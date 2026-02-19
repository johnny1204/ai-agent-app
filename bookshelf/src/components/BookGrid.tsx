import { BookCard } from './BookCard';
import type { BookWithTags } from '@/lib/types';

type BookGridProps = {
    books: BookWithTags[];
};

export function BookGrid({ books }: BookGridProps) {
    if (books.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="mb-4 text-5xl">📚</span>
                <p className="text-lg font-medium text-stone-500 dark:text-stone-400">
                    まだ書籍が登録されていません
                </p>
                <p className="mt-1 text-sm text-stone-400 dark:text-stone-500">
                    管理画面から書籍を追加してください
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {books.map((book) => (
                <BookCard key={book.id} book={book} />
            ))}
        </div>
    );
}
