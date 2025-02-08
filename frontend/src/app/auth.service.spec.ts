import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('googleSignUp', () => {
    it('should sign up a user via Google and store tokens', () => {
      const mockCredential = 'mock-credential';
      const mockResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        idToken: 'mock-id-token',
      };

      service.googleSignUp(mockCredential).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(
        'http://localhost:3000/users/google-signup'
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ credential: mockCredential });

      req.flush(mockResponse);
    });
  });

  describe('googleSignIn', () => {
    it('should sign in a user via Google and store tokens', () => {
      const mockCredential = 'mock-credential';
      const mockResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        idToken: 'mock-id-token',
      };

      service.googleSignIn(mockCredential).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(
        'http://localhost:3000/users/google-signin'
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ credential: mockCredential });

      req.flush(mockResponse);
    });
  });

  describe('login', () => {
    it('should login a user and store tokens', () => {
      const mockEmail = 'user@example.com';
      const mockPassword = 'password123';
      const mockResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        _id: 'mock-user-id',
      };

      service.login(mockEmail, mockPassword).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('http://localhost:3000/users/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: mockEmail,
        password: mockPassword,
      });

      req.flush(mockResponse);
    });
  });

  describe('logout', () => {
    it('should logout and remove tokens from localStorage', () => {
      // Set the initial tokens
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('_id', 'mock-user-id');
      localStorage.setItem('idToken', 'mock-id-token');

      service.logout();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('_id')).toBeNull();
      expect(localStorage.getItem('idToken')).toBeNull();
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh the access token', () => {
      const mockResponse = { accessToken: 'new-mock-access-token' };
      const mockRefreshToken = 'mock-refresh-token';
      const mockUserId = 'mock-user-id';

      localStorage.setItem('refreshToken', mockRefreshToken);
      localStorage.setItem('_id', mockUserId);

      service.refreshAccessToken().subscribe((response) => {
        expect(response).toBe(mockResponse.accessToken);
        expect(localStorage.getItem('accessToken')).toBe(
          mockResponse.accessToken
        );
      });

      const req = httpMock.expectOne(
        'http://localhost:3000/users/me/access-token'
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('x-refresh-token')).toBe(mockRefreshToken);
      expect(req.request.headers.get('_id')).toBe(mockUserId);

      req.flush(mockResponse);
    });

    it('should throw an error if refresh token or user ID is missing', (done) => {
      localStorage.removeItem('refreshToken'); // Simulate missing refresh token
      localStorage.removeItem('_id'); // Simulate missing user ID

      service.refreshAccessToken().subscribe({
        next: () => {
          fail(
            'Expected refreshAccessToken to throw an error, but it succeeded'
          );
        },
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.message).toBe('Session expired. Please log in again.');
          done();
        },
      });
    });
  });

  describe('makeAuthenticatedRequest', () => {
    it('should make an authenticated GET request', () => {
      const mockUrl = 'http://localhost:3000/protected-data';
      const mockResponse = { data: 'mock-data' };
      const initialAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';
      const mockUserId = 'mock-user-id';
      const newAccessToken = 'new-mock-access-token';

      // Set initial tokens in localStorage.
      localStorage.setItem('accessToken', initialAccessToken);
      localStorage.setItem('refreshToken', mockRefreshToken);
      localStorage.setItem('_id', mockUserId);

      service.makeAuthenticatedRequest(mockUrl, 'GET').subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      // FIRST: The interceptor first calls refreshAccessToken.
      // Expect a GET request to the refresh URL.
      const refreshReq = httpMock.expectOne(
        'http://localhost:3000/users/me/access-token'
      );
      expect(refreshReq.request.method).toBe('GET');
      expect(refreshReq.request.headers.get('x-refresh-token')).toBe(
        mockRefreshToken
      );
      expect(refreshReq.request.headers.get('_id')).toBe(mockUserId);

      // Flush the refresh request with the new access token.
      refreshReq.flush({ accessToken: newAccessToken });

      // THEN: After refresh, the final GET request to the protected URL is made.
      const req = httpMock.expectOne(mockUrl);
      expect(req.request.method).toBe('GET');
      // The header should now be the new access token.
      expect(req.request.headers.get('accessToken')).toBe(newAccessToken);
      req.flush(mockResponse);
    });

    it('should throw an error if access token is missing', () => {
      localStorage.removeItem('accessToken');
      // The error thrown now includes the full message.
      expect(() =>
        service.makeAuthenticatedRequest(
          'http://localhost:3000/protected-data',
          'GET'
        )
      ).toThrowError('Access token is missing. Please log in again.');
    });
  });
});
