import React, { useEffect, useState, useRef } from 'react';
import { useNavigation } from '../../components/AppRouter';
import styles from './ChessPassword.module.css';
import { PasswordIntegrationService } from "../../services/password-integration-service.ts";
import { PatternType } from "../../models/pattern-type.ts";
import UsernameInput from '../../components/UsernameInput/UsernameInput';
import { CredentialsDisplay } from '../cretentials-display/CredentialsDisplay';
import PasswordControls from '../../components/PasswordControls/PasswordControls.tsx';
import PasswordDifficulty, { DifficultyLevel, PasswordDifficultyRef } from '../../components/PasswordDifficulty/PasswordDifficulty';

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
  const difficultyRef = useRef<PasswordDifficultyRef>(null);

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
  const [draggedFromBoard, setDraggedFromBoard] = useState<{ position: string, piece: PlacedPiece } | null>(null);
  const [draggedPieceId, setDraggedPieceId] = useState<string | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>('Easy');

  const [showCredentials, setShowCredentials] = useState<boolean>(false);
  const [retrievedPassword, setRetrievedPassword] = useState<string>('');

  const handleDifficultyChange = (difficulty: DifficultyLevel) => {
    setCurrentDifficulty(difficulty);
  };

  const assessPasswordDifficulty = (placedPieces: PlacedPiece[]): DifficultyLevel => {
    if (placedPieces.length === 0) return 'Easy';

    const pieceCount = placedPieces.length;
    const uniquePieceTypes = new Set(placedPieces.map(p => p.piece.name)).size;
    const colorMix = checkForColorMix(placedPieces);
    const hasHighValuePieces = checkForHighValuePieces(placedPieces);
    const hasSymmetricPlacement = checkForSymmetricPlacement(placedPieces);
    const hasEdgePlacement = checkForEdgePlacement(placedPieces);
    const hasCenterControl = checkForCenterControl(placedPieces);
    const hasAdvancedPositioning = checkForAdvancedPositioning(placedPieces);
    const pieceValueSum = checkForPieceValues(placedPieces);

    let score = 0;

    if (pieceCount >= 8) score += 4;
    else if (pieceCount >= 5) score += 3;
    else if (pieceCount >= 3) score += 2;
    else score += 1;

    if (uniquePieceTypes >= 4) score += 3;
    else if (uniquePieceTypes >= 3) score += 2;
    else if (uniquePieceTypes >= 2) score += 1;

    score += pieceValueSum / 5;

    if (colorMix) score += 2;
    if (hasHighValuePieces) score += 2;
    if (hasSymmetricPlacement) score -= 2;
    if (hasEdgePlacement) score += 1;
    if (hasCenterControl) score += 2;
    if (hasAdvancedPositioning) score += 3;

    if (score >= 24) return 'Hard';
    else if (score >= 16) return 'Normal';
    else return 'Easy';
  };

  const checkForColorMix = (pieces: PlacedPiece[]): boolean => {
    const colors = new Set(pieces.map(p => p.piece.color));
    return colors.size === 2;
  };

  const checkForHighValuePieces = (pieces: PlacedPiece[]): boolean => {
    const highValuePieces = ['Queen', 'King', 'Rook'];
    return pieces.some(p => highValuePieces.includes(p.piece.name));
  };

  const checkForSymmetricPlacement = (pieces: PlacedPiece[]): boolean => {
    if (pieces.length < 2) return false;

    const hasVerticalSymmetry = pieces.every(piece => {
      const mirrorCol = 7 - piece.col;
      return pieces.some(p => p.row === piece.row && p.col === mirrorCol);
    });

    const hasHorizontalSymmetry = pieces.every(piece => {
      const mirrorRow = 7 - piece.row;
      return pieces.some(p => p.row === mirrorRow && p.col === piece.col);
    });

    return hasVerticalSymmetry || hasHorizontalSymmetry;
  };

  const checkForEdgePlacement = (pieces: PlacedPiece[]): boolean => {
    return pieces.some(p => 
      p.row === 0 || p.row === 7 || p.col === 0 || p.col === 7
    );
  };

  const checkForCenterControl = (pieces: PlacedPiece[]): boolean => {
    const centerSquares = [
      [3, 3], [3, 4], [4, 3], [4, 4]
    ];
    
    return pieces.some(p => 
      centerSquares.some(([row, col]) => p.row === row && p.col === col)
    );
  };

  const checkForAdvancedPositioning = (pieces: PlacedPiece[]): boolean => {
    let advancedCount = 0;

    for (const piece of pieces) {
      if (piece.piece.name === 'Knight') {
        const knightMoves = getKnightMoves(piece.row, piece.col);
        if (knightMoves.some(([r, c]) => pieces.some(p => p.row === r && p.col === c))) {
          advancedCount++;
        }
      }
      
      if (piece.piece.name === 'Bishop') {
        const diagonalSquares = getDiagonalSquares(piece.row, piece.col);
        if (diagonalSquares.some(([r, c]) => pieces.some(p => p.row === r && p.col === c))) {
          advancedCount++;
        }
      }

      if ((piece.row + piece.col) % 2 === 0 && piece.piece.color === 'white') {
        advancedCount++;
      }
      if ((piece.row + piece.col) % 2 === 1 && piece.piece.color === 'black') {
        advancedCount++;
      }
    }

    return advancedCount >= 2;
  };

  const getKnightMoves = (row: number, col: number): number[][] => {
    const moves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    
    return moves
      .map(([dr, dc]) => [row + dr, col + dc])
      .filter(([r, c]) => r >= 0 && r < 8 && c >= 0 && c < 8);
  };

  const getDiagonalSquares = (row: number, col: number): number[][] => {
    const diagonals = [];
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    
    for (const [dr, dc] of directions) {
      for (let i = 1; i < 8; i++) {
        const newRow = row + dr * i;
        const newCol = col + dc * i;
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
          diagonals.push([newRow, newCol]);
        } else {
          break;
        }
      }
    }
    
    return diagonals;
  };

  const checkForPieceValues = (pieces: PlacedPiece[]): number => {
    const pieceValues: { [key: string]: number } = {
      'Pawn': 1,
      'Knight': 3,
      'Bishop': 3,
      'Rook': 5,
      'Queen': 9,
      'King': 4
    };

    return pieces.reduce((sum, piece) => {
      return sum + (pieceValues[piece.piece.name] || 0);
    }, 0);
  };

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
    if (isCreatingPassword && difficultyRef.current) {
      const difficulty = assessPasswordDifficulty(placedPieces);
      difficultyRef.current.setDifficulty(difficulty);
    }
  }, [placedPieces, isCreatingPassword]);

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

    if (isCreatingPassword && difficultyRef.current) {
      difficultyRef.current.setDifficulty('Easy');
    }
  };

  const canProceed = () => {
    const hasPieces = placedPieces.length > 0;

    if (isCreatingPassword) {
      return isUsernameValid && hasPieces && currentDifficulty !== 'Easy';
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
        const squareClass = `${styles.chessSquare} ${isLight ? styles.light : styles.dark} ${isDragOver ? styles.dragOver : ''}`;

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
                className={`${styles.chessPiece} ${piece.piece.color === styles.white ? styles.whitePiece : styles.blackPiece} ${isPieceDragging ? styles.dragging : ''}`}
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
    <div className={styles.pieceContainer}>
      <div className={styles.pieceItems}>
        {pieces.map((piece) => {
          const isDragging = draggedPieceId === piece.id;
          return (
            <div
              key={piece.id}
              className={`${styles.pieceButton} ${isDragging ? styles.dragging : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(piece, e)}
              onDragEnd={handleDragEnd}
              title={piece.name}
            >
              <span className={`${styles.pieceIcon} ${piece.color === styles.white ? styles.whitePiece : styles.blackPiece}`}>
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
    <div className="mainContainer">
      <div className="passwordOptionHeader">
        <button className="backButton" onClick={goBack}>
          ← Back
        </button>
        <h2>Chess Board</h2>
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
            ? "Drag chess pieces from below onto the board, or drag pieces on the board to move them."
            : "Recreate your password pattern by dragging pieces to the same positions."
          }
        </p>
        <p><small>Click on a piece to remove it, or double-click pieces on the board to delete them.</small></p>
      </div>

      <div className={styles.pieceSelector}>
        <h3>Drag Pieces to the Board:</h3>
        <div className={styles.pieceRows}>
          {renderPieceRow(whitePieces)}
          {renderPieceRow(blackPieces)}
        </div>
      </div>

      <div className={styles.chessBoardContainer}>
        <div className={styles.chessBoard}>
          {renderBoard()}
        </div>
      </div>
      <PasswordControls
        onClear={clearBoard}
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

      {placedPieces.length > 0 && (
        <div className={styles.patternDisplay}>
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