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
  imports: [RouterLink],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent {
  constructor(private authService: AuthService, private router: Router) {
    window.handleGoogleSignIn = this.handleGoogleSignIn.bind(this);
  }

  onLoginButtonClicked(email: string, password: string) {
    this.authService.login(email, password).subscribe({
      next: (response: any) => {
        console.log('Login successful:', response);
        this.router.navigate(['lists']);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Login failed:', err.message);
      },
    });
  }

  handleGoogleSignIn(response: any) {
    const credential = response.credential;
    this.authService.googleSignIn(credential).subscribe({
      next: () => {
        this.router.navigate(['lists']);
      },
      error: (error) => {
        console.error('Google Sign-In failed:', error);
      },
    });
  }

  navigateToSignup() {
    this.router.navigate(['/signup']);
  }
}
