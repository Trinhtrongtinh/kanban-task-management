import { format, isPast, differenceInHours } from 'date-fns';

export type DueDateStatus = 'completed' | 'overdue' | 'due-soon' | 'default';

export function getDueDateStatus(
  dueDate: string | undefined,
  isCompleted: boolean | undefined
): DueDateStatus {
  if (!dueDate) return 'default';
  if (isCompleted) return 'completed';

  const date = new Date(dueDate);
  const now = new Date();

  if (isPast(date)) return 'overdue';
  if (differenceInHours(date, now) <= 24) return 'due-soon';
  return 'default';
}

export function getDueDateColor(status: DueDateStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30';
    case 'overdue':
      return 'bg-red-500/15 text-red-700 border-red-500/30';
    case 'due-soon':
      return 'bg-amber-500/15 text-amber-700 border-amber-500/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export function formatDueDate(dueDate: string): string {
  return format(new Date(dueDate), 'MMM d \'at\' h:mm a');
}

export function formatDueDateShort(dueDate: string): string {
  return format(new Date(dueDate), 'MMM d');
}
