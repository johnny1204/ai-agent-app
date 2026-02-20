interface Env {
    DB: D1Database;
}

// GET/PUT/DELETE /api/books/:id
export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env, params } = context;
    const db = env.DB;
    const id = Number(params.id);

    if (request.method === 'GET') {
        const url = new URL(request.url);
        const showAll = url.searchParams.get('all') === '1';
        return handleGetBook(db, id, showAll);
    } else if (request.method === 'PUT') {
        return handleUpdateBook(request, db, id);
    } else if (request.method === 'DELETE') {
        return handleDeleteBook(db, id);
    }

    return new Response('Method not allowed', { status: 405 });
};

async function handleGetBook(db: D1Database, id: number, showAll: boolean) {
    try {
        let bookQuery = 'SELECT * FROM books WHERE id = ?';
        if (!showAll) bookQuery += ' AND is_public = 1';
        const book = await db.prepare(bookQuery).bind(id).first();
        if (!book) {
            return Response.json({ error: '書籍が見つかりません' }, { status: 404 });
        }

        // タグ取得
        const tagsResult = await db.prepare(`
      SELECT t.name FROM tags t
      JOIN book_tags bt ON t.id = bt.tag_id
      WHERE bt.book_id = ?
    `).bind(id).all();

        // メモ取得
        let memoQuery = 'SELECT * FROM memos WHERE book_id = ?';
        if (!showAll) memoQuery += ' AND is_public = 1';
        memoQuery += ' ORDER BY category, created_at';
        const memosResult = await db.prepare(memoQuery).bind(id).all();

        return Response.json({
            ...book,
            tags: tagsResult.results.map((t: Record<string, unknown>) => t.name),
            memos: memosResult.results,
        });
    } catch (error) {
        console.error('GET /api/books/[id] error:', error);
        return Response.json({ error: '書籍の取得に失敗しました' }, { status: 500 });
    }
}

async function handleUpdateBook(request: Request, db: D1Database, id: number) {
    try {
        const existing = await db.prepare('SELECT * FROM books WHERE id = ?').bind(id).first();
        if (!existing) {
            return Response.json({ error: '書籍が見つかりません' }, { status: 404 });
        }

        const body = await request.json() as Record<string, unknown>;
        const updates: string[] = [];
        const params: unknown[] = [];

        if (body.title !== undefined) { updates.push('title = ?'); params.push(body.title); }
        if (body.author !== undefined) { updates.push('author = ?'); params.push(body.author); }
        if (body.isbn !== undefined) { updates.push('isbn = ?'); params.push(body.isbn); }
        if (body.cover_url !== undefined) { updates.push('cover_url = ?'); params.push(body.cover_url); }
        if (body.status !== undefined) { updates.push('status = ?'); params.push(body.status); }
        if (body.is_public !== undefined) { updates.push('is_public = ?'); params.push(body.is_public ? 1 : 0); }

        if (updates.length > 0) {
            updates.push("updated_at = datetime('now')");
            await db.prepare(`UPDATE books SET ${updates.join(', ')} WHERE id = ?`).bind(...params, id).run();
        }

        // タグ同期
        if (body.tags !== undefined) {
            const tags = body.tags as string[];
            await db.prepare('DELETE FROM book_tags WHERE book_id = ?').bind(id).run();
            for (const name of tags) {
                let tag = await db.prepare('SELECT id FROM tags WHERE name = ?').bind(name).first<{ id: number }>();
                if (!tag) {
                    await db.prepare('INSERT INTO tags (name) VALUES (?)').bind(name).run();
                    tag = await db.prepare('SELECT id FROM tags WHERE name = ?').bind(name).first<{ id: number }>();
                }
                await db.prepare('INSERT INTO book_tags (book_id, tag_id) VALUES (?, ?)').bind(id, tag!.id).run();
            }
        }

        const book = await db.prepare('SELECT * FROM books WHERE id = ?').bind(id).first();
        return Response.json(book);
    } catch (error) {
        console.error('PUT /api/books/[id] error:', error);
        return Response.json({ error: '書籍の更新に失敗しました' }, { status: 500 });
    }
}

async function handleDeleteBook(db: D1Database, id: number) {
    try {
        const result = await db.prepare('DELETE FROM books WHERE id = ?').bind(id).run();
        if ((result.meta.changes as number) === 0) {
            return Response.json({ error: '書籍が見つかりません' }, { status: 404 });
        }
        return Response.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/books/[id] error:', error);
        return Response.json({ error: '書籍の削除に失敗しました' }, { status: 500 });
    }
}
