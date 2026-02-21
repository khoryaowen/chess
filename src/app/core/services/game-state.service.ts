import { Injectable, signal, computed } from '@angular/core';
import { GameSetup, GameState, PlayerScore, Color, Move } from '../models/chess.models';
import { ChessEngineService } from './chess-engine.service';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  private readonly engine = new ChessEngineService();

  readonly gameSetup = signal<GameSetup | null>(null);
  readonly gameState = signal<GameState | null>(null);
  readonly scores = signal<{ player1: PlayerScore; player2: PlayerScore } | null>(null);

  readonly selectedSquare = signal<{ row: number; col: number } | null>(null);
  readonly legalMovesForSelected = signal<Move[]>([]);

  readonly isGameOver = computed(() => {
    const status = this.gameState()?.status;
    return status === 'checkmate' || status === 'stalemate' || status === 'draw';
  });

  startNewGame(setup: GameSetup): void {
    this.gameSetup.set(setup);
    const initialState = this.engine.createInitialGameState();

    this.gameState.set(initialState);
    this.selectedSquare.set(null);
    this.legalMovesForSelected.set([]);

    this.scores.set({
      player1: { name: setup.player1Name, color: setup.player1Color, score: 0 },
      player2: { name: setup.player2Name, color: setup.player1Color === 'white' ? 'black' : 'white', score: 0 }
    });
  }

  resetBoardKeepScores(): void {
    const setup = this.gameSetup();
    if (!setup) return;
    const initialState = this.engine.createInitialGameState();
    this.gameState.set(initialState);
    this.selectedSquare.set(null);
    this.legalMovesForSelected.set([]);
  }

  selectSquare(row: number, col: number): void {
    const state = this.gameState();
    if (!state || this.isGameOver()) return;

    const piece = state.board[row][col];
    const selected = this.selectedSquare();

    // If a square is already selected, try to move
    if (selected) {
      const legalMoves = this.legalMovesForSelected();
      const targetMove = legalMoves.find(m => m.to.row === row && m.to.col === col);

      if (targetMove) {
        this.executeMove(targetMove);
        return;
      }

      // Check if clicking a piece of same color to re-select
      if (piece && piece.color === state.currentTurn) {
        this.selectedSquare.set({ row, col });
        this.legalMovesForSelected.set(this.engine.getLegalMoves({ row, col }, state));
        return;
      }

      this.selectedSquare.set(null);
      this.legalMovesForSelected.set([]);
      return;
    }

    // Select a piece if it belongs to the current player
    if (piece && piece.color === state.currentTurn) {
      this.selectedSquare.set({ row, col });
      this.legalMovesForSelected.set(this.engine.getLegalMoves({ row, col }, state));
    }
  }

  private executeMove(move: Move): void {
    const state = this.gameState();
    if (!state) return;

    // Handle pawn promotion — auto-promote to queen for now (can be extended with UI)
    let finalMove = move;
    if (!finalMove.promotion) {
      const piece = state.board[move.from.row][move.from.col];
      if (piece?.type === 'pawn') {
        const promotionRow = piece.color === 'white' ? 0 : 7;
        if (move.to.row === promotionRow) {
          finalMove = { ...move, promotion: 'queen' };
        }
      }
    }

    let newState = this.engine.applyMoveToState(finalMove, state);
    newState = this.engine.evaluateGameStatus(newState);

    this.gameState.set(newState);
    this.selectedSquare.set(null);
    this.legalMovesForSelected.set([]);

    // Update scores on game end
    if (newState.status === 'checkmate' && newState.winner) {
      this.updateScores(newState.winner, 'win');
    } else if (newState.status === 'stalemate' || newState.status === 'draw') {
      this.updateScores(null, 'draw');
    }
  }

  private updateScores(winner: Color | null, result: 'win' | 'draw'): void {
    const scores = this.scores();
    if (!scores) return;

    if (result === 'draw') {
      this.scores.set({
        player1: { ...scores.player1, score: scores.player1.score + 0.5 },
        player2: { ...scores.player2, score: scores.player2.score + 0.5 }
      });
    } else if (winner) {
      this.scores.set({
        player1: {
          ...scores.player1,
          score: scores.player1.color === winner ? scores.player1.score + 1 : scores.player1.score
        },
        player2: {
          ...scores.player2,
          score: scores.player2.color === winner ? scores.player2.score + 1 : scores.player2.score
        }
      });
    }
  }

  getWinnerName(): string {
    const state = this.gameState();
    const scores = this.scores();
    if (!state?.winner || !scores) return '';
    return scores.player1.color === state.winner ? scores.player1.name : scores.player2.name;
  }

  clearGame(): void {
    this.gameSetup.set(null);
    this.gameState.set(null);
    this.scores.set(null);
    this.selectedSquare.set(null);
    this.legalMovesForSelected.set([]);
  }
}
