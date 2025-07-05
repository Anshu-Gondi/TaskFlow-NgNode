import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  throwError,
  of
} from 'rxjs';
import {
  map,
  tap,
  switchMap,
  catchError
} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private accessTokenSubject = new BehaviorSubject<string | null>(
    localStorage.getItem('accessToken')
  );
  private idTokenSubject = new BehaviorSubject<string | null>(
    localStorage.getItem('idToken')
  );
  private userIdSubject = new BehaviorSubject<string | null>(
    localStorage.getItem('_id')
  );

  constructor(private http: HttpClient) {}

  /** ========== Google Sign-Up ========== */
  googleSignUp(credential: string): Observable<any> {
    return this.http
      .post<{ accessToken: string; refreshToken: string; idToken: string; _id: string }>(
        'http://localhost:3000/users/google-signup',
        { credential }
      )
      .pipe(
        tap((response) => {
          this.setAccessToken(response.accessToken);
          this.setIdToken(response.idToken);
          this.setUserId(response._id);
          localStorage.setItem('refreshToken', response.refreshToken);
        })
      );
  }

  /** ========== Google Sign-In ========== */
  googleSignIn(credential: string): Observable<any> {
    return this.http
      .post<{ accessToken: string; refreshToken: string; idToken: string; _id: string }>(
        'http://localhost:3000/users/google-signin',
        { credential }
      )
      .pipe(
        tap((response) => {
          this.setAccessToken(response.accessToken);
          this.setIdToken(response.idToken);
          this.setUserId(response._id);
          localStorage.setItem('refreshToken', response.refreshToken);
        })
      );
  }

  /** ========== Manual Signup ========== */
  signup(email: string, password: string): Observable<any> {
    return this.http.post('http://localhost:3000/users', { email, password });
  }

  /** ========== Manual Login ========== */
  login(email: string, password: string): Observable<any> {
    return this.http
      .post<{ accessToken: string; refreshToken: string; _id: string }>(
        'http://localhost:3000/users/login',
        { email, password }
      )
      .pipe(
        tap((response) => {
          this.setAccessToken(response.accessToken);
          this.setUserId(response._id);
          localStorage.setItem('refreshToken', response.refreshToken);
        })
      );
  }

  /** ========== Token Helpers ========== */
  setAccessToken(token: string): void {
    this.accessTokenSubject.next(token);
    localStorage.setItem('accessToken', token);
  }

  getAccessToken(): string | null {
    const token = this.accessTokenSubject.value || localStorage.getItem('accessToken');
    if (!token) throw new Error('Access token missing. Please log in again.');
    return token;
  }

  refreshAccessToken(): Observable<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    const userId = localStorage.getItem('_id');

    if (!refreshToken || !userId) {
      this.logout();
      return throwError(() => new Error('Session expired. Please log in again.'));
    }

    return this.http
      .get<{ accessToken: string }>('http://localhost:3000/users/me/access-token', {
        headers: { 'x-refresh-token': refreshToken, _id: userId },
      })
      .pipe(
        tap((response) => this.setAccessToken(response.accessToken)),
        map((response) => response.accessToken),
        catchError((error) => {
          this.logout();
          return throwError(() => new Error('Session expired. Please log in again.'));
        })
      );
  }

  /** ========== ID Token Helpers ========== */
  setIdToken(token: string): void {
    this.idTokenSubject.next(token);
    localStorage.setItem('idToken', token);
  }

  getIdToken(): string | null {
    return this.idTokenSubject.value || localStorage.getItem('idToken');
  }

  /** ========== Current User ID Helpers ========== */
  setUserId(id: string): void {
    this.userIdSubject.next(id);
    localStorage.setItem('_id', id);
  }

  get currentUserId(): string | null {
    return this.userIdSubject.value;
  }

  get currentUserId$(): Observable<string | null> {
    return this.userIdSubject.asObservable();
  }

  /** ========== Logout ========== */
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('_id');
    localStorage.removeItem('idToken');
    this.accessTokenSubject.next(null);
    this.idTokenSubject.next(null);
    this.userIdSubject.next(null);
  }

  /** ========== Generic Authenticated Request ========== */
  makeAuthenticatedRequest(
    url: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    body?: any
  ): Observable<any> {
    const token = this.getAccessToken();
    if (!token) {
      return throwError(() => new Error('Access token is missing. Please log in again.'));
    }

    return this.refreshAccessToken().pipe(
      switchMap((newToken) => {
        const headers = {
          'Content-Type': 'application/json',
          accessToken: newToken,
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
}
