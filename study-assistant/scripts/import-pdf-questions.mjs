import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config(); // Load variables from .env if present

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ ERROR: GEMINI_API_KEY is not set in the .env file.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// Local LLM and Database configurations
const LOCAL_LLM_URL = process.env.LOCAL_LLM_URL || "http://localhost:11434/v1/chat/completions";
const LOCAL_LLM_MODEL = process.env.LOCAL_LLM_MODEL || "llama3";
const DB_NAME = process.env.DB_NAME || "study-assistant-db";
const IS_REMOTE = process.argv.includes('--remote');
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

    // Auto-skip if already fully processed
    if (fs.existsSync(FINAL_JSON_FILE)) {
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

        console.log("\n[Step 1] Sending Multimodal prompt to Gemini 2.5 Flash to extract raw text and JSON structure...");
        const prompt = `
You are an expert IT instructor. I have uploaded two PDF files: exactly one file containing multiple-choice questions (often with 4 options like ア, イ, ウ, エ or similar), and another file containing the correct answers for those questions. The PDFs are Japanese IT exams (IPA).

First, cross-reference and identify the mapping between the questions and their correct answers.
Then, process each question and generate a cohesive JSON output.

For EACH question found in the PDF, output a JSON object adhering STRICTLY to this format (in a JSON array):
{
  "question": "The text of the question (e.g. 1. ...). Combine any fragmented sentences.",
  "options": [
    "Option text for ア",
    "Option text for イ",
    "Option text for ウ",
    "Option text for エ"
  ],
  "correctAnswer": 0, // integer index (0-3) of the correct option
  "category": "Infer a broad IT category (e.g., 'セキュリティ', 'ネットワーク', 'データベース', 'プロジェクトマネジメント', '基礎理論', etc.) based on the content."
}

Do NOT generate explanations. Only extract the structure and identify the correct answer index.

Output ONLY a raw, valid JSON array containing all the structured objects. Do not include markdown ticks, preamble, or postamble.
`;

        try {
            let response;
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
                    config: {
                        temperature: 0.2
                    }
                });
            } catch (fallbackError) {
                console.warn(`⚠️ Gemini 2.5 API Error: ${fallbackError.message}`);
                console.log(`🔄 Falling back to gemini-2.0-flash (higher free tier limits)...`);
                response = await ai.models.generateContent({
                    model: "gemini-2.0-flash",
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
                    config: {
                        temperature: 0.2
                    }
                });
            }

            const outputText = response.text;

            // Attempt to extract the JSON array safely
            const jsonMatch = outputText.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (!jsonMatch) {
                console.error("Failed to find JSON array from Gemini. Raw response:\n", outputText);
                return [];
            }

            extractedData = JSON.parse(jsonMatch[0]);

            console.log(`\n💾 Saving extraction results (${extractedData.length} items) to ${TEMP_JSON_FILE}...`);
            fs.writeFileSync(TEMP_JSON_FILE, JSON.stringify(extractedData, null, 2));

        } catch (error) {
            console.error("Gemini API Error:", error.message);
            return [];
        }
    }

    if (extractedData.length === 0) return [];

    console.log(`\n[Step 2] Sending ${extractedData.length} questions to Local LLM at ${LOCAL_LLM_URL} (Model: ${LOCAL_LLM_MODEL}) for explanation generation...`);

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
            const llmResponse = await fetch(LOCAL_LLM_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: LOCAL_LLM_MODEL,
                    messages: [{ role: "user", content: explanationPrompt }],
                    temperature: 0.2
                })
            });

            if (!llmResponse.ok) {
                console.error(`  -> Local LLM failed for Q${i + 1} with status ${llmResponse.status}. Skipping explanation.`);
                q.explanation = "解説の生成に失敗しました。";
                continue;
            }

            const result = await llmResponse.json();
            q.explanation = result.choices[0].message.content.trim();

            // Save progress continuously
            fs.writeFileSync(TEMP_JSON_FILE, JSON.stringify(extractedData, null, 2));

        } catch (error) {
            console.error(`  -> Network error generating explanation for Q${i + 1}: ${error.message}`);
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
            // Handle missing explanation (shouldn't happen but just in case)
            const safeExplanation = (q.explanation || "").replace(/'/g, "''");
            const safeCategory = (q.category || "その他").replace(/'/g, "''");
            return `('${safeQuestion}', '${safeOptions}', ${q.correctAnswer}, '${safeExplanation}', '${safeCategory}')`;
        }).join(",");

        const query = `INSERT INTO questions (question, options, correctAnswer, explanation, category) VALUES ${values};`;

        // Save the query to a temporary string and pass it to wrangler to avoid bash escaping issues
        const tempQueryFile = path.join(__dirname, 'temp_query.sql');
        fs.writeFileSync(tempQueryFile, query);

        const wranglerCmd = `npx wrangler d1 execute ${DB_NAME} ${IS_REMOTE ? '--remote' : '--local'} --file "${tempQueryFile}"`;
        console.log(`Executing: ${wranglerCmd}`);
        execSync(wranglerCmd, { stdio: 'inherit' });

        // Clean up
        fs.unlinkSync(tempQueryFile);

        console.log("✅ Bulk insert successful!");
    } catch (error) {
        console.error("❌ Failed to insert into D1:", error.message);
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

    const folders = fs.readdirSync(targetDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    if (folders.length === 0) {
        console.log("No exam folders found in data/pdf_exams/ to process.");
        process.exit(0);
    }

    console.log(`Found ${folders.length} exam folders to process.`);

    for (const folderName of folders) {
        const examDirPath = path.join(targetDir, folderName);
        console.log(`\n================================`);
        console.log(`🚀 Starting processing for: ${folderName}`);
        console.log(`================================`);

        const extractedQuestions = await extractQuestionsAndAnswers(examDirPath);

        if (extractedQuestions.length > 0) {
            console.log(`Successfully structured ${extractedQuestions.length} questions for ${folderName}.`);
            insertIntoD1(extractedQuestions);
        }
    }

    console.log("\n🎉 All 10-year batch import processing is complete!");
    process.exit(0);
}

main().catch(console.error);
