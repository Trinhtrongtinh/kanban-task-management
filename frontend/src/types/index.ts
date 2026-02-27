export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'free' | 'pro';
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface List {
  id: string;
  title: string;
  position: number;
  boardId: string;
  cards: Card[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  position: number;
  listId: string;
  dueDate?: Date;
  labels?: Label[];
  checklists?: Checklist[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Checklist {
  id: string;
  title: string;
  cardId: string;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
  checklistId: string;
}

export interface Activity {
  id: string;
  action: string;
  entityType: 'board' | 'list' | 'card' | 'checklist';
  entityId: string;
  userId: string;
  user?: User;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
