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

// ── Mock board members ──────────────────────────────────────────────
const BOARD_MEMBERS: User[] = [
  { id: 'u1', name: 'Alice Nguyen', email: 'alice@example.com' },
  { id: 'u2', name: 'Bob Tran', email: 'bob@example.com' },
  { id: 'u3', name: 'Charlie Le', email: 'charlie@example.com' },
  { id: 'u4', name: 'Diana Pham', email: 'diana@example.com' },
  { id: 'u5', name: 'Edward Vo', email: 'edward@example.com' },
];

interface CardMemberPickerProps {
  assignedMembers: User[];
  onToggleMember: (user: User) => void;
  children: React.ReactNode;
}

export function CardMemberPicker({
  assignedMembers,
  onToggleMember,
  children,
}: CardMemberPickerProps) {
  const assignedIds = new Set(assignedMembers.map((m) => m.id));

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
            <CommandEmpty>No members found.</CommandEmpty>
            <CommandGroup heading="Board members">
              {BOARD_MEMBERS.map((user) => {
                const isAssigned = assignedIds.has(user.id);
                return (
                  <CommandItem
                    key={user.id}
                    onSelect={() => onToggleMember(user)}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback className="text-[10px] font-medium">
                        {user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{user.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                    {isAssigned && (
                      <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
