import React, { useEffect, useState } from 'react';
import { useNavigation } from '../../components/AppRouter';
import { AuthService } from '../../services/auth-service';
import SavedPatterns from '../../components/SavedPatterns/SavedPatterns';
import styles from './Popup.module.css';

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

  const handleNavigateToPixelArt = () => {
    navigateTo('pixel_art', { isCreatingPassword });
  };

  if (!user) {
    return (
      <div className={styles.popupContainer}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.popupContainer}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={goBack}>
          ← Back
        </button>
        <div className={styles.headerContent}>
          <h2>
            {isCreatingPassword ? '🔐 Creating' : '🔓 Filling'}
          </h2>
        </div>
      </div>

      <div className={styles.userInfo}>
        <img className={styles.userPic} src={user.photoURL || ''} alt="User Picture" />
        <div className={styles.userDetails}>
          <p className={styles.userName}>{user.displayName || "Unknown"}</p>
          <p className={styles.userEmail}>{user.email || ""}</p>
        </div>
      </div>
      
      {!isCreatingPassword && (
        <SavedPatterns />
      )}

      {isCreatingPassword && (
        <div className={styles.passwordOptions}>
          <h3>Choose Password Type:</h3>

          <button
            className={styles.passwordTypeButton}
            onClick={handleNavigateToConnectDots}
          >
            <span className={styles.buttonIcon}>⚫</span>
            <div className={styles.buttonContent}>
              <span className={styles.buttonTitle}>Connect The Dots</span>
              <span className={styles.buttonDescription}>Create patterns by connecting dots</span>
            </div>
          </button>

          <button
            className={styles.passwordTypeButton}
            onClick={handleNavigateToPiano}
          >
            <span className={styles.buttonIcon}>🎹</span>
            <div className={styles.buttonContent}>
              <span className={styles.buttonTitle}>Piano Sequence</span>
              <span className={styles.buttonDescription}>Create melodies as passwords</span>
            </div>
          </button>

          <button
            className={styles.passwordTypeButton}
            onClick={handleNavigateToChess}
          >
            <span className={styles.buttonIcon}>♔</span>
            <div className={styles.buttonContent}>
              <span className={styles.buttonTitle}>Chess Board</span>
              <span className={styles.buttonDescription}>Place pieces on a chess board</span>
            </div>
          </button>

          <button
            className={styles.passwordTypeButton}
            onClick={handleNavigateToMathFormula}
          >
            <span className={styles.buttonIcon}>∫</span>
            <div className={styles.buttonContent}>
              <span className={styles.buttonTitle}>Mathematical Formula</span>
              <span className={styles.buttonDescription}>Draw mathematical expressions</span>
            </div>
          </button>

          <button
            className={styles.passwordTypeButton}
            onClick={handleNavigateToPixelArt}
          >
            <span className={styles.buttonIcon}>🎨</span>
            <div className={styles.buttonContent}>
              <span className={styles.buttonTitle}>Pixel Art</span>
              <span className={styles.buttonDescription}>Create patterns with pixel art</span>
            </div>
          </button>

        </div>
      )}

      <div className="footer">
        <button className="signOutButton" onClick={handleSignOut}>
          <span className="signOutIcon">👋</span>
          <span className="signOutText">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Popup;