import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPageComponent } from './login-page.component';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', [
      'login',
      'googleSignIn',
    ]);
    const routerMock = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call login with correct credentials', () => {
    const email = 'test@example.com';
    const password = 'password123';
    authServiceSpy.login.and.returnValue(of({ message: 'Login successful' }));

    component.onLoginButtonClicked(email, password);

    expect(authServiceSpy.login).toHaveBeenCalledWith(email, password);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['lists']);
  });

  it('should handle login error correctly', () => {
    const email = 'test@example.com';
    const password = 'wrongpassword';
    const errorResponse = new HttpErrorResponse({
      error: { message: 'Invalid credentials' }, // Ensure correct error format
      status: 401,
    });

    spyOn(console, 'error'); // Prevent actual console error logs

    authServiceSpy.login.and.returnValue(throwError(() => errorResponse));

    component.onLoginButtonClicked(email, password);

    expect(authServiceSpy.login).toHaveBeenCalledWith(email, password);
    expect(console.error).toHaveBeenCalledWith(
      'Login failed:',
      'Invalid credentials'
    );
  });

  it('should navigate to signup page', () => {
    component.navigateToSignup();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/signup']);
  });

  it('should handle Google sign-in correctly', () => {
    const mockResponse = { credential: 'google_jwt_token' };
    authServiceSpy.googleSignIn.and.returnValue(
      of({ message: 'Google Sign-in success' })
    );

    component.handleGoogleSignIn(mockResponse);

    expect(authServiceSpy.googleSignIn).toHaveBeenCalledWith(
      'google_jwt_token'
    );
    expect(routerSpy.navigate).toHaveBeenCalledWith(['lists']);
  });
});
