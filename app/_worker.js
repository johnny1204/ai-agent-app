// src/worker.ts
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    let apiPath = url.pathname;
    if (apiPath.startsWith("/bookshelf/")) {
      apiPath = apiPath.replace("/bookshelf", "");
    } else if (apiPath === "/bookshelf") {
      apiPath = "/";
    } else if (apiPath.startsWith("/study-assistant/")) {
      apiPath = apiPath.replace("/study-assistant", "");
    } else if (apiPath === "/study-assistant") {
      apiPath = "/";
    }
    if (requiresAuth(request)) {
      const authResponse = checkAuth(request, env);
      if (authResponse) return authResponse;
    }
    if (apiPath === "/api/books" || apiPath === "/api/books/") {
      return handleBooks(request, env.DB);
    }
    const bookIdMatch = apiPath.match(/^\/api\/books\/(\d+)$/);
    if (bookIdMatch) {
      return handleBookById(request, env.DB, Number(bookIdMatch[1]));
    }
    if (apiPath === "/api/memos" || apiPath === "/api/memos/") {
      return handleMemos(request, env.DB);
    }
    if (apiPath === "/api/questions/public" || apiPath === "/api/questions/public/") {
      return handlePublicQuestions(request, env);
    }
    if (apiPath === "/api/questions" || apiPath === "/api/questions/") {
      if (request.method === "POST") return handleNextQuestion(request, env);
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
async function handlePublicQuestions(request, env) {
  try {
    const db = env.study_assistant_db;
    const cacheTtlStr = env.PUBLIC_CACHE_TTL || "86400";
    const limitCountStr = env.PUBLIC_QUESTIONS_LIMIT || "5";
    const cacheTtl = parseInt(cacheTtlStr, 10);
    const limitCount = parseInt(limitCountStr, 10) || 5;
    const { results } = await db.prepare("SELECT * FROM questions LIMIT ?").bind(limitCount).all();
    if (!results || results.length === 0) return Response.json([]);
    const formattedQuestions = results.map((row) => formatQuestion(row, true));
    return new Response(JSON.stringify(formattedQuestions), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, s-maxage=${cacheTtl}, stale-while-revalidate=${Math.floor(cacheTtl / 2)}`
      }
    });
  } catch (error) {
    console.error("Error fetching public questions:", error);
    return Response.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
async function handleNextQuestion(request, env) {
  try {
    const db = env.study_assistant_db;
    const body = await request.json();
    const topic = body?.topic;
    const exclude = body?.exclude || [];
    let query = "SELECT * FROM questions WHERE 1=1";
    const params = [];
    if (topic) {
      query += " AND category = ?";
      params.push(topic);
    }
    if (exclude.length > 0) {
      query += " AND question NOT IN (" + exclude.map(() => "?").join(",") + ")";
      params.push(...exclude);
    }
    query += " ORDER BY RANDOM() LIMIT 1";
    let { results } = await db.prepare(query).bind(...params).all();
    if ((!results || results.length === 0) && topic) {
      let fallbackQuery = "SELECT * FROM questions WHERE 1=1";
      const fallbackParams = [];
      if (exclude.length > 0) {
        fallbackQuery += " AND question NOT IN (" + exclude.map(() => "?").join(",") + ")";
        fallbackParams.push(...exclude);
      }
      fallbackQuery += " ORDER BY RANDOM() LIMIT 1";
      const fallbackRes = await db.prepare(fallbackQuery).bind(...fallbackParams).all();
      results = fallbackRes.results;
    }
    if (results && results.length > 0) {
      return Response.json(formatQuestion(results[0], false));
    }
    return Response.json({
      question: `\u73FE\u5728\u300C${topic || "\u6307\u5B9A\u306A\u3057"}\u300D\u5206\u91CE\u306E\u904E\u53BB\u554F\u304C\u767B\u9332\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002`,
      options: ["-", "-", "-", "-"],
      correctAnswer: 0,
      explanation: "\u554F\u984C\u306E\u767B\u9332\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
      category: topic || "Unknown"
    });
  } catch (error) {
    console.error("Error fetching question:", error);
    return Response.json({ error: "Failed to fetch question" }, { status: 500 });
  }
}
function formatQuestion(row, isPublic) {
  let parsedOptions = ["-", "-", "-", "-"];
  try {
    const cleanedOptions = row.options.replace(/,\s*\]$/, "]").replace(/\][^\]]*$/, "]");
    parsedOptions = JSON.parse(cleanedOptions);
  } catch (e) {
    const match = row.options.match(/\[(.*)\]/);
    if (match && match[1]) {
      parsedOptions = match[1].split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
      if (parsedOptions.length !== 4) parsedOptions = ["[\u30D1\u30FC\u30B9\u5931\u6557]", "[\u30D1\u30FC\u30B9\u5931\u6557]", "[\u30D1\u30FC\u30B9\u5931\u6557]", "[\u30D1\u30FC\u30B9\u5931\u6557]"];
    }
  }
  let finalOptions = parsedOptions;
  let finalCorrectAnswer = row.correctAnswer;
  if (parsedOptions.length === 4 && parsedOptions[0] !== "[\u30D1\u30FC\u30B9\u5931\u6557]") {
    const optionsWithCorrectness = parsedOptions.map((text, idx) => ({
      text,
      isCorrect: idx === row.correctAnswer
    }));
    if (isPublic) {
      let seed = row.question.length;
      for (let i = optionsWithCorrectness.length - 1; i > 0; i--) {
        const j = seed % (i + 1);
        [optionsWithCorrectness[i], optionsWithCorrectness[j]] = [optionsWithCorrectness[j], optionsWithCorrectness[i]];
        seed = (seed * 9301 + 49297) % 233280;
      }
    } else {
      for (let i = optionsWithCorrectness.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [optionsWithCorrectness[i], optionsWithCorrectness[j]] = [optionsWithCorrectness[j], optionsWithCorrectness[i]];
      }
    }
    finalOptions = optionsWithCorrectness.map((o) => o.text);
    finalCorrectAnswer = optionsWithCorrectness.findIndex((o) => o.isCorrect);
  }
  return {
    question: row.question,
    options: finalOptions,
    correctAnswer: finalCorrectAnswer,
    explanation: row.explanation,
    category: row.category,
    exam_year: row.exam_year,
    exam_season: row.exam_season,
    question_number: row.question_number
  };
}
export {
  worker_default as default
};
