import type { User } from '@/types';

export interface BoardCard {
  id: string;
  title: string;
  boardId?: string;
  members?: User[];
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
  cards: BoardCard[];
}
