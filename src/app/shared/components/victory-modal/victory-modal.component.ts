import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerScore } from '../../../core/models/chess.models';

@Component({
  selector: 'app-victory-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './victory-modal.component.html',
  styleUrl: './victory-modal.component.scss'
})
export class VictoryModalComponent {
  @Input() message = '';
  @Input() scores: { player1: PlayerScore; player2: PlayerScore } | null = null;
  @Output() playAgain = new EventEmitter<void>();
  @Output() quit = new EventEmitter<void>();
}
