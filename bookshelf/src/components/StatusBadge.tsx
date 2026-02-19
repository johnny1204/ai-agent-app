import { BOOK_STATUSES, type BookStatus } from '@/lib/types';

const statusColors: Record<BookStatus, string> = {
    unread: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
    reading: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    finished: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    practicing: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

type StatusBadgeProps = {
    status: BookStatus;
    className?: string;
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status]} ${className}`}
        >
            {BOOK_STATUSES[status]}
        </span>
    );
}
