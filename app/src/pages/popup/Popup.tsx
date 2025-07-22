import React, { useEffect, useState } from 'react';
import { useNavigation } from '../../components/AppRouter';
import { AuthService } from '../../services/auth-service';
import SavedPatterns from '../../components/SavedPatterns/SavedPatterns';
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

  const handleNavigateToPiano = () => {
    navigateTo('piano_password', { isCreatingPassword });
  };

  const handleNavigateToChess = () => {
    navigateTo('chess_password', { isCreatingPassword });
  };

  const handleNavigateToMathFormula = () => {
    navigateTo('math_formula', { isCreatingPassword });
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
      {!isCreatingPassword && (
        <SavedPatterns />
      )}

      {isCreatingPassword && (
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
            onClick={handleNavigateToPiano}
          >
            <span className="button-icon">🎹</span>
            <div className="button-content">
              <span className="button-title">Piano Sequence</span>
              <span className="button-description">Create melodies as passwords</span>
            </div>
          </button>

          <button
            className="password-type-button"
            onClick={handleNavigateToChess}
          >
            <span className="button-icon">♔</span>
            <div className="button-content">
              <span className="button-title">Chess Board</span>
              <span className="button-description">Place pieces on a chess board</span>
            </div>
          </button>

          <button
            className="password-type-button"
            onClick={handleNavigateToMathFormula}
          >
            <span className="button-icon">∫</span>
            <div className="button-content">
              <span className="button-title">Mathematical Formula</span>
              <span className="button-description">Draw mathematical expressions</span>
            </div>
          </button>

        </div>
      )}

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