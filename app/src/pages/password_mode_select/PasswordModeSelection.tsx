import React from 'react';
import { useNavigation } from '../../components/AppRouter';
import { AuthService } from '../../services/auth-service';
import styles from './PasswordModeSelection.module.css';

const PasswordModeSelection: React.FC = () => {
  const { navigateTo } = useNavigation();

  const handleModeSelection = (isCreating: boolean) => {
    navigateTo('password_type_selection', { isCreatingPassword: isCreating });
  };

  const handleManagePasswords = () => {
    navigateTo('password-manager-page');
  };

  const handleSignOut = () => {
      AuthService.handleSignOut(() => navigateTo('login'));
  };

  return (
    <div className={styles.passwordModeContainer}>
      <div className={styles.modeSelectionCard}>
        <h1>Password Manager</h1>
        <p className={styles.subtitle}>Choose what you'd like to do</p>
        
        <div className={styles.modeButtons}>
          <button 
            className={`${styles.modeButton} ${styles.createButton}`}
            onClick={() => handleModeSelection(true)}
          >
            <div className={styles.buttonIcon}>🔐</div>
            <h3>Create New Password</h3>
            <p>Set up a new pattern-based password</p>
          </button>
          
          <button 
            className={`${styles.modeButton} ${styles.fillButton}`}
            onClick={() => handleModeSelection(false)}
          >
            <div className={styles.buttonIcon}>🔓</div>
            <h3>Fill Existing Password</h3>
            <p>Use your saved pattern to fill a password</p>
          </button>

          <button
              className="mode-button manage-button"
              onClick={handleManagePasswords}
          >
            <div className="button-icon">📋</div>
            <h3>Manage Passwords</h3>
            <p>View and organize all your saved passwords</p>
          </button>
        </div>
        
      </div>
      <div className="footer">
        <button className="signOutButton" onClick={handleSignOut}>
          <span className="signOutIcon">👋</span>
          <span className="signOutText">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default PasswordModeSelection;