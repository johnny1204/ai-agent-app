import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import type { BookWithTags } from '@/lib/types';

type BookCardProps = {
    book: BookWithTags;
};

export function BookCard({ book }: BookCardProps) {
    const maxTags = 3;
    const displayTags = book.tags.slice(0, maxTags);
    const remainingTags = book.tags.length - maxTags;

    return (
        <Link href={`/book?id=${book.id}`} className="group block">
            <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 dark:border-stone-800 dark:bg-stone-900">
                {/* カバー画像 or プレースホルダー */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-700">
                    {book.cover_url ? (
                        <img
                            src={book.cover_url}
                            alt={book.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center p-4">
                            <span className="text-center text-lg font-bold leading-snug text-stone-400 dark:text-stone-500">
                                {book.title}
                            </span>
                        </div>
                    )}
                    <div className="absolute top-3 right-3">
                        <StatusBadge status={book.status} />
                    </div>
                </div>

                {/* 情報 */}
                <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="text-sm font-bold leading-snug text-stone-800 line-clamp-2 dark:text-stone-100">
                        {book.title}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{book.author}</p>

                    {/* タグ */}
                    {displayTags.length > 0 && (
                        <div className="mt-auto flex flex-wrap gap-1 pt-2">
                            {displayTags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                                >
                                    {tag}
                                </span>
                            ))}
                            {remainingTags > 0 && (
                                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                                    +{remainingTags}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </article>
        </Link>
    );
}
