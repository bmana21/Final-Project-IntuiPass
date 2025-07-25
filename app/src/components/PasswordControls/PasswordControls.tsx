import React from 'react';
import styles from './PasswordControls.module.css';

interface PasswordControlsProps {
  onClear: () => void;
  onSave: () => void;
  canProceed: () => boolean;
  isCreatingPassword: boolean;
  isViewingPassword: boolean;
  clearButtonText?: string;
  className?: string;
}

const PasswordControls: React.FC<PasswordControlsProps> = ({
  onClear,
  onSave,
  canProceed,
  isCreatingPassword,
  isViewingPassword,
  className = ""
}) => {
  const getSaveButtonText = () => {
    if (isCreatingPassword) return "Save Pattern";
    if (isViewingPassword) return "View Password";
    return "Fill Password";
  };

  return (
    <div className={`${styles.controls} ${className}`}>
      <button onClick={onClear} className={styles.clearButton}>
        Clear
      </button>

      <button
        onClick={onSave}
        className={`${styles.saveButton} ${!canProceed() ? styles.disabled : ''}`}
        disabled={!canProceed()}
      >
        {getSaveButtonText()}
      </button>
    </div>
  );
};

export default PasswordControls;