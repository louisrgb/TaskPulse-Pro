
export enum TaskFrequency {
  ONCE = 'Once',
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly'
}

export enum UserRole {
  ADMIN = 'Admin',
  CHILD = 'Kind'
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  password?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // User ID or '3' for everyone
  frequency: TaskFrequency;
  createdAt: string;
  startDate: string; // The date it starts appearing
  scheduledTime?: string; // Format 'HH:mm'
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  completedAt: string; // ISO Date string (YYYY-MM-DD)
  userId: string;
}

export type ViewMode = 'daily' | 'weekly' | 'team' | 'manage';
