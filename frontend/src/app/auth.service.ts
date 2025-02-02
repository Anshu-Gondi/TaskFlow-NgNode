import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  private idTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {}

  // Method for Google Sign-Up
  googleSignUp(credential: string): Observable<any> {
    return this.http
      .post<{ accessToken: string; refreshToken: string; idToken: string }>(
        'http://localhost:3000/users/google-signup',
        { credential }
      )
      .pipe(
        tap((response) => {
          this.setAccessToken(response.accessToken);
          this.setIdToken(response.idToken); // Set the id_token
          localStorage.setItem('refreshToken', response.refreshToken);
        })
      );
  }

  // Method for Google Sign-In
  googleSignIn(credential: string): Observable<any> {
    return this.http
      .post<{ accessToken: string; refreshToken: string; idToken: string }>(
        'http://localhost:3000/users/google-signin',
        { credential }
      )
      .pipe(
        tap((response) => {
          this.setAccessToken(response.accessToken);
          this.setIdToken(response.idToken); // Set the id_token
          localStorage.setItem('refreshToken', response.refreshToken);
        })
      );
  }

  // Set the id_token
  setIdToken(token: string): void {
    this.idTokenSubject.next(token);
    localStorage.setItem('idToken', token);
  }

  // Get the id_token from the BehaviorSubject or localStorage
  getIdToken(): string | null {
    return this.idTokenSubject.value || localStorage.getItem('idToken');
  }

  // AuthService signup method
  signup(email: string, password: string): Observable<any> {
    const signupPayload = { email, password };
    return this.http.post('http://localhost:3000/users', signupPayload);
  }

  // Login function
  login(email: string, password: string): Observable<any> {
    const loginPayload = { email, password };
    return this.http
      .post<{ accessToken: string; refreshToken: string; _id: string }>(
        'http://localhost:3000/users/login',
        loginPayload
      )
      .pipe(
        tap((response) => {
          this.setAccessToken(response.accessToken); // Set access token
          localStorage.setItem('refreshToken', response.refreshToken); // Store refresh token
          localStorage.setItem('_id', response._id); // Store user ID
        })
      );
  }

  // Get the access token from the BehaviorSubject or localStorage
  getAccessToken(): string | null {
    return this.accessTokenSubject.value;
  }

  // Set the access token
  setAccessToken(token: string): void {
    this.accessTokenSubject.next(token);
    localStorage.setItem('accessToken', token);
  }

  // Refresh the access token
  refreshAccessToken(): Observable<string> {
    const refreshToken = localStorage.getItem('refreshToken'); // Stored refresh token
    const userId = localStorage.getItem('_id'); // User ID

    if (!refreshToken || !userId) {
      throw new Error('Refresh token or user ID is missing');
    }

    return this.http
      .get<{ accessToken: string }>(
        'http://localhost:3000/users/me/access-token',
        {
          headers: {
            'x-refresh-token': refreshToken,
            _id: userId,
          },
        }
      )
      .pipe(
        tap((response) => {
          this.setAccessToken(response.accessToken);
        }),
        // Map the response to return only the accessToken
        map((response) => response.accessToken)
      );
  }

  // Logout function
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('_id');
    localStorage.removeItem('idToken'); // Clear id_token on logout
    this.accessTokenSubject.next(null);
    this.idTokenSubject.next(null); // Clear the id_token subject
  }

  // Make an HTTP request with the access token in headers
  makeAuthenticatedRequest(
    url: string,
    method: string,
    body?: any
  ): Observable<any> {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error('Access token is missing');
    }

    const headers = {
      'Content-Type': 'application/json',
      accessToken: accessToken, // Attach the access token to the request headers
    };

    if (method === 'GET') {
      return this.http.get(url, { headers });
    } else if (method === 'POST') {
      return this.http.post(url, body, { headers });
    } else if (method === 'PATCH') {
      return this.http.patch(url, body, { headers });
    } else if (method === 'DELETE') {
      return this.http.delete(url, { headers });
    }
    return new Observable(); // Add default return for unmatched methods
  }
}
