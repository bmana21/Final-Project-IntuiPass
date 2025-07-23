import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '../../components/AppRouter';
import { PasswordIntegrationService } from "../../services/password-integration-service.ts";
import { PatternType } from "../../models/pattern-type.ts";
import UsernameInput from '../../components/UsernameInput/UsernameInput';
import { ConfigService } from '../../services/config-service.ts';
import {CredentialsDisplay} from '../cretentials-display/CredentialsDisplay';
import './MathFormulaPassword.css';

import * as iink from 'iink-ts';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const MathFormulaPassword: React.FC = () => {
    const { goBack, getRouteParams } = useNavigation();

    const editorRef = useRef<HTMLDivElement>(null);
    const resultRef = useRef<HTMLDivElement>(null);
    const [editor, setEditor] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [latexFormula, setLatexFormula] = useState('');
    const [username, setUsername] = useState<string>('');
    const [isUsernameValid, setIsUsernameValid] = useState<boolean>(false);

    const [showCredentials, setShowCredentials] = useState<boolean>(false);
    const [retrievedPassword, setRetrievedPassword] = useState<string>('');

    const routeParams = getRouteParams();
    const isCreatingPassword = routeParams?.isCreatingPassword ?? true;
    const isViewingPassword = routeParams?.isViewingPassword ?? false;
    const usernameFromPattern = routeParams?.username;

    useEffect(() => {
        loadEditor();

        if (usernameFromPattern && !isCreatingPassword) {
            setUsername(usernameFromPattern);
        }

        return () => {
            if (editor) {
                editor.dispose?.();
            }
        };
    }, [isCreatingPassword, usernameFromPattern]);

    const cleanLatex = useCallback((latexExport: string | number) => {
        if (typeof latexExport === "number") {
            latexExport = latexExport.toString();
        }
        if (latexExport.includes("\\\\")) {
            const steps = "\\begin{align*}" + latexExport + "\\end{align*}";
            return steps
                .replace("\\begin{aligned}", "")
                .replace("\\end{aligned}", "")
                .replace(new RegExp("(align.{1})", "g"), "aligned");
        }
        return latexExport.replace(new RegExp("(align.{1})", "g"), "aligned");
    }, []);

    const loadEditor = async () => {
        try {
            if (!editorRef.current) {
                console.error('Editor element not found');
                setIsLoading(false);
                return;
            }

            const { appKey, hmacKey } = await ConfigService.getCredentials();
            console.log('appkey and hmacKey', appKey, hmacKey);
            if (!appKey || !hmacKey) {
                console.error('MyScript credentials not found in environment variables');
                setIsLoading(false);
                return;
            }

            const options = {
                configuration: {
                    server: {
                        applicationKey: appKey,
                        hmacKey: hmacKey
                    },
                    recognition: {
                        type: "MATH" as const,
                        math: {
                            mimeTypes: ["application/x-latex" as const],
                        },
                    },
                },
            };

            const editorInstance = await iink.Editor.load(
                editorRef.current,
                "INKV2",
                options
            );

            setTimeout(() => {
                if (editorInstance && editorInstance.resize) {
                    if (editor && editor.resize && editorRef.current) {
                        const width = editorRef.current.clientWidth;
                        const height = editorRef.current.clientHeight;

                        editorInstance.resize({ width, height });
                        console.log(`Editor resized to: ${width}x${height}`);
                    } else {
                        editorInstance.resize();
                    }
                }
            }, 100);

            editorInstance.event.addEventListener("exported", (evt: any) => {
                const exports = evt.detail;
                if (exports && exports["application/x-latex"]) {
                    const latex = cleanLatex(exports["application/x-latex"]);
                    setLatexFormula(latex);

                    if (resultRef.current) {
                        try {
                            katex.render(latex, resultRef.current);
                        } catch (error) {
                            resultRef.current.innerHTML = `<span>${latex}</span>`;
                        }
                    }
                }
            });

            setEditor(editorInstance);
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to load math editor:', error);
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        if (editor) {
            editor.clear();
            setLatexFormula('');
            if (resultRef.current) {
                resultRef.current.innerHTML = '';
            }
        }
        setShowCredentials(false);
        setRetrievedPassword('');
    };

    const handleUndo = () => {
        if (editor) {
            editor.undo();
        }
    };

    const handleRedo = () => {
        if (editor) {
            editor.redo();
        }
    };

    const canProceed = () => {
        const hasFormula = latexFormula.length > 0;

        if (isCreatingPassword) {
            return isUsernameValid && hasFormula;
        } else {
            return hasFormula;
        }
    };

    const savePassword = async () => {
        if (!canProceed()) {
            if (isCreatingPassword) {
                if (!isUsernameValid) {
                    alert('Please enter a valid username!');
                    return;
                }
                if (!latexFormula) {
                    alert('Please draw a mathematical formula!');
                    return;
                }
            } else {
                alert('Please draw a mathematical formula!');
                return;
            }
        }

        const finalUsername = isCreatingPassword ? username : (usernameFromPattern || '');

        if (!finalUsername.trim()) {
            alert('Username is required!');
            return;
        }

        try {
            const passwordData = {
                type: 'mathematical_formula',
                pattern: latexFormula,
                username: finalUsername,
                createdAt: new Date(),
                userId: 'current_user_id'
            };

            console.log('Processing password:', passwordData);

            const passwordIntegrationService = new PasswordIntegrationService();
            if (!isViewingPassword) {
                const success = await passwordIntegrationService.processPassword(
                    latexFormula,
                    PatternType.MATHEMATICAL_FORMULA,
                    isCreatingPassword,
                    finalUsername
                );

                if (success) {
                    window.close();
                } else {
                    alert('Could not process password!');
                }
            } else {
                const password = await passwordIntegrationService.getPasswordByKey(latexFormula, PatternType.MATHEMATICAL_FORMULA, usernameFromPattern);

                if (password) {
                    setRetrievedPassword(password);
                    setShowCredentials(true);
                } else {
                    alert('Password not found or formula incorrect!');
                }
            }
        } catch (error) {
            console.error('Error processing password:', error);
            alert('Failed to process password');
        }
    };

    return (
        <div className="math-formula-container">
            <div className="header">
                <button className="back-button" onClick={goBack}>
                    ← Back
                </button>
                <div className="header-content">
                    <h2>Mathematical Formula</h2>
                </div>
            </div>

            {isCreatingPassword && (
                <UsernameInput
                    value={username}
                    onChange={setUsername}
                    onValidation={setIsUsernameValid}
                />
            )}

            <div className="instructions">
                <p>
                    {isCreatingPassword
                        ? "Draw your mathematical formula using your mouse or touch. The formula will be converted to LaTeX."
                        : "Recreate your mathematical formula password by drawing it below."
                    }
                </p>
            </div>

            <div className="math-editor-section">
                <div className="controls">
                    <button onClick={handleClear} disabled={isLoading} className="clear-button">
                        Clear
                    </button>
                    <button onClick={handleUndo} disabled={isLoading} className="undo-button">
                        Undo
                    </button>
                    <button onClick={handleRedo} disabled={isLoading} className="redo-button">
                        Redo
                    </button>
                </div>

                <div className="canvas-container">
                    <div
                        ref={editorRef}
                        className="math-editor"
                        style={{
                            height: '500px',
                            width: '100%',
                            border: '3px solid #ddd',
                            borderRadius: '12px',
                            backgroundColor: '#fff'
                        }}
                    />

                    {isLoading && (
                        <div className="loading-overlay">Loading math editor...</div>
                    )}
                </div>
            </div>

            <div className="preview-section">
                <h3>Preview:</h3>
                <div
                    ref={resultRef}
                    className="latex-preview"
                    style={{
                        minHeight: '80px',
                        border: '2px solid #eee',
                        borderRadius: '8px',
                        padding: '20px',
                        backgroundColor: '#f9f9f9',
                        textAlign: 'center'
                    }}
                />
                {latexFormula && (
                    <div className="latex-raw">
                        <small>LaTeX: {latexFormula}</small>
                    </div>
                )}
            </div>

            <div className="controls">
                <button
                    onClick={savePassword}
                    className={`save-button ${!canProceed() ? 'disabled' : ''}`}
                    disabled={!canProceed()}
                >
                    {isCreatingPassword ? "Save Pattern" : (isViewingPassword ? "View Password" : "Fill Password")}
                </button>
            </div>

            {/* Add the CredentialsDisplay component here */}
            {showCredentials && isViewingPassword && usernameFromPattern && retrievedPassword && (
                <CredentialsDisplay
                    username={usernameFromPattern}
                    password={retrievedPassword}
                />
            )}

            {latexFormula && (
                <div className="pattern-display">
                    <p><strong>Formula:</strong> {latexFormula}</p>
                    <p><small>Mathematical expression in LaTeX format</small></p>
                </div>
            )}
        </div>
    );
};

export default MathFormulaPassword;