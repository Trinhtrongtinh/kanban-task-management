'use client';

import { useState, useCallback } from 'react';
import { Check, UserPlus, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { User } from '@/types';

// ── Mock data ────────────────────────────────────────────────────────

const ALL_SYSTEM_USERS: User[] = [
  { id: 'u1', name: 'Alice Nguyen', email: 'alice@example.com' },
  { id: 'u2', name: 'Bob Tran', email: 'bob@example.com' },
  { id: 'u3', name: 'Charlie Le', email: 'charlie@example.com' },
  { id: 'u4', name: 'Diana Pham', email: 'diana@example.com' },
  { id: 'u5', name: 'Edward Vo', email: 'edward@example.com' },
  { id: 'u6', name: 'Fiona Do', email: 'fiona@example.com' },
];

const INITIAL_MEMBERS: User[] = [
  ALL_SYSTEM_USERS[0], // Alice
  ALL_SYSTEM_USERS[1], // Bob
];

// ── Component ────────────────────────────────────────────────────────

interface BoardNavbarProps {
  boardId: string;
  title: string;
  workspaceId: string;
}

export function BoardNavbar({ boardId, title, workspaceId }: BoardNavbarProps) {
  const [boardMembers, setBoardMembers] = useState<User[]>(INITIAL_MEMBERS);
  const [isOpen, setIsOpen] = useState(false);

  const memberIds = new Set(boardMembers.map((m) => m.id));

  const toggleMember = useCallback((user: User) => {
    setBoardMembers((prev) => {
      const exists = prev.some((m) => m.id === user.id);
      if (exists) {
        return prev.filter((m) => m.id !== user.id);
      }
      return [...prev, user];
    });
  }, []);

  return (
    <div className="mb-2 flex w-full items-center justify-between rounded-lg border bg-white/60 px-4 py-2 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-x-4">
        <Button variant="ghost" size="sm" asChild className="text-neutral-600 hover:bg-neutral-200">
          <Link href={workspaceId ? `/workspaces/${workspaceId}` : '/workspaces'}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            <span className="font-semibold">Workspaces</span>
          </Link>
        </Button>
        <div className="h-6 w-px bg-neutral-300" />
        <h2 className="text-lg font-bold text-neutral-700">{title}</h2>
        <div className="h-6 w-px bg-neutral-300" />

        {/* ── Facepile: overlapping avatars ────────────── */}
        <div className="flex items-center">
          <TooltipProvider delayDuration={200}>
            <div className="flex -space-x-2">
              {boardMembers.map((member) => (
                <Tooltip key={member.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-8 w-8 ring-2 ring-white transition-transform hover:z-10 hover:scale-110">
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                      <AvatarFallback className="bg-indigo-100 text-xs font-medium text-indigo-700">
                        {member.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {member.name}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>

          {/* ── Invite Popover ─────────────────────────── */}
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="ml-3 flex h-8 items-center gap-2 rounded-md border bg-white px-3 text-neutral-600 transition hover:bg-neutral-100"
              >
                <UserPlus className="h-4 w-4" />
                <span className="text-sm font-medium">Invite</span>
              </Button>
            </PopoverTrigger>

            <PopoverContent
              align="start"
              className="w-80 p-0"
              side="bottom"
              sideOffset={8}
            >
              <Command>
                <CommandInput placeholder="Search users to invite..." />
                <CommandList>
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup heading="All users">
                    {ALL_SYSTEM_USERS.map((user) => {
                      const isAssigned = memberIds.has(user.id);
                      return (
                        <CommandItem
                          key={user.id}
                          onSelect={() => toggleMember(user)}
                          className="flex cursor-pointer items-center gap-3 px-3 py-2"
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback className="text-[10px] font-medium">
                              {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium">
                              {user.name}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {user.email}
                            </span>
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
        </div>
      </div>
    </div>
  );
}

