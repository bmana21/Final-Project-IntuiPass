import React, {useEffect, useState} from 'react';
import {useNavigation} from "../../components/AppRouter";
import {getPatternTypeDisplay} from "../../utils/PatternUtils";
import {UserPatternData} from "../../models/user-pattern-data";
import "./PasswordManager.css";
import {UserPatternService} from "../../services/firestore-service.ts";
import {firebaseApp} from "../../firebase/firebase-config.ts";

const PasswordManager: React.FC = () => {
    // @ts-ignore
    const {_navigateTo, _getRouteParams, goBack} = useNavigation();
    const [expandedWebsites, setExpandedWebsites] = useState<Set<string>>(new Set());
    const [userPasswords, setUserPasswords] = useState<UserPatternData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPasswords = async () => {
        try {
            setIsLoading(true);
            const uid = firebaseApp.auth().currentUser?.uid;
            if (!uid) {
                setIsLoading(false);
                console.log("No user logged in");
                return;
            }

            const service = new UserPatternService();
            const data = await service.getUserPatternDataByUUID(uid);
            setUserPasswords(data);
        } catch (e) {
            console.error('Error loading saved patterns:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPasswords();
    }, []);

    const groupedPasswords = userPasswords.reduce((acc, pwd) => {
        const domain = pwd.website_url;
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

    if (isLoading) {
        return (
            <div className="manager-container">
                <div className="header">
                    <button className="back-button" onClick={goBack}>
                        ← Back
                    </button>
                    <h1 className="page-title">Password Manager</h1>
                    <button className="refresh-button" onClick={fetchPasswords} disabled={isLoading}>
                        🔄
                    </button>
                </div>

                <div className="passwords-container">
                    <div className="loading-screen">
                        <div className="spinner"></div>
                        <div className="loading-text">Loading your passwords...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="manager-container">
            <div className="header">
                <button className="back-button" onClick={goBack}>
                    ← Back
                </button>
                <h1 className="page-title">Password Manager</h1>
                <button className="refresh-button" onClick={fetchPasswords} disabled={isLoading}>
                    🔄
                </button>
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
                                            <div className="password-count">{passwords.length} passwords saved</div>
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
                                                        {getPatternTypeDisplay(password.pattern_type).name}
                                                        <br/>
                                                        {password.username}
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