import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'setup',
    loadComponent: () => import('./features/game-setup/game-setup.component').then(m => m.GameSetupComponent)
  },
  {
    path: 'game',
    loadComponent: () => import('./features/chess-board/chess-board.component').then(m => m.ChessBoardComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
