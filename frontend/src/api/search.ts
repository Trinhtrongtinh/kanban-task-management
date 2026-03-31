import { apiClient } from './client';

export type SearchEntityType =
  | 'all'
  | 'workspace'
  | 'board'
  | 'list'
  | 'card'
  | 'comment';

export interface SearchWorkspace {
  id: string;
  name: string;
  slug: string;
  type: string;
}

export interface SearchBoard {
  id: string;
  title: string;
  slug: string;
  visibility: string;
  workspaceId: string;
  workspaceName: string;
}

export interface SearchList {
  id: string;
  title: string;
  boardId: string;
  boardTitle: string;
  workspaceId: string;
  workspaceName: string;
}

export interface SearchCard {
  id: string;
  title: string;
  description?: string | null;
  labels?: string[];
  listId: string;
  listTitle: string;
  boardId: string;
  boardTitle: string;
  workspaceId: string;
  workspaceName: string;
  deadline?: string | null;
  isArchived: boolean;
}

export interface SearchComment {
  id: string;
  content: string;
  cardId: string;
  cardTitle: string;
  listId: string;
  listTitle: string;
  boardId: string;
  boardTitle: string;
  workspaceId: string;
  workspaceName: string;
}

export interface GlobalSearchResponse {
  workspaces: SearchWorkspace[];
  boards: SearchBoard[];
  lists: SearchList[];
  cards: SearchCard[];
  comments: SearchComment[];
  total: {
    workspaces: number;
    boards: number;
    lists: number;
    cards: number;
    comments: number;
  };
}

export const searchApi = {
  global: async (
    q: string,
    signal?: AbortSignal,
  ): Promise<GlobalSearchResponse> => {
    const response = await apiClient.get<{ data: GlobalSearchResponse }>('/search/global', {
      params: { q },
      signal,
    });

    return response.data.data;
  },
};
