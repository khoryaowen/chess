import { Injectable, signal } from '@angular/core';
import { AppSettings, BoardTheme } from '../models/chess.models';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly STORAGE_KEY = 'chess-app-settings';

  readonly settings = signal<AppSettings>(this.loadSettings());

  private loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return { boardTheme: 'wood' };
  }

  setBoardTheme(theme: BoardTheme): void {
    const newSettings = { ...this.settings(), boardTheme: theme };
    this.settings.set(newSettings);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newSettings));
  }
}
