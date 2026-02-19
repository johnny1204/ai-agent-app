import Link from 'next/link';

export function Header() {
    return (
        <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-lg dark:border-stone-800 dark:bg-stone-950/80">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
                    <span className="text-2xl">📚</span>
                    <h1 className="text-lg font-bold tracking-tight text-stone-800 dark:text-stone-100">
                        Reading Memo Bookshelf
                    </h1>
                </Link>
            </div>
        </header>
    );
}
