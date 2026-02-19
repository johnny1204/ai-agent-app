'use client';

import { BOOK_STATUSES, type BookStatus } from '@/lib/types';

type TagFilterProps = {
    tags: string[];
    selectedTag: string | null;
    selectedStatus: BookStatus | null;
    onTagChange: (tag: string | null) => void;
    onStatusChange: (status: BookStatus | null) => void;
};

export function TagFilter({ tags, selectedTag, selectedStatus, onTagChange, onStatusChange }: TagFilterProps) {
    const statuses = Object.entries(BOOK_STATUSES) as [BookStatus, string][];

    return (
        <div className="space-y-3">
            {/* ステータスフィルタ */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => onStatusChange(null)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${selectedStatus === null
                            ? 'bg-stone-800 text-white dark:bg-white dark:text-stone-900'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700'
                        }`}
                >
                    全て
                </button>
                {statuses.map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => onStatusChange(selectedStatus === key ? null : key)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${selectedStatus === key
                                ? 'bg-stone-800 text-white dark:bg-white dark:text-stone-900'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* タグフィルタ */}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => onTagChange(selectedTag === tag ? null : tag)}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${selectedTag === tag
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400 dark:hover:bg-indigo-900'
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
