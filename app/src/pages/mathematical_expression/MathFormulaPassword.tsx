import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '../../components/AppRouter';
import { PasswordIntegrationService } from "../../services/password-integration-service.ts";
import { PatternType } from "../../models/pattern-type.ts";
import UsernameInput from '../../components/UsernameInput/UsernameInput';
import { ConfigService } from '../../services/config-service.ts';
import { CredentialsDisplay } from '../cretentials-display/CredentialsDisplay';
import styles from './MathFormulaPassword.module.css';
import PasswordControls from '../../components/PasswordControls/PasswordControls.tsx';
import PasswordDifficulty, { DifficultyLevel, PasswordDifficultyRef } from '../../components/PasswordDifficulty/PasswordDifficulty';

import * as iink from 'iink-ts';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const MathFormulaPassword: React.FC = () => {
    const { goBack, getRouteParams } = useNavigation();
    const difficultyRef = useRef<PasswordDifficultyRef>(null);

    const editorRef = useRef<HTMLDivElement>(null);
    const resultRef = useRef<HTMLDivElement>(null);
    const [editor, setEditor] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [latexFormula, setLatexFormula] = useState('');
    const [username, setUsername] = useState<string>('');
    const [isUsernameValid, setIsUsernameValid] = useState<boolean>(false);
    const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>('Easy');

    const [showCredentials, setShowCredentials] = useState<boolean>(false);
    const [retrievedPassword, setRetrievedPassword] = useState<string>('');

    const routeParams = getRouteParams();
    const isCreatingPassword = routeParams?.isCreatingPassword ?? true;
    const isViewingPassword = routeParams?.isViewingPassword ?? false;
    const usernameFromPattern = routeParams?.username;

    const handleDifficultyChange = (difficulty: DifficultyLevel) => {
        setCurrentDifficulty(difficulty);
    };

    const assessPasswordDifficulty = (latexFormula: string): DifficultyLevel => {
        if (!latexFormula || latexFormula.trim().length === 0) return 'Easy';

        const formula = latexFormula.trim();
        let score = 0;

        const lengthScore = calculateLengthScore(formula);
        const operatorScore = calculateOperatorScore(formula);
        const symbolScore = calculateSymbolScore(formula);
        const symbolCountScore = calculateSymbolCountScore(formula);
        const functionScore = calculateFunctionScore(formula);
        const nestingScore = calculateNestingScore(formula);
        const complexityPenalty = calculateComplexityPenalty(formula);

        score = lengthScore + operatorScore + symbolScore + symbolCountScore + functionScore + nestingScore - complexityPenalty;

        if (score >= 20) return 'Hard';
        else if (score >= 12) return 'Normal';
        else return 'Easy';
    };

    const calculateLengthScore = (formula: string): number => {
        const cleanLength = formula.replace(/\\[a-zA-Z]+/g, 'X').length;
        
        if (cleanLength >= 8) return 4;
        else if (cleanLength >= 6) return 3;
        else if (cleanLength >= 4) return 2;
        else if (cleanLength >= 2) return 1;
        else return 0;
    };

    const calculateOperatorScore = (formula: string): number => {
        const advancedOperators = [
            '\\int', '\\sum', '\\prod', '\\lim', '\\partial', '\\nabla',
            '\\sqrt', '\\frac', '\\binom', '\\choose'
        ];
        
        let score = 0;
        advancedOperators.forEach(op => {
            const matches = (formula.match(new RegExp(`\\${op}`, 'g')) || []).length;
            score += matches * 2;
        });
        
        return Math.min(score, 8);
    };

    const calculateSymbolScore = (formula: string): number => {
        const greekLetters = [
            '\\alpha', '\\beta', '\\gamma', '\\delta', '\\epsilon', '\\zeta',
            '\\eta', '\\theta', '\\iota', '\\kappa', '\\lambda', '\\mu',
            '\\nu', '\\xi', '\\pi', '\\rho', '\\sigma', '\\tau',
            '\\upsilon', '\\phi', '\\chi', '\\psi', '\\omega'
        ];
        
        const specialSymbols = [
            '\\infty', '\\pm', '\\mp', '\\times', '\\div', '\\cdot',
            '\\equiv', '\\approx', '\\neq', '\\leq', '\\geq',
            '\\subset', '\\supset', '\\in', '\\notin', '\\cup', '\\cap'
        ];
        
        let score = 0;
        
        greekLetters.forEach(symbol => {
            if (formula.includes(symbol)) score += 1;
        });
        
        specialSymbols.forEach(symbol => {
            if (formula.includes(symbol)) score += 1;
        });
        
        return Math.min(score, 6);
    };

    const calculateSymbolCountScore = (formula: string): number => {
        const uniqueSymbols = new Set();
        
        const greekLetters = [
            '\\alpha', '\\beta', '\\gamma', '\\delta', '\\epsilon', '\\zeta',
            '\\eta', '\\theta', '\\iota', '\\kappa', '\\lambda', '\\mu',
            '\\nu', '\\xi', '\\pi', '\\rho', '\\sigma', '\\tau',
            '\\upsilon', '\\phi', '\\chi', '\\psi', '\\omega'
        ];
        
        const specialSymbols = [
            '\\infty', '\\pm', '\\mp', '\\times', '\\div', '\\cdot',
            '\\equiv', '\\approx', '\\neq', '\\leq', '\\geq',
            '\\subset', '\\supset', '\\in', '\\notin', '\\cup', '\\cap'
        ];

        const operators = [
            '\\int', '\\sum', '\\prod', '\\lim', '\\partial', '\\nabla',
            '\\sqrt', '\\frac', '\\binom', '\\choose'
        ];

        const functions = [
            '\\sin', '\\cos', '\\tan', '\\sec', '\\csc', '\\cot',
            '\\log', '\\ln', '\\lg', '\\sinh', '\\cosh', '\\tanh',
            '\\exp', '\\max', '\\min', '\\gcd', '\\lcm'
        ];

        const allSymbols = [...greekLetters, ...specialSymbols, ...operators, ...functions];
        
        allSymbols.forEach(symbol => {
            if (formula.includes(symbol)) {
                uniqueSymbols.add(symbol);
            }
        });

        const basicChars = formula.replace(/\\[a-zA-Z]+/g, '').split('');
        basicChars.forEach(char => {
            if (char.match(/[a-zA-Z0-9+\-*\/=(){}^_]/)) {
                uniqueSymbols.add(char);
            }
        });

        const uniqueCount = uniqueSymbols.size;
        
        return uniqueCount;
    };

    const calculateFunctionScore = (formula: string): number => {
        const trigFunctions = ['\\sin', '\\cos', '\\tan', '\\sec', '\\csc', '\\cot'];
        const logFunctions = ['\\log', '\\ln', '\\lg'];
        const hyperbolicFunctions = ['\\sinh', '\\cosh', '\\tanh'];
        const otherFunctions = ['\\exp', '\\max', '\\min', '\\gcd', '\\lcm'];
        
        let score = 0;
        
        [...trigFunctions, ...logFunctions, ...hyperbolicFunctions, ...otherFunctions].forEach(func => {
            const matches = (formula.match(new RegExp(`\\${func}`, 'g')) || []).length;
            score += matches;
        });
        
        return Math.min(score, 6);
    };

    const calculateNestingScore = (formula: string): number => {
        let maxDepth = 0;
        let currentDepth = 0;
        
        for (let i = 0; i < formula.length; i++) {
            if (formula[i] === '{' || formula[i] === '(') {
                currentDepth++;
                maxDepth = Math.max(maxDepth, currentDepth);
            } else if (formula[i] === '}' || formula[i] === ')') {
                currentDepth--;
            }
        }
        
        if (maxDepth >= 4) return 3;
        else if (maxDepth >= 3) return 2;
        else if (maxDepth >= 2) return 1;
        else return 0;
    };

    const calculateComplexityPenalty = (formula: string): number => {
        let penalty = 0;
        
        const simplePatterns = [
            /^[a-zA-Z]\s*=\s*[a-zA-Z0-9]+$/,
            /^[a-zA-Z]\s*\+\s*[a-zA-Z0-9]+$/,
            /^[0-9]+\s*[\+\-\*\/]\s*[0-9]+$/
        ];
        
        const isVerySimple = simplePatterns.some(pattern => pattern.test(formula.replace(/\\/g, '')));
        if (isVerySimple) penalty += 3;
        
        const hasOnlyBasicOps = !/\\[a-zA-Z]/.test(formula);
        if (hasOnlyBasicOps && formula.length < 10) penalty += 2;
        
        const isSymmetric = checkForSymmetry(formula);
        if (isSymmetric) penalty += 1;
        
        return penalty;
    };

    const checkForSymmetry = (formula: string): boolean => {
        const cleanFormula = formula.replace(/\s/g, '');
        const reversedFormula = cleanFormula.split('').reverse().join('');
        
        const symmetricPatterns = [
            /^(.+)\s*=\s*\1$/,
            /^(.+)\s*\+\s*(.+)\s*=\s*\2\s*\+\s*\1$/
        ];
        
        return symmetricPatterns.some(pattern => pattern.test(cleanFormula)) || 
               cleanFormula === reversedFormula;
    };

    useEffect(() => {
        if (isCreatingPassword && difficultyRef.current) {
            const difficulty = assessPasswordDifficulty(latexFormula);
            difficultyRef.current.setDifficulty(difficulty);
        }
    }, [latexFormula, isCreatingPassword]);

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

        if (isCreatingPassword && difficultyRef.current) {
            difficultyRef.current.setDifficulty('Easy');
        }
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
            return isUsernameValid && hasFormula && currentDifficulty !== 'Easy';
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
        <div className="mainContainer">
            <div className="passwordOptionHeader">
                <button className="backButton" onClick={goBack}>
                    ← Back
                </button>
                <h2>Mathematical Expression</h2>
                <div className="modeBadge">
                    {isCreatingPassword ? '🔐 Creating' : '🔓 Filling'}
                </div>
            </div>

            {isCreatingPassword && (
                <UsernameInput
                    value={username}
                    onChange={setUsername}
                    onValidation={setIsUsernameValid}
                />
            )}

            {isCreatingPassword && (
                <PasswordDifficulty ref={difficultyRef} onChange={handleDifficultyChange} />
            )}

            <div className={styles.instructions}>
                <p>
                    {isCreatingPassword
                        ? "Draw your mathematical formula using your mouse or touch. The formula will be converted to LaTeX."
                        : "Recreate your mathematical formula password by drawing it below."
                    }
                </p>
            </div>

            <div className={styles.mathEditorSection}>
                <div className={styles.controls}>
                    <button onClick={handleUndo} disabled={isLoading} className={styles.undoButton}>
                        Undo
                    </button>
                    <button onClick={handleRedo} disabled={isLoading} className={styles.redoButton}>
                        Redo
                    </button>
                </div>

                <div className={styles.canvasContainer}>
                    <div
                        ref={editorRef}
                        className={styles.mathEditor}
                        style={{
                            height: '500px',
                            width: '100%',
                            border: '3px solid #ddd',
                            borderRadius: '12px',
                            backgroundColor: '#fff'
                        }}
                    />

                    {isLoading && (
                        <div className={styles.loadingOverlay}>Loading math editor...</div>
                    )}
                </div>
            </div>

            <div className={styles.previewSection}>
                <h3>Preview:</h3>
                <div
                    ref={resultRef}
                    className={styles.latexPreview}
                    style={{
                        minHeight: '80px',
                        border: '2px solid #eee',
                        borderRadius: '8px',
                        padding: '20px',
                        backgroundColor: '#f9f9f9',
                        textAlign: 'center'
                    }}
                />
            </div>
            <PasswordControls
                onClear={handleClear}
                onSave={savePassword}
                canProceed={canProceed}
                isCreatingPassword={isCreatingPassword}
                isViewingPassword={isViewingPassword}
            />

            {showCredentials && isViewingPassword && usernameFromPattern && retrievedPassword && (
                <CredentialsDisplay
                    username={usernameFromPattern}
                    password={retrievedPassword}
                />
            )}
        </div>
    );
};

export default MathFormulaPassword;