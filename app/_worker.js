// src/worker.ts
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (requiresAuth(request)) {
      const authResponse = checkAuth(request, env);
      if (authResponse) return authResponse;
    }
    if (path === "/api/books" || path === "/api/books/") {
      return handleBooks(request, env.DB);
    }
    const bookIdMatch = path.match(/^\/api\/books\/(\d+)$/);
    if (bookIdMatch) {
      return handleBookById(request, env.DB, Number(bookIdMatch[1]));
    }
    if (path === "/api/memos" || path === "/api/memos/") {
      return handleMemos(request, env.DB);
    }
    return env.ASSETS.fetch(request);
  }
};
function requiresAuth(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (path.startsWith("/bookshelf/admin")) return true;
  if (path.startsWith("/api/") && ["POST", "PUT", "DELETE"].includes(request.method)) return true;
  return false;
}
function checkAuth(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return unauthorized();
  }
  const decoded = atob(authHeader.slice(6));
  const [username, password] = decoded.split(":");
  const expectedUsername = env.ADMIN_USERNAME || "admin";
  const expectedPassword = env.ADMIN_PASSWORD || "password";
  if (username !== expectedUsername || password !== expectedPassword) {
    return unauthorized();
  }
  return null;
}
function unauthorized() {
  return new Response("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin Area"' }
  });
}
async function handleBooks(request, db) {
  if (request.method === "GET") return handleGetBooks(request, db);
  if (request.method === "POST") return handleCreateBook(request, db);
  return new Response("Method not allowed", { status: 405 });
}
async function handleGetBooks(request, db) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const tag = url.searchParams.get("tag");
    const showAll = url.searchParams.get("all") === "1";
    let query = `
            SELECT b.*, GROUP_CONCAT(t.name) as tag_names
            FROM books b
            LEFT JOIN book_tags bt ON b.id = bt.book_id
            LEFT JOIN tags t ON bt.tag_id = t.id
        `;
    const conditions = [];
    const params = [];
    if (!showAll) conditions.push("b.is_public = 1");
    if (status) {
      conditions.push("b.status = ?");
      params.push(status);
    }
    if (tag) {
      conditions.push("b.id IN (SELECT bt2.book_id FROM book_tags bt2 JOIN tags t2 ON bt2.tag_id = t2.id WHERE t2.name = ?)");
      params.push(tag);
    }
    if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");
    query += " GROUP BY b.id ORDER BY b.updated_at DESC";
    const stmt = db.prepare(query);
    const result = await (params.length > 0 ? stmt.bind(...params) : stmt).all();
    const books = result.results.map((row) => ({
      ...row,
      tags: row.tag_names ? row.tag_names.split(",") : [],
      tag_names: void 0
    }));
    return Response.json(books);
  } catch (error) {
    console.error("GET /api/books error:", error);
    return Response.json({ error: "\u66F8\u7C4D\u4E00\u89A7\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, { status: 500 });
  }
}
async function handleCreateBook(request, db) {
  try {
    const body = await request.json();
    if (!body.title || !body.author) {
      return Response.json({ error: "\u30BF\u30A4\u30C8\u30EB\u3068\u8457\u8005\u306F\u5FC5\u9808\u3067\u3059" }, { status: 400 });
    }
    const result = await db.prepare(`
            INSERT INTO books (title, author, isbn, cover_url, status, is_public)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(body.title, body.author, body.isbn ?? null, body.cover_url ?? null, body.status ?? "unread", body.is_public ? 1 : 0).run();
    const bookId = result.meta.last_row_id;
    const tags = body.tags;
    if (tags && tags.length > 0) {
      for (const name of tags) {
        let tag = await db.prepare("SELECT id FROM tags WHERE name = ?").bind(name).first();
        if (!tag) {
          await db.prepare("INSERT INTO tags (name) VALUES (?)").bind(name).run();
          tag = await db.prepare("SELECT id FROM tags WHERE name = ?").bind(name).first();
        }
        await db.prepare("INSERT INTO book_tags (book_id, tag_id) VALUES (?, ?)").bind(bookId, tag.id).run();
      }
    }
    const book = await db.prepare("SELECT * FROM books WHERE id = ?").bind(bookId).first();
    return Response.json(book, { status: 201 });
  } catch (error) {
    console.error("POST /api/books error:", error);
    return Response.json({ error: "\u66F8\u7C4D\u306E\u767B\u9332\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, { status: 500 });
  }
}
async function handleBookById(request, db, id) {
  if (request.method === "GET") {
    const url = new URL(request.url);
    const showAll = url.searchParams.get("all") === "1";
    return handleGetBook(db, id, showAll);
  }
  if (request.method === "PUT") return handleUpdateBook(request, db, id);
  if (request.method === "DELETE") return handleDeleteBook(db, id);
  return new Response("Method not allowed", { status: 405 });
}
async function handleGetBook(db, id, showAll) {
  try {
    let bookQuery = "SELECT * FROM books WHERE id = ?";
    if (!showAll) bookQuery += " AND is_public = 1";
    const book = await db.prepare(bookQuery).bind(id).first();
    if (!book) return Response.json({ error: "\u66F8\u7C4D\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, { status: 404 });
    const tagsResult = await db.prepare(`
            SELECT t.name FROM tags t
            JOIN book_tags bt ON t.id = bt.tag_id
            WHERE bt.book_id = ?
        `).bind(id).all();
    let memoQuery = "SELECT * FROM memos WHERE book_id = ?";
    if (!showAll) memoQuery += " AND is_public = 1";
    memoQuery += " ORDER BY category, created_at";
    const memosResult = await db.prepare(memoQuery).bind(id).all();
    return Response.json({
      ...book,
      tags: tagsResult.results.map((t) => t.name),
      memos: memosResult.results
    });
  } catch (error) {
    console.error("GET /api/books/[id] error:", error);
    return Response.json({ error: "\u66F8\u7C4D\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, { status: 500 });
  }
}
async function handleUpdateBook(request, db, id) {
  try {
    const existing = await db.prepare("SELECT * FROM books WHERE id = ?").bind(id).first();
    if (!existing) return Response.json({ error: "\u66F8\u7C4D\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, { status: 404 });
    const body = await request.json();
    const updates = [];
    const params = [];
    if (body.title !== void 0) {
      updates.push("title = ?");
      params.push(body.title);
    }
    if (body.author !== void 0) {
      updates.push("author = ?");
      params.push(body.author);
    }
    if (body.isbn !== void 0) {
      updates.push("isbn = ?");
      params.push(body.isbn);
    }
    if (body.cover_url !== void 0) {
      updates.push("cover_url = ?");
      params.push(body.cover_url);
    }
    if (body.status !== void 0) {
      updates.push("status = ?");
      params.push(body.status);
    }
    if (body.is_public !== void 0) {
      updates.push("is_public = ?");
      params.push(body.is_public ? 1 : 0);
    }
    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      await db.prepare(`UPDATE books SET ${updates.join(", ")} WHERE id = ?`).bind(...params, id).run();
    }
    if (body.tags !== void 0) {
      const tags = body.tags;
      await db.prepare("DELETE FROM book_tags WHERE book_id = ?").bind(id).run();
      for (const name of tags) {
        let tag = await db.prepare("SELECT id FROM tags WHERE name = ?").bind(name).first();
        if (!tag) {
          await db.prepare("INSERT INTO tags (name) VALUES (?)").bind(name).run();
          tag = await db.prepare("SELECT id FROM tags WHERE name = ?").bind(name).first();
        }
        await db.prepare("INSERT INTO book_tags (book_id, tag_id) VALUES (?, ?)").bind(id, tag.id).run();
      }
    }
    const book = await db.prepare("SELECT * FROM books WHERE id = ?").bind(id).first();
    return Response.json(book);
  } catch (error) {
    console.error("PUT /api/books/[id] error:", error);
    return Response.json({ error: "\u66F8\u7C4D\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, { status: 500 });
  }
}
async function handleDeleteBook(db, id) {
  try {
    const result = await db.prepare("DELETE FROM books WHERE id = ?").bind(id).run();
    if (result.meta.changes === 0) {
      return Response.json({ error: "\u66F8\u7C4D\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/books/[id] error:", error);
    return Response.json({ error: "\u66F8\u7C4D\u306E\u524A\u9664\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, { status: 500 });
  }
}
async function handleMemos(request, db) {
  if (request.method === "POST") return handleCreateMemo(request, db);
  if (request.method === "DELETE") return handleDeleteMemo(request, db);
  return new Response("Method not allowed", { status: 405 });
}
async function handleCreateMemo(request, db) {
  try {
    const body = await request.json();
    if (!body.book_id || !body.category || !body.content) {
      return Response.json({ error: "book_id, category, content \u306F\u5FC5\u9808\u3067\u3059" }, { status: 400 });
    }
    await db.prepare(`
            INSERT INTO memos (book_id, category, content, is_public)
            VALUES (?, ?, ?, ?)
        `).bind(body.book_id, body.category, body.content, body.is_public ? 1 : 0).run();
    await db.prepare("UPDATE books SET updated_at = datetime('now') WHERE id = ?").bind(body.book_id).run();
    const memo = await db.prepare("SELECT * FROM memos WHERE book_id = ? ORDER BY id DESC LIMIT 1").bind(body.book_id).first();
    return Response.json(memo, { status: 201 });
  } catch (error) {
    console.error("POST /api/memos error:", error);
    return Response.json({ error: "\u30E1\u30E2\u306E\u8FFD\u52A0\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, { status: 500 });
  }
}
async function handleDeleteMemo(request, db) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return Response.json({ error: "id \u306F\u5FC5\u9808\u3067\u3059" }, { status: 400 });
    const result = await db.prepare("DELETE FROM memos WHERE id = ?").bind(Number(id)).run();
    if (result.meta.changes === 0) {
      return Response.json({ error: "\u30E1\u30E2\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/memos error:", error);
    return Response.json({ error: "\u30E1\u30E2\u306E\u524A\u9664\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, { status: 500 });
  }
}
export {
  worker_default as default
};
