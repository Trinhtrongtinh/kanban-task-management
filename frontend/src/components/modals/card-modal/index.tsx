'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { useCardModal } from '@/hooks/use-card-modal';
import { useBoardSafe } from '@/components/board/board-context';
import { useAddChecklistMutation } from '@/api/checklists';
import { ChecklistsContainer } from './checklists-container';
import { CardMemberPicker } from './card-member-picker';
import { LabelPicker } from './label-picker';
import {
  Users,
  Calendar as CalendarIcon,
  Paperclip,
  CheckSquare,
  X,
  Clock,
  Loader2,
  FileIcon,
} from 'lucide-react';
import {
  getDueDateStatus,
  getDueDateColor,
  formatDueDate,
} from '@/lib/due-date-utils';
import type { User } from '@/types';

export function CardModal() {
  const { id, isOpen, onClose } = useCardModal();
  const [assignedMembers, setAssignedMembers] = useState<User[]>([]);

  // Checklist popover state
  const [checklistPopoverOpen, setChecklistPopoverOpen] = useState(false);
  const [checklistName, setChecklistName] = useState('Checklist');
  const addChecklist = useAddChecklistMutation(id ?? undefined);

  // Due date popover state
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  // Attachment upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Access board context to update card data (safe — may be null outside board pages)
  const boardCtx = useBoardSafe();
  const lists = boardCtx?.lists ?? [];
  const setLists = boardCtx?.setLists;

  // Get the current card from lists
  const currentCard = lists
    .flatMap((l) => l.cards)
    .find((c) => c.id === id);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setAssignedMembers([]);
    }
  };

  const toggleMember = useCallback((user: User) => {
    setAssignedMembers((prev) => {
      const exists = prev.some((m) => m.id === user.id);
      if (exists) return prev.filter((m) => m.id !== user.id);
      return [...prev, user];
    });
  }, []);

  const handleAddChecklist = useCallback(() => {
    const name = checklistName.trim();
    if (!name) return;
    addChecklist.mutate(name);
    setChecklistName('Checklist');
    setChecklistPopoverOpen(false);
  }, [checklistName, addChecklist]);

  const handleChecklistKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddChecklist();
    }
  };

  // Due date: optimistically update the card in the board lists
  const updateCard = useCallback(
    (updates: { 
      dueDate?: string; 
      isCompleted?: boolean;
      attachments?: { id: string; url: string; fileName: string; type: string; createdAt: string; }[];
    }) => {
      if (!id || !setLists) return;
      setLists((prev) =>
        prev.map((list) => ({
          ...list,
          cards: list.cards.map((card) =>
            card.id === id ? { ...card, ...updates } : card
          ),
        }))
      );
    },
    [id, setLists]
  );

  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      updateCard({ dueDate: date.toISOString() });
      setDatePopoverOpen(false);
    },
    [updateCard]
  );

  const handleToggleCompleted = useCallback(() => {
    updateCard({ isCompleted: !currentCard?.isCompleted });
  }, [updateCard, currentCard?.isCompleted]);

  const handleRemoveDate = useCallback(() => {
    updateCard({ dueDate: undefined, isCompleted: false });
    setDatePopoverOpen(false);
  }, [updateCard]);

  // Handle mock file upload
  const handleAttachmentUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !currentCard) return;

      setIsUploading(true);

      // Mock upload delay
      setTimeout(() => {
        const newAttachment = {
          id: `att-${Date.now()}`,
          url: URL.createObjectURL(file), // create local preview
          fileName: file.name,
          type: file.type,
          createdAt: new Date().toISOString(),
        };

        const existingAttachments = currentCard.attachments || [];
        updateCard({
          attachments: [...existingAttachments, newAttachment],
        });

        setIsUploading(false);
        // Reset input so the same file could be selected again if needed
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1000);
    },
    [currentCard, updateCard]
  );

  const handleDeleteAttachment = useCallback(
    (attachmentId: string) => {
      if (!currentCard?.attachments) return;
      const updated = currentCard.attachments.filter(
        (a) => a.id !== attachmentId
      );
      updateCard({ attachments: updated });
    },
    [currentCard, updateCard]
  );

  const dueDateStatus = getDueDateStatus(
    currentCard?.dueDate,
    currentCard?.isCompleted
  );
  const dueDateColor = getDueDateColor(dueDateStatus);

  const cardTitle = id ? `Card ${id}` : 'Card';
  const selectedDate = currentCard?.dueDate
    ? new Date(currentCard.dueDate)
    : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-4">
          {/* ── Main column ───────────────────────────────── */}
          <div className="space-y-4 md:col-span-3">
            <DialogHeader>
              <DialogTitle>{cardTitle}</DialogTitle>
              <DialogDescription>In list: To Do</DialogDescription>
            </DialogHeader>

            {/* Labels and Members Wrapper */}
            <div className="flex flex-wrap gap-5">
              {/* Assigned members avatars */}
              {assignedMembers.length > 0 && (
                <div className="space-y-1.5 min-w-0">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Members
                  </h3>
                  <TooltipProvider delayDuration={200}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {assignedMembers.map((member) => (
                        <Tooltip key={member.id}>
                          <TooltipTrigger asChild>
                            <Avatar className="h-8 w-8 ring-2 ring-background transition-transform hover:scale-110">
                              <AvatarImage
                                src={member.avatarUrl}
                                alt={member.name}
                              />
                              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
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
                </div>
              )}

              {/* Labels Display */}
              {currentCard?.labels && currentCard.labels.length > 0 && (
                <div className="space-y-1.5 min-w-0">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Labels
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {currentCard.labels.map((label) => (
                      <Badge 
                        key={label.id}
                        className="rounded-sm font-semibold shrink-0 text-white hover:opacity-80 transition"
                        style={{ backgroundColor: label.color }}
                      >
                        {label.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Due Date display */}
            {currentCard?.dueDate && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Due Date
                </h3>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={currentCard.isCompleted ?? false}
                    onCheckedChange={handleToggleCompleted}
                  />
                  <Badge
                    className={`gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${dueDateColor}`}
                  >
                    <Clock className="h-3 w-3" />
                    {formatDueDate(currentCard.dueDate)}
                    {dueDateStatus === 'completed' && (
                      <span className="ml-0.5 text-[10px] font-semibold uppercase">
                        Complete
                      </span>
                    )}
                    {dueDateStatus === 'overdue' && (
                      <span className="ml-0.5 text-[10px] font-semibold uppercase">
                        Overdue
                      </span>
                    )}
                    {dueDateStatus === 'due-soon' && (
                      <span className="ml-0.5 text-[10px] font-semibold uppercase">
                        Due soon
                      </span>
                    )}
                  </Badge>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Add a more detailed description..."
                className="mt-2 min-h-[120px]"
              />
            </div>

            {/* Attachments Section */}
            {currentCard?.attachments && currentCard.attachments.length > 0 && (
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  <h3 className="text-base font-semibold">Attachments</h3>
                </div>
                <div className="space-y-3 pl-7 max-h-[180px] overflow-y-auto custom-scrollbar pr-2">
                  {currentCard.attachments.map((attachment) => {
                    const isImage = attachment.type.includes('image');
                    const addedDate = new Date(attachment.createdAt).toLocaleDateString(undefined, { 
                      month: 'short', day: 'numeric', year: 'numeric', 
                      hour: 'numeric', minute: '2-digit' 
                    });

                    return (
                      <div key={attachment.id} className="flex flex-row items-center gap-4 hover:bg-muted/50 p-2 rounded-md transition-colors group">
                        {/* Thumbnail */}
                        <a 
                          href={attachment.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex h-16 w-[112px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted hover:opacity-80 transition-opacity"
                        >
                          {isImage ? (
                            <img
                              src={attachment.url}
                              alt={attachment.fileName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FileIcon className="h-8 w-8 text-muted-foreground" />
                          )}
                        </a>

                        {/* Details */}
                        <div className="flex flex-col gap-1 overflow-hidden">
                          <p className="truncate text-sm font-medium leading-none">
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Added {addedDate}
                          </p>
                          <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a 
                              href={attachment.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xs underline hover:text-foreground text-muted-foreground"
                            >
                              Download
                            </a>
                            <span className="text-muted-foreground text-xs">•</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(attachment.id)}
                              className="text-xs underline hover:text-destructive text-muted-foreground"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Checklists */}
            <ChecklistsContainer />

            <div>
              <h3 className="text-sm font-medium">Activity</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                No activity yet.
              </p>
            </div>
          </div>

          {/* ── Sidebar ───────────────────────────────────── */}
          <div className="flex flex-col gap-2 md:col-span-1">
            <CardMemberPicker
              assignedMembers={assignedMembers}
              onToggleMember={toggleMember}
            >
              <Button variant="secondary" className="w-full justify-start mt-4">
                <Users className="mr-2 h-4 w-4" />
                Members
              </Button>
            </CardMemberPicker>

            <LabelPicker />

            {/* Checklist — Popover to name & create */}
            <Popover
              open={checklistPopoverOpen}
              onOpenChange={setChecklistPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button variant="secondary" className="w-full justify-start">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Checklist
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                side="bottom"
                className="w-64 space-y-3 p-3"
              >
                <p className="text-center text-sm font-medium">
                  Add Checklist
                </p>
                <div className="space-y-1.5">
                  <label
                    htmlFor="checklist-name"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Title
                  </label>
                  <Input
                    id="checklist-name"
                    value={checklistName}
                    onChange={(e) => setChecklistName(e.target.value)}
                    onKeyDown={handleChecklistKeyDown}
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

            {/* Due Date — Calendar picker */}
            <Popover
              open={datePopoverOpen}
              onOpenChange={setDatePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button variant="secondary" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Dates
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                side="bottom"
                className="w-auto space-y-2 p-3"
              >
                <p className="text-center text-sm font-medium">Due Date</p>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
                {currentCard?.dueDate && (
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

            <div className="w-full">
              <Button 
                variant="secondary" 
                className="w-full justify-start"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="mr-2 h-4 w-4" />
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
