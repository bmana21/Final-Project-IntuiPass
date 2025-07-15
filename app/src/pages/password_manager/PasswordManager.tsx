import React, {useState} from 'react';
import {PatternType} from "../../models/pattern-type";
import {useNavigation} from "../../components/AppRouter";
import {getPatternTypeDisplay} from "../../utils/PatternUtils";
import {UserPatternData} from "../../models/user-pattern-data";
import "./PasswordManager.css";

const PasswordManager: React.FC = () => {
    // @ts-ignore
    const {_navigateTo, _getRouteParams, goBack} = useNavigation();
    const [expandedWebsites, setExpandedWebsites] = useState<Set<string>>(new Set());

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
            'john.doe@email.com',
            'https://www.google.com',
            'encrypted_password_1'
        ),
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
            'https://www.codeforces.com',
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

    const getDomainName = (url: string) => {
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '');
        } catch {
            return url;
        }
    };

    const groupedPasswords = testPasswords.reduce((acc, pwd) => {
        const domain = getDomainName(pwd.website_url);
        if (!acc[domain]) acc[domain] = [];
        acc[domain].push(pwd);
        return acc;
    }, {} as Record<string, UserPatternData[]>);

    const toggleWebsiteExpansion = (domain: string) => {
        const newSet = new Set(expandedWebsites);
        if (newSet.has(domain)) {
            newSet.delete(domain);
        } else {
            newSet.add(domain);
        }
        setExpandedWebsites(newSet);
    };

    return (
        <div className="manager-container">
            <div className="header">
                <button className="back-button" onClick={goBack}>
                    ← Back
                </button>
                <h1 className="page-title">Password Manager</h1>
            </div>

            <div className="passwords-container">
                {Object.keys(groupedPasswords).length === 0 ? (
                    <div className="no-passwords">
                        <div className="no-passwords-icon">🔐</div>
                        <h3>No passwords saved yet</h3>
                        <p>Start by creating your first password</p>
                    </div>
                ) : (
                    <div className="passwords-list">
                        {Object.entries(groupedPasswords).map(([domain, passwords]) => (
                            <div key={domain} className="password-group">
                                <div className="password-header" onClick={() => toggleWebsiteExpansion(domain)}>
                                    <div className="website-info">
                                        <div className="website-icon">🌐</div>
                                        <div className="website-details">
                                            <div className="website-name">{domain}</div>
                                            <div className="website-url">{passwords[0].website_url}</div>
                                        </div>
                                    </div>
                                    <div className="expand-icon">
                                        {expandedWebsites.has(domain) ? '▼' : '▶'}
                                    </div>
                                </div>

                                {expandedWebsites.has(domain) && (
                                    <div className="password-details-group">
                                        {passwords.map((password) => (
                                            <div key={password.uuid} className="password-tile">
                                                <div className="pattern-type-icon">
                                                    {getPatternTypeDisplay(password.pattern_type).icon}
                                                </div>
                                                <div className="password-info">
                                                    <div className="password-main-text">
                                                        {`${getPatternTypeDisplay(password.pattern_type).name}\n${password.username}`}
                                                    </div>
                                                    <div className="password-date-text">
                                                        {new Date(password.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <button className="eye-button">👁️</button>
                                            </div>
                                        ))}
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