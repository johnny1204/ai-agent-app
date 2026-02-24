"use client";

import { useState, useEffect } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Brain, FileQuestion, GraduationCap, ChevronRight, Activity, Sparkles, RefreshCcw, Home } from "lucide-react";

type Question = {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    category: string;
};

type Result = {
    category: string;
    correct: boolean;
    questionText?: string;
};

// Align categories with what the MCP generates or mock data uses
const DEFAULT_CATEGORIES = ["セキュリティ", "ネットワーク", "データベース", "基礎理論", "プロジェクトマネジメント"];

interface QuizAppProps {
    mode: "public" | "private";
}

export default function QuizApp({ mode }: QuizAppProps) {
    const [loading, setLoading] = useState(false);
    const [question, setQuestion] = useState<Question | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [results, setResults] = useState<Result[]>([]);
    const [mounted, setMounted] = useState(false);
    const [publicQuestions, setPublicQuestions] = useState<Question[] | null>(null);

    // Load from local storage securely on mount
    useEffect(() => {
        setMounted(true);
        try {
            const storageKey = mode === "public" ? "studyAssistantHistory_public" : "studyAssistantHistory_private";
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                setResults(JSON.parse(saved));
            }
        } catch (e) { }
    }, [mode]);

    // Save to local storage
    useEffect(() => {
        if (mounted) {
            const storageKey = mode === "public" ? "studyAssistantHistory_public" : "studyAssistantHistory_private";
            localStorage.setItem(storageKey, JSON.stringify(results));
        }
    }, [results, mounted, mode]);

    const fetchPublicQuestionsOnce = async () => {
        try {
            const res = await fetch("/study-assistant/api/questions/public");
            const list = await res.json() as Question[];
            setPublicQuestions(list);
            return list;
        } catch (e) {
            console.error(e);
            return [];
        }
    };

    const generateNextQuestion = async () => {
        setLoading(true);
        setQuestion(null);
        setSelectedOption(null);
        setShowExplanation(false);

        if (mode === "public") {
            let pool = publicQuestions;
            if (!pool) {
                pool = await fetchPublicQuestionsOnce();
            }

            if (!pool || pool.length === 0) {
                setQuestion({
                    question: "公開問題の取得に失敗しました。",
                    options: ["-", "-", "-", "-"],
                    correctAnswer: 0,
                    explanation: "ネットワークエラーか、サーバー側で問題のキャッシュがありません。",
                    category: "エラー"
                });
                setLoading(false);
                return;
            }

            const answeredQuestions = results.map(r => r.questionText);
            const unasked = pool.filter(q => !answeredQuestions.includes(q.question));

            if (unasked.length === 0) {
                // 用意された上限数を出題しきった場合は終了画面（ダミー問題）を表示する
                setQuestion({
                    question: `✅ 今日の公開問題（全${pool.length}問）をすべて解き終わりました！\n\nお疲れ様でした！「スコアをリセット」を押すと、学習履歴を初期化して最初からやり直すことができます。`,
                    options: ["-", "-", "-", "-"],
                    correctAnswer: 0,
                    explanation: "デモンストレーションのため出題数を固定・制限しています。",
                    category: "終了"
                });
                setShowExplanation(true); // ボタンを表示させるために必要
                setSelectedOption(null);
                setLoading(false);
                return;
            }

            // 未出題のものからランダムに1問選ぶ（一度出た問題はクリアするまで出ない）
            const randQ = unasked[Math.floor(Math.random() * unasked.length)];

            setQuestion(randQ);
            setLoading(false);
            return;
        }

        // --- Private Mode logic ---
        let weakArea = "";
        if (results.length > 5) {
            const stats = calculateStats();
            const lowestStat = [...stats].sort((a, b) => a.score - b.score)[0];
            if (lowestStat && lowestStat.score < 50) {
                weakArea = lowestStat.subject;
            }
        }

        try {
            const answeredQuestions = results.map(r => r.questionText).filter(Boolean);
            const res = await fetch("/study-assistant/api/questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic: weakArea || undefined,
                    exclude: answeredQuestions
                }),
            });
            const data = await res.json() as { error?: string } & Question;

            if (!res.ok || data.error) {
                console.error("API Error:", data.error);
                setQuestion({
                    question: "データベースからの問題取得に失敗しました。ローカルサーバーのD1バインディングが正しく動作しているか確認してください。",
                    options: ["-", "-", "-", "-"],
                    correctAnswer: 0,
                    explanation: "開発サーバーを起動する際、標準の 'npm run dev' ではなくCloudflareバインディング用のコマンドを使用しているか確認してください。",
                    category: "エラー"
                } as Question);
            } else {
                setQuestion(data as Question);
            }
        } catch (e) {
            console.error(e);
            setQuestion({
                question: "ネットワークエラーが発生しました。",
                options: ["-", "-", "-", "-"],
                correctAnswer: 0,
                explanation: "APIサーバーに接続できません。",
                category: "エラー"
            } as Question);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (index: number) => {
        if (showExplanation) return;
        setSelectedOption(index);
        setShowExplanation(true);

        if (question && question.options[0] !== "-") { // Avoid scoring fallback errors
            setResults(prev => [...prev, {
                category: question.category,
                correct: index === question.correctAnswer,
                questionText: question.question
            }]);
        }
    };

    const calculateStats = () => {
        const defaultStats = DEFAULT_CATEGORIES.map(cat => ({
            subject: cat,
            score: 50, // Default baseline for beautiful radar visualization
            total: 0,
            correct: 0,
            fullMark: 100,
        }));

        if (results.length === 0) return defaultStats;

        const statsMap = new Map(defaultStats.map(s => [s.subject, s]));

        // Update with real data
        results.forEach(res => {
            if (!statsMap.has(res.category)) {
                statsMap.set(res.category, { subject: res.category, score: 50, total: 0, correct: 0, fullMark: 100 });
            }
            const stat = statsMap.get(res.category)!;
            stat.total += 1;
            if (res.correct) stat.correct += 1;
            stat.score = Math.max(10, Math.round((stat.correct / stat.total) * 100));
        });

        return Array.from(statsMap.values());
    };

    const stats = calculateStats();

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#0A0F1C] text-slate-50 font-sans p-4 sm:p-8 selection:bg-indigo-500/30">
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-sky-600/10 blur-[120px]" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                <nav className="flex justify-end mb-4">
                    <a
                        href="../index.html"
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        <Home className="w-4 h-4" />
                        ポートフォリオTOPへ
                    </a>
                </nav>
                <header className="flex items-center gap-4 mb-12 pt-4 justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-gradient-to-br from-indigo-500/20 to-sky-500/20 rounded-2xl border border-white/5 shadow-lg shadow-indigo-500/5">
                            <GraduationCap className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-sky-300 to-emerald-300">
                                AI Study Assistant
                            </h1>

                        </div>
                    </div>
                    {mode === 'public' && (
                        <div className="px-3 py-1.5 bg-sky-500/10 text-sky-400 text-sm rounded-lg border border-sky-500/20 font-medium">
                            プレビュー版
                        </div>
                    )}
                    {mode === 'private' && (
                        <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-sm rounded-lg border border-emerald-500/20 font-medium">
                            フルアクセス版
                        </div>
                    )}
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <section className="lg:col-span-4 space-y-6">
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-7 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-white/[0.1] transition-colors duration-500">
                            <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2.5">
                                <Activity className="w-5 h-5 text-indigo-400" />
                                スキル・プロファイル
                            </h2>
                            <div className="h-64 w-full -ml-3">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={stats}>
                                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                                            itemStyle={{ color: '#38bdf8' }}
                                        />
                                        <Radar
                                            name="習熟度(%)"
                                            dataKey="score"
                                            stroke="#818cf8"
                                            strokeWidth={2}
                                            fill="url(#colorScore)"
                                            fillOpacity={0.5}
                                        />
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.2} />
                                            </linearGradient>
                                        </defs>
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-7 backdrop-blur-xl shadow-2xl">
                            <h3 className="text-slate-200 font-bold mb-5 flex items-center gap-2.5">
                                <Brain className="w-5 h-5 text-emerald-400" />
                                学習パフォーマンス
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/[0.03]">
                                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Answered</p>
                                    <p className="text-2xl font-bold text-slate-100">{results.length}<span className="text-sm font-normal text-slate-500 ml-1">問</span></p>
                                </div>
                                <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/[0.03]">
                                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Accuracy</p>
                                    <p className="text-2xl font-bold text-emerald-400">
                                        {results.length > 0
                                            ? Math.round((results.filter(r => r.correct).length / results.length) * 100)
                                            : 0}
                                        <span className="text-sm font-normal text-emerald-500/50 ml-1">%</span>
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    if (confirm("履歴をリセットして最初から学習をやり直しますか？")) setResults([]);
                                }}
                                className="mt-6 text-xs font-medium text-slate-500 hover:text-red-400 transition ml-auto flex items-center gap-1.5"
                            >
                                <RefreshCcw className="w-3.5 h-3.5" />
                                スコアをリセット
                            </button>
                        </div>
                    </section>

                    <section className="lg:col-span-8">
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 sm:p-10 backdrop-blur-xl shadow-2xl min-h-[550px] flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                            {!question && !loading && (
                                <div className="flex flex-col items-center justify-center flex-grow text-center animate-in fade-in duration-700">
                                    <div className="relative mb-8">
                                        <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full" />
                                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-sky-500/10 border border-white/10 flex items-center justify-center relative z-10 backdrop-blur-md shadow-2xl transform hover:scale-105 transition-transform duration-500">
                                            <FileQuestion className="w-12 h-12 text-sky-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-100 mb-3 tracking-tight">AI出題エンジン</h3>
                                    <p className="text-slate-400 max-w-md mb-10 leading-relaxed">
                                        NotebookLMにインポートされた独自の資料から、あなたの習熟度に合わせて問題を自動生成します。
                                    </p>
                                    <button
                                        onClick={generateNextQuestion}
                                        className="group px-8 py-4 bg-slate-100 hover:bg-white text-slate-900 rounded-2xl font-bold transition-all duration-300 flex items-center gap-3 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] transform hover:-translate-y-1"
                                    >
                                        学習を開始する
                                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-900 transition-colors" />
                                    </button>
                                </div>
                            )}

                            {loading && (
                                <div className="flex flex-col items-center justify-center flex-grow text-center animate-in fade-in duration-300">
                                    <div className="relative w-16 h-16 mb-6">
                                        <div className="absolute inset-0 border-4 border-slate-700/30 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-200 mb-2">問題を準備中</h3>
                                    <p className="text-sm text-slate-400/80 animate-pulse">データベースから抽出しています...</p>
                                </div>
                            )}

                            {question && !loading && (
                                <div className="flex flex-col h-full animate-in slide-in-from-right-8 fade-in duration-500">
                                    <div className="flex justify-between items-center mb-8">
                                        <span className="px-3.5 py-1.5 bg-indigo-500/10 text-indigo-300 text-xs font-bold tracking-wider rounded-lg border border-indigo-500/20 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                            FullStack: {question.category}
                                        </span>
                                    </div>

                                    <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mb-10 leading-relaxed whitespace-pre-line">
                                        {question.question}
                                    </h2>

                                    {question.category !== "終了" && (
                                        <div className="space-y-4 mb-8">
                                            {question.options.map((opt, idx) => {
                                                const isSelected = selectedOption === idx;
                                                const isCorrect = idx === question.correctAnswer;
                                                const isFallback = opt === "-";

                                                let btnClass = "w-full text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group ";

                                                if (!showExplanation) {
                                                    btnClass += "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5";
                                                } else {
                                                    if (isCorrect && !isFallback && selectedOption !== null) {
                                                        btnClass += "bg-emerald-500/10 border-emerald-500/50 text-emerald-100 shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)]";
                                                    } else if (isSelected && !isCorrect) {
                                                        btnClass += "bg-rose-500/10 border-rose-500/50 text-rose-100";
                                                    } else {
                                                        btnClass += "bg-transparent border-white/[0.02] text-slate-500 opacity-40";
                                                    }
                                                }

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleAnswer(idx)}
                                                        disabled={showExplanation || isFallback}
                                                        className={btnClass}
                                                    >
                                                        <div className="flex items-start gap-4 relative z-10">
                                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${showExplanation && isCorrect && selectedOption !== null ? 'bg-emerald-500/20 text-emerald-300' :
                                                                showExplanation && isSelected ? 'bg-rose-500/20 text-rose-300' :
                                                                    'bg-slate-800 text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300'
                                                                }`}>
                                                                {String.fromCharCode(65 + idx)}
                                                            </span>
                                                            <span className="pt-1 whitespace-pre-line">{opt}</span>
                                                        </div>

                                                        {showExplanation && isCorrect && !isFallback && selectedOption !== null && (
                                                            <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500" />
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {showExplanation && selectedOption !== null && (
                                        <div className="mt-8 p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-700/50 animate-in slide-in-from-bottom-8 fade-in duration-500 backdrop-blur-md relative overflow-hidden">
                                            <div className={`absolute top-0 inset-x-0 h-px ${selectedOption === question.correctAnswer ? 'bg-emerald-500/50' : 'bg-rose-500/50'}`} />

                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedOption === question.correctAnswer ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                                                    {selectedOption === question.correctAnswer
                                                        ? <span className="text-emerald-400 font-bold">✓</span>
                                                        : <span className="text-rose-400 font-bold">✕</span>}
                                                </div>
                                                <h4 className={`text-lg font-bold tracking-tight ${selectedOption === question.correctAnswer ? "text-emerald-400" : "text-rose-400"}`}>
                                                    {selectedOption === question.correctAnswer ? "正解！素晴らしいです" : "残念...不正解です"}
                                                </h4>
                                            </div>

                                            <div className="text-slate-300 text-sm leading-loose whitespace-pre-line">
                                                <p>{question.explanation}</p>
                                            </div>

                                            <div className="flex justify-end mt-8 pt-6 border-t border-slate-700/50">
                                                <button
                                                    onClick={generateNextQuestion}
                                                    className="px-6 py-3 bg-white text-slate-900 hover:bg-indigo-50 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg"
                                                >
                                                    次の問題へ進む
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {showExplanation && selectedOption === null && question.category === "終了" && (
                                        <div className="mt-8 flex justify-end">
                                            <button
                                                onClick={() => {
                                                    setResults([]); // 履歴を消すことで、次のgenerateNextQuestionで同じ5問が未解答として復活する
                                                    setQuestion(null);
                                                    setSelectedOption(null);
                                                    setShowExplanation(false);
                                                }}
                                                className="px-6 py-3 bg-white text-slate-900 hover:bg-indigo-50 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg"
                                            >
                                                スコアをリセットして同じ問題をもう一度解く
                                                <RefreshCcw className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                    {showExplanation && selectedOption === null && question.category !== "終了" && (
                                        <div className="mt-8 flex justify-end">
                                            <button
                                                onClick={generateNextQuestion}
                                                className="px-6 py-3 bg-white text-slate-900 hover:bg-indigo-50 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg"
                                            >
                                                メインに戻る
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
