interface Env {
    study_assistant_db: D1Database;
    PUBLIC_CACHE_TTL?: string;
    PUBLIC_QUESTIONS_LIMIT?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
    try {
        const { env } = context;
        const db = env.study_assistant_db;

        const cacheTtlStr = env.PUBLIC_CACHE_TTL || "86400";
        const limitCountStr = env.PUBLIC_QUESTIONS_LIMIT || "5";

        const cacheTtl = parseInt(cacheTtlStr, 10);
        const limitCount = parseInt(limitCountStr, 10) || 5;

        const { results } = await db.prepare("SELECT * FROM questions LIMIT ?").bind(limitCount).all();

        if (results && results.length > 0) {
            const formattedQuestions = results.map((row: any) => {
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

                    let seed = row.question.length;
                    for (let i = optionsWithCorrectness.length - 1; i > 0; i--) {
                        const j = seed % (i + 1);
                        [optionsWithCorrectness[i], optionsWithCorrectness[j]] = [optionsWithCorrectness[j], optionsWithCorrectness[i]];
                        seed = (seed * 9301 + 49297) % 233280;
                    }

                    finalOptions = optionsWithCorrectness.map(o => o.text);
                    finalCorrectAnswer = optionsWithCorrectness.findIndex(o => o.isCorrect);
                }

                return {
                    question: row.question,
                    options: finalOptions,
                    correctAnswer: finalCorrectAnswer,
                    explanation: row.explanation,
                    category: row.category
                };
            });

            return new Response(JSON.stringify(formattedQuestions), {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': `public, s-maxage=${cacheTtl}, stale-while-revalidate=${Math.floor(cacheTtl / 2)}`,
                }
            });
        }

        return new Response(JSON.stringify([]), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Error fetching public questions from DB:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch questions" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
