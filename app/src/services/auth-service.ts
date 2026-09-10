import { firebaseApp } from '../firebase/firebase-config';

export class AuthService {

  private static getCachedToken(): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (chrome.runtime.lastError || !token) {
          resolve(null);
          return;
        }
        resolve(typeof token === 'string' ? token : token.token ?? null);
      });
    });
  }

  private static removeCachedToken(token: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.identity.removeCachedAuthToken({ token }, () => resolve());
    });
  }

  private static async clearGoogleToken(revoke = false): Promise<void> {
    const token = await this.getCachedToken();
    if (!token) return;

    if (revoke) {
      try {
        await fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `token=${encodeURIComponent(token)}`
        });
      } catch (error) {
        // A failed revoke must not strand the user in a signed-in state.
        console.error('Token revocation failed:', error);
      }
    }

    await this.removeCachedToken(token);
  }

  private static signOutBackground(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
        resolve();
        return;
      }
      chrome.runtime.sendMessage({ type: 'signOut' }, () => {
        if (chrome.runtime.lastError) {
          console.error('Background sign-out failed:', chrome.runtime.lastError);
        }
        resolve();
      });
    });
  }

  static async handleSignOut(navigateToLogin: () => void): Promise<void> {
    try {
      await this.clearGoogleToken();
      await firebaseApp.auth().signOut();
      await this.signOutBackground();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      navigateToLogin();
    }
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
