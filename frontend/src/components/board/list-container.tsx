'use client';

import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useBoard } from './board-context';
import { ListItem } from './list-item';
import { ListCreator } from './list-creator';

export function ListContainer() {
  const { lists, boardId } = useBoard();
  const listIds = lists.map((list) => list.id);

  return (
    <div className="flex h-full gap-4 p-2 overflow-x-auto">
      <SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
        {lists.map((list) => (
          <ListItem key={list.id} list={list} />
        ))}
      </SortableContext>
      <ListCreator boardId={boardId} />
    </div>
  );
}
