import React, { useEffect, useState } from 'react';
import { useNavigation } from '../../components/AppRouter';
import styles from './PixelArt.module.css';
import { PasswordIntegrationService } from "../../services/password-integration-service.ts";
import { PatternType } from "../../models/pattern-type.ts";
import UsernameInput from '../../components/UsernameInput/UsernameInput';
import {CredentialsDisplay} from '../cretentials-display/CredentialsDisplay';
import PasswordControls from '../../components/PasswordControls/PasswordControls.tsx';

interface PixelGrid {
  [key: string]: boolean;
}

const GRID_SIZE = 8;

const PixelArt: React.FC = () => {
  const { goBack, getRouteParams } = useNavigation();
  
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

  const [showCredentials, setShowCredentials] = useState<boolean>(false);
  const [retrievedPassword, setRetrievedPassword] = useState<string>('');

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
  };

  const canProceed = () => {
    const hasPattern = Object.values(pixelGrid).some(selected => selected);
    
    if (isCreatingPassword) {
      return isUsernameValid && hasPattern;
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