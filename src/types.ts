
export interface FlashcardFolder {
  id: string;
  name: string;
  createdAt: number;
}

export interface Flashcard {
  id: string;
  word: string;
  meaning: string;
  meaningTr: string;
  hint: string;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  folderId?: string;
  userId: string;
  createdAt: number;
  // Stats
  correctCount: number;
  wrongCount: number;
  lastViewedAt?: number;
  totalViews: number;
}

export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  STUDY = 'STUDY',
  MATCH = 'MATCH',
  QUIZ = 'QUIZ',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}
