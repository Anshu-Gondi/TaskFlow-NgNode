import { Component } from '@angular/core';
import { AuthService } from '../../auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

declare global {
  interface Window {
    handleGoogleSignIn: (response: any) => void;
  }
}

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent {
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {
    window.handleGoogleSignIn = this.handleGoogleSignIn.bind(this);
  }

  onLoginButtonClicked(email: string, password: string) {
    this.errorMessage = ''; // Reset previous error message
    if (!email || !password) {
      this.errorMessage = 'Email and password are required!';
      return;
    }

    this.authService.login(email, password).subscribe({
      next: (response: any) => {
        console.log('Login successful:', response);
        this.router.navigate(['lists']);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage =
          err.error?.message || 'Invalid credentials. Please try again.';
        console.error('Login failed:', this.errorMessage);
      },
    });
  }

  handleGoogleSignIn(response: any) {
    const credential = response?.credential;
    if (!credential) {
      this.errorMessage = 'Google Sign-In failed. Please try again.';
      return;
    }

    this.authService.googleSignIn(credential).subscribe({
      next: () => {
        this.router.navigate(['lists']);
      },
      error: (error) => {
        this.errorMessage = 'Google Sign-In failed. Please try again.';
        console.error('Google Sign-In failed:', error);
      },
    });
  }

  navigateToSignup() {
    this.router.navigate(['/signup']);
  }
}
