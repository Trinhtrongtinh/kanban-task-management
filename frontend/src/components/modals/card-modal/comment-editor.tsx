'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/types';

// ── Shared mock board members (same list as CardMemberPicker) ────────
export const BOARD_MEMBERS: User[] = [
  { id: 'u1', name: 'Alice Nguyen', email: 'alice@example.com' },
  { id: 'u2', name: 'Bob Tran', email: 'bob@example.com' },
  { id: 'u3', name: 'Charlie Le', email: 'charlie@example.com' },
  { id: 'u4', name: 'Diana Pham', email: 'diana@example.com' },
  { id: 'u5', name: 'Edward Vo', email: 'edward@example.com' },
];

interface CommentEditorProps {
  /** Called when the user saves a comment */
  onSave: (payload: { content: string; mentionedUserIds: string[] }) => void;
  /** Optional — show a loading spinner on Save */
  isLoading?: boolean;
}

/**
 * Finds the @-query that the user is currently typing.
 * Returns `null` when the cursor is not inside an @mention.
 */
function getMentionQuery(
  text: string,
  cursorPos: number
): { query: string; atIndex: number } | null {
  const before = text.slice(0, cursorPos);
  // Walk backwards to find the nearest '@' that is either at start or preceded by whitespace
  const match = before.match(/@([^\s@]*)$/);
  if (!match) return null;
  const atIndex = before.lastIndexOf('@');
  return { query: match[1], atIndex };
}

export function CommentEditor({ onSave, isLoading }: CommentEditorProps) {
  const [content, setContent] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);

  // @mention popover state
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionAtIndex, setMentionAtIndex] = useState<number>(-1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filtered member list based on the query typed after @
  const filteredMembers = BOARD_MEMBERS.filter((m) =>
    m.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const closeMentionMenu = useCallback(() => {
    setMentionOpen(false);
    setMentionQuery('');
    setMentionAtIndex(-1);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Close on Escape
      if (e.key === 'Escape' && mentionOpen) {
        e.preventDefault();
        closeMentionMenu();
        return;
      }
      // Submit on Ctrl/Cmd + Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mentionOpen, closeMentionMenu]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    const cursor = e.target.selectionStart ?? value.length;
    const result = getMentionQuery(value, cursor);

    if (result) {
      setMentionQuery(result.query);
      setMentionAtIndex(result.atIndex);
      setMentionOpen(true);
    } else {
      closeMentionMenu();
    }
  };

  // Close popover when clicking outside the wrapper
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        closeMentionMenu();
      }
    };
    if (mentionOpen) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [mentionOpen, closeMentionMenu]);

  const selectMember = useCallback(
    (member: User) => {
      if (mentionAtIndex === -1) return;

      // Replace "@query" with "@Name " in the textarea
      const before = content.slice(0, mentionAtIndex);
      const after = content.slice(
        mentionAtIndex + 1 + mentionQuery.length // skip '@' + typed query
      );
      const inserted = `@${member.name} `;
      const newContent = before + inserted + after;

      setContent(newContent);
      setMentionedUserIds((prev) =>
        prev.includes(member.id) ? prev : [...prev, member.id]
      );
      closeMentionMenu();

      // Restore focus + move cursor to end of inserted mention
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        const pos = before.length + inserted.length;
        el.setSelectionRange(pos, pos);
      });
    },
    [content, mentionAtIndex, mentionQuery, closeMentionMenu]
  );

  const handleSave = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSave({ content: trimmed, mentionedUserIds });
    setContent('');
    setMentionedUserIds([]);
  };

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-2">
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Write a comment… (@ to mention)"
        rows={2}
        className="
          w-full resize-none rounded-md border border-input bg-background
          px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50 transition
        "
      />

      {/* Inline @mention Command menu (renders below the textarea, anchored to wrapper) */}
      {mentionOpen && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-64 rounded-md border bg-popover shadow-xl animate-in fade-in-0 zoom-in-95">
          <Command>
            <CommandList className="max-h-48">
              <CommandEmpty>No members found.</CommandEmpty>
              <CommandGroup heading="Mention a member">
                {filteredMembers.map((member) => (
                  <CommandItem
                    key={member.id}
                    value={member.name}
                    onSelect={() => selectMember(member)}
                    className="flex cursor-pointer items-center gap-2 px-2 py-1.5"
                  >
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                      <AvatarFallback className="text-[9px] font-medium">
                        {member.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{member.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground select-none">
          <kbd className="rounded border px-1 font-mono text-[9px]">Ctrl↵</kbd> send · <span className="font-medium text-foreground">@</span> mention
        </p>
        <Button
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={handleSave}
          disabled={!content.trim() || isLoading}
        >
          {isLoading ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
