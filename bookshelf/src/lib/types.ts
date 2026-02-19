// ステータス定義
export const BOOK_STATUSES = {
    unread: '積読',
    reading: '読書中',
    finished: '読了',
    practicing: '実践中',
} as const;

export type BookStatus = keyof typeof BOOK_STATUSES;

// メモカテゴリ定義
export const MEMO_CATEGORIES = {
    claim: { label: '著者の主張', icon: '📖' },
    insight: { label: '自分の洞察', icon: '💡' },
    action: { label: '具体アクション', icon: '🎯' },
} as const;

export type MemoCategory = keyof typeof MEMO_CATEGORIES;

// DB テーブル型
export type Book = {
    id: number;
    title: string;
    author: string;
    isbn: string | null;
    cover_url: string | null;
    status: BookStatus;
    is_public: number; // 0 or 1
    created_at: string;
    updated_at: string;
};

export type Memo = {
    id: number;
    book_id: number;
    category: MemoCategory;
    content: string;
    is_public: number;
    created_at: string;
    updated_at: string;
};

export type Tag = {
    id: number;
    name: string;
    created_at: string;
};

// API レスポンス型
export type BookWithTags = Book & {
    tags: string[];
};

export type BookDetail = Book & {
    tags: string[];
    memos: Memo[];
};

// API リクエスト型
export type CreateBookInput = {
    title: string;
    author: string;
    isbn?: string;
    cover_url?: string;
    status?: BookStatus;
    is_public?: boolean;
    tags?: string[];
};

export type UpdateBookInput = Partial<CreateBookInput>;

export type CreateMemoInput = {
    book_id: number;
    category: MemoCategory;
    content: string;
    is_public?: boolean;
};
