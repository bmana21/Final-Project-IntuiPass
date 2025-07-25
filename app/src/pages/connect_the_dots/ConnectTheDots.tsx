import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '../../components/AppRouter';
import styles from './ConnectTheDots.module.css';
import { PasswordIntegrationService } from "../../services/password-integration-service.ts";
import { PatternType } from "../../models/pattern-type.ts";
import UsernameInput from '../../components/UsernameInput/UsernameInput';
import { CredentialsDisplay } from '../cretentials-display/CredentialsDisplay.tsx';
import PasswordDifficulty, { DifficultyLevel, PasswordDifficultyRef } from '../../components/PasswordDifficulty/PasswordDifficulty';
import PasswordControls from '../../components/PasswordControls/PasswordControls.tsx';

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
  const difficultyRef = useRef<PasswordDifficultyRef>(null);
  const { goBack, getRouteParams } = useNavigation();

  const [points, setPoints] = useState<Point[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedPath, setSelectedPath] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number; y: number } | null>(null);
  const [passwordPattern, setPasswordPattern] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isUsernameValid, setIsUsernameValid] = useState<boolean>(false);
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>('Easy');

  const [showCredentials, setShowCredentials] = useState<boolean>(false);
  const [retrievedPassword, setRetrievedPassword] = useState<string>('');

  const routeParams = getRouteParams();
  const isCreatingPassword = routeParams?.isCreatingPassword ?? true;
  const isViewingPassword = routeParams?.isViewingPassword ?? false;
  const usernameFromPattern = routeParams?.username;

  const assessPasswordDifficulty = (selectedPath: number[]): DifficultyLevel => {
    if (selectedPath.length === 0) return 'Easy';

    const length = selectedPath.length;

    const hasSimpleLines = checkForSimpleLines(selectedPath);
    const hasCrossings = checkForCrossings(selectedPath);
    const hasCornerUsage = checkForCornerUsage(selectedPath);
    const directionChanges = countDirectionChanges(selectedPath);

    let score = 0;

    if (length >= 7) score += 5;
    else if (length >= 5) score += 3;
    else if (length >= 3) score += 1;

    if (!hasSimpleLines) score += 2;
    if (hasCrossings) score += 4;
    if (hasCornerUsage) score += 1;

    if (directionChanges >= 3) score += 2;
    else if (directionChanges >= 2) score += 1;

    if (score >= 12) return 'Hard';
    else if (score >= 8) return 'Normal';
    else return 'Easy';
  };

  const checkForSimpleLines = (path: number[]): boolean => {
    if (path.length < 3) return false;

    const straightLines = [
      [1, 2, 3], [4, 5, 6], [7, 8, 9],
      [1, 4, 7], [2, 5, 8], [3, 6, 9],
      [1, 5, 9], [3, 5, 7]
    ];

    for (let i = 0; i <= path.length - 3; i++) {
      const segment = path.slice(i, i + 3);
      for (const line of straightLines) {
        if (JSON.stringify(segment) === JSON.stringify(line) ||
          JSON.stringify(segment) === JSON.stringify(line.reverse())) {
          return true;
        }
      }
    }

    return false;
  };

  const checkForCrossings = (selectedPath: number[]): boolean => {
    const getPointPosition = (id: number) => {
      const row = Math.floor((id - 1) / 3);
      const col = (id - 1) % 3;
      return { row, col };
    };

    const linesIntersect = (line1X: number, line1Y: number, line2X: number, line2Y: number): boolean => {
      const p1 = getPointPosition(line1X);
      const q1 = getPointPosition(line1Y);
      const p2 = getPointPosition(line2X);
      const q2 = getPointPosition(line2Y);

      if (line1X === line2X || line1X === line2Y ||
        line1Y === line2X || line1Y === line2Y) {
        return false;
      }

      const orientation = (p: any, q: any, r: any) => {
        const val = (q.col - p.col) * (r.row - q.row) - (q.row - p.row) * (r.col - q.col);
        if (val === 0) return 0;
        return val > 0 ? 1 : 2;
      };

      const o1 = orientation(p1, q1, p2);
      const o2 = orientation(p1, q1, q2);
      const o3 = orientation(p2, q2, p1);
      const o4 = orientation(p2, q2, q1);

      return (o1 !== o2 && o3 !== o4);
    };

    for (let i = 0; i < selectedPath.length - 1; i++) {
      for (let j = i + 1; j < selectedPath.length - 1; j++) {
        if (linesIntersect(selectedPath[i], selectedPath[i + 1], selectedPath[j], selectedPath[j + 1])) {
          return true;
        }
      }
    }

    return false;
  };

  const checkForCornerUsage = (path: number[]): boolean => {
    const corners = [1, 3, 7, 9];
    return path.some(dot => corners.includes(dot));
  };


  const countDirectionChanges = (path: number[]): number => {
    if (path.length < 3) return 0;

    const getDirection = (from: number, to: number) => {
      const fromRow = Math.floor((from - 1) / 3);
      const fromCol = (from - 1) % 3;
      const toRow = Math.floor((to - 1) / 3);
      const toCol = (to - 1) % 3;

      const deltaRow = toRow - fromRow;
      const deltaCol = toCol - fromCol;

      if (deltaRow === 0 && deltaCol > 0) return 'right';
      if (deltaRow === 0 && deltaCol < 0) return 'left';
      if (deltaRow > 0 && deltaCol === 0) return 'down';
      if (deltaRow < 0 && deltaCol === 0) return 'up';
      if (deltaRow > 0 && deltaCol > 0) return 'down-right';
      if (deltaRow > 0 && deltaCol < 0) return 'down-left';
      if (deltaRow < 0 && deltaCol > 0) return 'up-right';
      if (deltaRow < 0 && deltaCol < 0) return 'up-left';
      return 'same';
    };

    let changes = 0;
    let lastDirection = getDirection(path[0], path[1]);

    for (let i = 1; i < path.length - 1; i++) {
      const currentDirection = getDirection(path[i], path[i + 1]);
      if (currentDirection !== lastDirection) {
        changes++;
      }
      lastDirection = currentDirection;
    }

    return changes;
  };

  useEffect(() => {
    if (isCreatingPassword && difficultyRef.current) {
      const difficulty = assessPasswordDifficulty(selectedPath);
      difficultyRef.current.setDifficulty(difficulty);
    }
  }, [selectedPath, isCreatingPassword]);

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

    if (isCreatingPassword && difficultyRef.current) {
      difficultyRef.current.setDifficulty('Easy');
    }
  };

  const canProceed = () => {
    const hasPattern = connections.length > 0 && passwordPattern.length > 0;

    if (isCreatingPassword) {
      return isUsernameValid && hasPattern && currentDifficulty != 'Easy';
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

      <PasswordControls
        onClear={clearConnections}
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
          <p><strong>Pattern:</strong> {passwordPattern}</p>
          <p><small>Each sequence represents a drawn path</small></p>
        </div>
      )}
    </div>
  );
};

export default ConnectTheDots;