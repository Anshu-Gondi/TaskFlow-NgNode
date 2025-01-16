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
  selector: 'app-signup-page',
  imports: [RouterLink],
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.scss'],
})
export class SignupPageComponent {
  constructor(private authService: AuthService, private router: Router) {
    window.handleGoogleSignIn = this.handleGoogleSignIn.bind(this);
  }

  onSignupButtonClicked(email: string, password: string) {
    this.authService.signup(email, password).subscribe({
      next: (response: any) => {
        console.log('Signup successful:', response);
        this.router.navigate(['login']);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Signup failed:', err.message);
      },
    });
  }

  handleGoogleSignIn(response: any) {
    const credential = response.credential;
    this.authService.googleSignUp(credential).subscribe({
      next: () => {
        this.router.navigate(['lists']);
      },
      error: (error) => {
        console.error('Google Sign-Up failed:', error);
      },
    });
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
