import { Injectable } from '@angular/core';
import { Board, Color, GameState, Move, Piece, PieceType, Position, Square } from '../models/chess.models';

@Injectable({ providedIn: 'root' })
export class ChessEngineService {

  createInitialBoard(): Board {
    const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
    const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

    for (let col = 0; col < 8; col++) {
      board[0][col] = { type: backRow[col], color: 'black', id: `b-${backRow[col]}-${col}`, hasMoved: false };
      board[1][col] = { type: 'pawn', color: 'black', id: `b-pawn-${col}`, hasMoved: false };
      board[6][col] = { type: 'pawn', color: 'white', id: `w-pawn-${col}`, hasMoved: false };
      board[7][col] = { type: backRow[col], color: 'white', id: `w-${backRow[col]}-${col}`, hasMoved: false };
    }
    return board;
  }

  createInitialGameState(): GameState {
    return {
      board: this.createInitialBoard(),
      currentTurn: 'white',
      enPassantTarget: null,
      whiteKingMoved: false,
      blackKingMoved: false,
      whiteRookAMoved: false,
      whiteRookHMoved: false,
      blackRookAMoved: false,
      blackRookHMoved: false,
      halfMoveClock: 0,
      fullMoveNumber: 1,
      status: 'playing',
      winner: null
    };
  }

  getLegalMoves(position: Position, gameState: GameState): Move[] {
    const piece = gameState.board[position.row][position.col];
    if (!piece) return [];

    const pseudoMoves = this.getPseudoMoves(position, piece, gameState);
    return pseudoMoves.filter(move => {
      const newState = this.applyMoveToState(move, gameState);
      return !this.isInCheck(piece.color, newState.board);
    });
  }

  private getPseudoMoves(position: Position, piece: Piece, gameState: GameState): Move[] {
    switch (piece.type) {
      case 'pawn': return this.getPawnMoves(position, piece, gameState);
      case 'knight': return this.getKnightMoves(position, piece, gameState.board);
      case 'bishop': return this.getSlidingMoves(position, piece, gameState.board, [[-1,-1],[-1,1],[1,-1],[1,1]]);
      case 'rook': return this.getSlidingMoves(position, piece, gameState.board, [[-1,0],[1,0],[0,-1],[0,1]]);
      case 'queen': return this.getSlidingMoves(position, piece, gameState.board, [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
      case 'king': return this.getKingMoves(position, piece, gameState);
      default: return [];
    }
  }

  private getPawnMoves(pos: Position, piece: Piece, gameState: GameState): Move[] {
    const moves: Move[] = [];
    const board = gameState.board;
    const dir = piece.color === 'white' ? -1 : 1;
    const startRow = piece.color === 'white' ? 6 : 1;
    const promotionRow = piece.color === 'white' ? 0 : 7;

    // Forward one
    const oneForward = { row: pos.row + dir, col: pos.col };
    if (this.inBounds(oneForward) && !board[oneForward.row][oneForward.col]) {
      if (oneForward.row === promotionRow) {
        (['queen', 'rook', 'bishop', 'knight'] as PieceType[]).forEach(p =>
          moves.push({ from: pos, to: oneForward, promotion: p }));
      } else {
        moves.push({ from: pos, to: oneForward });
      }

      // Forward two from start
      if (pos.row === startRow) {
        const twoForward = { row: pos.row + 2 * dir, col: pos.col };
        if (!board[twoForward.row][twoForward.col]) {
          moves.push({ from: pos, to: twoForward });
        }
      }
    }

    // Diagonal captures
    for (const dc of [-1, 1]) {
      const capPos = { row: pos.row + dir, col: pos.col + dc };
      if (!this.inBounds(capPos)) continue;

      const target = board[capPos.row][capPos.col];
      if (target && target.color !== piece.color) {
        if (capPos.row === promotionRow) {
          (['queen', 'rook', 'bishop', 'knight'] as PieceType[]).forEach(p =>
            moves.push({ from: pos, to: capPos, promotion: p, capturedPiece: target }));
        } else {
          moves.push({ from: pos, to: capPos, capturedPiece: target });
        }
      }

      // En passant
      const ep = gameState.enPassantTarget;
      if (ep && ep.row === capPos.row && ep.col === capPos.col) {
        moves.push({ from: pos, to: capPos, isEnPassant: true });
      }
    }

    return moves;
  }

  private getKnightMoves(pos: Position, piece: Piece, board: Board): Move[] {
    const moves: Move[] = [];
    const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of deltas) {
      const to = { row: pos.row + dr, col: pos.col + dc };
      if (!this.inBounds(to)) continue;
      const target = board[to.row][to.col];
      if (!target || target.color !== piece.color) {
        moves.push({ from: pos, to, capturedPiece: target || undefined });
      }
    }
    return moves;
  }

  private getSlidingMoves(pos: Position, piece: Piece, board: Board, directions: number[][]): Move[] {
    const moves: Move[] = [];
    for (const [dr, dc] of directions) {
      let r = pos.row + dr;
      let c = pos.col + dc;
      while (this.inBounds({ row: r, col: c })) {
        const target = board[r][c];
        if (target) {
          if (target.color !== piece.color) {
            moves.push({ from: pos, to: { row: r, col: c }, capturedPiece: target });
          }
          break;
        }
        moves.push({ from: pos, to: { row: r, col: c } });
        r += dr;
        c += dc;
      }
    }
    return moves;
  }

  private getKingMoves(pos: Position, piece: Piece, gameState: GameState): Move[] {
    const moves: Move[] = [];
    const board = gameState.board;
    const deltas = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

    for (const [dr, dc] of deltas) {
      const to = { row: pos.row + dr, col: pos.col + dc };
      if (!this.inBounds(to)) continue;
      const target = board[to.row][to.col];
      if (!target || target.color !== piece.color) {
        moves.push({ from: pos, to, capturedPiece: target || undefined });
      }
    }

    // Castling
    if (!this.isInCheck(piece.color, board)) {
      const row = piece.color === 'white' ? 7 : 0;
      const kingMoved = piece.color === 'white' ? gameState.whiteKingMoved : gameState.blackKingMoved;
      const rookAMoved = piece.color === 'white' ? gameState.whiteRookAMoved : gameState.blackRookAMoved;
      const rookHMoved = piece.color === 'white' ? gameState.whiteRookHMoved : gameState.blackRookHMoved;

      if (!kingMoved) {
        // Kingside
        if (!rookHMoved && !board[row][5] && !board[row][6]) {
          if (!this.isSquareAttacked({ row, col: 5 }, piece.color, board) &&
              !this.isSquareAttacked({ row, col: 6 }, piece.color, board)) {
            moves.push({ from: pos, to: { row, col: 6 }, isCastling: true });
          }
        }
        // Queenside
        if (!rookAMoved && !board[row][3] && !board[row][2] && !board[row][1]) {
          if (!this.isSquareAttacked({ row, col: 3 }, piece.color, board) &&
              !this.isSquareAttacked({ row, col: 2 }, piece.color, board)) {
            moves.push({ from: pos, to: { row, col: 2 }, isCastling: true });
          }
        }
      }
    }

    return moves;
  }

  isInCheck(color: Color, board: Board): boolean {
    const kingPos = this.findKing(color, board);
    if (!kingPos) return false;
    return this.isSquareAttacked(kingPos, color, board);
  }

  isSquareAttacked(pos: Position, defendingColor: Color, board: Board): boolean {
    const attackingColor: Color = defendingColor === 'white' ? 'black' : 'white';

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece || piece.color !== attackingColor) continue;

        const fakeState: GameState = {
          board, currentTurn: attackingColor,
          enPassantTarget: null,
          whiteKingMoved: true, blackKingMoved: true,
          whiteRookAMoved: true, blackRookAMoved: true,
          whiteRookHMoved: true, blackRookHMoved: true,
          halfMoveClock: 0, fullMoveNumber: 1,
          status: 'playing', winner: null
        };

        const pseudoMoves = piece.type === 'king'
          ? this.getKingMovesNocastle({ row: r, col: c }, piece, board)
          : this.getPseudoMoves({ row: r, col: c }, piece, fakeState);

        if (pseudoMoves.some(m => m.to.row === pos.row && m.to.col === pos.col)) return true;
      }
    }
    return false;
  }

  private getKingMovesNocastle(pos: Position, piece: Piece, board: Board): Move[] {
    const moves: Move[] = [];
    const deltas = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (const [dr, dc] of deltas) {
      const to = { row: pos.row + dr, col: pos.col + dc };
      if (!this.inBounds(to)) continue;
      const target = board[to.row][to.col];
      if (!target || target.color !== piece.color) moves.push({ from: pos, to });
    }
    return moves;
  }

  applyMoveToState(move: Move, gameState: GameState): GameState {
    const board = this.cloneBoard(gameState.board);
    const piece = board[move.from.row][move.from.col]!;
    const newState: GameState = {
      ...gameState,
      board,
      enPassantTarget: null,
      halfMoveClock: gameState.halfMoveClock + 1
    };

    // Move piece
    board[move.to.row][move.to.col] = { ...piece, hasMoved: true };
    board[move.from.row][move.from.col] = null;

    // En passant capture
    if (move.isEnPassant) {
      const captureRow = move.from.row;
      board[captureRow][move.to.col] = null;
    }

    // Pawn two-square move sets en passant target
    if (piece.type === 'pawn' && Math.abs(move.to.row - move.from.row) === 2) {
      newState.enPassantTarget = {
        row: (move.from.row + move.to.row) / 2,
        col: move.from.col
      };
    }

    // Promotion
    if (move.promotion) {
      board[move.to.row][move.to.col] = { ...piece, type: move.promotion, hasMoved: true };
    }

    // Castling rook move
    if (move.isCastling) {
      const row = move.from.row;
      if (move.to.col === 6) { // Kingside
        board[row][5] = { ...board[row][7]!, hasMoved: true };
        board[row][7] = null;
      } else { // Queenside
        board[row][3] = { ...board[row][0]!, hasMoved: true };
        board[row][0] = null;
      }
    }

    // Track moved pieces for castling rights
    if (piece.type === 'king') {
      if (piece.color === 'white') newState.whiteKingMoved = true;
      else newState.blackKingMoved = true;
    }
    if (piece.type === 'rook') {
      if (piece.color === 'white') {
        if (move.from.col === 0) newState.whiteRookAMoved = true;
        if (move.from.col === 7) newState.whiteRookHMoved = true;
      } else {
        if (move.from.col === 0) newState.blackRookAMoved = true;
        if (move.from.col === 7) newState.blackRookHMoved = true;
      }
    }

    // Pawn or capture resets half move clock
    if (piece.type === 'pawn' || move.capturedPiece) {
      newState.halfMoveClock = 0;
    }

    newState.currentTurn = gameState.currentTurn === 'white' ? 'black' : 'white';
    if (newState.currentTurn === 'white') {
      newState.fullMoveNumber = gameState.fullMoveNumber + 1;
    }

    return newState;
  }

  evaluateGameStatus(gameState: GameState): GameState {
    const color = gameState.currentTurn;
    const hasLegalMoves = this.hasAnyLegalMoves(color, gameState);
    const inCheck = this.isInCheck(color, gameState.board);

    if (!hasLegalMoves) {
      if (inCheck) {
        return { ...gameState, status: 'checkmate', winner: color === 'white' ? 'black' : 'white' };
      } else {
        return { ...gameState, status: 'stalemate', winner: null };
      }
    }

    if (gameState.halfMoveClock >= 100) {
      return { ...gameState, status: 'draw', winner: null };
    }

    if (inCheck) {
      return { ...gameState, status: 'check' };
    }

    return { ...gameState, status: 'playing' };
  }

  private hasAnyLegalMoves(color: Color, gameState: GameState): boolean {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = gameState.board[r][c];
        if (piece && piece.color === color) {
          if (this.getLegalMoves({ row: r, col: c }, gameState).length > 0) return true;
        }
      }
    }
    return false;
  }

  private findKing(color: Color, board: Board): Position | null {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'king' && p.color === color) return { row: r, col: c };
      }
    }
    return null;
  }

  cloneBoard(board: Board): Board {
    return board.map(row => row.map(sq => sq ? { ...sq } : null));
  }

  private inBounds(pos: Position): boolean {
    return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
  }
}
