'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { MemoDisplay } from '@/components/MemoDisplay';
import type { BookDetail, BookStatus } from '@/lib/types';

function BookContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [book, setBook] = useState<BookDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setError('書籍IDが指定されていません');
            setLoading(false);
            return;
        }

        async function fetchBook() {
            try {
                const res = await fetch(`/bookshelf/api/books/${id}`);
                if (!res.ok) {
                    setError('書籍が見つかりません');
                    return;
                }
                const data: BookDetail = await res.json();
                setBook(data);
            } catch {
                setError('データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        }
        fetchBook();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-800 dark:border-stone-700 dark:border-t-stone-200" />
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="py-20 text-center">
                <p className="text-stone-500">{error || '書籍が見つかりません'}</p>
                <Link href="/" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
                    本棚に戻る
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
                </svg>
                本棚に戻る
            </Link>

            <div className="flex flex-col gap-8 sm:flex-row">
                <div className="w-full shrink-0 sm:w-48">
                    <div className="aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 shadow-md dark:from-stone-800 dark:to-stone-700">
                        {book.cover_url ? (
                            <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center p-6">
                                <span className="text-center text-xl font-bold leading-snug text-stone-400 dark:text-stone-500">{book.title}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-1 flex-col gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-stone-800 dark:text-stone-100">{book.title}</h2>
                        <p className="mt-1 text-base text-stone-500 dark:text-stone-400">{book.author}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge status={book.status as BookStatus} />
                        {book.isbn && <span className="text-xs text-stone-400 dark:text-stone-500">ISBN: {book.isbn}</span>}
                    </div>
                    {book.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {book.tags.map((tag) => (
                                <span key={tag} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <section className="space-y-4">
                <h3 className="text-lg font-bold text-stone-700 dark:text-stone-200">読書メモ</h3>
                <MemoDisplay memos={book.memos} />
            </section>
        </div>
    );
}

export default function BookPage() {
    return (
        <Suspense
            fallback={
                <div className="flex justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-800 dark:border-stone-700 dark:border-t-stone-200" />
                </div>
            }
        >
            <BookContent />
        </Suspense>
    );
}
