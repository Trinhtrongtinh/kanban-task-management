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
  description?: string | null;
  boardId?: string;
  members?: User[];
  labels?: Label[];
  deadline?: string | null; // ISO format
  isReminded?: boolean;
  isArchived?: boolean;
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
  position: number;
  cards: BoardCard[];
}
