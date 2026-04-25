import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import os from 'os';

dotenv.config(); // Load variables from .env if present

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ ERROR: GEMINI_API_KEY is not set in the .env file.");
    process.exit(1);
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const ai = new GoogleGenAI({ apiKey });

// Local LLM and Database configurations
const LOCAL_LLM_URL = process.env.LOCAL_LLM_URL || "http://localhost:11434/v1/chat/completions";
const LOCAL_LLM_MODEL = process.env.LOCAL_LLM_MODEL || "llama3";
const DB_NAME = process.env.DB_NAME || "study-assistant-db";
const IS_REMOTE = process.argv.includes('--remote');
const IS_FORCE = process.argv.includes('--force');
const PDF_EXAMS_DIR = process.env.PDF_EXAMS_DIR || 'data/pdf_exams';

async function uploadFile(filePath) {
    console.log(`Uploading ${filePath} to Gemini API...`);
    try {
        return await ai.files.upload({ file: filePath, mimeType: 'application/pdf' });
    } catch (error) {
        console.error(`Failed to upload ${filePath}:`, error.message);
        process.exit(1);
    }
}

async function extractQuestionsAndAnswers(examDirPath) {
    const questionsPdfPath = path.join(examDirPath, 'qs.pdf');
    const answersPdfPath = path.join(examDirPath, 'ans.pdf');
    const TEMP_JSON_FILE = path.join(examDirPath, 'extracted_questions.json');
    const FINAL_JSON_FILE = path.join(examDirPath, 'final_questions.json');

    // Auto-skip if already fully processed (unless forced)
    if (fs.existsSync(FINAL_JSON_FILE) && !IS_FORCE) {
        console.log(`\n✅ Skipping folder ${path.basename(examDirPath)} (Already fully processed)`);
        return [];
    }

    if (!fs.existsSync(questionsPdfPath) || !fs.existsSync(answersPdfPath)) {
        console.error(`⚠️ Skipping ${path.basename(examDirPath)}: Missing qs.pdf or ans.pdf`);
        return [];
    }

    let extractedData = [];

    // Check for intermediate file
    if (fs.existsSync(TEMP_JSON_FILE)) {
        console.log(`\n[Step 1] ✔ Found ${TEMP_JSON_FILE}! Loading previously extracted structure to save Gemini API calls...`);
        extractedData = JSON.parse(fs.readFileSync(TEMP_JSON_FILE, 'utf8'));
    } else {
        console.log(`\n[Processing: ${path.basename(examDirPath)}]`);
        console.log("Uploading both PDFs...");
        const qsFile = await uploadFile(questionsPdfPath);
        const ansFile = await uploadFile(answersPdfPath);

        try {
            const CHUNK_SIZE = 10;
            const TOTAL_QUESTIONS = 80; // Standard for IPA AM exams

            for (let start = 1; start <= TOTAL_QUESTIONS; start += CHUNK_SIZE) {
                const end = start + CHUNK_SIZE - 1;
                console.log(`\n[Step 1] Extracting questions ${start} to ${end}...`);

                const prompt = `
You are an expert IT instructor. I have uploaded two PDF files: a question file and an answer file from a Japanese IT exam (IPA).
Please focus ONLY on questions numbered ${start} to ${end}.

For EACH question in this range, output a JSON object in a JSON array (ALL TEXT MUST BE IN JAPANESE - 日本語で出力してください):
{
  "question": "The text of the question. Combine fragmented sentences.
    - TABLES: Convert to Markdown tables.
    - DIAGRAMS/IMAGES: 
        Produce a **Mermaid** code block (if logic/flow/tree) or an **SVG** code block (if custom layout). 
    Example: '...次の図のとおりである：
    \`\`\`mermaid
    graph TD...
    \`\`\`'",
  "options": ["ア text", "イ text", "ウ text", "エ text"],
  "correctAnswer": 0, // 0-3 index
  "questionNumber": ${start}, // exact number from PDF
  "category": "Choose from: ['セキュリティ', 'ネットワーク', 'データベース', '基礎理論', 'プロジェクトマネジメント']"
}

Output ONLY a raw JSON array. No markdown outside the JSON, no "🎉", no extra text.
`;

                let response;
                let success = false;
                let retryCount = 0;
                const maxRetries = 3;

                while (!success && retryCount < maxRetries) {
                    try {
                        response = await ai.models.generateContent({
                            model: "gemini-2.5-flash",
                            contents: [
                                {
                                    role: "user",
                                    parts: [
                                        { fileData: { fileUri: qsFile.uri, mimeType: qsFile.mimeType } },
                                        { fileData: { fileUri: ansFile.uri, mimeType: ansFile.mimeType } },
                                        { text: prompt }
                                    ]
                                }
                            ],
                            config: { temperature: 0.1 }
                        });

                        const outputText = response.text;
                        const jsonMatch = outputText.match(/\[\s*\{[\s\S]*\}\s*\]/);

                        if (jsonMatch) {
                            const chunkData = JSON.parse(jsonMatch[0]);
                            // Merge by questionNumber to avoid duplicates within same folder processing
                            chunkData.forEach(newQ => {
                                const existingIdx = extractedData.findIndex(exQ => exQ.questionNumber === newQ.questionNumber);
                                if (existingIdx !== -1) {
                                    extractedData[existingIdx] = { ...extractedData[existingIdx], ...newQ };
                                } else {
                                    extractedData.push(newQ);
                                }
                            });

                            success = true;
                            console.log(`✅ Successfully extracted ${chunkData.length} questions (${start}-${end}).`);
                        } else {
                            throw new Error("No JSON found in response");
                        }
                    } catch (err) {
                        retryCount++;
                        const isRateLimit = err.message.includes("429") || err.message.includes("RESOURCE_EXHAUSTED");
                        const waitTime = isRateLimit ? retryCount * 20000 : 5000;
                        console.warn(`⚠️ Error on chunk ${start}-${end}: ${err.message}. Retrying in ${waitTime / 1000}s... (${retryCount}/${maxRetries})`);
                        await wait(waitTime);
                    }
                }

                if (!success) {
                    console.error(`❌ Failed to extract chunk ${start}-${end} after ${maxRetries} attempts.`);
                }

                // Small delay between chunks to avoid rate limits
                await wait(2000);
            }

            if (extractedData.length > 0) {
                console.log(`\n💾 Saving total extraction results (${extractedData.length} items) to ${TEMP_JSON_FILE}...`);
                fs.writeFileSync(TEMP_JSON_FILE, JSON.stringify(extractedData, null, 2));
            }

        } catch (error) {
            console.error("Critical Error during extraction:", error.message);
            return [];
        }
    }

    if (extractedData.length === 0) return [];

    console.log(`\n[Step 2] Generating ${extractedData.length} explanations...`);

    // Add explanations using the Local LLM
    for (let i = 0; i < extractedData.length; i++) {
        const q = extractedData[i];

        if (q.explanation && q.explanation !== "解説の生成に失敗しました。" && q.explanation.length > 30) {
            console.log(`Skipping Q${i + 1}/${extractedData.length} (Explanation already generated).`);
            continue;
        }

        console.log(`Generating explanation for Question ${i + 1}/${extractedData.length}...`);

        const explanationPrompt = `
You are an expert IT instructor. I am providing you with a single multiple-choice question from a Japanese IT exam, its options, and the index of the correct answer.

Question: ${q.question}
Options:
0: ${q.options[0]}
1: ${q.options[1]}
2: ${q.options[2]}
3: ${q.options[3]}

The CORRECT answer is option index ${q.correctAnswer} (${q.options[q.correctAnswer]}).

Write a highly detailed, 300-character explanation of WHY this specific option is correct, and optionally why the others are wrong. Act as a teacher. MUST BE IN JAPANESE. Output ONLY the raw explanation text, do not include any prefixes or markdown formatting.
`;

        try {
            let explanationText = "";

            try {
                const llmResponse = await fetch(LOCAL_LLM_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: LOCAL_LLM_MODEL,
                        messages: [{ role: "user", content: explanationPrompt }],
                        temperature: 0.2,
                        stream: false // CRITICAL: Stop LM Studio from streaming
                    })
                });

                if (llmResponse.ok) {
                    const result = await llmResponse.json();
                    if (result && result.choices && result.choices[0] && result.choices[0].message) {
                        explanationText = result.choices[0].message.content.trim();
                    } else {
                        console.warn(`  -> Unexpected result structure from Q${i + 1}:`, JSON.stringify(result).substring(0, 100));
                    }
                } else {
                    console.warn(`  -> Local LLM (LM Studio) returned status ${llmResponse.status}: ${llmResponse.statusText}`);
                }
            } catch (localErr) {
                console.warn(`  -> Could not reach Local LLM at ${LOCAL_LLM_URL}: ${localErr.message}`);
                // Strictly Local LLM. No fallback requested.
            }

            q.explanation = explanationText || "解説の生成に失敗しました。";
            if (explanationText) {
                console.log(`  -> Q${i + 1}: Explanation generated via Local LLM.`);
            }

            // Save progress continuously (non-blocking for EACCES errors)
            try {
                fs.writeFileSync(TEMP_JSON_FILE, JSON.stringify(extractedData, null, 2));
            } catch (fsErr) {
                if (fsErr.code === 'EACCES') {
                    console.warn(`  -> Warning: Could not save progress to ${TEMP_JSON_FILE} due to permissions. Continuing anyway...`);
                } else {
                    throw fsErr;
                }
            }

        } catch (error) {
            console.error(`  -> Critical error generating explanation for Q${i + 1}: ${error.message}`);
            q.explanation = "解説の生成に失敗しました。";
        }
    }

    console.log(`\n💾 Saving final complete results to ${FINAL_JSON_FILE}...`);
    fs.writeFileSync(FINAL_JSON_FILE, JSON.stringify(extractedData, null, 2));

    return extractedData;
}

function insertIntoD1(questionsArray) {
    if (!questionsArray || questionsArray.length === 0) {
        console.log("No questions to insert.");
        return;
    }

    try {
        console.log(`\nInserting ${questionsArray.length} questions into D1 database via Wrangler...`);
        // Format the values string to batch insert
        const values = questionsArray.map(q => {
            // Escape single quotes for SQL
            const safeQuestion = q.question.replace(/'/g, "''");
            const safeOptions = JSON.stringify(q.options).replace(/'/g, "''");
            const safeExplanation = (q.explanation || "").replace(/'/g, "''");
            const safeCategory = (q.category || "その他").replace(/'/g, "''");
            const examYear = q.examYear || 'NULL';
            const examSeason = q.examSeason ? `'${q.examSeason.replace(/'/g, "''")}'` : 'NULL';
            const questionNumber = q.questionNumber || 'NULL';

            return `('${safeQuestion}', '${safeOptions}', ${q.correctAnswer}, '${safeExplanation}', '${safeCategory}', ${examYear}, ${examSeason}, ${questionNumber})`;
        }).join(",");

        const query = `INSERT INTO questions (question, options, correctAnswer, explanation, category, exam_year, exam_season, question_number) VALUES ${values};`;

        // Save the query to a temporary string and pass it to wrangler to avoid bash escaping issues
        const tempQueryFile = path.join(os.tmpdir(), `temp_query_${Date.now()}.sql`);
        fs.writeFileSync(tempQueryFile, query);

        const wranglerCmd = `npx wrangler d1 execute ${DB_NAME} ${IS_REMOTE ? '--remote' : '--local'} --file "${tempQueryFile}"`;
        console.log(`Executing: ${wranglerCmd}`);
        execSync(wranglerCmd, { stdio: 'inherit' });

        // Clean up
        fs.unlinkSync(tempQueryFile);

        console.log("✅ Bulk insert successful!");
        return true;
    } catch (error) {
        console.error("❌ Failed to insert into D1:", error.message);
        return false;
    }
}

async function main() {
    // Determine path based on executing from the study-assistant folder
    // Determine path based on environment variable or default
    const targetDir = path.isAbsolute(PDF_EXAMS_DIR)
        ? PDF_EXAMS_DIR
        : path.join(process.cwd(), PDF_EXAMS_DIR);

    if (!fs.existsSync(targetDir)) {
        console.error(`❌ ERROR: Could not find target directory ${targetDir}.`);
        console.error("Please create standard folders inside it (e.g. 2023_spring/) featuring qs.pdf and ans.pdf");
        process.exit(1);
    }

    let folders = fs.readdirSync(targetDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    // Filter by specific folder if provided as an argument (excluding --remote)
    const specificFolderArg = process.argv.find(arg => !arg.startsWith('--') && arg.endsWith('_am'));
    if (specificFolderArg) {
        const specificFolder = path.basename(specificFolderArg);
        if (folders.includes(specificFolder)) {
            folders = [specificFolder];
            console.log(`🎯 Filtering to specific folder: ${specificFolder}`);
        } else {
            console.error(`❌ ERROR: Folder ${specificFolder} not found in ${targetDir}`);
            process.exit(1);
        }
    }

    if (folders.length === 0) {
        console.log("No exam folders found in data/pdf_exams/ to process.");
        process.exit(0);
    }

    console.log(`Found ${folders.length} exam folders to process.`);

    let totalImported = 0;

    for (const folderName of folders) {
        const examDirPath = path.join(targetDir, folderName);
        console.log(`\n================================`);
        console.log(`🚀 Starting processing for: ${folderName}`);
        console.log(`================================`);

        let extractedQuestions = await extractQuestionsAndAnswers(examDirPath);

        if (extractedQuestions.length > 0) {
            console.log(`Successfully structured ${extractedQuestions.length} questions for ${folderName}.`);

            // Extract year and season from folder name (e.g., 2024r06a_ap_am)
            // Format: YYYY(EraYear)(SeasonCode)_...
            // a = spring (秋ではない, 春), h = fall (秋)
            const yearMatch = folderName.match(/^(\d{4})/);
            const seasonMatch = folderName.match(/([ah])_/);
            const year = yearMatch ? parseInt(yearMatch[1]) : null;
            let season = null;
            if (seasonMatch) {
                season = seasonMatch[1] === 'a' ? '春期' : '秋期';
            }

            extractedQuestions = extractedQuestions.map(q => ({
                ...q,
                examYear: year,
                examSeason: season
            }));

            const success = insertIntoD1(extractedQuestions);
            if (success) {
                totalImported += extractedQuestions.length;
            }
        }
    }

    if (totalImported > 0) {
        console.log(`\n🎉 Success! A total of ${totalImported} questions were processed and imported.`);
    } else {
        console.log("\n⚠️ No new questions were imported. Check the logs for errors.");
    }
    process.exit(0);
}

main().catch(console.error);
