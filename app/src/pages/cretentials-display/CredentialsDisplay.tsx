import React, {useState} from 'react';
import './CredentialsDisplay.css';

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
        // TODO: Implement QR code generation here
    };

    return (
        <>
            <div className="credentials-container">
                <div className="credential-field">
                    <label>Username</label>
                    <div className="input-group">
                        <input
                            type="text"
                            value={username}
                            readOnly
                            className="credential-input"
                        />
                        <button
                            className={`copy-button ${usernameCopied ? 'copied' : ''}`}
                            onClick={() => copyToClipboard(username, 'username')}
                        >
                            <span className="copy-text">
                                {usernameCopied ? 'Copied!' : 'Copy'}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="credential-field">
                    <label>Password</label>
                    <div className="input-group">
                        <input
                            type={isPasswordVisible ? 'text' : 'password'}
                            value={password}
                            readOnly
                            className="credential-input password-field"
                        />
                        <button
                            className="view-button"
                            onClick={togglePasswordVisibility}
                        >
                            <span className="view-text">
                                {isPasswordVisible ? '🔒' : '👁️'}
                            </span>
                        </button>
                        <button
                            className={`copy-button ${passwordCopied ? 'copied' : ''}`}
                            onClick={() => copyToClipboard(password, 'password')}
                        >
                            <span className="copy-text">
                                {passwordCopied ? 'Copied!' : 'Copy'}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="qr-share-section">
                    <span className="qr-share-label">Share with mobile device</span>
                    <button
                        className="qr-share-button"
                        onClick={handleQRShareClick}
                    >
                        📱 Share with QR Code
                    </button>
                </div>
            </div>

            {showWarningModal && (
                <div className="modal-overlay">
                    <div className="warning-modal">
                        <div className="warning-header">
                            <span className="warning-icon">⚠️</span>
                            <h3 className="warning-title">Security Warning</h3>
                        </div>
                        <p className="warning-message">
                            You're about to display your password as a QR code. Make sure no one else can see your screen,
                            as anyone who scans this QR code will have access to your password. The QR code will automatically
                            disappear after 60 seconds for your security.
                        </p>
                        <div className="warning-buttons">
                            <button
                                className="warning-button cancel"
                                onClick={handleWarningCancel}
                            >
                                Cancel
                            </button>
                            <button
                                className="warning-button ok"
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