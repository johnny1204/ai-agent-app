interface Env {
    ADMIN_USERNAME: string;
    ADMIN_PASSWORD: string;
    DB: D1Database;
}

// Basic 認証が必要なパスとメソッドの判定
function requiresAuth(request: Request): boolean {
    const url = new URL(request.url);
    const path = url.pathname;

    // 管理画面は常に認証必要
    if (path.startsWith('/bookshelf/admin')) {
        return true;
    }

    // API の書き込み操作は認証必要
    if (path.startsWith('/api/') && ['POST', 'PUT', 'DELETE'].includes(request.method)) {
        return true;
    }

    return false;
}

function unauthorized(): Response {
    return new Response('Unauthorized', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Admin Area"',
        },
    });
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    if (!requiresAuth(request)) {
        return context.next();
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return unauthorized();
    }

    const encoded = authHeader.slice(6);
    const decoded = atob(encoded);
    const [username, password] = decoded.split(':');

    const expectedUsername = env.ADMIN_USERNAME || 'admin';
    const expectedPassword = env.ADMIN_PASSWORD || 'password';

    if (username !== expectedUsername || password !== expectedPassword) {
        return unauthorized();
    }

    return context.next();
};
