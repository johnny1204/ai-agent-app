'use client';

import { useEffect, useState, useCallback } from 'react';
import { BookGrid } from '@/components/BookGrid';
import { TagFilter } from '@/components/TagFilter';
import type { BookWithTags, BookStatus } from '@/lib/types';

export default function HomePage() {
  const [books, setBooks] = useState<BookWithTags[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<BookStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus) params.set('status', selectedStatus);
      if (selectedTag) params.set('tag', selectedTag);

      const res = await fetch(`/bookshelf/api/books?${params.toString()}`);
      if (!res.ok) {
        console.warn('API not available:', res.status);
        return;
      }
      const data: BookWithTags[] = await res.json();
      setBooks(data);

      // 初回のみ全タグを収集
      if (allTags.length === 0 && data.length > 0) {
        const tags = [...new Set(data.flatMap((b) => b.tags))];
        setAllTags(tags);
      }
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedTag, allTags.length]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return (
    <div className="space-y-8">
      {/* ページタイトル */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-800 dark:text-stone-100">
          📚 本棚
        </h2>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          読んだ本とそこから得た学びの記録
        </p>
      </div>

      {/* フィルタ */}
      <TagFilter
        tags={allTags}
        selectedTag={selectedTag}
        selectedStatus={selectedStatus}
        onTagChange={setSelectedTag}
        onStatusChange={setSelectedStatus}
      />

      {/* 書籍グリッド */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-800 dark:border-stone-700 dark:border-t-stone-200" />
        </div>
      ) : (
        <BookGrid books={books} />
      )}
    </div>
  );
}
