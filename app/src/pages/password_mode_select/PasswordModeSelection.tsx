import React from 'react';
import { firebaseApp } from '../../firebase/firebase-config';
import { useNavigation } from '../../components/AppRouter';
import './PasswordModeSelection.css';

const PasswordModeSelection: React.FC = () => {
  const { navigateTo } = useNavigation();

  const handleModeSelection = (isCreating: boolean) => {
    navigateTo('password_type_selection', { isCreatingPassword: isCreating });
  };
  const handleSignOut = () => {
      firebaseApp.auth().signOut()
        .then(() => {
          chrome.runtime.sendMessage({ command: "signOut" }, (_) => {
            navigateTo('login');
            console.log("Signed out successfully");
          });
        })
        .catch((error) => {
          console.error("Sign out failed:", error);
          navigateTo('login');
        });
    };

  return (
    <div className="password-mode-container">
      <div className="mode-selection-card">
        <h1>Password Manager</h1>
        <p className="subtitle">Choose what you'd like to do</p>
        
        <div className="mode-buttons">
          <button 
            className="mode-button create-button"
            onClick={() => handleModeSelection(true)}
          >
            <div className="button-icon">🔐</div>
            <h3>Create New Password</h3>
            <p>Set up a new pattern-based password</p>
          </button>
          
          <button 
            className="mode-button fill-button"
            onClick={() => handleModeSelection(false)}
          >
            <div className="button-icon">🔓</div>
            <h3>Fill Existing Password</h3>
            <p>Use your saved pattern to fill a password</p>
          </button>
        </div>
        
        <button className="sign-out-link" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default PasswordModeSelection;