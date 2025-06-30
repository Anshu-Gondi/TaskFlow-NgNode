import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, switchMap, catchError } from 'rxjs/operators';

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
          this.setIdToken(response.idToken);
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
          this.setIdToken(response.idToken);
          localStorage.setItem('refreshToken', response.refreshToken);
        })
      );
  }

  // Set the id_token
  setIdToken(token: string): void {
    this.idTokenSubject.next(token);
    localStorage.setItem('idToken', token);
  }

  // Get the id_token
  getIdToken(): string | null {
    return this.idTokenSubject.value || localStorage.getItem('idToken');
  }

  // AuthService signup method
  signup(email: string, password: string): Observable<any> {
    return this.http.post('http://localhost:3000/users', { email, password });
  }

  // Login function
  login(email: string, password: string): Observable<any> {
    return this.http
      .post<{ accessToken: string; refreshToken: string; _id: string }>(
        'http://localhost:3000/users/login',
        { email, password }
      )
      .pipe(
        tap((response) => {
          this.setAccessToken(response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          localStorage.setItem('_id', response._id);
        })
      );
  }

  /// Get the access token
  getAccessToken(): string | null {
    const token =
      this.accessTokenSubject.value || localStorage.getItem('accessToken');

    // If token is missing, throw an error
    if (!token) {
      throw new Error('Access token is missing. Please log in again.');
    }

    return token;
  }

  // Set the access token
  setAccessToken(token: string): void {
    this.accessTokenSubject.next(token);
    localStorage.setItem('accessToken', token);
  }

  // Refresh the access token
  refreshAccessToken(): Observable<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    const userId = localStorage.getItem('_id');

    // If refresh token or user ID is missing, logout and throw an error
    if (!refreshToken || !userId) {
      this.logout();
      return throwError(
        () => new Error('Session expired. Please log in again.')
      );
    }

    return this.http
      .get<{ accessToken: string }>(
        'http://localhost:3000/users/me/access-token',
        {
          headers: { 'x-refresh-token': refreshToken, _id: userId },
        }
      )
      .pipe(
        tap((response) => this.setAccessToken(response.accessToken)),
        map((response) => response.accessToken),
        catchError((error) => {
          this.logout(); // Ensure logout is triggered on failure
          return throwError(
            () => new Error('Session expired. Please log in again.')
          );
        })
      );
  }

  // Logout function
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('_id');
    localStorage.removeItem('idToken');
    this.accessTokenSubject.next(null);
    this.idTokenSubject.next(null);
  }

  // Make an authenticated HTTP request
  makeAuthenticatedRequest(
    url: string,
    method: string,
    body?: any
  ): Observable<any> {
    const accessToken = this.getAccessToken(); // Check if access token is available
    if (!accessToken) {
      return throwError(
        () => new Error('Access token is missing. Please log in again.')
      );
    }

    return this.refreshAccessToken().pipe(
      switchMap((newAccessToken) => {
        const headers = {
          'Content-Type': 'application/json',
          accessToken: newAccessToken,
        };

        switch (method) {
          case 'GET':
            return this.http.get(url, { headers });
          case 'POST':
            return this.http.post(url, body, { headers });
          case 'PATCH':
            return this.http.patch(url, body, { headers });
          case 'DELETE':
            return this.http.delete(url, { headers });
          default:
            return throwError(() => new Error('Invalid HTTP method'));
        }
      })
    );
  }

  get currentUserId(): string | null {
    return localStorage.getItem('_id') ?? null;
  }
}
