import { create } from 'zustand';
import type { Board, List, Card } from '@/types';

interface BoardState {
  currentBoard: Board | null;
  lists: List[];
  isLoading: boolean;
  
  setCurrentBoard: (board: Board | null) => void;
  setLists: (lists: List[]) => void;
  addList: (list: List) => void;
  updateList: (listId: string, data: Partial<List>) => void;
  removeList: (listId: string) => void;
  
  addCard: (listId: string, card: Card) => void;
  updateCard: (listId: string, cardId: string, data: Partial<Card>) => void;
  removeCard: (listId: string, cardId: string) => void;
  moveCard: (
    sourceListId: string,
    destListId: string,
    cardId: string,
    newPosition: number
  ) => void;
  
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  currentBoard: null,
  lists: [],
  isLoading: false,

  setCurrentBoard: (currentBoard) => set({ currentBoard }),
  
  setLists: (lists) => set({ lists }),
  
  addList: (list) => set((state) => ({ 
    lists: [...state.lists, list] 
  })),
  
  updateList: (listId, data) => set((state) => ({
    lists: state.lists.map((list) =>
      list.id === listId ? { ...list, ...data } : list
    ),
  })),
  
  removeList: (listId) => set((state) => ({
    lists: state.lists.filter((list) => list.id !== listId),
  })),

  addCard: (listId, card) => set((state) => ({
    lists: state.lists.map((list) =>
      list.id === listId
        ? { ...list, cards: [...list.cards, card] }
        : list
    ),
  })),
  
  updateCard: (listId, cardId, data) => set((state) => ({
    lists: state.lists.map((list) =>
      list.id === listId
        ? {
            ...list,
            cards: list.cards.map((card) =>
              card.id === cardId ? { ...card, ...data } : card
            ),
          }
        : list
    ),
  })),
  
  removeCard: (listId, cardId) => set((state) => ({
    lists: state.lists.map((list) =>
      list.id === listId
        ? { ...list, cards: list.cards.filter((c) => c.id !== cardId) }
        : list
    ),
  })),
  
  moveCard: (sourceListId, destListId, cardId, newPosition) =>
    set((state) => {
      const sourceList = state.lists.find((l) => l.id === sourceListId);
      const card = sourceList?.cards.find((c) => c.id === cardId);
      
      if (!card) return state;
      
      const updatedCard = { ...card, position: newPosition, listId: destListId };
      
      return {
        lists: state.lists.map((list) => {
          if (list.id === sourceListId) {
            return {
              ...list,
              cards: list.cards.filter((c) => c.id !== cardId),
            };
          }
          if (list.id === destListId) {
            const newCards = [...list.cards, updatedCard].sort(
              (a, b) => a.position - b.position
            );
            return { ...list, cards: newCards };
          }
          return list;
        }),
      };
    }),

  setLoading: (isLoading) => set({ isLoading }),
  
  reset: () => set({ currentBoard: null, lists: [], isLoading: false }),
}));
