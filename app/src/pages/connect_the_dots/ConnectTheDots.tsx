import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '../../components/AppRouter';
import styles from './ConnectTheDots.module.css';
import { PasswordIntegrationService } from "../../services/password-integration-service.ts";
import { PatternType } from "../../models/pattern-type.ts";
import UsernameInput from '../../components/UsernameInput/UsernameInput';
import { CredentialsDisplay } from '../cretentials-display/CredentialsDisplay.tsx';

interface Point {
  x: number;
  y: number;
  id: number;
}

interface Connection {
  from: number;
  to: number;
}

const ConnectTheDots: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { goBack, getRouteParams } = useNavigation();

  const [points, setPoints] = useState<Point[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedPath, setSelectedPath] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number; y: number } | null>(null);
  const [passwordPattern, setPasswordPattern] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isUsernameValid, setIsUsernameValid] = useState<boolean>(false);

  const [showCredentials, setShowCredentials] = useState<boolean>(false);
  const [retrievedPassword, setRetrievedPassword] = useState<string>('');

  const routeParams = getRouteParams();
  const isCreatingPassword = routeParams?.isCreatingPassword ?? true;
  const isViewingPassword = routeParams?.isViewingPassword ?? false;
  const usernameFromPattern = routeParams?.username;

  useEffect(() => {
    console.log("creating password is: ", isCreatingPassword);
    console.log("username from pattern: ", usernameFromPattern);

    const initialPoints: Point[] = [];
    const gridSize = 3;
    const spacing = 80;
    const offsetX = 120;
    const offsetY = 100;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        initialPoints.push({
          x: offsetX + col * spacing,
          y: offsetY + row * spacing,
          id: row * gridSize + col + 1
        });
      }
    }
    setPoints(initialPoints);

    if (usernameFromPattern && !isCreatingPassword) {
      setUsername(usernameFromPattern);
    }
  }, [isCreatingPassword, usernameFromPattern]);

  useEffect(() => {
    drawCanvas();
  }, [points, connections, selectedPath, currentMousePos, isDrawing]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 4;
    connections.forEach(connection => {
      const fromPoint = points.find(p => p.id === connection.from);
      const toPoint = points.find(p => p.id === connection.to);

      if (fromPoint && toPoint) {
        ctx.beginPath();
        ctx.moveTo(fromPoint.x, fromPoint.y);
        ctx.lineTo(toPoint.x, toPoint.y);
        ctx.stroke();
      }
    });

    if (selectedPath.length > 1) {
      ctx.strokeStyle = '#FF9800';
      ctx.lineWidth = 3;
      ctx.beginPath();

      for (let i = 0; i < selectedPath.length - 1; i++) {
        const fromPoint = points.find(p => p.id === selectedPath[i]);
        const toPoint = points.find(p => p.id === selectedPath[i + 1]);

        if (fromPoint && toPoint) {
          if (i === 0) {
            ctx.moveTo(fromPoint.x, fromPoint.y);
          }
          ctx.lineTo(toPoint.x, toPoint.y);
        }
      }
      ctx.stroke();
    }

    if (isDrawing && selectedPath.length > 0 && currentMousePos) {
      const lastPoint = points.find(p => p.id === selectedPath[selectedPath.length - 1]);
      if (lastPoint) {
        ctx.strokeStyle = '#FF9800';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(currentMousePos.x, currentMousePos.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 20, 0, 2 * Math.PI);

      if (selectedPath.includes(point.id)) {
        ctx.fillStyle = '#FF9800';
      } else {
        ctx.fillStyle = '#2196F3';
      }

      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(point.id.toString(), point.x, point.y + 5);
    });
  }, [points, connections, selectedPath, currentMousePos, isDrawing]);

  const getPointAtPosition = (x: number, y: number): Point | null => {
    return points.find(point => {
      const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
      return distance <= 35;
    }) || null;
  };

  const getCanvasCoordinates = (event: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(event);
    const clickedPoint = getPointAtPosition(coords.x, coords.y);

    if (clickedPoint) {
      setConnections([]);
      setPasswordPattern('');

      setIsDrawing(true);
      setSelectedPath([clickedPoint.id]);
      setCurrentMousePos(coords);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const coords = getCanvasCoordinates(event);
    setCurrentMousePos(coords);

    const hoveredPoint = getPointAtPosition(coords.x, coords.y);

    if (hoveredPoint && !selectedPath.includes(hoveredPoint.id)) {
      setSelectedPath(prev => [...prev, hoveredPoint.id]);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || selectedPath.length < 2) {
      setSelectedPath([]);
      setIsDrawing(false);
      setCurrentMousePos(null);
      return;
    }

    const newConnections: Connection[] = [];
    for (let i = 0; i < selectedPath.length - 1; i++) {
      newConnections.push({
        from: selectedPath[i],
        to: selectedPath[i + 1]
      });
    }

    setConnections(newConnections);

    const patternString = selectedPath.join('-');
    setPasswordPattern(patternString);

    setSelectedPath([]);
    setIsDrawing(false);
    setCurrentMousePos(null);
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      handleMouseUp();
    }
  };

  const clearConnections = () => {
    setConnections([]);
    setPasswordPattern('');
    setSelectedPath([]);
    setIsDrawing(false);
    setCurrentMousePos(null);
    setShowCredentials(false);
    setRetrievedPassword('');
  };

  const canProceed = () => {
    const hasPattern = connections.length > 0 && passwordPattern.length > 0;

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
        if (connections.length === 0) {
          alert('Please create a pattern!');
          return;
        }
      } else {
        alert('Please create a pattern!');
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
        type: 'connect_the_dots',
        pattern: passwordPattern,
        connections: connections,
        username: finalUsername,
        createdAt: new Date(),
        userId: 'current_user_id'
      };

      console.log('Processing password:', passwordData);

      const passwordIntegrationService = new PasswordIntegrationService();

      if (!isViewingPassword) {
        const success = await passwordIntegrationService.processPassword(
          passwordPattern,
          PatternType.CONNECT_DOTS,
          isCreatingPassword,
          finalUsername
        );

        if (success) {
          window.close()
        } else {
          alert('Could not process password!');
        }
      } else {
        const password = await passwordIntegrationService.getPasswordByKey(passwordPattern, PatternType.CONNECT_DOTS, usernameFromPattern);
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

  return (
    <div className="mainContainer">
      <div className="passwordOptionHeader">
        <button className="backButton" onClick={goBack}>
          ← Back
        </button>
        <h2>Connect The Dots</h2>
        <div className="modeBadge">
          {isCreatingPassword ? '🔐 Creating' : '🔓 Filling'}
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
              ? "Press and drag from one dot to another to create your pattern. Lift the mouse to finish."
              : "Recreate your password pattern by dragging through the dots."
            }
          </p>
          {isDrawing && (
            <p className={styles.drawingInfo}>
              Drawing pattern... Current path: {selectedPath.join(' → ')}
            </p>)}
        </div>

        <div className={styles.canvasContainer}>
          <canvas
            ref={canvasRef}
            width={400}
            height={350}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className={styles.dotsCanvas}
          />
        </div>

        <div className={styles.controls}>
          <button onClick={clearConnections} className={styles.clearButton}>
            Clear All
          </button>

          <button
            onClick={savePassword}
            className={`${styles.saveButton} ${!canProceed() ? 'disabled' : ''}`}
            disabled={!canProceed()}
          >
            {isCreatingPassword ? "Save Pattern" : "Fill Password"}
          </button>
        </div>

        {/* Add the CredentialsDisplay component here */}
        {showCredentials && isViewingPassword && usernameFromPattern && retrievedPassword && (
          <CredentialsDisplay
            username={usernameFromPattern}
            password={retrievedPassword}
          />
        )}

        {passwordPattern && (
          <div className={styles.patternDisplay}>
            <p><strong>Pattern:</strong> {passwordPattern}</p>
            <p><small>Each sequence represents a drawn path</small></p>
          </div>
        )}
      </div>
    </div>
  );
};
export default ConnectTheDots;