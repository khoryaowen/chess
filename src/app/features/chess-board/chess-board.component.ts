import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';
import { SettingsService } from '../../core/services/settings.service';
import { VictoryModalComponent } from '../../shared/components/victory-modal/victory-modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { Color, Piece } from '../../core/models/chess.models';

interface SquareDisplay {
  row: number;
  col: number;
  piece: Piece | null;
  isSelected: boolean;
  isLegalTarget: boolean;
  isLastMoveFrom: boolean;
  isLastMoveTo: boolean;
  isCheck: boolean;
  label?: string;
}

@Component({
  selector: 'app-chess-board',
  standalone: true,
  imports: [CommonModule, VictoryModalComponent, ConfirmModalComponent],
  templateUrl: './chess-board.component.html',
  styleUrl: './chess-board.component.scss'
})
export class ChessBoardComponent implements OnInit {
  private readonly gameStateService = inject(GameStateService);
  private readonly settingsService = inject(SettingsService);
  private readonly router = inject(Router);

  readonly rows = [0,1,2,3,4,5,6,7];
  readonly cols = [0,1,2,3,4,5,6,7];

  readonly gameState = this.gameStateService.gameState;
  readonly gameSetup = this.gameStateService.gameSetup;
  readonly scores = this.gameStateService.scores;
  readonly selectedSquare = this.gameStateService.selectedSquare;
  readonly legalMoves = this.gameStateService.legalMovesForSelected;
  readonly isGameOver = this.gameStateService.isGameOver;
  readonly settings = this.settingsService.settings;
  readonly showExitConfirm = signal(false);

  readonly squares = computed<SquareDisplay[][]>(() => {
    const state = this.gameState();
    if (!state) return [];
    const selected = this.selectedSquare();
    const legalMoves = this.legalMoves();
    const legalTargets = new Set(legalMoves.map(m => `${m.to.row},${m.to.col}`));

    const checkRow = this.getCheckKingPosition();

    return this.rows.map(row =>
      this.cols.map(col => ({
        row, col,
        piece: state.board[row][col],
        isSelected: selected?.row === row && selected?.col === col,
        isLegalTarget: legalTargets.has(`${row},${col}`),
        isLastMoveFrom: false,
        isLastMoveTo: false,
        isCheck: checkRow?.row === row && checkRow?.col === col
      }))
    );
  });

  readonly displayedBoard = computed(() => {
    const setup = this.gameSetup();
    const allSquares = this.squares();
    // Flip board if player 1 is black
    if (setup?.player1Color === 'black') {
      return [...allSquares].reverse().map(row => [...row].reverse());
    }
    return allSquares;
  });

  readonly currentPlayerName = computed(() => {
    const state = this.gameState();
    const setup = this.gameSetup();
    const scores = this.scores();
    if (!state || !setup || !scores) return '';
    return state.currentTurn === scores.player1.color ? scores.player1.name : scores.player2.name;
  });

  readonly rankLabels = computed(() => {
    const setup = this.gameSetup();
    return setup?.player1Color === 'black'
      ? ['1','2','3','4','5','6','7','8']
      : ['8','7','6','5','4','3','2','1'];
  });

  readonly fileLabels = computed(() => {
    const setup = this.gameSetup();
    const files = ['a','b','c','d','e','f','g','h'];
    return setup?.player1Color === 'black' ? [...files].reverse() : files;
  });

  ngOnInit() {
    if (!this.gameState()) {
      this.router.navigate(['/setup']);
    }
  }

  onSquareClick(row: number, col: number) {
    // Convert display coordinates back to board coordinates if flipped
    const setup = this.gameSetup();
    let boardRow = row;
    let boardCol = col;
    if (setup?.player1Color === 'black') {
      boardRow = 7 - row;
      boardCol = 7 - col;
    }
    this.gameStateService.selectSquare(boardRow, boardCol);
  }

  getPieceSymbol(piece: Piece | null): string {
    if (!piece) return '';
    const filled: Record<string, string>   = { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' };
    return filled[piece.type];
  }

  isLightSquare(row: number, col: number): boolean {
    return (row + col) % 2 === 0;
  }

  private getCheckKingPosition() {
    const state = this.gameState();
    if (!state || state.status !== 'check') return null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = state.board[r][c];
        if (p?.type === 'king' && p.color === state.currentTurn) return { row: r, col: c };
      }
    }
    return null;
  }

  getStatusMessage(): string {
    const state = this.gameState();
    if (!state) return '';
    if (state.status === 'check') return `${this.currentPlayerName()} is in check!`;
    return `${this.currentPlayerName()}'s turn`;
  }

  onExitClick() {
    this.showExitConfirm.set(true);
  }

  onExitConfirmed() {
    this.showExitConfirm.set(false);
    this.onQuit();
  }

  onExitCancelled() {
    this.showExitConfirm.set(false);
  }

  onPlayAgain() {
    this.gameStateService.resetBoardKeepScores();
  }

  onQuit() {
    this.gameStateService.clearGame();
    this.router.navigate(['/']);
  }

  getWinnerMessage(): string {
    const state = this.gameState();
    if (!state) return '';
    if (state.status === 'checkmate') return `${this.gameStateService.getWinnerName()} is Victorious!`;
    if (state.status === 'stalemate') return 'Stalemate — It\'s a Draw!';
    if (state.status === 'draw') return 'It\'s a Draw!';
    return '';
  }
}
