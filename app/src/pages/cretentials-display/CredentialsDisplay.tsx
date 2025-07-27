import React, {useState} from 'react';
import styles from './CredentialsDisplay.module.css';
import {useNavigation} from "../../components/AppRouter.tsx";

interface CredentialsDisplayProps {
    username: string;
    password: string;
}

export const CredentialsDisplay: React.FC<CredentialsDisplayProps> = ({
                                                                          username,
                                                                          password
                                                                      }) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [usernameCopied, setUsernameCopied] = useState(false);
    const [passwordCopied, setPasswordCopied] = useState(false);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const {navigateTo} = useNavigation();

    const copyToClipboard = async (text: string, field: 'username' | 'password') => {
        try {
            await navigator.clipboard.writeText(text);

            if (field === 'username') {
                setUsernameCopied(true);
                setTimeout(() => setUsernameCopied(false), 2000);
            } else {
                setPasswordCopied(true);
                setTimeout(() => setPasswordCopied(false), 2000);
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);

            if (field === 'username') {
                setUsernameCopied(true);
                setTimeout(() => setUsernameCopied(false), 2000);
            } else {
                setPasswordCopied(true);
                setTimeout(() => setPasswordCopied(false), 2000);
            }
        }
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const handleQRShareClick = () => {
        setShowWarningModal(true);
    };

    const handleWarningCancel = () => {
        setShowWarningModal(false);
    };

    const handleWarningOk = () => {
        setShowWarningModal(false);
        navigateTo('qr-code', {
            plainTextPassword: password
        });
    };

    return (
        <>
            <div className={styles.credentialsContainer}>
                <div className={styles.credentialField}>
                    <label>Username</label>
                    <div className={styles.inputGroup}>
                        <input
                            type="text"
                            value={username}
                            readOnly
                            className={styles.credentialInput}
                        />
                        <button
                            className={`${styles.copyButton} ${usernameCopied ? styles.copied : ''}`}
                            onClick={() => copyToClipboard(username, 'username')}
                        >
                            <span className={styles.copyText}>
                                {usernameCopied ? 'Copied!' : 'Copy'}
                            </span>
                        </button>
                    </div>
                </div>

                <div className={styles.credentialField}>
                    <label>Password</label>
                    <div className={styles.inputGroup}>
                        <input
                            type={isPasswordVisible ? 'text' : 'password'}
                            value={password}
                            readOnly
                            className={`${styles.credentialInput} ${styles.passwordField}`}
                        />
                        <button
                            className={styles.viewButton}
                            onClick={togglePasswordVisibility}
                        >
                            <span className={styles.viewText}>
                                {isPasswordVisible ? '🔒' : '👁️'}
                            </span>
                        </button>
                        <button
                            className={`${styles.copyButton} ${passwordCopied ? styles.copied : ''}`}
                            onClick={() => copyToClipboard(password, 'password')}
                        >
                            <span className={styles.copyText}>
                                {passwordCopied ? 'Copied!' : 'Copy'}
                            </span>
                        </button>
                    </div>
                </div>

                <div className={styles.qrShareSection}>
                    <span className={styles.qrShareLabel}>Share with mobile device</span>
                    <button
                        className={styles.qrShareButton}
                        onClick={handleQRShareClick}
                    >
                        Share with QR Code
                    </button>
                </div>
            </div>

            {showWarningModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.warningModal}>
                        <div className={styles.warningHeader}>
                            <span className={styles.warningIcon}>⚠️</span>
                            <h3 className={styles.warningTitle}>Security Warning</h3>
                        </div>
                        <p className={styles.warningMessage}>
                            The QR code will contain your generated password in plain text.
                            Only display it if you are in a private, secure environment.

                            Anyone who sees the QR code can access your password.

                            Do you want to continue?
                        </p>
                        <div className={styles.warningButtons}>
                            <button
                                className={`${styles.warningButton} ${styles.cancel}`}
                                onClick={handleWarningCancel}
                            >
                                Cancel
                            </button>
                            <button
                                className={`${styles.warningButton} ${styles.ok}`}
                                onClick={handleWarningOk}
                            >
                                I Understand, Show QR Code
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};