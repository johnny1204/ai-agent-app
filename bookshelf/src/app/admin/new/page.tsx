'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BOOK_STATUSES, type BookStatus } from '@/lib/types';

export default function NewBookPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: '',
        author: '',
        isbn: '',
        cover_url: '',
        status: 'unread' as BookStatus,
        is_public: false,
        tags: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.author) return;

        setSaving(true);
        try {
            const res = await fetch('/bookshelf/api/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    is_public: form.is_public,
                    tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
                }),
            });

            if (res.ok) {
                router.push('/admin');
            } else {
                alert('登録に失敗しました');
            }
        } catch {
            alert('通信エラーが発生しました');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">📖 書籍を登録</h2>
                <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-800">← 戻る</Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                {/* タイトル */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">タイトル *</label>
                    <input
                        type="text" required value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                    />
                </div>

                {/* 著者 */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">著者 *</label>
                    <input
                        type="text" required value={form.author}
                        onChange={(e) => setForm({ ...form, author: e.target.value })}
                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                    />
                </div>

                {/* ISBN */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">ISBN</label>
                    <input
                        type="text" value={form.isbn}
                        onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                    />
                </div>

                {/* 表紙 URL */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">表紙画像 URL</label>
                    <input
                        type="url" value={form.cover_url}
                        onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                    />
                </div>

                {/* ステータス */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">ステータス</label>
                    <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value as BookStatus })}
                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                    >
                        {Object.entries(BOOK_STATUSES).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>

                {/* タグ */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">タグ（カンマ区切り）</label>
                    <input
                        type="text" value={form.tags} placeholder="AI, Web, 設計"
                        onChange={(e) => setForm({ ...form, tags: e.target.value })}
                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                    />
                </div>

                {/* 公開設定 */}
                <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
                    <input
                        type="checkbox" checked={form.is_public}
                        onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                        className="rounded border-stone-300"
                    />
                    公開する
                </label>

                <button
                    type="submit" disabled={saving}
                    className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                    {saving ? '登録中...' : '登録する'}
                </button>
            </form>
        </div>
    );
}
