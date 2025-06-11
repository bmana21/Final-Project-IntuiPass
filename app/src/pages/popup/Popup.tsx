import React, { useEffect, useState } from 'react';
import { useNavigation } from '../../components/AppRouter';
import { AuthService } from '../../services/auth-service';
import './Popup.css';

const Popup: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const { navigateTo, getRouteParams, goBack } = useNavigation();
  const routeParams = getRouteParams();
  const isCreatingPassword = routeParams?.isCreatingPassword ?? true;

  useEffect(() => {
    AuthService.checkAuthStatus((user) => setUser(user), () => navigateTo('login'))
  }, [navigateTo]);

  const handleSignOut = () => {
    AuthService.handleSignOut(() => navigateTo('login'));
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
          <span className="sign-out-icon">👋</span>
          <span className="sign-out-text">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Popup;