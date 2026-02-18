import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SettingsService } from '../../core/services/settings.service';
import { BoardTheme } from '../../core/models/chess.models';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private readonly settingsService = inject(SettingsService);
  private readonly router = inject(Router);

  readonly settings = this.settingsService.settings;

  themes: { id: BoardTheme; label: string; description: string; light: string; dark: string }[] = [
    { id: 'wood', label: 'Wood', description: 'Spruce & Birch', light: '#f0d9b5', dark: '#b58863' },
    { id: 'standard', label: 'Standard', description: 'Black & White', light: '#ffffff', dark: '#444444' }
  ];

  setTheme(theme: BoardTheme) {
    this.settingsService.setBoardTheme(theme);
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
