interface Env {
    DB: D1Database;
}

// POST /api/memos — メモ追加
// DELETE /api/memos?id=xxx — メモ削除
export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const db = env.DB;

    if (request.method === 'POST') {
        return handleCreateMemo(request, db);
    } else if (request.method === 'DELETE') {
        return handleDeleteMemo(request, db);
    }

    return new Response('Method not allowed', { status: 405 });
};

async function handleCreateMemo(request: Request, db: D1Database) {
    try {
        const body = await request.json() as Record<string, unknown>;

        if (!body.book_id || !body.category || !body.content) {
            return Response.json({ error: 'book_id, category, content は必須です' }, { status: 400 });
        }

        await db.prepare(`
      INSERT INTO memos (book_id, category, content, is_public)
      VALUES (?, ?, ?, ?)
    `).bind(body.book_id, body.category, body.content, body.is_public ? 1 : 0).run();

        // 書籍の updated_at を更新
        await db.prepare("UPDATE books SET updated_at = datetime('now') WHERE id = ?").bind(body.book_id).run();

        const memo = await db.prepare('SELECT * FROM memos WHERE book_id = ? ORDER BY id DESC LIMIT 1')
            .bind(body.book_id).first();

        return Response.json(memo, { status: 201 });
    } catch (error) {
        console.error('POST /api/memos error:', error);
        return Response.json({ error: 'メモの追加に失敗しました' }, { status: 500 });
    }
}

async function handleDeleteMemo(request: Request, db: D1Database) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return Response.json({ error: 'id は必須です' }, { status: 400 });
        }

        const result = await db.prepare('DELETE FROM memos WHERE id = ?').bind(Number(id)).run();
        if ((result.meta.changes as number) === 0) {
            return Response.json({ error: 'メモが見つかりません' }, { status: 404 });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/memos error:', error);
        return Response.json({ error: 'メモの削除に失敗しました' }, { status: 500 });
    }
}
