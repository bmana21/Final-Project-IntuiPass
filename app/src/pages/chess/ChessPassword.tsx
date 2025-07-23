import React, { useEffect, useState } from 'react';
import { useNavigation } from '../../components/AppRouter';
import './ChessPassword.css';
import { PasswordIntegrationService } from "../../services/password-integration-service.ts";
import { PatternType } from "../../models/pattern-type.ts";
import UsernameInput from '../../components/UsernameInput/UsernameInput';
import {CredentialsDisplay} from '../cretentials-display/CredentialsDisplay';

interface ChessPiece {
  id: string;
  name: string;
  whiteSymbol: string;
  blackSymbol: string;
  value: string;
  color: 'white' | 'black';
}

interface PlacedPiece {
  piece: ChessPiece;
  position: string;
  row: number;
  col: number;
}

const ChessPassword: React.FC = () => {
  const { goBack, getRouteParams } = useNavigation();

  const routeParams = getRouteParams();
  const isCreatingPassword = routeParams?.isCreatingPassword ?? true;
  const isViewingPassword = routeParams?.isViewingPassword ?? false;
  const usernameFromPattern = routeParams?.username;

  const [placedPieces, setPlacedPieces] = useState<PlacedPiece[]>([]);
  const [passwordPattern, setPasswordPattern] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isUsernameValid, setIsUsernameValid] = useState<boolean>(false);
  const [draggedPiece, setDraggedPiece] = useState<ChessPiece | null>(null);
  const [dragOverSquare, setDragOverSquare] = useState<string | null>(null);
  const [draggedFromBoard, setDraggedFromBoard] = useState<{position: string, piece: PlacedPiece} | null>(null);
  const [draggedPieceId, setDraggedPieceId] = useState<string | null>(null);

  const [showCredentials, setShowCredentials] = useState<boolean>(false);
  const [retrievedPassword, setRetrievedPassword] = useState<string>('');

  const whitePieces: ChessPiece[] = [
    { id: 'white-king', name: 'King', whiteSymbol: '♔', blackSymbol: '♚', value: 'K', color: 'white' },
    { id: 'white-queen', name: 'Queen', whiteSymbol: '♕', blackSymbol: '♛', value: 'Q', color: 'white' },
    { id: 'white-rook', name: 'Rook', whiteSymbol: '♖', blackSymbol: '♜', value: 'R', color: 'white' },
    { id: 'white-bishop', name: 'Bishop', whiteSymbol: '♗', blackSymbol: '♝', value: 'B', color: 'white' },
    { id: 'white-knight', name: 'Knight', whiteSymbol: '♘', blackSymbol: '♞', value: 'N', color: 'white' },
    { id: 'white-pawn', name: 'Pawn', whiteSymbol: '♙', blackSymbol: '♟', value: 'P', color: 'white' },
  ];

  const blackPieces: ChessPiece[] = [
    { id: 'black-king', name: 'King', whiteSymbol: '♔', blackSymbol: '♚', value: 'k', color: 'black' },
    { id: 'black-queen', name: 'Queen', whiteSymbol: '♕', blackSymbol: '♛', value: 'q', color: 'black' },
    { id: 'black-rook', name: 'Rook', whiteSymbol: '♖', blackSymbol: '♜', value: 'r', color: 'black' },
    { id: 'black-bishop', name: 'Bishop', whiteSymbol: '♗', blackSymbol: '♝', value: 'b', color: 'black' },
    { id: 'black-knight', name: 'Knight', whiteSymbol: '♘', blackSymbol: '♞', value: 'n', color: 'black' },
    { id: 'black-pawn', name: 'Pawn', whiteSymbol: '♙', blackSymbol: '♟', value: 'p', color: 'black' },
  ];

  useEffect(() => {
    if (usernameFromPattern && !isCreatingPassword) {
      setUsername(usernameFromPattern);
    }
  }, [isCreatingPassword, usernameFromPattern]);

  useEffect(() => {
    if (placedPieces.length > 0) {
      const sortedPieces = [...placedPieces].sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
      });

      const pattern = sortedPieces.map(p => `${p.piece.value}${p.position}`).join('-');
      setPasswordPattern(pattern);
    } else {
      setPasswordPattern('');
    }
  }, [placedPieces]);

  const getSquarePosition = (row: number, col: number): string => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    return files[col] + ranks[row];
  };

  const handleDragStart = (piece: ChessPiece, e?: React.DragEvent) => {
    setDraggedPiece(piece);
    setDraggedFromBoard(null);
    setDraggedPieceId(piece.id);

    if (e) {
      const dragImage = document.createElement('div');
      dragImage.innerHTML = piece.color === 'white' ? piece.whiteSymbol : piece.blackSymbol;
      dragImage.style.fontSize = '36px';
      dragImage.style.fontWeight = 'bold';
      dragImage.style.color = piece.color === 'white' ? 'white' : 'black';
      dragImage.style.textShadow = piece.color === 'white'
        ? '1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black'
        : '1px 1px 1px rgba(255, 255, 255, 0.5)';
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      dragImage.style.background = 'transparent';
      dragImage.style.padding = '10px';

      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 25, 25);

      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);
    }
  };

  const handleBoardPieceDragStart = (placedPiece: PlacedPiece, e?: React.DragEvent) => {
    setDraggedPiece(placedPiece.piece);
    setDraggedFromBoard({ position: placedPiece.position, piece: placedPiece });
    setDraggedPieceId(`board-${placedPiece.position}`);

    if (e) {
      const dragImage = document.createElement('div');
      dragImage.innerHTML = placedPiece.piece.color === 'white' ? placedPiece.piece.whiteSymbol : placedPiece.piece.blackSymbol;
      dragImage.style.fontSize = '36px';
      dragImage.style.fontWeight = 'bold';
      dragImage.style.color = placedPiece.piece.color === 'white' ? 'white' : 'black';
      dragImage.style.textShadow = placedPiece.piece.color === 'white'
        ? '1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black'
        : '1px 1px 1px rgba(255, 255, 255, 0.5)';
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      dragImage.style.background = 'transparent';
      dragImage.style.padding = '10px';

      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 25, 25);

      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);
    }
  };

  const handleDragEnd = () => {
    setDraggedPiece(null);
    setDragOverSquare(null);
    setDraggedFromBoard(null);
    setDraggedPieceId(null);
  };

  const handleDragOver = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    const position = getSquarePosition(row, col);
    setDragOverSquare(position);
  };

  const handleDragLeave = () => {
    setDragOverSquare(null);
  };

  const handleDrop = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    const position = getSquarePosition(row, col);

    if (draggedPiece) {
      if (draggedFromBoard) {
        setPlacedPieces(prev => prev.filter(p => p.position !== draggedFromBoard.position));
      }

      const existingPieceIndex = placedPieces.findIndex(p => p.position === position);
      if (existingPieceIndex !== -1) {
        setPlacedPieces(prev => prev.filter((_, index) => index !== existingPieceIndex));
      }

      const newPiece: PlacedPiece = {
        piece: draggedPiece,
        position,
        row,
        col
      };
      setPlacedPieces(prev => [...prev, newPiece]);
    }

    setDragOverSquare(null);
    setDraggedPiece(null);
    setDraggedFromBoard(null);
  };

  const handleSquareClick = (row: number, col: number) => {
    const position = getSquarePosition(row, col);
    const existingPieceIndex = placedPieces.findIndex(p => p.position === position);

    if (existingPieceIndex !== -1) {
      setPlacedPieces(prev => prev.filter((_, index) => index !== existingPieceIndex));
    }
  };

  const handlePieceDoubleClick = (position: string) => {
    setPlacedPieces(prev => prev.filter(p => p.position !== position));
  };

  const getPieceAtPosition = (row: number, col: number): PlacedPiece | null => {
    const position = getSquarePosition(row, col);
    return placedPieces.find(p => p.position === position) || null;
  };

  const isSquareLight = (row: number, col: number): boolean => {
    return (row + col) % 2 === 0;
  };

  const clearBoard = () => {
    setPlacedPieces([]);
    setPasswordPattern('');
    setShowCredentials(false);
    setRetrievedPassword('');
  };

  const canProceed = () => {
    const hasPieces = placedPieces.length > 0;

    if (isCreatingPassword) {
      return isUsernameValid && hasPieces;
    } else {
      return hasPieces;
    }
  };

  const savePassword = async () => {
    if (!canProceed()) {
      if (isCreatingPassword) {
        if (!isUsernameValid) {
          alert('Please enter a valid username!');
          return;
        }
        if (placedPieces.length === 0) {
          alert('Please place some pieces on the board!');
          return;
        }
      } else {
        alert('Please place some pieces on the board!');
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
        type: 'chess_board',
        pattern: passwordPattern,
        pieces: placedPieces,
        username: finalUsername,
        createdAt: new Date(),
        userId: 'current_user_id'
      };

      console.log('Processing password:', passwordData);

      const passwordIntegrationService = new PasswordIntegrationService();

      if (!isViewingPassword) {
        const success = await passwordIntegrationService.processPassword(
            passwordPattern,
            PatternType.CHESS_BOARD,
            isCreatingPassword,
            finalUsername
        );

        if (success) {
          window.close()
        } else {
          alert('Could not process password!');
        }
      } else {
        const password = await passwordIntegrationService.getPasswordByKey(passwordPattern, PatternType.CHESS_BOARD, usernameFromPattern);

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

  const renderBoard = () => {
    const squares = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = isSquareLight(row, col);
        const piece = getPieceAtPosition(row, col);
        const position = getSquarePosition(row, col);
        const isDragOver = dragOverSquare === position;
        const isPieceDragging = piece && draggedPieceId === `board-${piece.position}`;
        const squareClass = `chess-square ${isLight ? 'light' : 'dark'} ${isDragOver ? 'drag-over' : ''}`;

        squares.push(
          <div
            key={`${row}-${col}`}
            className={squareClass}
            onClick={() => handleSquareClick(row, col)}
            onDragOver={(e) => handleDragOver(e, row, col)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, row, col)}
            title={getSquarePosition(row, col)}
          >
            {piece && (
              <span
                className={`chess-piece ${piece.piece.color === 'white' ? 'white-piece' : 'black-piece'} ${isPieceDragging ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handleBoardPieceDragStart(piece, e)}
                onDragEnd={handleDragEnd}
                onDoubleClick={() => handlePieceDoubleClick(piece.position)}
              >
                {piece.piece.color === 'white' ? piece.piece.whiteSymbol : piece.piece.blackSymbol}
              </span>
            )}
          </div>
        );
      }
    }
    return squares;
  };

  const renderPieceRow = (pieces: ChessPiece[]) => (
    <div className="piece-container">
      <div className="piece-items">
        {pieces.map((piece) => {
          const isDragging = draggedPieceId === piece.id;
          return (
            <div
              key={piece.id}
              className={`piece-button ${isDragging ? 'dragging' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(piece, e)}
              onDragEnd={handleDragEnd}
              title={piece.name}
            >
              <span className={`piece-icon ${piece.color === 'white' ? 'white-piece' : 'black-piece'}`}>
                {piece.color === 'white' ? piece.whiteSymbol : piece.blackSymbol}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const getSortedPlacedPieces = () => {
    return [...placedPieces].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });
  };

  return (
    <div className="chess-password-container">
      <div className="header">
        <button className="back-button" onClick={goBack}>
          ← Back
        </button>
        <h2>Chess Board Pattern</h2>
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
            ? "Drag chess pieces from below onto the board, or drag pieces on the board to move them."
            : "Recreate your password pattern by dragging pieces to the same positions."
          }
        </p>
        <p><small>Click on a piece to remove it, or double-click pieces on the board to delete them.</small></p>
      </div>

      <div className="piece-selector">
        <h3>Drag Pieces to the Board:</h3>
        <div className="piece-rows">
          {renderPieceRow(whitePieces)}
          {renderPieceRow(blackPieces)}
        </div>
      </div>

      <div className="chess-board-container">
        <div className="chess-board">
          {renderBoard()}
        </div>
      </div>

        <div className="controls">
          <button onClick={clearBoard} className="clear-button">
            Clear Board
          </button>

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

        {placedPieces.length > 0 && (
            <div className="pattern-display">
              <p><strong>Placed Pieces:</strong></p>
              <div className="pattern-pieces">
                {getSortedPlacedPieces().map((piece, index) => (
                    <span key={index} className="pattern-piece">
                <span className={piece.piece.color === 'white' ? 'white-piece' : 'black-piece'}>
                  {piece.piece.color === 'white' ? piece.piece.whiteSymbol : piece.piece.blackSymbol}
                </span> {piece.position}
              </span>
            ))}
          </div>
          <p><small>Pattern: {passwordPattern}</small></p>
        </div>
      )}
    </div>
  );
};

export default ChessPassword;