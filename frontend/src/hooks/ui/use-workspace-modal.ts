import { create } from 'zustand';

interface useWorkspaceModalStore {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
}

export const useWorkspaceModal = create<useWorkspaceModalStore>((set) => ({
    isOpen: false,
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
}));
