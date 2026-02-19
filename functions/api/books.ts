type BookStatus = 'unread' | 'reading' | 'finished' | 'practicing';

interface Env {
    DB: D1Database;
}

// GET /api/books — 書籍一覧
// POST /api/books — 書籍登録
export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const db = env.DB;

    if (request.method === 'GET') {
        return handleGetBooks(request, db);
    } else if (request.method === 'POST') {
        return handleCreateBook(request, db);
    }

    return new Response('Method not allowed', { status: 405 });
};

async function handleGetBooks(request: Request, db: D1Database) {
    try {
        const url = new URL(request.url);
        const status = url.searchParams.get('status') as BookStatus | null;
        const tag = url.searchParams.get('tag');
        const showAll = url.searchParams.get('all') === '1';

        let query = `
      SELECT b.*, GROUP_CONCAT(t.name) as tag_names
      FROM books b
      LEFT JOIN book_tags bt ON b.id = bt.book_id
      LEFT JOIN tags t ON bt.tag_id = t.id
    `;
        const conditions: string[] = [];
        const params: string[] = [];

        if (!showAll) {
            conditions.push('b.is_public = 1');
        }
        if (status) {
            conditions.push('b.status = ?');
            params.push(status);
        }
        if (tag) {
            conditions.push('b.id IN (SELECT bt2.book_id FROM book_tags bt2 JOIN tags t2 ON bt2.tag_id = t2.id WHERE t2.name = ?)');
            params.push(tag);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' GROUP BY b.id ORDER BY b.updated_at DESC';

        const stmt = db.prepare(query);
        const result = await (params.length > 0 ? stmt.bind(...params) : stmt).all();

        const books = result.results.map((row: Record<string, unknown>) => ({
            ...row,
            tags: row.tag_names ? (row.tag_names as string).split(',') : [],
            tag_names: undefined,
        }));

        return Response.json(books);
    } catch (error) {
        console.error('GET /api/books error:', error);
        return Response.json({ error: '書籍一覧の取得に失敗しました' }, { status: 500 });
    }
}

async function handleCreateBook(request: Request, db: D1Database) {
    try {
        const body = await request.json() as Record<string, unknown>;

        if (!body.title || !body.author) {
            return Response.json({ error: 'タイトルと著者は必須です' }, { status: 400 });
        }

        const result = await db.prepare(`
      INSERT INTO books (title, author, isbn, cover_url, status, is_public)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
            body.title,
            body.author,
            body.isbn ?? null,
            body.cover_url ?? null,
            body.status ?? 'unread',
            body.is_public ? 1 : 0
        ).run();

        const bookId = result.meta.last_row_id;

        const tags = body.tags as string[] | undefined;
        if (tags && tags.length > 0) {
            for (const name of tags) {
                let tag = await db.prepare('SELECT id FROM tags WHERE name = ?').bind(name).first<{ id: number }>();
                if (!tag) {
                    await db.prepare('INSERT INTO tags (name) VALUES (?)').bind(name).run();
                    tag = await db.prepare('SELECT id FROM tags WHERE name = ?').bind(name).first<{ id: number }>();
                }
                await db.prepare('INSERT INTO book_tags (book_id, tag_id) VALUES (?, ?)').bind(bookId, tag!.id).run();
            }
        }

        const book = await db.prepare('SELECT * FROM books WHERE id = ?').bind(bookId).first();
        return Response.json(book, { status: 201 });
    } catch (error) {
        console.error('POST /api/books error:', error);
        return Response.json({ error: '書籍の登録に失敗しました' }, { status: 500 });
    }
}
