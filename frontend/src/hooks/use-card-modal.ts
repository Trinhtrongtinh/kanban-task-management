import { create } from 'zustand';

interface CardModalState {
  id: string | undefined;
  isOpen: boolean;
  onOpen: (id: string) => void;
  onClose: () => void;
}

export const useCardModal = create<CardModalState>((set) => ({
  id: undefined,
  isOpen: false,
  onOpen: (id) => set({ id, isOpen: true }),
  onClose: () => set({ id: undefined, isOpen: false }),
}));
