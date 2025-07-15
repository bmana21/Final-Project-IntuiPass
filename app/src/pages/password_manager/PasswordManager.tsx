import React, {useState} from 'react';
import {PatternType} from "../../models/pattern-type.ts";
import {useNavigation} from "../../components/AppRouter.tsx";
import {getPatternTypeDisplay} from "../../utils/PatternUtils.ts";
import {UserPatternData} from "../../models/user-pattern-data.ts";
import "./PasswordManager.css";

const PasswordManager: React.FC = () => {
    // @ts-ignore
    const {_navigateTo, _getRouteParams, goBack} = useNavigation();

    const [expandedPassword, setExpandedPassword] = useState<string | null>(null);

    // Test data, TODO: Replace this with real data from DB.
    const testPasswords: UserPatternData[] = [
        new UserPatternData(
            'user1',
            PatternType.CONNECT_DOTS,
            'john.doe@email.com',
            'https://www.google.com',
            'encrypted_password_1'
        ),
        new UserPatternData(
            'user1',
            PatternType.CONNECT_DOTS,
            'johnsmith',
            'https://www.facebook.com',
            'encrypted_password_2'
        ),
        new UserPatternData(
            'user1',
            PatternType.CONNECT_DOTS,
            'john_doe',
            'https://www.github.com',
            'encrypted_password_3'
        ),
        new UserPatternData(
            'user1',
            PatternType.PIANO_SEQUENCE,
            'john.doe@company.com',
            'https://www.linkedin.com',
            'encrypted_password_4'
        ),
        new UserPatternData(
            'user1',
            PatternType.PIANO_SEQUENCE,
            'john.doe@company.com',
            'https://www.codeforces.com',
            'encrypted_password_4'
        ),
        new UserPatternData(
            'user1',
            PatternType.PIANO_SEQUENCE,
            'john.doe@company.com',
            'https://www.youtube.com',
            'encrypted_password_4'
        ),
        new UserPatternData(
            'user1',
            PatternType.PIANO_SEQUENCE,
            'john.doe@company.com',
            'https://www.asus.com',
            'encrypted_password_4'
        )
    ];

    const togglePasswordExpansion = (uuid: string) => {
        setExpandedPassword(expandedPassword === uuid ? null : uuid);
    };

    const getDomainName = (url: string) => {
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '');
        } catch {
            return url;
        }
    };

    return (
        <div className="popup-container">
            <div className="header">
                <button className="back-button" onClick={goBack}>
                    ← Back
                </button>
                <h1 className="page-title">Password Manager</h1>
            </div>

            <div className="passwords-container">
                {testPasswords.length === 0 ? (
                    <div className="no-passwords">
                        <div className="no-passwords-icon">🔐</div>
                        <h3>No passwords saved yet</h3>
                        <p>Start by creating your first password</p>
                    </div>
                ) : (
                    <div className="passwords-list">
                        {testPasswords.map((password) => (
                            <div key={password.uuid} className="password-item">
                                <div
                                    className="password-header"
                                    onClick={() => togglePasswordExpansion(password.uuid)}
                                >
                                    <div className="website-info">
                                        <div className="website-icon">🌐</div>
                                        <div className="website-details">
                                            <div className="website-name">{getDomainName(password.website_url)}</div>
                                            <div className="website-url">{password.website_url}</div>
                                        </div>
                                    </div>
                                    <div className="expand-icon">
                                        {expandedPassword === password.uuid ? '▼' : '▶'}
                                    </div>
                                </div>

                                {expandedPassword === password.uuid && (
                                    <div className="password-details">
                                        <div className="detail-row">
                                            <div className="detail-label">Pattern Type:</div>
                                            <div className="detail-value">
                                                <span
                                                    className="pattern-icon">{getPatternTypeDisplay(password.pattern_type).icon}</span>
                                                {getPatternTypeDisplay(password.pattern_type).name}
                                            </div>
                                        </div>

                                        <div className="detail-row">
                                            <div className="detail-label">Username:</div>
                                            <div className="detail-value">{password.username}</div>
                                            <button className="eye-button">
                                                👁️
                                            </button>
                                        </div>

                                        <div className="detail-row">
                                            <div className="detail-label">Created:</div>
                                            <div className="detail-value">
                                                {new Date(password.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PasswordManager;