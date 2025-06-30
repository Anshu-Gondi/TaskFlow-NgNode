import { Component, AfterViewInit } from '@angular/core';
import { AuthService } from '../../auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

declare global {
  interface Window {
    handleGoogleSignIn: (response: any) => void;
  }
}

declare const google: any;

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent {
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {
    window.handleGoogleSignIn = this.handleGoogleSignIn.bind(this);
  }

  ngAfterViewInit() {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id:
          '931212072659-sfnnpu9j3uod34u8uqt7p9nmrovqd46f.apps.googleusercontent.com',
        callback: this.handleGoogleSignIn.bind(this),
        ux_mode: 'popup',
      });

      google.accounts.id.renderButton(
        document.getElementById('googleSignInDiv'),
        {
          theme: 'outline',
          size: 'large',
          type: 'standard',
        }
      );
    } else {
      console.error('Google script not loaded');
    }
  }

  onLoginButtonClicked(email: string, password: string) {
    this.errorMessage = '';
    if (!email || !password) {
      this.errorMessage = 'Email and password are required!';
      return;
    }

    this.authService.login(email, password).subscribe({
      next: () => {
        const last = localStorage.getItem('lastWorkspace');
        if (last === 'solo') this.router.navigate(['/workspace/solo']);
        else if (last === 'team') this.router.navigate(['/teams']);
        else this.router.navigate(['/choose-workspace']);
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
        const last = localStorage.getItem('lastWorkspace');
        if (last === 'solo') this.router.navigate(['/workspace/solo']);
        else if (last === 'team') this.router.navigate(['/teams']);
        else this.router.navigate(['/choose-workspace']);
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
