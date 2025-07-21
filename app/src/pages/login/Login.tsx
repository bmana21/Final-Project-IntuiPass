import React, { useEffect, useState } from 'react';
import firebase from 'firebase/compat/app';
import { useNavigation } from '../../components/AppRouter';
import { firebaseApp } from '../../firebase/firebase-config';
import './Login.css';

declare global {
  interface Window {
    firebase: any;
    iink: {
      Editor: {
        load: (element: HTMLElement, type: string, options: any) => Promise<any>;
      };
    };
    katex: {
      render: (latex: string, element: HTMLElement, options?: any) => void;
    };
  }
}

const Login: React.FC = () => {
  const [_, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { navigateTo } = useNavigation();

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "getAuthStatus" }, (response) => {
      setIsLoading(false);
      if (response && response.isLoggedIn) {
        setUser(response.userData);
        navigateTo('password_mode_selection');
      }
    });

  }, []);

  const handleSignIn = () => {
    setIsLoading(true);
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        console.error("Failed to get auth token", chrome.runtime.lastError);
        alert("Sign-in failed");
        setIsLoading(false);
        return;
      }

      const tokenString = typeof token === 'string' ? token : token.token;
      
      if (!tokenString) {
        console.error("No valid token received");
        alert("Authentication failed - no token");
        setIsLoading(false);
        return;
      }

      const credential = firebase.auth.GoogleAuthProvider.credential(null, tokenString);
      firebaseApp.auth().signInWithCredential(credential)
        .then((userCredential) => {
          if (userCredential.user) {
            setUser(userCredential.user);
            console.log("Signed in:", userCredential.user.email);
            navigateTo('password_mode_selection');
          } else {
            console.error("Sign in succeeded but no user data received");
            setIsLoading(false);
          }
        })
        .catch((error) => {
          console.error("Firebase sign-in failed:", error);
          alert("Firebase sign-in failed: " + error.message);
          setIsLoading(false);
        });
    });
  };

  if (isLoading) {
    return (
      <div className="login-container">
        <div className="loading-section">
          <div className="logo">
            <h1>🔐 IntuiPass</h1>
          </div>
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-section">
        <div className="logo">
          <h1>🔐 IntuiPass</h1>
        </div>
        <h2>Welcome to IntuiPass</h2>
        <p>Secure password manager with intuitive password creation</p>
        <button className="sign-in-button" onClick={handleSignIn}>
          <span>🔑</span> Sign In with Google
        </button>
        
        <div className="features">
          <div className="feature">
            <span className="feature-icon">⚫</span>
            <span>Connect the Dots</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🎹</span>
            <span>Piano</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;