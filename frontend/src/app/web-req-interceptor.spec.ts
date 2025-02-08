import { TestBed } from '@angular/core/testing';
import { WebRequestInterceptor } from './web-req-interceptor';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import {
  HttpClient,
  HttpErrorResponse,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('WebRequestInterceptor', () => {
  let interceptor: WebRequestInterceptor;
  let authService: jasmine.SpyObj<AuthService>;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  beforeEach(() => {
    // Create a spy for AuthService with the needed methods.
    authService = jasmine.createSpyObj('AuthService', [
      'getAccessToken',
      'refreshAccessToken',
      'logout',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        // Register the interceptor with the HTTP_INTERCEPTORS token.
        {
          provide: HTTP_INTERCEPTORS,
          useClass: WebRequestInterceptor,
          multi: true,
        },
        { provide: AuthService, useValue: authService },
      ],
    });

    interceptor = TestBed.inject(WebRequestInterceptor);
    // Use the same spy object we created.
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should add x-access-token header if token is available', (done) => {
    const mockToken = 'mock-access-token';
    authService.getAccessToken.and.returnValue(mockToken);

    // Make a GET request.
    httpClient.get('/test').subscribe(() => {
      done();
    });

    // Only call expectOne() once.
    const req = httpMock.expectOne('/test');
    expect(req.request.headers.has('x-access-token')).toBeTrue();
    expect(req.request.headers.get('x-access-token')).toBe(mockToken);
    req.flush({}); // Simulate a successful response.
  });

  it('should handle 401 error and attempt to refresh token', (done) => {
    const mockToken = 'mock-access-token';
    const newToken = 'new-mock-access-token';

    // Since the interceptor only calls getAccessToken() once, use returnValue() instead of returnValues()
    authService.getAccessToken.and.returnValue(mockToken);
    authService.refreshAccessToken.and.returnValue(of(newToken));

    httpClient.get('/test').subscribe({
      next: (response) => {
        // When the refresh is successful the request is retried.
        expect(authService.refreshAccessToken).toHaveBeenCalled();
        // getAccessToken is called only once (in intercept())
        expect(authService.getAccessToken).toHaveBeenCalledTimes(1);
        expect(response).toEqual({ success: true });
        done();
      },
      error: () => {
        fail('Request should not fail when refresh token succeeds.');
      },
    });

    // Simulate the first request returning a 401 error with "jwt expired" text.
    const req = httpMock.expectOne('/test');
    req.flush('jwt expired', {
      status: 401,
      statusText: 'Unauthorized',
    });

    // The interceptor should now retry the request with the new token.
    const retryReq = httpMock.expectOne('/test');
    expect(retryReq.request.headers.get('x-access-token')).toBe(newToken);
    retryReq.flush({ success: true });
  });


  it('should log out user when refresh token fails', (done) => {
    const mockToken = 'mock-access-token';
    authService.getAccessToken.and.returnValue(mockToken);
    // Simulate a failed refresh call.
    authService.refreshAccessToken.and.returnValue(
      throwError(() => new Error('Refresh failed'))
    );

    httpClient.get('/test').subscribe({
      next: () => fail('Request should fail when refresh token fails.'),
      error: () => {
        // Since authService.logout is already a spy (from createSpyObj),
        // do not spyOn it again. Simply verify it was called.
        expect(authService.logout).toHaveBeenCalled();
        done();
      },
    });

    // Simulate a 401 error response.
    const req = httpMock.expectOne('/test');
    req.flush('jwt expired', {
      status: 401,
      statusText: 'Unauthorized',
    });
  }, 10000);

  it('should not retry request if error is not jwt expired', (done) => {
    const mockToken = 'mock-access-token';
    authService.getAccessToken.and.returnValue(mockToken);
    authService.refreshAccessToken.and.returnValue(of('new-mock-access-token'));

    httpClient.get('/test').subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(403);
        done();
      },
    });

    // Simulate an error response that is not 401.
    const req = httpMock.expectOne('/test');
    req.flush(null, { status: 403, statusText: 'Forbidden' });
  });
});
