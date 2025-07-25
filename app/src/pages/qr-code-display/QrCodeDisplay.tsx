import React, { useEffect, useState } from "react";
import "./QrCodeDisplay.css";
import { useNavigation } from "../../components/AppRouter.tsx";

const QrCodeDisplay: React.FC = () => {
    const { goBack, getRouteParams } = useNavigation();
    const routeParams = getRouteParams();
    const plainTextPassword = routeParams?.plainTextPassword ?? '';
    const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState(60);

    useEffect(() => {
        generateQRCode(plainTextPassword);

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleClose();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [plainTextPassword]);

    const generateQRCode = async (text: string) => {
        try {
            const QRCode = await import('qrcode');
            const dataURL = await QRCode.toDataURL(text, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            setQrCodeDataURL(dataURL);
        } catch (error) {
            console.error('Error generating QR code:', error);
            setQrCodeDataURL('data:image/svg+xml;base64,' + btoa(`
                <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
                    <rect width="256" height="256" fill="#f0f0f0"/>
                    <text x="128" y="128" text-anchor="middle" font-family="Arial" font-size="14" fill="#666">
                        QR Code Error
                    </text>
                </svg>
            `));
        }
    };

    const handleClose = () => {
        window.close();
    };

    const handleGoBack = () => {
        goBack();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="qr-display-container">
            <div className="qr-header">
                <h2 className="qr-title">Scan with Your Mobile Device</h2>
                <div className="timer-display">
                    Auto-close in: <span className="timer-countdown">{formatTime(timeLeft)}</span>
                </div>
            </div>

            <div className="qr-content">
                <div className="qr-code-wrapper">
                    {qrCodeDataURL ? (
                        <img
                            src={qrCodeDataURL}
                            alt="QR Code for password"
                            className="qr-code-image"
                        />
                    ) : (
                        <div className="qr-loading">
                            <div className="loading-spinner"></div>
                            <p>Generating QR Code...</p>
                        </div>
                    )}
                </div>

                <div className="qr-instructions">
                    <p className="instruction-text">
                        Open your phone's camera app and point it at the QR code above
                    </p>
                    <p className="instruction-subtitle">
                        Your password will appear on your phone's screen
                    </p>
                </div>

                <div className="security-notice">
                    <div className="notice-icon">🔒</div>
                    <div className="notice-text">
                        <strong>Security Notice:</strong> This QR code contains your password.
                        Make sure no one else can see your screen.
                    </div>
                </div>
            </div>

            <div className="qr-actions">
                <button
                    className="action-button secondary"
                    onClick={handleGoBack}
                >
                    ← Go Back
                </button>
                <button
                    className="action-button primary"
                    onClick={handleClose}
                >
                    Close Extension
                </button>
            </div>
        </div>
    );
};

export default QrCodeDisplay;