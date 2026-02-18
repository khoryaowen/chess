import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../../core/services/game-state.service';
import { Color, GameMode, GameSetup } from '../../core/models/chess.models';

@Component({
  selector: 'app-game-setup',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './game-setup.component.html',
  styleUrl: './game-setup.component.scss'
})
export class GameSetupComponent {
  player1Name = signal('Player 1');
  player2Name = signal('Player 2');
  gameMode = signal<GameMode>('pvp');
  player1Color = signal<Color | 'random'>('white');

  constructor(
    private router: Router,
    private gameStateService: GameStateService
  ) {}

  setGameMode(mode: GameMode) { this.gameMode.set(mode); }
  setColor(color: Color | 'random') { this.player1Color.set(color); }

  startGame() {
    const p1Name = this.player1Name().trim() || 'Player 1';
    const p2Name = this.player2Name().trim() || 'Player 2';

    let resolvedColor: Color;
    if (this.player1Color() === 'random') {
      resolvedColor = Math.random() < 0.5 ? 'white' : 'black';
    } else {
      resolvedColor = this.player1Color() as Color;
    }

    const setup: GameSetup = {
      player1Name: p1Name,
      player2Name: p2Name,
      player1Color: resolvedColor,
      gameMode: this.gameMode()
    };

    this.gameStateService.startNewGame(setup);
    this.router.navigate(['/game']);
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
