'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCardModal } from '@/hooks/ui/use-card-modal';
import { useBoardSafe } from '@/components/board/board-context';
import { useUpdateCard, useDeleteCard } from '@/hooks/data/use-cards';
import { useAddChecklistMutation } from '@/api/checklists';
import { attachmentsApi } from '@/api/attachments';
import { BASE_URL } from '@/api/client';
import { ChecklistsContainer } from './checklists-container';
import { CommentEditor } from './comment-editor';
import { CommentList } from './comment-list';
import { useComments, useCreateCommentMutation } from '@/api/comments';
import { CardMemberPicker } from './card-member-picker';
import { LabelPicker } from './label-picker';
import { useGetBoardMembers } from '@/api/board-members';
import { useAssignMember, useUnassignMember } from '@/api/card-members';
import {
  Users,
  Calendar as CalendarIcon,
  Paperclip,
  CheckSquare,
  X,
  Clock,
  Loader2,
  FileIcon,
  ChevronDown,
  ChevronRight,
  Tag,
  MessageSquare,
  Trash,
} from 'lucide-react';
import {
  getDueDateStatus,
  getDueDateColor,
  formatDueDate,
} from '@/lib/due-date-utils';
import type { User } from '@/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { resolveAvatarUrl } from '@/lib/utils';

// ── Collapsible Section ───────────────────────────────────────────────
function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
      >
        {icon}
        <span className="flex-1 text-left">{title}</span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="pl-1">{children}</div>}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────
export function CardModal() {
  const { id, isOpen, onClose } = useCardModal();
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Comments ──────────────────────────────────────────────────────
  const { data: comments = [] } = useComments(id);
  const createComment = useCreateCommentMutation(id);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const handleCreateComment = useCallback(
    ({
      content,
      mentionedUserIds,
    }: {
      content: string;
      mentionedUserIds: string[];
    }) => {
      setIsPostingComment(true);
      createComment.mutate({ content, mentionedUserIds }, {
        onSuccess: () => {
          setIsPostingComment(false);
          // Scroll feed to bottom
          requestAnimationFrame(() => {
            feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
          });
        },
        onError: () => {
          setIsPostingComment(false);
        }
      });
    },
    [createComment]
  );

  // ── Checklist popover ─────────────────────────────────────────────
  const [checklistPopoverOpen, setChecklistPopoverOpen] = useState(false);
  const [checklistName, setChecklistName] = useState('Checklist');
  const addChecklist = useAddChecklistMutation(id ?? undefined);

  // ── Due date popover ──────────────────────────────────────────────
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  // ── Attachment upload ─────────────────────────────────────────────
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Board context ─────────────────────────────────────────────────
  const boardCtx = useBoardSafe();
  const lists = boardCtx?.lists ?? [];
  const setLists = boardCtx?.setLists;

  const currentCard = lists.flatMap((l) => l.cards).find((c) => c.id === id);
  const currentList = lists.find((l) => l.cards.some((c) => c.id === id));
  const currentBoardId = boardCtx?.boardId || currentCard?.boardId || currentList?.boardId;
  const { data: boardMembers = [] } = useGetBoardMembers(currentBoardId || '');
  const assignMemberMutation = useAssignMember(id || '', currentBoardId || '');
  const unassignMemberMutation = useUnassignMember(id || '');
  const updateCardApi = useUpdateCard();
  const deleteCardApi = useDeleteCard();

  const memberNames = useMemo(
    () =>
      new Set(
        boardMembers
          .map((member) => member.username || member.name)
          .filter(Boolean) as string[],
      ),
    [boardMembers]
  );
  const highlightedCommentId = searchParams.get('commentId');

  const assignedMembers = currentCard?.members?.length
    ? currentCard.members
    : currentCard?.assignee
      ? [currentCard.assignee]
      : [];

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('cardId');
      params.delete('commentId');
      params.delete('focus');

      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(nextUrl, { scroll: false });
      onClose();
    }
  };

  const updateCard = useCallback(
    (updates: {
      deadline?: string | null;
      isArchived?: boolean;
      title?: string;
      description?: string;
      assigneeId?: string | null;
      assignee?: User | null;
      attachments?: {
        id: string;
        fileUrl: string;
        fileName: string;
        fileType: string;
        createdAt: string;
      }[];
    }) => {
      if (!id) return;

      // Update DB
      if ('deadline' in updates || 'isArchived' in updates || 'title' in updates || 'description' in updates || 'assigneeId' in updates) {
        // Strip out 'assignee' object when sending to backend
        const { assignee, ...payload } = updates;
        updateCardApi.mutate({ id, payload: payload as any });
      }

      // Optimistic update (only when board context is available)
      if (setLists) {
        setLists((prev) =>
          prev.map((list) => ({
            ...list,
            cards: list.cards.map((card) =>
              card.id === id ? { ...card, ...updates } : card
            ),
          }))
        );
      }
    },
    [id, setLists, updateCardApi]
  );

  const toggleMember = useCallback((selectedUser: User) => {
    if (!id || !currentBoardId) return;

    const isAssigned = assignedMembers.some((member) => member.id === selectedUser.id);

    if (setLists) {
      setLists((prev) =>
        prev.map((list) => ({
          ...list,
          cards: list.cards.map((card) => {
            if (card.id !== id) return card;

            const currentMembers = card.members || [];
            if (isAssigned) {
              return {
                ...card,
                members: currentMembers.filter((member) => member.id !== selectedUser.id),
              };
            }

            const exists = currentMembers.some((member) => member.id === selectedUser.id);
            return exists
              ? card
              : { ...card, members: [...currentMembers, selectedUser] };
          }),
        }))
      );
    }

    if (isAssigned) {
      unassignMemberMutation.mutate({ cardId: id, userId: selectedUser.id });
    } else {
      assignMemberMutation.mutate({ cardId: id, userId: selectedUser.id });
    }
  }, [id, currentBoardId, assignedMembers, assignMemberMutation, unassignMemberMutation, setLists]);

  const handleAddChecklist = useCallback(() => {
    const name = checklistName.trim();
    if (!name) return;
    addChecklist.mutate(name);
    setChecklistName('Checklist');
    setChecklistPopoverOpen(false);
  }, [checklistName, addChecklist]);

  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      updateCard({ deadline: date.toISOString() });
      setDatePopoverOpen(false);
    },
    [updateCard]
  );

  const handleRemoveDate = useCallback(() => {
    updateCard({ deadline: null });
    setDatePopoverOpen(false);
  }, [updateCard]);

  const handleAttachmentUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !currentCard || !id) return;
      setIsUploading(true);
      try {
        const newAttachment = await attachmentsApi.upload(id, file);
        const existingAttachments = currentCard.attachments || [];
        updateCard({ attachments: [...existingAttachments, newAttachment] });
      } catch (error) {
        console.error('Failed to upload attachment:', error);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [currentCard, updateCard, id]
  );

  const handleDeleteAttachment = useCallback(
    async (attachmentId: string) => {
      if (!currentCard?.attachments) return;

      // Optimistic update
      const prevAttachments = currentCard.attachments;
      updateCard({
        attachments: currentCard.attachments.filter(
          (a) => a.id !== attachmentId
        ),
      });

      try {
        await attachmentsApi.delete(attachmentId);
      } catch (error) {
        // Rollback
        updateCard({ attachments: prevAttachments });
      }
    },
    [currentCard, updateCard]
  );

  const handleDeleteCard = useCallback(() => {
    if (!id || !setLists) return;
    deleteCardApi.mutate(id);
    setLists((prev) =>
      prev.map((list) => ({
        ...list,
        cards: list.cards.filter((card) => card.id !== id),
      }))
    );
    onClose();
  }, [id, setLists, deleteCardApi, onClose]);

  const dueDateStatus = getDueDateStatus(
    currentCard?.deadline || undefined,
    false
  );
  const dueDateColor = getDueDateColor(dueDateStatus);
  const selectedDate = currentCard?.deadline
    ? new Date(currentCard.deadline)
    : undefined;

  const cardTitle = currentCard?.title || 'Card';

  // Local state for title / description to handle forms smoothly
  const [descValue, setDescValue] = useState(currentCard?.description || '');
  const [titleValue, setTitleValue] = useState(cardTitle);

  // Sync state when opening different cards
  useEffect(() => {
    setTitleValue(currentCard?.title || 'Card');
    setDescValue(currentCard?.description || '');
  }, [currentCard?.id, currentCard?.title, currentCard?.description]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {/* Wide modal — 5xl (~1024px) */}
      <DialogContent className="sm:max-w-5xl p-0 gap-0 overflow-hidden">
        {/* ── 3-Zone grid ─────────────────────────────────────────── */}
        <div className="flex h-[85vh] min-h-0">

          {/* ═══════════════════════════════════════════════════════
              ZONE 1 — LEFT: Content (title, desc, checklists, attachments)
          ═══════════════════════════════════════════════════════ */}
          <div className="flex flex-1 min-w-0 flex-col overflow-y-auto p-6 gap-5">
            {/* Title */}
            <div className="space-y-1">
              <Input
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                className="text-xl font-bold tracking-tight leading-tight border-none px-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <p className="text-xs text-muted-foreground pl-1">In list: <span className="font-medium text-foreground">{currentList?.title}</span></p>
            </div>

            {/* Description */}
            <div className="space-y-1.5 pl-1">
              <label className="text-sm font-semibold">Description</label>
              <Textarea
                placeholder="Add a detailed description…"
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                className="min-h-[100px] resize-none text-sm"
              />

              {/* Save / Cancel edits for Title & Description */}
              {(titleValue !== (currentCard?.title || 'Card') || descValue !== (currentCard?.description || '')) && (
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const newTitle = titleValue.trim() || currentCard?.title || 'Card';
                      updateCard({ title: newTitle, description: descValue });
                      setTitleValue(newTitle);
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setTitleValue(currentCard?.title || 'Card');
                      setDescValue(currentCard?.description || '');
                      onClose();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Checklists — collapsible */}
            <CollapsibleSection
              title="Checklists"
              icon={<CheckSquare className="h-4 w-4" />}
              defaultOpen={false}
            >
              <ChecklistsContainer />
            </CollapsibleSection>

            {/* Attachments — collapsible */}
            {currentCard?.attachments && currentCard.attachments.length > 0 && (
              <CollapsibleSection
                title={`Attachments (${currentCard.attachments.length})`}
                icon={<Paperclip className="h-4 w-4" />}
                defaultOpen={false}
              >
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {currentCard.attachments.map((attachment) => {
                    const isImage = attachment.fileType.includes('image');
                    const fileUrl = attachment.fileUrl.startsWith('http')
                      ? attachment.fileUrl
                      : `${BASE_URL}${attachment.fileUrl}`;
                    const addedDate = new Date(
                      attachment.createdAt
                    ).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    return (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 rounded-md border p-2 hover:bg-muted/50 transition-colors group"
                      >
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-muted"
                        >
                          {isImage ? (
                            <img
                              src={fileUrl}
                              alt={attachment.fileName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FileIcon className="h-6 w-6 text-muted-foreground" />
                          )}
                        </a>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium">
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Added {addedDate}
                          </p>
                          <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs underline text-muted-foreground hover:text-foreground"
                            >
                              Download
                            </a>
                            <span className="text-muted-foreground text-xs">·</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteAttachment(attachment.id)
                              }
                              className="text-xs underline text-muted-foreground hover:text-destructive"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleSection>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════
              ZONE 2 — MIDDLE: Actions & metadata chips
          ═══════════════════════════════════════════════════════ */}
          <div className="flex w-44 shrink-0 flex-col gap-3 border-l border-r bg-muted/30 px-3 py-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Actions
            </p>

            {/* Members */}
            <div className="space-y-1.5">
              <CardMemberPicker
                boardId={currentBoardId}
                assignedMembers={assignedMembers}
                onToggleMember={toggleMember}
                isPending={assignMemberMutation.isPending || unassignMemberMutation.isPending}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start text-xs"
                >
                  <Users className="mr-1.5 h-3.5 w-3.5" />
                  Thêm
                </Button>
              </CardMemberPicker>
              {assignedMembers.length > 0 && (
                <TooltipProvider delayDuration={200}>
                  <div className="flex flex-wrap gap-1 pl-1">
                    {assignedMembers.map((m) => (
                      <Tooltip key={m.id}>
                        <TooltipTrigger asChild>
                          <Avatar className="h-6 w-6 ring-2 ring-background cursor-pointer hover:scale-110 transition-transform">
                            <AvatarImage src={resolveAvatarUrl(m.avatarUrl)} alt={m.name || m.username} />
                            <AvatarFallback className="text-[9px] font-medium bg-primary/10 text-primary">
                              {(m.name || m.username || 'Un').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          {m.name || m.username}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              )}
            </div>

            {/* Labels */}
            <div className="space-y-1.5">
              <LabelPicker />
              {currentCard?.labels && currentCard.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 pl-1">
                  {currentCard.labels.map((label) => (
                    <Badge
                      key={label.id}
                      className="h-4 rounded-sm px-1.5 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: label.colorCode }}
                    >
                      {label.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-start text-xs"
                  >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    Dates
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" side="bottom" className="w-auto space-y-2 p-3">
                  <p className="text-center text-sm font-medium">Due Date</p>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                  {currentCard?.deadline && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={handleRemoveDate}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove due date
                    </Button>
                  )}
                </PopoverContent>
              </Popover>

              {currentCard?.deadline && (
                <div className="pl-1 flex items-center gap-1">
                  <Badge
                    className={cn(
                      'h-5 gap-1 rounded-md border px-1.5 text-[10px] font-medium',
                      dueDateColor
                    )}
                  >
                    <Clock className="h-2.5 w-2.5" />
                    {formatDueDate(currentCard.deadline)}
                  </Badge>
                </div>
              )}
            </div>

            {/* Checklist */}
            <Popover
              open={checklistPopoverOpen}
              onOpenChange={setChecklistPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start text-xs"
                >
                  <CheckSquare className="mr-1.5 h-3.5 w-3.5" />
                  Checklist
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" side="bottom" className="w-60 space-y-3 p-3">
                <p className="text-center text-sm font-medium">Add Checklist</p>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Title
                  </label>
                  <Input
                    value={checklistName}
                    onChange={(e) => setChecklistName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklist();
                      }
                    }}
                    autoFocus
                    className="h-8 text-sm"
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleAddChecklist}
                  disabled={!checklistName.trim()}
                >
                  Add
                </Button>
              </PopoverContent>
            </Popover>

            {/* Attachment */}
            <div>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                )}
                Attachment
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAttachmentUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-start text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDeleteCard}
            >
              <Trash className="mr-1.5 h-3.5 w-3.5" />
              Delete card
            </Button>
          </div>

          {/* ═══════════════════════════════════════════════════════
              ZONE 3 — RIGHT: Activity (scrollable feed + sticky input)
          ═══════════════════════════════════════════════════════ */}
          <div className="flex w-72 shrink-0 flex-col border-none">
            {/* Header */}
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Activity</h3>
              <Badge variant="secondary" className="text-[10px] h-5">
                {comments.length}
              </Badge>
            </div>

            {/* Scrollable comment feed */}
            <div
              ref={feedRef}
              className="flex-1 overflow-y-auto px-4 py-3"
            >
              <CommentList
                comments={comments}
                memberNames={memberNames}
                highlightedCommentId={highlightedCommentId}
              />
            </div>

            {/* Sticky comment input */}
            <div className="border-t bg-background px-4 py-3 space-y-2">
              <div className="flex items-start gap-2">
                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                  <AvatarImage src={resolveAvatarUrl(user?.avatarUrl)} alt={user?.username || 'Me'} />
                  <AvatarFallback className="bg-primary/10 text-[9px] font-semibold text-primary">
                    {(user?.username || 'Me').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CommentEditor
                    members={boardMembers}
                    onSave={handleCreateComment}
                    isLoading={isPostingComment}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
