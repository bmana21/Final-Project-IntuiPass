import React, { useEffect, useState } from 'react';
import firebase from 'firebase/compat/app';
import { useNavigation } from '../../components/AppRouter';
import './popup.css';
import { firebaseApp } from '../../firebase/firebase-config';
declare global {
  interface Window {
    firebase: any;
  }
}

const Popup: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const { navigateTo } = useNavigation();

  useEffect(() => {
    chrome.runtime.sendMessage({ command: "getAuthStatus" }, (response) => {
      if (response && response.isLoggedIn) {
        setUser(response.userData);
      }
    });
  }, []);
  const handleSignIn = () => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        console.error("Failed to get auth token", chrome.runtime.lastError);
        alert("Sign-in failed");
        return;
      }

      const tokenString = typeof token === 'string' ? token : token.token;
      
      if (!tokenString) {
        console.error("No valid token received");
        alert("Authentication failed - no token");
        return;
      }

      const credential = firebase.auth.GoogleAuthProvider.credential(null, tokenString);
      firebaseApp.auth().signInWithCredential(credential)
        .then((userCredential) => {
          if (userCredential.user) {
            setUser(userCredential.user);
            console.log("Signed in:", userCredential.user.email);
          } else {
            console.error("Sign in succeeded but no user data received");
          }
        })
        .catch((error) => {
          console.error("Firebase sign-in failed:", error);
          alert("Firebase sign-in failed: " + error.message);
        });
    });
  };

  const handleSignOut = () => {
    firebaseApp.auth().signOut()
      .then(() => {
        setUser(null);
        console.log("Signed out successfully");
      })
      .catch((error) => {
        console.error("Sign out failed:", error);
      });
  };

  const handleNavigateToConnectDots = () => {
    navigateTo('connect_the_dots');
  };

  const handleNavigateToPatternLock = () => {
    navigateTo('pattern_lock');
  };

  const handleNavigateToColorSequence = () => {
    navigateTo('color_sequence');
  };

  return (
    <div id="content">
      {user ? (
        <div id="user-info">
          <img id="user-pic" src={user.photoURL || ''} alt="User Picture" />
          <p id="user-name">{user.displayName || "Unknown"}</p>
          <p id="user-email">{user.email || ""}</p>
          
          {/* Password Creation Options */}
          <div className="password-options">
            <h3>Create Password</h3>
            <button 
              className="password-type-button"
              onClick={handleNavigateToConnectDots}
            >
              <span className="button-icon">⚫</span>
              <div className="button-content">
                <span className="button-title">Connect The Dots</span>
                <span className="button-description">Create patterns by connecting dots</span>
              </div>
            </button>
            
            <button 
              className="password-type-button"
              onClick={handleNavigateToPatternLock}
            >
              <span className="button-icon">🔒</span>
              <div className="button-content">
                <span className="button-title">Pattern Lock</span>
                <span className="button-description">Draw unlock patterns</span>
              </div>
            </button>
            
            <button 
              className="password-type-button"
              onClick={handleNavigateToColorSequence}
            >
              <span className="button-icon">🎨</span>
              <div className="button-content">
                <span className="button-title">Color Sequence</span>
                <span className="button-description">Remember color combinations</span>
              </div>
            </button>
          </div>
          
          <button id="sign-out" onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <div id="sign-in-section">
          <div className="logo">
            <h1>🔐 IntuiPass</h1>
          </div>
          <h2>Welcome to IntuiPass</h2>
          <p>Secure password manager with intuitive password creation</p>
          <button id="sign-in" onClick={handleSignIn}>
            <span>🔑</span> Sign In with Google
          </button>
        </div>
      )}
    </div>
  );
};

export default Popup;