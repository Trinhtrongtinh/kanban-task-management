import type { User } from '@/types';

export interface Label {
  id: string;
  boardId: string;
  name: string;
  colorCode: string;
}

export interface BoardCard {
  id: string;
  title: string;
  description?: string | null;
  assigneeId?: string | null;
  assignee?: User | null;
  boardId?: string;
  members?: User[];
  labels?: Label[];
  deadline?: string | null; // ISO format
  isReminded?: boolean;
  isArchived?: boolean;
  attachments?: {
    id: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
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
