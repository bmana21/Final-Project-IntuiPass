import { firebaseApp } from '../firebase/firebase-config';

export class AuthService {
  static handleSignOut(navigateToLogin: () => void): void {
    firebaseApp.auth().signOut()
      .then(() => {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ type: 'signOut' }, (_) => {
            if (chrome.runtime.lastError) {
              console.error("Chrome runtime error during signout:", chrome.runtime.lastError);
            }
            console.log("Signed out successfully");
            navigateToLogin();
          });
        } else {
          console.log("Signed out successfully (Chrome API not available)");
          navigateToLogin();
        }
      })
      .catch((error) => {
        console.error("Sign out failed:", error);
        navigateToLogin();
      });
  }

  static checkAuthStatus(
    onAuthenticated: (userData: any) => void,
    onNotAuthenticated: () => void
  ): void {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        chrome.runtime.sendMessage({ type: 'getAuthStatus' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Chrome runtime error:", chrome.runtime.lastError);
            onNotAuthenticated();
            return;
          }
          
          if (response && response.isLoggedIn) {
            onAuthenticated(response.userData);
          } else {
            onNotAuthenticated();
          }
        });
      } catch (error) {
        console.error("Error sending Chrome message:", error);
        onNotAuthenticated();
      }
    } else {
      console.warn("Chrome runtime not available");
      onNotAuthenticated();
    }
  }
}