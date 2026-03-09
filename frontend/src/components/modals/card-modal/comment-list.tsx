'use client';

import { Fragment } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/types';

// ── Types ────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  cardId: string;
  author: User;
  content: string;
  createdAt: string; // ISO string
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Human-readable time-ago string (e.g. "3 minutes ago"). */
function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} hour${diffH !== 1 ? 's' : ''} ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD} day${diffD !== 1 ? 's' : ''} ago`;
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
}

export function CommentList({ comments, memberNames }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">No comments yet.</p>
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <li key={comment.id} className="flex gap-3">
          {/* Avatar */}
          <Avatar className="h-8 w-8 shrink-0 mt-0.5">
            <AvatarImage
              src={comment.author.avatarUrl}
              alt={comment.author.name}
            />
            <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
              {comment.author.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm font-semibold">{comment.author.name}</span>
              <span className="text-xs text-muted-foreground">
                {timeAgo(comment.createdAt)}
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
