import { useState, useImperativeHandle, forwardRef } from 'react';
import styles from './PasswordDifficulty.module.css';

export type DifficultyLevel = 'Easy' | 'Normal' | 'Hard';

export interface PasswordDifficultyRef {
  setDifficulty: (level: DifficultyLevel) => void;
  getDifficulty: () => DifficultyLevel;
}

interface PasswordDifficultyProps {
  initialDifficulty?: DifficultyLevel;
  className?: string;
}

const PasswordDifficulty = forwardRef<PasswordDifficultyRef, PasswordDifficultyProps>(
  ({ initialDifficulty = 'Easy', className = '' }, ref) => {
    const [difficulty, setDifficultyState] = useState<DifficultyLevel>(initialDifficulty);

    useImperativeHandle(ref, () => ({
      setDifficulty: (level: DifficultyLevel) => {
        setDifficultyState(level);
      },
      getDifficulty: () => difficulty,
    }));

    const getDifficultyColor = (level: DifficultyLevel): string => {
      switch (level) {
        case 'Easy':
          return '#4CAF50';
        case 'Normal':
          return '#FF9800';
        case 'Hard':
          return '#F44336';
        default:
          return '#4CAF50';
      }
    };

    const getDifficultyIcon = (level: DifficultyLevel): string => {
      switch (level) {
        case 'Easy':
          return '🟢';
        case 'Normal':
          return '🟡';
        case 'Hard':
          return '🔴';
        default:
          return '🟢';
      }
    };

    return (
      <div className={`${styles.difficultyContainer} ${className}`}>
        <div 
          className={styles.difficultyBadge}
          style={{ 
            backgroundColor: getDifficultyColor(difficulty),
            borderColor: getDifficultyColor(difficulty)
          }}
        >
          <span className={styles.difficultyIcon}>
            {getDifficultyIcon(difficulty)}
          </span>
          <span className={styles.difficultyText}>
            Password Difficulty: {difficulty}
          </span>
        </div>
      </div>
    );
  }
);

PasswordDifficulty.displayName = 'PasswordDifficulty';

export default PasswordDifficulty;