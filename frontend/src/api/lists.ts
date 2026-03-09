import { useMutation } from '@tanstack/react-query';
import { useBoard, useBoardSafe } from '@/components/board/board-context';
import type { BoardList } from '@/components/board/types';

// Mock delay to simulate network
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useCreateList() {
  const boardCtx = useBoardSafe();

  return useMutation({
    mutationFn: async ({ title, boardId }: { title: string; boardId: string }) => {
      await delay(500); 
      return { id: `list-${Date.now()}`, title, boardId, cards: [], order: Date.now() };
    },
    onMutate: async ({ title, boardId }) => {
      if (!boardCtx) return;
      const { lists, setLists } = boardCtx;
      
      const prevLists = lists;
      
      const optimisticList: BoardList = {
        id: `list-opt-${Date.now()}`,
        title,
        boardId,
        order: prevLists.length,
        cards: [],
      };
      
      setLists([...prevLists, optimisticList]);
      return { prevLists, optimisticId: optimisticList.id };
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic ID with real ID
      if (!boardCtx) return;
      boardCtx.setLists(prev => 
        prev.map(list => (list.id === context?.optimisticId ? data : list))
      );
    },
    onError: (error, variables, context) => {
      if (boardCtx && context?.prevLists) {
        boardCtx.setLists(context.prevLists);
      }
    },
  });
}

export function useUpdateList() {
  const boardCtx = useBoardSafe();

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      await delay(500);
      return { id, title };
    },
    onMutate: async ({ id, title }) => {
      if (!boardCtx) return;
      const { lists, setLists } = boardCtx;
      const prevLists = lists;
      
      setLists(
        lists.map((list) =>
          list.id === id ? { ...list, title } : list
        )
      );
      
      return { prevLists };
    },
    onError: (error, variables, context) => {
      if (boardCtx && context?.prevLists) {
        boardCtx.setLists(context.prevLists);
      }
    },
  });
}

export function useDeleteList() {
  const boardCtx = useBoardSafe();

  return useMutation({
    mutationFn: async (id: string) => {
      await delay(500);
      return id;
    },
    onMutate: async (id) => {
      if (!boardCtx) return;
      const { lists, setLists } = boardCtx;
      const prevLists = lists;
      
      setLists(lists.filter((list) => list.id !== id));
      
      return { prevLists };
    },
    onError: (error, variables, context) => {
      if (boardCtx && context?.prevLists) {
        boardCtx.setLists(context.prevLists);
      }
    },
  });
}
