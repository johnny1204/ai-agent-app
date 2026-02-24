interface Env {
    study_assistant_db: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const { request, env } = context;
        const db = env.study_assistant_db;
        const body = (await request.json()) as { topic?: string, exclude?: string[] };
        const topic = body?.topic;
        const exclude = body?.exclude || [];

        let query = "SELECT * FROM questions WHERE 1=1";
        const params: any[] = [];

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
            const fallbackParams: any[] = [];
            if (exclude.length > 0) {
                fallbackQuery += " AND question NOT IN (" + exclude.map(() => "?").join(",") + ")";
                fallbackParams.push(...exclude);
            }
            fallbackQuery += " ORDER BY RANDOM() LIMIT 1";
            const fallbackRes = await db.prepare(fallbackQuery).bind(...fallbackParams).all();
            results = fallbackRes.results;
        }

        if (results && results.length > 0) {
            const row: any = results[0];
            let parsedOptions = ["-", "-", "-", "-"];
            try {
                const cleanedOptions = row.options.replace(/,\s*\]$/, ']').replace(/\][^\]]*$/, ']');
                parsedOptions = JSON.parse(cleanedOptions);
            } catch (e) {
                const match = row.options.match(/\[(.*)\]/);
                if (match && match[1]) {
                    parsedOptions = match[1].split(',').map((s: string) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
                    if (parsedOptions.length !== 4) parsedOptions = ["[パース失敗]", "[パース失敗]", "[パース失敗]", "[パース失敗]"];
                }
            }

            let finalOptions = parsedOptions;
            let finalCorrectAnswer = row.correctAnswer;

            if (parsedOptions.length === 4 && parsedOptions[0] !== "[パース失敗]") {
                const optionsWithCorrectness = parsedOptions.map((text: string, idx: number) => ({
                    text,
                    isCorrect: idx === row.correctAnswer
                }));

                for (let i = optionsWithCorrectness.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [optionsWithCorrectness[i], optionsWithCorrectness[j]] = [optionsWithCorrectness[j], optionsWithCorrectness[i]];
                }

                finalOptions = optionsWithCorrectness.map(o => o.text);
                finalCorrectAnswer = optionsWithCorrectness.findIndex(o => o.isCorrect);
            }

            const question = {
                question: row.question,
                options: finalOptions,
                correctAnswer: finalCorrectAnswer,
                explanation: row.explanation,
                category: row.category
            };
            return new Response(JSON.stringify(question), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            question: `現在「${topic || "指定なし"}」分野の過去問がデータベースに登録されていません。問題生成スクリプトを実行して追加してください。`,
            options: ["-", "-", "-", "-"],
            correctAnswer: 0,
            explanation: "ローカルでスクリプトを実行し、NotebookLMからD1データベースへ問題を登録する必要があります。",
            category: topic || "Unknown"
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Error fetching question from DB:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch question" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
