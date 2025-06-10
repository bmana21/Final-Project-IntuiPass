import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserPatternData } from '../../models/user-pattern-data';
import { decrypt } from '../../services/encryption';
import { DomManager } from '../../services/dom_manager';
import { PatternType } from '../../models/pattern-type';
import './PatternVerification.css';

interface PatternVerificationProps {
  patternData: UserPatternData;
  onSuccess: () => void;
  onCancel: () => void;
}

const PatternVerification: React.FC<PatternVerificationProps> = ({
  patternData,
  onSuccess,
  onCancel
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedPath, setSelectedPath] = useState<number[]>([]);
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number; y: number } | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [showError, setShowError] = useState(false);
  const [errorKey, setErrorKey] = useState(0); // Add key to force re-animation

  interface Point {
    x: number;
    y: number;
    id: number;
  }

  useEffect(() => {
    initializePoints();
    
    // Add class to body to prevent interactions with elements behind modal
    document.body.classList.add('modal-open');
    
    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  useEffect(() => {
    drawCanvas();
  }, [points, selectedPath, currentMousePos, isDrawing]);

  const initializePoints = () => {
    const initialPoints: Point[] = [];
    const gridSize = 3;
    const spacing = 60;
    const offsetX = 90;
    const offsetY = 75;
    
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
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the current path
    if (selectedPath.length > 1) {
      ctx.strokeStyle = '#4CAF50';
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

    // Draw temporary line while dragging
    if (isDrawing && selectedPath.length > 0 && currentMousePos) {
      const lastPoint = points.find(p => p.id === selectedPath[selectedPath.length - 1]);
      if (lastPoint) {
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(currentMousePos.x, currentMousePos.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw points
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 15, 0, 2 * Math.PI);
      
      if (selectedPath.includes(point.id)) {
        ctx.fillStyle = '#4CAF50';
      } else {
        ctx.fillStyle = '#2196F3';
      }
      
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(point.id.toString(), point.x, point.y + 4);
    });
  };

  const getPointAtPosition = (x: number, y: number): Point | null => {
    return points.find(point => {
      const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
      return distance <= 25;
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
      setIsDrawing(true);
      setSelectedPath([clickedPoint.id]);
      setCurrentMousePos(coords);
      // Don't clear the error message here - let it stay until correct pattern
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

  const handleMouseUp = async () => {
    if (!isDrawing || selectedPath.length < 2) {
      setSelectedPath([]);
      setIsDrawing(false);
      setCurrentMousePos(null);
      return;
    }

    const patternString = selectedPath.join('-');
    setIsDrawing(false);
    setCurrentMousePos(null);

    // Verify the pattern
    await verifyPattern(patternString);
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      handleMouseUp();
    }
  };

  const verifyPattern = async (userPattern: string) => {
    try {
      // Decrypt the password using the pattern as the key
      const decryptedPassword = await decrypt(patternData, userPattern);
      
      // If decryption succeeds, clear error and fill the password
      setShowError(false);
      const domManager = new DomManager();
      await domManager.fillPassword(decryptedPassword);
      
      // Clear the pattern
      setSelectedPath([]);
      
      // Call success callback
      onSuccess();
    } catch (error) {
      console.error('Pattern verification failed:', error);
      setShowError(true);
      setErrorKey(prev => prev + 1); // Increment key to restart animation
      setAttempts(prev => prev + 1);
      
      // Clear the pattern after a delay but keep the error message
      setTimeout(() => {
        setSelectedPath([]);
      }, 1000);
      
      if (attempts >= 2) {
        alert('Too many failed attempts. Please try again later.');
        onCancel();
      }
    }
  };

  const handleCancel = () => {
    // Remove the modal-open class when canceling
    document.body.classList.remove('modal-open');
    onCancel();
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the overlay itself, not the modal content
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  };

  const modalContent = (
    <div className="pattern-verification-overlay" onClick={handleOverlayClick}>
      <div className="pattern-verification-modal">
        <div className="verification-header">
          <h3>Draw Your Pattern</h3>
          <button onClick={handleCancel} className="cancel-button">×</button>
        </div>
        
        <div className="verification-content">
          <p className="verification-instructions">
            Draw your {patternData.pattern_type === PatternType.CONNECT_DOTS ? 'Connect The Dots' : ''} pattern to unlock your password
          </p>
          
          {/* Always reserve space for error message to prevent layout jumping */}
          <div style={{ minHeight: '50px', marginBottom: '15px' }}>
            {showError && (
              <div key={errorKey} className="error-message">
                Incorrect pattern. Please try again. ({3 - attempts} attempts remaining)
              </div>
            )}
          </div>
          
          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              className="verification-canvas"
            />
          </div>
          
          <div className="verification-footer">
            <button onClick={handleCancel} className="cancel-verification-button">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render the modal using a portal to ensure it's rendered at the top level
  return createPortal(modalContent, document.body);
};

export default PatternVerification;