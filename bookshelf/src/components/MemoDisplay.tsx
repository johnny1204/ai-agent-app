import { MEMO_CATEGORIES, type Memo, type MemoCategory } from '@/lib/types';

type MemoDisplayProps = {
    memos: Memo[];
};

export function MemoDisplay({ memos }: MemoDisplayProps) {
    const categories: MemoCategory[] = ['claim', 'insight', 'action'];

    const grouped = categories.reduce(
        (acc, cat) => {
            acc[cat] = memos.filter((m) => m.category === cat);
            return acc;
        },
        {} as Record<MemoCategory, Memo[]>
    );

    const hasAnyMemos = memos.length > 0;

    if (!hasAnyMemos) {
        return (
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-8 text-center dark:border-stone-800 dark:bg-stone-900">
                <p className="text-sm text-stone-400 dark:text-stone-500">メモはまだありません</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {categories.map((cat) => {
                const catMemos = grouped[cat];
                if (catMemos.length === 0) return null;

                const { label, icon } = MEMO_CATEGORIES[cat];

                return (
                    <section key={cat} className="space-y-3">
                        <h3 className="flex items-center gap-2 text-base font-bold text-stone-700 dark:text-stone-200">
                            <span className="text-lg">{icon}</span>
                            {label}
                            <span className="ml-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                                {catMemos.length}
                            </span>
                        </h3>
                        <div className="space-y-2 pl-7">
                            {catMemos.map((memo) => (
                                <div
                                    key={memo.id}
                                    className="rounded-lg border-l-2 border-stone-300 bg-white py-3 px-4 text-sm leading-relaxed text-stone-700 shadow-sm dark:border-stone-600 dark:bg-stone-850 dark:text-stone-300"
                                >
                                    {memo.content}
                                </div>
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
