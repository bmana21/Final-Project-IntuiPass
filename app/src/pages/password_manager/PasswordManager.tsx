import React, {useEffect, useState} from 'react';
import {Page, useNavigation} from "../../components/AppRouter";
import {getPatternTypeDisplay} from "../../utils/PatternUtils";
import {UserPatternData} from "../../models/user-pattern-data";
import styles from "./PasswordManager.module.css";
import {UserPatternService} from "../../services/firestore-service.ts";
import {firebaseApp} from "../../firebase/firebase-config.ts";
import {PatternType} from "../../models/pattern-type.ts";

const PasswordManager: React.FC = () => {
    const {navigateTo, goBack} = useNavigation();
    const [expandedWebsites, setExpandedWebsites] = useState<Set<string>>(new Set());
    const [userPasswords, setUserPasswords] = useState<UserPatternData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [passwordToDelete, setPasswordToDelete] = useState<UserPatternData | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

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

    const filteredPasswords = userPasswords.filter(pwd =>
        pwd.website_url.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedPasswords = filteredPasswords.reduce((acc, pwd) => {
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
            [PatternType.MATHEMATICAL_FORMULA]: 'math_formula',
            [PatternType.PIXEL_ART]: 'pixel_art'
        };

        const route = routeMap[password.pattern_type];
        if (!route) return;

        navigateTo(route, {
            isCreatingPassword: false,
            username: password.username,
            isViewingPassword: true
        });
    };

    const handlePasswordDelete = (e: React.MouseEvent, password: UserPatternData) => {
        e.stopPropagation();
        setPasswordToDelete(password);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!passwordToDelete) return;

        try {
            await (new UserPatternService()).deleteUserPatternData(passwordToDelete.uuid);
            await fetchPasswords();
            setShowDeleteModal(false);
            setPasswordToDelete(null);
        } catch (error) {
            console.error('Error deleting password:', error);
            alert('Failed to delete password. Please try again.');
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setPasswordToDelete(null);
    };

    const clearSearch = () => {
        setSearchQuery('');
    };

    if (!authChecked || isLoading) {
        return (
            <div className={styles.managerContainer}>
                <div className={styles.header}>
                    <button className={styles.backButton} onClick={goBack}>
                        ← Back
                    </button>
                    <h1 className={styles.pageTitle}>Password Manager</h1>
                    <button className={styles.refreshButton} onClick={handleRefresh} disabled={isLoading}>
                        🔄
                    </button>
                </div>

                <div className={styles.passwordsContainer}>
                    <div className={styles.loadingScreen}>
                        <div className={styles.spinner}></div>
                        <div className={styles.loadingText}>
                            {!authChecked ? "Checking authentication..." : "Loading your passwords..."}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!firebaseApp.auth().currentUser) {
        return (
            <div className={styles.managerContainer}>
                <div className={styles.header}>
                    <button className={styles.backButton} onClick={goBack}>
                        ← Back
                    </button>
                    <h1 className={styles.pageTitle}>Password Manager</h1>
                    <button className={styles.refreshButton} onClick={handleRefresh}>
                        🔄
                    </button>
                </div>

                <div className={styles.passwordsContainer}>
                    <div className={styles.noPasswords}>
                        <div className={styles.noPassswordsIcon}>🔐</div>
                        <h3>Authentication Required</h3>
                        <p>Please log in to view your saved passwords</p>
                        <button className={styles.refreshButton} onClick={handleRefresh} style={{marginTop: '20px'}}>
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={styles.managerContainer}>
                <div className={styles.header}>
                    <button className={styles.backButton} onClick={goBack}>
                        ← Back
                    </button>
                    <h1 className={styles.pageTitle}>Password Manager</h1>
                    <button className={styles.refreshButton} onClick={handleRefresh} disabled={isLoading}>
                        🔄
                    </button>
                </div>

                <div className={styles.passwordsContainer}>
                    <div className={styles.searchContainer}>
                        <div className={styles.searchInputWrapper}>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search by website..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    className={styles.clearSearchButton}
                                    onClick={clearSearch}
                                    title="Clear search"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {Object.keys(groupedPasswords).length === 0 ? (
                        <div className={styles.noPasswords}>
                            <div className={styles.noPasswordsIcon}>
                                {searchQuery ? '🔍' : '🔐'}
                            </div>
                            <h3>
                                {searchQuery ? 'No matching passwords found' : 'No passwords saved yet'}
                            </h3>
                            <p>
                                {searchQuery
                                    ? `No passwords found for "${searchQuery}"`
                                    : 'Start by creating your first password'
                                }
                            </p>
                            {!searchQuery && (
                                <button
                                    className={styles.refreshButton}
                                    onClick={handleRefresh}
                                    style={{ marginTop: '20px' }}
                                >
                                    Refresh
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {searchQuery && (
                                <div className={styles.searchResultsInfo}>
                                    Found {filteredPasswords.length} password{filteredPasswords.length !== 1 ? 's' : ''} matching "{searchQuery}"
                                </div>
                            )}
                            <div className={styles.passwrodsList}>
                                {Object.entries(groupedPasswords).map(([domain, passwords]) => (
                                    <div key={domain} className={styles.passwordGroup}>
                                        <div className={styles.passwordHeader} onClick={() => toggleWebsiteExpansion(domain)}>
                                            <div className={styles.websiteInfo}>
                                                <div className={styles.websiteIcon}>🌐</div>
                                                <div className={styles.websiteDetails}>
                                                    <div className={styles.websiteName}>{domain}</div>
                                                    <div className={styles.passwordCount}>{passwords.length} passwords saved</div>
                                                </div>
                                            </div>
                                            <div className={styles.expandIcon}>
                                                {expandedWebsites.has(domain) ? '▼' : '▶'}
                                            </div>
                                        </div>

                                        {expandedWebsites.has(domain) && (
                                            <div className={styles.passwordDetailsGroup}>
                                                {passwords.map((password) => (
                                                    <div
                                                        key={password.uuid}
                                                        className={styles.passwordTile}
                                                        onClick={() => handlePasswordView(password)}
                                                    >
                                                        <div className={styles.patternTypeIcon}>
                                                            {getPatternTypeDisplay(password.pattern_type).icon}
                                                        </div>
                                                        <div className={styles.passwordInfo}>
                                                            <div className={styles.passwordMainText}>
                                                                {getPatternTypeDisplay(password.pattern_type).name}
                                                                <br/>
                                                                {password.username}
                                                            </div>
                                                            <div className={styles.passwordDateText}>
                                                                {new Date(password.createdAt).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                        <button
                                                            className={styles.deleteButton}
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
                        </>
                    )}
                </div>
            </div>

            {showDeleteModal && passwordToDelete && (
                <div className={styles.modalOverlay}>
                    <div className={styles.deleteConfirmationModal}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalIcon}>⚠️</div>
                            <h3 className={styles.modalTitle}>Delete Password</h3>
                        </div>

                        <div className={styles.modalContent}>
                            <p className={styles.modalMessage}>
                                Are you sure you want to delete the password for{' '}
                                <strong>{passwordToDelete.username}</strong> on{' '}
                                <strong>{passwordToDelete.website_url}</strong>?
                            </p>
                            <p className={styles.modalWarning}>
                                This action cannot be undone.
                            </p>
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                className={`${styles.modalButton} ${styles.secondary}`}
                                onClick={cancelDelete}
                            >
                                Cancel
                            </button>
                            <button
                                className={`${styles.modalButton} ${styles.danger}`}
                                onClick={confirmDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PasswordManager;