import type { User } from '@/types';

export interface Label {
  id: string;
  boardId: string;
  title: string;
  color: string;
}

export interface BoardCard {
  id: string;
  title: string;
  boardId?: string;
  members?: User[];
  labels?: Label[];
  dueDate?: string; // ISO format
  isCompleted?: boolean;
  attachments?: {
    id: string;
    url: string;
    fileName: string;
    type: string;
    createdAt: string;
  }[];
}

export interface BoardList {
  id: string;
  title: string;
  boardId: string;
  order: number;
  cards: BoardCard[];
}
