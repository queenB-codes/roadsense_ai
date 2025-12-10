export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface PotholeReport {
  id: string;
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  confidence: number;
  imageUrl: string; // Base64 or URL
  timestamp: number;
  synced: boolean;
}

export interface AppState {
  currentUser: User | null;
  isOffline: boolean;
}

export interface DetectionResult {
  bbox: [number, number, number, number]; // [x, y, width, height]
  class: string;
  score: number;
}