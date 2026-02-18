export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type Color = 'white' | 'black';
export type BoardTheme = 'wood' | 'standard';
export type GameMode = 'pvp' | 'pvc';

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  type: PieceType;
  color: Color;
  id: string;
  hasMoved: boolean;
}

export type Square = Piece | null;
export type Board = Square[][];

export interface Move {
  from: Position;
  to: Position;
  promotion?: PieceType;
  isCastling?: boolean;
  isEnPassant?: boolean;
  capturedPiece?: Piece;
}

export interface GameSetup {
  player1Name: string;
  player2Name: string;
  player1Color: Color;
  gameMode: GameMode;
}

export interface PlayerScore {
  name: string;
  color: Color;
  score: number;
}

export interface GameState {
  board: Board;
  currentTurn: Color;
  enPassantTarget: Position | null;
  whiteKingMoved: boolean;
  blackKingMoved: boolean;
  whiteRookAMoved: boolean;
  whiteRookHMoved: boolean;
  blackRookAMoved: boolean;
  blackRookHMoved: boolean;
  halfMoveClock: number;
  fullMoveNumber: number;
  status: 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';
  winner: Color | null;
}

export interface AppSettings {
  boardTheme: BoardTheme;
}
