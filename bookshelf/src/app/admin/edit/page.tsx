'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BOOK_STATUSES, MEMO_CATEGORIES, type BookStatus, type BookDetail, type MemoCategory, type Memo } from '@/lib/types';

function EditContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');

    const [book, setBook] = useState<BookDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: '', author: '', isbn: '', cover_url: '',
        status: 'unread' as BookStatus, is_public: false, tags: '',
    });

    // メモ入力
    const [memoTab, setMemoTab] = useState<MemoCategory>('claim');
    const [memoContent, setMemoContent] = useState('');
    const [memoPublic, setMemoPublic] = useState(false);

    useEffect(() => {
        if (!id) return;
        async function fetchBook() {
            try {
                const res = await fetch(`/bookshelf/api/books/${id}?all=1`);
                if (!res.ok) { setLoading(false); return; }
                const data: BookDetail = await res.json();
                setBook(data);
                setForm({
                    title: data.title, author: data.author,
                    isbn: data.isbn || '', cover_url: data.cover_url || '',
                    status: data.status, is_public: !!data.is_public,
                    tags: data.tags.join(', '),
                });
            } catch { /* ignore */ } finally { setLoading(false); }
        }
        fetchBook();
    }, [id]);

    const handleSaveBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setSaving(true);
        try {
            const res = await fetch(`/bookshelf/api/books/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    is_public: form.is_public,
                    tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
                }),
            });
            if (res.ok) { alert('保存しました'); router.push('/admin'); }
            else alert('保存に失敗しました');
        } catch { alert('通信エラー'); } finally { setSaving(false); }
    };

    const handleAddMemo = async () => {
        if (!id || !memoContent.trim()) return;
        try {
            const res = await fetch('/bookshelf/api/memos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    book_id: Number(id), category: memoTab,
                    content: memoContent, is_public: memoPublic,
                }),
            });
            if (res.ok) {
                setMemoContent('');
                // リロード
                const bookRes = await fetch(`/bookshelf/api/books/${id}?all=1`);
                if (bookRes.ok) setBook(await bookRes.json());
            }
        } catch { alert('メモの追加に失敗しました'); }
    };

    const handleDeleteMemo = async (memoId: number) => {
        if (!confirm('このメモを削除しますか？')) return;
        try {
            await fetch(`/bookshelf/api/memos?id=${memoId}`, { method: 'DELETE' });
            const bookRes = await fetch(`/bookshelf/api/books/${id}?all=1`);
            if (bookRes.ok) setBook(await bookRes.json());
        } catch { alert('削除に失敗しました'); }
    };

    if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-800" /></div>;
    if (!book) return <div className="py-12 text-center"><p className="text-stone-500">書籍が見つかりません</p></div>;

    const inputClass = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200";

    return (
        <div className="mx-auto max-w-2xl space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">✏️ 書籍を編集</h2>
                <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-800">← 戻る</Link>
            </div>

            {/* 書籍情報フォーム */}
            <form onSubmit={handleSaveBook} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                <h3 className="text-base font-bold text-stone-700 dark:text-stone-200">書籍情報</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-stone-600 dark:text-stone-400">タイトル</label>
                        <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-stone-600 dark:text-stone-400">著者</label>
                        <input type="text" required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-stone-600 dark:text-stone-400">ISBN</label>
                        <input type="text" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-stone-600 dark:text-stone-400">ステータス</label>
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as BookStatus })} className={inputClass}>
                            {Object.entries(BOOK_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-stone-600 dark:text-stone-400">タグ（カンマ区切り）</label>
                    <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className={inputClass} />
                </div>
                <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
                    <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} className="rounded border-stone-300" />
                    公開する
                </label>
                <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                    {saving ? '保存中...' : '保存'}
                </button>
            </form>

            {/* メモ入力エリア */}
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                <h3 className="mb-4 text-base font-bold text-stone-700 dark:text-stone-200">📝 メモ</h3>

                {/* タブ */}
                <div className="mb-3 flex gap-1 rounded-lg bg-stone-100 p-1 dark:bg-stone-800">
                    {(Object.entries(MEMO_CATEGORIES) as [MemoCategory, { label: string; icon: string }][]).map(([key, { label, icon }]) => (
                        <button
                            key={key} type="button"
                            onClick={() => setMemoTab(key)}
                            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${memoTab === key ? 'bg-white text-stone-800 shadow-sm dark:bg-stone-700 dark:text-stone-100' : 'text-stone-500 hover:text-stone-700'
                                }`}
                        >
                            {icon} {label}
                        </button>
                    ))}
                </div>

                {/* テキストエリア */}
                <textarea
                    value={memoContent}
                    onChange={(e) => setMemoContent(e.target.value)}
                    placeholder={`${MEMO_CATEGORIES[memoTab].label}を記入...`}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                />

                <div className="mt-2 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
                        <input type="checkbox" checked={memoPublic} onChange={(e) => setMemoPublic(e.target.checked)} className="rounded border-stone-300" />
                        公開する
                    </label>
                    <button onClick={handleAddMemo} disabled={!memoContent.trim()}
                        className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                        追加
                    </button>
                </div>

                {/* 既存メモ一覧 */}
                {book.memos.length > 0 && (
                    <div className="mt-6 space-y-3">
                        <h4 className="text-xs font-medium text-stone-500">登録済みメモ</h4>
                        {book.memos.map((memo: Memo) => (
                            <div key={memo.id} className="flex items-start gap-2 rounded-lg border border-stone-100 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
                                <span className="text-sm">{MEMO_CATEGORIES[memo.category]?.icon}</span>
                                <p className="flex-1 text-xs leading-relaxed text-stone-700 dark:text-stone-300">{memo.content}</p>
                                <button onClick={() => handleDeleteMemo(memo.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function EditBookPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-800" /></div>}>
            <EditContent />
        </Suspense>
    );
}
