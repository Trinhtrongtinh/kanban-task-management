'use client';

import { Fragment, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import type { Comment } from '@/api/comments';

// ── Helpers ──────────────────────────────────────────────────────────

function formatCommentTime(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  }).format(new Date(iso));
}

/**
 * Parses a comment string and returns an array of React nodes,
 * where words starting with "@" that match a known member name
 * are highlighted as mention chips.
 */
function parseMentions(
  content: string,
  memberNames: Set<string>
): React.ReactNode[] {
  // Split on whitespace but keep the separators so we can rejoin
  const tokens = content.split(/(\s+)/);

  return tokens.map((token, i) => {
    if (token.startsWith('@')) {
      const candidate = token.slice(1); // name after '@'
      if (memberNames.has(candidate)) {
        return (
          <span
            key={i}
            className="inline-flex items-center rounded bg-blue-50 px-1 text-blue-600 font-semibold dark:bg-blue-950 dark:text-blue-400"
          >
            @{candidate}
          </span>
        );
      }
    }
    // Return whitespace / normal tokens as-is
    return <Fragment key={i}>{token}</Fragment>;
  });
}

// ── Component ────────────────────────────────────────────────────────

interface CommentListProps {
  comments: Comment[];
  /** Full set of board member names used for mention highlighting */
  memberNames: Set<string>;
  highlightedCommentId?: string | null;
}

export function CommentList({ comments, memberNames, highlightedCommentId }: CommentListProps) {
  useEffect(() => {
    if (!highlightedCommentId) return;

    const element = document.querySelector(`[data-comment-id="${highlightedCommentId}"]`);
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightedCommentId, comments]);

  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">No comments yet.</p>
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <li
          key={comment.id}
          data-comment-id={comment.id}
          className={`flex gap-3 rounded-lg px-2 py-1 transition-colors ${highlightedCommentId === comment.id ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}
        >
          {/* Avatar */}
          <Avatar className="h-8 w-8 shrink-0 mt-0.5">
            <AvatarImage
              src={comment.user.avatarUrl || undefined}
              alt={comment.user.username}
            />
            <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
              {comment.user.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm font-semibold">{comment.user.username}</span>
              <span className="text-xs text-muted-foreground">
                {formatCommentTime(comment.createdAt)}
              </span>
            </div>

            {/* Content bubble */}
            <div className="mt-1 rounded-md border bg-card px-3 py-2 text-sm leading-relaxed shadow-sm">
              {parseMentions(comment.content, memberNames)}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
