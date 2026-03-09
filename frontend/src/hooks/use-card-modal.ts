import { create } from 'zustand';

interface CardModalState {
  id: string | undefined;
  boardId: string | undefined;
  isOpen: boolean;
  onOpen: (id: string, boardId?: string) => void;
  onClose: () => void;
}

export const useCardModal = create<CardModalState>((set) => ({
  id: undefined,
  boardId: undefined,
  isOpen: false,
  onOpen: (id, boardId) => set({ id, boardId, isOpen: true }),
  onClose: () => set({ id: undefined, boardId: undefined, isOpen: false }),
}));
