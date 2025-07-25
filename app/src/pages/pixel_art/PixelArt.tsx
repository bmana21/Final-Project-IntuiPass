import React, { useEffect, useState, useRef } from 'react';
import { useNavigation } from '../../components/AppRouter';
import styles from './PixelArt.module.css';
import { PasswordIntegrationService } from "../../services/password-integration-service.ts";
import { PatternType } from "../../models/pattern-type.ts";
import UsernameInput from '../../components/UsernameInput/UsernameInput';
import {CredentialsDisplay} from '../cretentials-display/CredentialsDisplay';
import PasswordControls from '../../components/PasswordControls/PasswordControls.tsx';
import PasswordDifficulty, { DifficultyLevel, PasswordDifficultyRef } from '../../components/PasswordDifficulty/PasswordDifficulty';

interface PixelGrid {
  [key: string]: boolean;
}

const GRID_SIZE = 8;

const PixelArt: React.FC = () => {
  const { goBack, getRouteParams } = useNavigation();
  const difficultyRef = useRef<PasswordDifficultyRef>(null);
  
  const routeParams = getRouteParams();
  const isCreatingPassword = routeParams?.isCreatingPassword ?? true;
  const isViewingPassword = routeParams?.isViewingPassword ?? false;
  const usernameFromPattern = routeParams?.username;
  
  const [pixelGrid, setPixelGrid] = useState<PixelGrid>({});
  const [passwordPattern, setPasswordPattern] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isUsernameValid, setIsUsernameValid] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawMode, setDrawMode] = useState<'draw' | 'erase'>('draw');
  const [isInitialClick, setIsInitialClick] = useState<boolean>(false);
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>('Easy');

  const [showCredentials, setShowCredentials] = useState<boolean>(false);
  const [retrievedPassword, setRetrievedPassword] = useState<string>('');

  const assessPasswordDifficulty = (pixelGrid: PixelGrid): DifficultyLevel => {
    const selectedPixels = Object.entries(pixelGrid)
      .filter(([_, isSelected]) => isSelected)
      .map(([position, _]) => position);

    if (selectedPixels.length === 0) return 'Easy';

    const pixelCount = selectedPixels.length;
    const coverage = pixelCount / (GRID_SIZE * GRID_SIZE);
    
    const hasComplexShapes = checkForComplexShapes(selectedPixels);
    const hasSymmetry = checkForSymmetry(selectedPixels);
    const hasConnectedRegions = checkForConnectedRegions(selectedPixels);
    const edgePixelCount = countEdgePixels(selectedPixels);
    const centerPixelCount = countCenterPixels(selectedPixels);

    let score = 0;

    if (pixelCount >= 20) score += 4;
    else if (pixelCount >= 12) score += 3;
    else if (pixelCount >= 6) score += 2;
    else score += 1;

    if (coverage >= 0.4) score += 2;
    else if (coverage >= 0.2) score += 1;

    if (hasComplexShapes) score += 3;
    if (hasSymmetry) score += 2;
    if (hasConnectedRegions) score += 2;

    const edgeRatio = edgePixelCount / pixelCount;
    if (edgeRatio < 0.3) score += 2;
    else if (edgeRatio < 0.5) score += 1;

    if (centerPixelCount >= 3) score += 2;

    if (score >= 12) return 'Hard';
    else if (score >= 8) return 'Normal';
    else return 'Easy';
  };

  const checkForComplexShapes = (selectedPixels: string[]): boolean => {
    const pixelSet = new Set(selectedPixels);
    let diagonalConnections = 0;
    let lShapes = 0;

    for (const pixel of selectedPixels) {
      const [row, col] = pixel.split('-').map(Number);

      const diagonalNeighbors = [
        `${row-1}-${col-1}`, `${row-1}-${col+1}`,
        `${row+1}-${col-1}`, `${row+1}-${col+1}`
      ];

      diagonalConnections += diagonalNeighbors.filter(n => pixelSet.has(n)).length;

      const rightDown = pixelSet.has(`${row}-${col+1}`) && pixelSet.has(`${row+1}-${col}`);
      const rightUp = pixelSet.has(`${row}-${col+1}`) && pixelSet.has(`${row-1}-${col}`);
      const leftDown = pixelSet.has(`${row}-${col-1}`) && pixelSet.has(`${row+1}-${col}`);
      const leftUp = pixelSet.has(`${row}-${col-1}`) && pixelSet.has(`${row-1}-${col}`);

      if (rightDown || rightUp || leftDown || leftUp) lShapes++;
    }

    return diagonalConnections >= 3 || lShapes >= 2;
  };

  const checkForSymmetry = (selectedPixels: string[]): boolean => {
    const pixelSet = new Set(selectedPixels);

    const hasVerticalSymmetry = selectedPixels.every(pixel => {
      const [row, col] = pixel.split('-').map(Number);
      const mirrorCol = GRID_SIZE - 1 - col;
      return pixelSet.has(`${row}-${mirrorCol}`);
    });

    const hasHorizontalSymmetry = selectedPixels.every(pixel => {
      const [row, col] = pixel.split('-').map(Number);
      const mirrorRow = GRID_SIZE - 1 - row;
      return pixelSet.has(`${mirrorRow}-${col}`);
    });

    return hasVerticalSymmetry || hasHorizontalSymmetry;
  };

  const checkForConnectedRegions = (selectedPixels: string[]): boolean => {
    if (selectedPixels.length === 0) return false;

    const pixelSet = new Set(selectedPixels);
    const visited = new Set<string>();
    let regions = 0;

    for (const pixel of selectedPixels) {
      if (!visited.has(pixel)) {
        regions++;
        const queue = [pixel];
        
        while (queue.length > 0) {
          const current = queue.shift()!;
          if (visited.has(current)) continue;
          
          visited.add(current);
          const [row, col] = current.split('-').map(Number);
          
          const neighbors = [
            `${row-1}-${col}`, `${row+1}-${col}`,
            `${row}-${col-1}`, `${row}-${col+1}`
          ];

          for (const neighbor of neighbors) {
            if (pixelSet.has(neighbor) && !visited.has(neighbor)) {
              queue.push(neighbor);
            }
          }
        }
      }
    }

    return regions >= 2;
  };

  const countEdgePixels = (selectedPixels: string[]): number => {
    return selectedPixels.filter(pixel => {
      const [row, col] = pixel.split('-').map(Number);
      return row === 0 || row === GRID_SIZE - 1 || col === 0 || col === GRID_SIZE - 1;
    }).length;
  };

  const countCenterPixels = (selectedPixels: string[]): number => {
    const centerStart = Math.floor(GRID_SIZE / 4);
    const centerEnd = GRID_SIZE - centerStart - 1;
    
    return selectedPixels.filter(pixel => {
      const [row, col] = pixel.split('-').map(Number);
      return row >= centerStart && row <= centerEnd && col >= centerStart && col <= centerEnd;
    }).length;
  };

  useEffect(() => {
    if (isCreatingPassword && difficultyRef.current) {
      const difficulty = assessPasswordDifficulty(pixelGrid);
      difficultyRef.current.setDifficulty(difficulty);
    }
  }, [pixelGrid, isCreatingPassword]);

  useEffect(() => {
    if (usernameFromPattern && !isCreatingPassword) {
      setUsername(usernameFromPattern);
    }
  }, [isCreatingPassword, usernameFromPattern]);

  useEffect(() => {
    const selectedPixels = Object.entries(pixelGrid)
      .filter(([_, isSelected]) => isSelected)
      .map(([position, _]) => position)
      .sort();
    
    setPasswordPattern(selectedPixels.join('-'));
  }, [pixelGrid]);

  const getPixelKey = (row: number, col: number): string => {
    return `${row}-${col}`;
  };

  const isPixelSelected = (row: number, col: number): boolean => {
    return pixelGrid[getPixelKey(row, col)] || false;
  };

  const handleMouseDown = (row: number, col: number) => {
    setIsDrawing(true);
    setIsInitialClick(true);
    const isCurrentlySelected = isPixelSelected(row, col);
    const newMode = isCurrentlySelected ? 'erase' : 'draw';
    setDrawMode(newMode);
    
    const key = getPixelKey(row, col);
    setPixelGrid(prev => ({
      ...prev,
      [key]: newMode === 'draw'
    }));
    
    setTimeout(() => setIsInitialClick(false), 50);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (isDrawing && !isInitialClick) {
      const key = getPixelKey(row, col);
      setPixelGrid(prev => ({
        ...prev,
        [key]: drawMode === 'draw'
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setIsInitialClick(false);
  };

  const clearGrid = () => {
    setPixelGrid({});
    setPasswordPattern('');
    setShowCredentials(false);
    setRetrievedPassword('');

    if (isCreatingPassword && difficultyRef.current) {
      difficultyRef.current.setDifficulty('Easy');
    }
  };

  const canProceed = () => {
    const hasPattern = Object.values(pixelGrid).some(selected => selected);
    
    if (isCreatingPassword) {
      return isUsernameValid && hasPattern && currentDifficulty !== 'Easy';
    } else {
      return hasPattern;
    }
  };

  const savePassword = async () => {
    if (!canProceed()) {
      if (isCreatingPassword) {
        if (!isUsernameValid) {
          alert('Please enter a valid username!');
          return;
        }
        if (!Object.values(pixelGrid).some(selected => selected)) {
          alert('Please select some pixels to create a pattern!');
          return;
        }
      } else {
        alert('Please select some pixels to create a pattern!');
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
        type: 'pixel_art',
        pattern: passwordPattern,
        pixelGrid: pixelGrid,
        username: finalUsername,
        createdAt: new Date(),
        userId: 'current_user_id'
      };
      
      console.log('Processing password:', passwordData);
      
      const passwordIntegrationService = new PasswordIntegrationService();
      
      if (!isViewingPassword) {
        const success = await passwordIntegrationService.processPassword(
          passwordPattern, 
          PatternType.PIXEL_ART, 
          isCreatingPassword,
          finalUsername
        );
        
        if (success) {
          window.close();
        } else {
          alert('Could not process password!');
        }
      } else {
        const password = await passwordIntegrationService.getPasswordByKey(passwordPattern, PatternType.PIXEL_ART, usernameFromPattern);
        
        if (password) {
          setRetrievedPassword(password);
          setShowCredentials(true);
        } else {
          alert('Password not found or pattern incorrect!');
        }
      }
    } catch (error) {
      console.error('Error processing password:', error);
      alert('Failed to process password');
    }
  };

  const renderGrid = () => {
    const pixels = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const isSelected = isPixelSelected(row, col);
        pixels.push(
          <div
            key={getPixelKey(row, col)}
            className={`${styles.pixel} ${isSelected ? styles.selected : ''}`}
            onMouseDown={() => handleMouseDown(row, col)}
            onMouseEnter={() => handleMouseEnter(row, col)}
            onMouseUp={handleMouseUp}
            style={{
              gridRow: row + 1,
              gridColumn: col + 1,
            }}
          />
        );
      }
    }
    return pixels;
  };

  return (
    <div className="mainContainer">
      <div className="passwordOptionHeader">
        <button className="backButton" onClick={goBack}>
          ← Back
        </button>
        <h2>Pixel Art Pattern</h2>
        <div className="modeBadge">
          {isCreatingPassword ? '🔐 Creating' : (isViewingPassword ? '👁️ Viewing' : '🔓 Filling')}
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
        <PasswordDifficulty ref={difficultyRef} onChange={setCurrentDifficulty} />
      )}

      <div className={styles.instructions}>
        <p>
          {isCreatingPassword 
            ? "Click and drag to paint pixels black. Create your unique pixel art pattern."
            : "Recreate your password pattern by selecting the same pixels."
          }
        </p>
        <p><small>Click on individual pixels or drag to paint multiple pixels at once.</small></p>
      </div>

      <div className={styles.gridContainer}>
        <div 
          className={styles.pixelGrid}
          onMouseLeave={handleMouseUp}
          onContextMenu={(e) => e.preventDefault()}
        >
          {renderGrid()}
        </div>
      </div>

      <div className={styles.patternInfo}>
        <p>Selected pixels: {Object.values(pixelGrid).filter(Boolean).length}</p>
      </div>
          <PasswordControls
        onClear={clearGrid}
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

      {passwordPattern && (
        <div className={styles.patternDisplay}>
          <p><strong>Pattern:</strong></p>
          <p><small>{passwordPattern}</small></p>
        </div>
      )}
    </div>
  );
};

export default PixelArt;