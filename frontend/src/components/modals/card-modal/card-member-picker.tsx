'use client';

import { Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { User } from '@/types';
import { useGetBoardMembers } from '@/api/board-members';
import { Loader2 } from 'lucide-react';

interface CardMemberPickerProps {
  boardId?: string;
  assignedMembers: User[];
  onToggleMember: (user: User) => void;
  children: React.ReactNode;
  isPending?: boolean;
}

export function CardMemberPicker({
  boardId,
  assignedMembers,
  onToggleMember,
  children,
  isPending = false,
}: CardMemberPickerProps) {
  const assignedIds = new Set(assignedMembers.map((m) => m.id));
  const { data: boardMembers = [], isLoading } = useGetBoardMembers(boardId || '');
  const isInteractionDisabled = isPending || isLoading;

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 p-0"
        side="bottom"
        sideOffset={8}
      >
        <Command>
          <CommandInput placeholder="Search members..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Đang tải thành viên...' : 'Không có thành viên phù hợp.'}
            </CommandEmpty>
            <CommandGroup heading="Board members">
              {isLoading && (
                <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Đang tải danh sách thành viên...
                </div>
              )}

              {boardMembers.map((user) => {
                const isAssigned = assignedIds.has(user.id);
                return (
                  <CommandItem
                    key={user.id}
                    onSelect={() => onToggleMember(user)}
                    className="flex cursor-pointer items-center gap-2"
                    disabled={isInteractionDisabled}
                    title={isLoading ? 'Đang tải thành viên, vui lòng chờ...' : undefined}
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={user.avatarUrl} alt={user.name || user.username} />
                      <AvatarFallback className="text-[10px] font-medium">
                        {(user.name || user.username || 'Un').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{user.name || user.username}</span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                    {isAssigned && (
                      <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {isLoading && (
              <div className="px-3 py-2 text-[11px] text-muted-foreground border-t">
                Đang tải thành viên, tạm thời chưa thể thêm.
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
