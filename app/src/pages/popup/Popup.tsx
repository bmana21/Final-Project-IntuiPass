import React, { useEffect, useState } from 'react';
import { useNavigation } from '../../components/AppRouter';
import { firebaseApp } from '../../firebase/firebase-config';
import './Popup.css';

const Popup: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const { navigateTo, getRouteParams, goBack } = useNavigation();
  const routeParams = getRouteParams();
  const isCreatingPassword = routeParams?.isCreatingPassword ?? true;

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "getAuthStatus" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Chrome runtime error:", chrome.runtime.lastError);
        navigateTo('login');
        return;
      }
      
      if (response && response.isLoggedIn) {
        setUser(response.userData);
      } else {
        navigateTo('login');
      }
    });
  }, [navigateTo]);

  const handleSignOut = () => {
    firebaseApp.auth().signOut()
      .then(() => {
        chrome.runtime.sendMessage({ command: "signOut" }, (_) => {
          setUser(null);
          navigateTo('login');
          console.log("Signed out successfully");
        });
      })
      .catch((error) => {
        console.error("Sign out failed:", error);
        setUser(null);
        navigateTo('login');
      });
  };

  const handleNavigateToConnectDots = () => {
    navigateTo('connect_the_dots', { isCreatingPassword });
  };

  const handleNavigateToPatternLock = () => {
    navigateTo('pattern_lock', { isCreatingPassword });
  };

  const handleNavigateToColorSequence = () => {
    navigateTo('color_sequence', { isCreatingPassword });
  };

  if (!user) {
    return (
      <div className="popup-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <div className="header">
        <button className="back-button" onClick={goBack}>
          ← Back
        </button>
        <div className="header-content">
          <h2>
            {isCreatingPassword ? '🔐 Creating' : '🔓 Filling'}
          </h2>
          {/* <div className="mode-badge">
            
          </div> */}
        </div>
      </div>

      <div className="user-info">
        <img className="user-pic" src={user.photoURL || ''} alt="User Picture" />
        <div className="user-details">
          <p className="user-name">{user.displayName || "Unknown"}</p>
          <p className="user-email">{user.email || ""}</p>
        </div>
      </div>

      <div className="password-options">
        <h3>Choose Password Type:</h3>
        
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

      <div className="footer">
        <button className="sign-out-button" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Popup;