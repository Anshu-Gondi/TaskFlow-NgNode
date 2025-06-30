import { Component, AfterViewInit } from '@angular/core';
import { AuthService } from '../../auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

declare const google: any;

declare global {
  interface Window {
    handleGoogleSignIn: (response: any) => void;
  }
}

@Component({
  selector: 'app-signup-page',
  imports: [RouterLink, CommonModule],
  standalone: true,
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.scss'],
})
export class SignupPageComponent {
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

  onSignupButtonClicked(email: string, password: string) {
    this.errorMessage = ''; // Reset previous error message
    if (!email || !password) {
      this.errorMessage = 'Email and password are required!';
      return;
    }

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

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
