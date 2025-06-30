import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { catchError, switchMap, take, filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class WebRequestInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  constructor(private authService: AuthService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const accessToken = this.authService.getAccessToken();

    let authReq = req;
    if (accessToken) {
      authReq = this.addToken(req, accessToken);
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && error.error === 'jwt expired') {
          return this.handle401Error(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      setHeaders: { 'x-access-token': token, Authorization: `Bearer ${token}` },
    });
  }

  private handle401Error(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (this.isRefreshing) {
      return throwError(() => new Error('Token refresh already in progress'));
    }

    this.isRefreshing = true;

    return this.authService.refreshAccessToken().pipe(
      take(1),
      filter((newToken: string | null) => newToken !== null),
      switchMap((newToken: string) => {
        this.isRefreshing = false;
        return next.handle(this.addToken(req, newToken));
      }),
      catchError((err) => {
        this.isRefreshing = false; // Set first to avoid any race conditions
        this.authService.logout(); // Ensure logout is always called
        return throwError(() => err);
      })
    );
  }
}
