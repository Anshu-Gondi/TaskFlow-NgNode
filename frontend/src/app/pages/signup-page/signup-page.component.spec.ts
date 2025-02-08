import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignupPageComponent } from './signup-page.component';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('SignupPageComponent', () => {
  let component: SignupPageComponent;
  let fixture: ComponentFixture<SignupPageComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['signup', 'googleSignUp']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [SignupPageComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignupPageComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call signup and navigate to login on success', () => {
    authServiceSpy.signup.and.returnValue(of({ message: 'Signup successful' }));

    component.onSignupButtonClicked('test@example.com', 'password123');

    expect(authServiceSpy.signup).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['login']);
  });

  it('should log error message on signup failure', () => {
    const errorResponse = new HttpErrorResponse({ error: { message: 'Signup failed' }, status: 400 });
    spyOn(console, 'error');
    authServiceSpy.signup.and.returnValue(throwError(() => errorResponse));

    component.onSignupButtonClicked('test@example.com', 'password123');

    expect(authServiceSpy.signup).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(console.error).toHaveBeenCalledWith('Signup failed:', errorResponse.message);
  });

  it('should call googleSignUp and navigate on success', () => {
    authServiceSpy.googleSignUp.and.returnValue(of({}));

    component.handleGoogleSignIn({ credential: 'google-token' });

    expect(authServiceSpy.googleSignUp).toHaveBeenCalledWith('google-token');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['lists']);
  });

  it('should log error message on Google sign-up failure', () => {
    const errorResponse = new Error('Google Sign-Up failed');
    spyOn(console, 'error');
    authServiceSpy.googleSignUp.and.returnValue(throwError(() => errorResponse));

    component.handleGoogleSignIn({ credential: 'google-token' });

    expect(authServiceSpy.googleSignUp).toHaveBeenCalledWith('google-token');
    expect(console.error).toHaveBeenCalledWith('Google Sign-Up failed:', errorResponse);
  });

  it('should navigate to login page when navigateToLogin is called', () => {
    component.navigateToLogin();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
