import React, { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '../../components/AppRouter';
import styles from './PianoPassword.module.css';
import { PasswordIntegrationService } from "../../services/password-integration-service.ts";
import { PatternType } from "../../models/pattern-type.ts";
import UsernameInput from '../../components/UsernameInput/UsernameInput';

interface PianoKey {
  id: string;
  note: string;
  frequency: number;
  keyboardKey: string;
  isBlack: boolean;
}

const PianoPassword: React.FC = () => {
  const { goBack, getRouteParams } = useNavigation();
  
  const routeParams = getRouteParams();
  const isCreatingPassword = routeParams?.isCreatingPassword ?? true;
  const usernameFromPattern = routeParams?.username;
  
  const [sequence, setSequence] = useState<string[]>([]);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [passwordPattern, setPasswordPattern] = useState<string>('');
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [username, setUsername] = useState<string>('');
  const [isUsernameValid, setIsUsernameValid] = useState<boolean>(false);

  const pianoKeys: PianoKey[] = [
    { id: 'C4', note: 'C', frequency: 261.63, keyboardKey: 'a', isBlack: false },
    { id: 'C#4', note: 'C#', frequency: 277.18, keyboardKey: 'w', isBlack: true },
    { id: 'D4', note: 'D', frequency: 293.66, keyboardKey: 's', isBlack: false },
    { id: 'D#4', note: 'D#', frequency: 311.13, keyboardKey: 'e', isBlack: true },
    { id: 'E4', note: 'E', frequency: 329.63, keyboardKey: 'd', isBlack: false },
    { id: 'F4', note: 'F', frequency: 349.23, keyboardKey: 'f', isBlack: false },
    { id: 'F#4', note: 'F#', frequency: 369.99, keyboardKey: 't', isBlack: true },
    { id: 'G4', note: 'G', frequency: 392.00, keyboardKey: 'g', isBlack: false },
    { id: 'G#4', note: 'G#', frequency: 415.30, keyboardKey: 'y', isBlack: true },
    { id: 'A4', note: 'A', frequency: 440.00, keyboardKey: 'h', isBlack: false },
    { id: 'A#4', note: 'A#', frequency: 466.16, keyboardKey: 'u', isBlack: true },
    { id: 'B4', note: 'B', frequency: 493.88, keyboardKey: 'j', isBlack: false },
    { id: 'C5', note: 'C', frequency: 523.25, keyboardKey: 'k', isBlack: false },
  ];

  useEffect(() => {
    if (usernameFromPattern && !isCreatingPassword) {
      setUsername(usernameFromPattern);
    }
  }, [isCreatingPassword, usernameFromPattern]);

  // Helper function to check if user is typing in an input field
  const isTypingInInput = () => {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' ||
      (activeElement as HTMLElement).contentEditable === 'true'
    );
  };

  useEffect(() => {
    const initAudio = () => {
      if (!audioContext) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't play piano keys if user is typing in an input field
      if (isTypingInInput()) {
        return;
      }

      const key = pianoKeys.find(k => k.keyboardKey === event.key.toLowerCase());
      if (key && !pressedKeys.has(key.id)) {
        playNote(key);
        addToSequence(key.id);
        setPressedKeys(prev => new Set([...prev, key.id]));
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Don't handle key up for piano keys if user is typing in an input field
      if (isTypingInInput()) {
        return;
      }

      const key = pianoKeys.find(k => k.keyboardKey === event.key.toLowerCase());
      if (key) {
        setPressedKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(key.id);
          return newSet;
        });
      }
    };

    const handleFirstInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [audioContext, pressedKeys]);

  const playNote = useCallback((key: PianoKey) => {
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(key.frequency, audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }, [audioContext]);

  const addToSequence = (keyId: string) => {
    setSequence(prev => {
      const newSequence = [...prev, keyId];
      const pattern = newSequence.join('-');
      setPasswordPattern(pattern);
      return newSequence;
    });
  };

  const handleKeyClick = (key: PianoKey) => {
    playNote(key);
    addToSequence(key.id);
    
    setPressedKeys(prev => new Set([...prev, key.id]));
    setTimeout(() => {
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(key.id);
        return newSet;
      });
    }, 150);
  };

  const clearSequence = () => {
    setSequence([]);
    setPasswordPattern('');
    setPressedKeys(new Set());
  };

  const canProceed = () => {
    const hasSequence = sequence.length > 0;
    
    if (isCreatingPassword) {
      return isUsernameValid && hasSequence;
    } else {
      return hasSequence;
    }
  };

  const savePassword = async () => {
    if (!canProceed()) {
      if (isCreatingPassword) {
        if (!isUsernameValid) {
          alert('Please enter a valid username!');
          return;
        }
        if (sequence.length === 0) {
          alert('Please create a sequence!');
          return;
        }
      } else {
        alert('Please create a sequence!');
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
        type: 'piano_sequence',
        pattern: passwordPattern,
        sequence: sequence,
        username: finalUsername,
        createdAt: new Date(),
        userId: 'current_user_id'
      };
      
      console.log('Processing password:', passwordData);
      
      const passwordIntegrationService = new PasswordIntegrationService();
      
      const success = await passwordIntegrationService.processPassword(
        passwordPattern, 
        PatternType.PIANO_SEQUENCE, 
        isCreatingPassword,
        finalUsername
      );
      
      if (success) {
        window.close();
      } else {
        alert('Could not process password!');
      }
    } catch (error) {
      console.error('Error processing password:', error);
      alert('Failed to process password');
    }
  };

  return (
    <div className={styles.pianoPasswordContainer}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={goBack}>
          ← Back
        </button>
        <h2>Piano Sequence</h2>
        <div className={styles.modeBadge}>
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

      <div className={styles.instructions}>
        <p>
          {isCreatingPassword 
            ? "Play notes on the piano to create your sequence. Use keyboard keys or click the piano keys."
            : "Recreate your password sequence by playing the same notes."
          }
        </p>
        <div className={styles.keyboardHints}>
          <p><small>Keyboard: A S D F G H J K (white keys) | W E T Y U (black keys)</small></p>
        </div>
      </div>

      <div className={styles.pianoContainer}>
        <div className={styles.piano}>
          {pianoKeys.map((key) => (
            <button
              key={key.id}
              className={`${styles.pianoKey} ${key.isBlack ? styles.blackKey : styles.whiteKey}`}
              data-pressed={pressedKeys.has(key.id)}
              onClick={() => handleKeyClick(key)}
              onMouseDown={(e) => e.preventDefault()}
            >
              <span className={styles.noteLabel}>{key.note}</span>
              <span className={styles.keyLabel}>{key.keyboardKey.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.controls}>
        <button onClick={clearSequence} className={styles.clearButton}>
          Clear Sequence
        </button>
        
        <button 
          onClick={savePassword} 
          className={`${styles.saveButton} ${!canProceed() ? styles.disabled : ''}`}
          disabled={!canProceed()}
        >
          {isCreatingPassword ? "Save Sequence" : "Fill Password"}
        </button>
      </div>

      {sequence.length > 0 && (
        <div className={styles.sequenceDisplay}>
          <p><strong>Current Sequence:</strong></p>
          <div className={styles.sequenceNotes}>
            {sequence.map((noteId, index) => {
              const key = pianoKeys.find(k => k.id === noteId);
              return (
                <span key={index} className={styles.sequenceNote}>
                  {key?.note}
                </span>
              );
            })}
          </div>
          <p><small>Pattern: {passwordPattern}</small></p>
        </div>
      )}
    </div>
  );
};

export default PianoPassword;