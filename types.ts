export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export interface Task {
  id: string;
  text: string;
  notes?: string;
  priority: Priority;
  completed: boolean;
  completedAt?: number; // Timestamp when it was checked
  resetIntervalHours: number; // 12 or 24
}

export interface AppState {
  tasks: Task[];
  streak: number;
  lastStreakDate: string | null; // YYYY-MM-DD
  darkMode: boolean;
  viewMode: 'list' | 'focus';
  lastVisit: number;
}
