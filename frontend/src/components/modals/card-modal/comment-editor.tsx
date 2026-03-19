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
import { resolveAvatarUrl } from '@/lib/utils';
import { useI18n } from '@/hooks/ui/use-i18n';
import { useAuthStore } from '@/stores/authStore';

interface CommentEditorProps {
  members: User[];
  /** Called when the user saves a comment */
  onSave: (payload: {
    content: string;
    mentionedUserIds: string[];
    mentionAll: boolean;
  }) => void;
  /** Optional — show a loading spinner on Save */
  isLoading?: boolean;
}

type MentionTarget = User | { id: '__everyone__'; username: string; name?: string; email?: string };

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

export function CommentEditor({ members, onSave, isLoading }: CommentEditorProps) {
  const { t } = useI18n();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [content, setContent] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [mentionAll, setMentionAll] = useState(false);

  // @mention popover state
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionAtIndex, setMentionAtIndex] = useState<number>(-1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filtered member list based on the query typed after @
  const everyoneLabel = t('cardModal.commentEditor.everyoneToken');
  const normalizedQuery = mentionQuery.toLowerCase();
  const otherMembers = members.filter((member) => member.id !== currentUserId);
  const shouldShowEveryone =
    normalizedQuery.length === 0 ||
    everyoneLabel.toLowerCase().includes(normalizedQuery) ||
    'everyone'.includes(normalizedQuery) ||
    'mọingười'.includes(normalizedQuery) ||
    'moi nguoi'.includes(normalizedQuery);
  const filteredMembers = otherMembers.filter((m) =>
    (m.username || m.name || '').toLowerCase().includes(normalizedQuery)
  );
  const mentionTargets: MentionTarget[] = [
    ...(shouldShowEveryone
      ? [{
          id: '__everyone__' as const,
          username: everyoneLabel,
          name: t('cardModal.commentEditor.everyoneDescription'),
        }]
      : []),
    ...filteredMembers,
  ];

  const closeMentionMenu = useCallback(() => {
    setMentionOpen(false);
    setMentionQuery('');
    setMentionAtIndex(-1);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Close on Escape
    if (e.key === 'Escape' && mentionOpen) {
      e.preventDefault();
      closeMentionMenu();
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      if (mentionOpen && filteredMembers.length > 0) {
        selectMember(filteredMembers[0]);
        return;
      }

      handleSave();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    setMentionAll(/(^|\s)@(everyone|mọingười)(?=\s|$)/i.test(value));

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
    (member: MentionTarget) => {
      if (mentionAtIndex === -1) return;

      // Replace "@query" with "@Name " in the textarea
      const before = content.slice(0, mentionAtIndex);
      const after = content.slice(
        mentionAtIndex + 1 + mentionQuery.length // skip '@' + typed query
      );
      const inserted = `@${member.username || member.name || 'user'} `;
      const newContent = before + inserted + after;

      setContent(newContent);
      if (member.id === '__everyone__') {
        setMentionAll(true);
      } else {
        setMentionedUserIds((prev) =>
          prev.includes(member.id) ? prev : [...prev, member.id]
        );
      }
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
    onSave({ content: trimmed, mentionedUserIds, mentionAll });
    setContent('');
    setMentionedUserIds([]);
    setMentionAll(false);
  };

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-2">
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={t('cardModal.commentEditor.placeholder')}
        rows={2}
        className="
          w-full resize-none rounded-md border border-input bg-background text-foreground
          px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50 transition
        "
      />

      {/* Inline @mention Command menu (renders below the textarea, anchored to wrapper) */}
      {mentionOpen && mentionTargets.length > 0 && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-64 rounded-md border bg-popover shadow-xl animate-in fade-in-0 zoom-in-95">
          <Command>
            <CommandList className="max-h-48">
              <CommandEmpty>{t('cardModal.commentEditor.noMembers')}</CommandEmpty>
              <CommandGroup heading={t('cardModal.commentEditor.mentionMember')}>
                {mentionTargets.map((member) => (
                  <CommandItem
                    key={member.id}
                    value={member.username || member.name}
                    onSelect={() => selectMember(member)}
                    className="flex cursor-pointer items-center gap-2 px-2 py-1.5"
                  >
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarImage src={member.id === '__everyone__' ? undefined : resolveAvatarUrl('avatarUrl' in member ? member.avatarUrl : undefined)} alt={member.username || member.name || ''} />
                      <AvatarFallback className="text-[9px] font-medium">
                        {member.id === '__everyone__'
                          ? '@@'
                          : (member.username || member.name || 'U').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{member.username || member.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{member.email || member.name}</p>
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
          <kbd className="rounded border px-1 font-mono text-[9px]">Enter</kbd> {t('cardModal.commentEditor.hintSend')} · <kbd className="rounded border px-1 font-mono text-[9px]">Shift+Enter</kbd> {t('cardModal.commentEditor.hintNewLine')} · <span className="font-medium text-foreground">@</span> {t('cardModal.commentEditor.hintMention')} · <span className="font-medium text-foreground">@{everyoneLabel}</span>
        </p>
        <Button
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={handleSave}
          disabled={!content.trim() || isLoading}
        >
          {isLoading ? t('cardModal.commentEditor.sending') : t('cardModal.commentEditor.send')}
        </Button>
      </div>
    </div>
  );
}
