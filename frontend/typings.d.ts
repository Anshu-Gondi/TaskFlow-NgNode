// src/typings.d.ts
declare global {
  interface Window {
    onGoogleSignIn: (response: any) => void;
  }
}

export {};
