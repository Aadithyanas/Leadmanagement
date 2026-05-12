import {
  formatDistanceToNow,
  isToday,
  isBefore,
  startOfDay,
  format,
  parseISO,
} from 'date-fns';

export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never';
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

export function isFollowUpToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  try {
    return isToday(parseISO(dateStr));
  } catch {
    return false;
  }
}

export function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  try {
    const date = parseISO(dateStr);
    return isBefore(date, startOfDay(new Date()));
  } catch {
    return false;
  }
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy h:mm a');
  } catch {
    return '—';
  }
}

export function formatDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
}
