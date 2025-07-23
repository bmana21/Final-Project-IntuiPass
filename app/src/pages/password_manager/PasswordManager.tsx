import React, {useEffect, useState} from 'react';
import {Page, useNavigation} from "../../components/AppRouter";
import {getPatternTypeDisplay} from "../../utils/PatternUtils";
import {UserPatternData} from "../../models/user-pattern-data";
import "./PasswordManager.css";
import {UserPatternService} from "../../services/firestore-service.ts";
import {firebaseApp} from "../../firebase/firebase-config.ts";
import {PatternType} from "../../models/pattern-type.ts";

const PasswordManager: React.FC = () => {
    const {navigateTo, goBack} = useNavigation();
    const [expandedWebsites, setExpandedWebsites] = useState<Set<string>>(new Set());
    const [userPasswords, setUserPasswords] = useState<UserPatternData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);

    const fetchPasswords = async (retryCount = 0) => {
        try {
            setIsLoading(true);

            const currentUser = firebaseApp.auth().currentUser;
            if (!currentUser) {
                if (retryCount < 3) {
                    setTimeout(() => fetchPasswords(retryCount + 1), 500);
                    return;
                }
                setIsLoading(false);
                console.log("No user logged in after retries");
                return;
            }

            const uid = currentUser.uid;
            const service = new UserPatternService();
            const data = await service.getUserPatternDataByUserUUID(uid);
            setUserPasswords(data);
        } catch (e) {
            console.error('Error loading saved patterns:', e);
            if (retryCount < 2) {
                setTimeout(() => fetchPasswords(retryCount + 1), 1000);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = firebaseApp.auth().onAuthStateChanged((user) => {
            setAuthChecked(true);
            if (user) {
                fetchPasswords();
            } else {
                setUserPasswords([]);
                setIsLoading(false);
                console.log("User is not authenticated");
            }
        });

        return () => unsubscribe();
    }, []);

    const handleRefresh = async () => {
        const currentUser = firebaseApp.auth().currentUser;
        if (!currentUser) {
            alert("Please make sure you're logged in");
            return;
        }
        await fetchPasswords();
    };

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

    const handlePasswordView = (password: UserPatternData) => {
        const routeMap: Record<PatternType, Page> = {
            [PatternType.CONNECT_DOTS]: 'connect_the_dots',
            [PatternType.PIANO_SEQUENCE]: 'piano_password',
            [PatternType.CHESS_BOARD]: 'chess_password',
            [PatternType.MATHEMATICAL_FORMULA]: 'math_formula'
        };

        const route = routeMap[password.pattern_type];
        if (!route) return;

        navigateTo(route, {
            isCreatingPassword: false,
            username: password.username,
            isViewingPassword: true
        });
    };

    const handlePasswordDelete = async (e: React.MouseEvent, password: UserPatternData) => {
        e.stopPropagation();

        if (window.confirm(`Are you sure you want to delete the password for ${password.username} on ${password.website_url}?`)) {
            try {
                await (new UserPatternService()).deleteUserPatternData(password.uuid);
                await fetchPasswords();
            } catch (error) {
                console.error('Error deleting password:', error);
                alert('Failed to delete password. Please try again.');
            }
        }
    };

    if (!authChecked || isLoading) {
        return (
            <div className="manager-container">
                <div className="header">
                    <button className="back-button" onClick={goBack}>
                        ← Back
                    </button>
                    <h1 className="page-title">Password Manager</h1>
                    <button className="refresh-button" onClick={handleRefresh} disabled={isLoading}>
                        🔄
                    </button>
                </div>

                <div className="passwords-container">
                    <div className="loading-screen">
                        <div className="spinner"></div>
                        <div className="loading-text">
                            {!authChecked ? "Checking authentication..." : "Loading your passwords..."}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!firebaseApp.auth().currentUser) {
        return (
            <div className="manager-container">
                <div className="header">
                    <button className="back-button" onClick={goBack}>
                        ← Back
                    </button>
                    <h1 className="page-title">Password Manager</h1>
                    <button className="refresh-button" onClick={handleRefresh}>
                        🔄
                    </button>
                </div>

                <div className="passwords-container">
                    <div className="no-passwords">
                        <div className="no-passwords-icon">🔐</div>
                        <h3>Authentication Required</h3>
                        <p>Please log in to view your saved passwords</p>
                        <button className="refresh-button" onClick={handleRefresh} style={{marginTop: '20px'}}>
                            Try Again
                        </button>
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
                <button className="refresh-button" onClick={handleRefresh} disabled={isLoading}>
                    🔄
                </button>
            </div>

            <div className="passwords-container">
                {Object.keys(groupedPasswords).length === 0 ? (
                    <div className="no-passwords">
                        <div className="no-passwords-icon">🔐</div>
                        <h3>No passwords saved yet</h3>
                        <p>Start by creating your first password</p>
                        <button className="refresh-button" onClick={handleRefresh} style={{marginTop: '20px'}}>
                            Refresh
                        </button>
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
                                            <div
                                                key={password.uuid}
                                                className="password-tile"
                                                onClick={() => handlePasswordView(password)}
                                            >
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
                                                <button
                                                    className="delete-button"
                                                    onClick={(e) => handlePasswordDelete(e, password)}
                                                    title="Delete password"
                                                >
                                                    ❌️
                                                </button>
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