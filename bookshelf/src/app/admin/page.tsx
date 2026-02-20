'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import type { BookWithTags, BookStatus } from '@/lib/types';
import { BOOK_STATUSES } from '@/lib/types';

export default function AdminPage() {
    const [books, setBooks] = useState<BookWithTags[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const res = await fetch('/bookshelf/api/books?all=1');
            if (!res.ok) {
                console.warn('API not available:', res.status);
                return;
            }
            const data = await res.json();
            setBooks(data);
        } catch (error) {
            console.error('Failed to fetch books:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBooks(); }, []);

    const handleDelete = async (id: number, title: string) => {
        if (!confirm(`「${title}」を削除しますか？`)) return;
        try {
            await fetch(`/bookshelf/api/books/${id}`, { method: 'DELETE' });
            fetchBooks();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">📚 管理画面</h2>
                <Link
                    href="/admin/new"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                    + 書籍を登録
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-800" />
                </div>
            ) : books.length === 0 ? (
                <div className="py-12 text-center">
                    <p className="text-stone-500">書籍が登録されていません</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900">
                            <tr>
                                <th className="px-4 py-3 font-medium text-stone-600 dark:text-stone-400">タイトル</th>
                                <th className="px-4 py-3 font-medium text-stone-600 dark:text-stone-400">著者</th>
                                <th className="px-4 py-3 font-medium text-stone-600 dark:text-stone-400">ステータス</th>
                                <th className="px-4 py-3 font-medium text-stone-600 dark:text-stone-400">公開</th>
                                <th className="px-4 py-3 font-medium text-stone-600 dark:text-stone-400">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                            {books.map((book) => (
                                <tr key={book.id} className="bg-white dark:bg-stone-950">
                                    <td className="px-4 py-3 font-medium text-stone-800 dark:text-stone-200">{book.title}</td>
                                    <td className="px-4 py-3 text-stone-500 dark:text-stone-400">{book.author}</td>
                                    <td className="px-4 py-3"><StatusBadge status={book.status as BookStatus} /></td>
                                    <td className="px-4 py-3 text-stone-500">{book.is_public ? '✅' : '—'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/admin/edit?id=${book.id}`}
                                                className="rounded bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300"
                                            >
                                                編集
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(book.id, book.title)}
                                                className="rounded bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400"
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Link href="/" className="inline-block text-sm text-stone-500 hover:text-stone-800">
                ← 公開ページへ
            </Link>
        </div>
    );
}
