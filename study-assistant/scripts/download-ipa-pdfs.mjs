import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_URL = 'https://www.ipa.go.jp/shiken/mondai-kaiotu';
const INDEX_URL = `${ROOT_URL}/index.html`;

const DATA_DIR = path.join(__dirname, '..', 'data', 'pdf_exams');

async function downloadFile(url, destPath) {
    if (fs.existsSync(destPath)) {
        console.log(`Skipping (already exists): ${path.basename(destPath)}`);
        return true;
    }

    try {
        console.log(`Downloading: ${url}`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(destPath, buffer);
        console.log(`Saved: ${destPath}`);
        return true;
    } catch (err) {
        console.error(`Failed to download ${url}: ${err.message}`);
        return false;
    }
}

async function scrapeIPAPDFs() {
    console.log(`Fetching index page: ${INDEX_URL}`);
    const indexResponse = await fetch(INDEX_URL);
    if (!indexResponse.ok) {
        console.error("Failed to fetch index page.");
        return;
    }
    const indexHtml = await indexResponse.text();

    // Find all links to yearly exam pages
    // e.g. <a href="/shiken/mondai-kaiotu/2024r06.html">
    const yearPageRegex = /href="\/shiken\/mondai-kaiotu\/(20\d{2}[A-Za-z0-9]+)\.html"/g;
    let match;
    const yearPages = new Set();
    while ((match = yearPageRegex.exec(indexHtml)) !== null) {
        yearPages.add(match[1]); // e.g. "2024r06"
    }

    const pages = Array.from(yearPages);
    console.log(`Found ${pages.length} exam year pages.`);

    // If data dir doesn't exist, create it
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Since we want 10 years, we might want to cap it. But let's just grab everything we can find.
    for (const pageId of pages) {
        const pageUrl = `${ROOT_URL}/${pageId}.html`;
        console.log(`\nScanning year page: ${pageUrl}`);

        try {
            const pageResp = await fetch(pageUrl);
            if (!pageResp.ok) continue;
            const pageHtml = await pageResp.text();

            // We specifically want Applied Information Technology Engineer (AP), Morning (AM).
            // Usually the links are like `m42obm000000afqx-att/2024r06a_ap_am_qs.pdf`
            // Regex to find qs and ans links
            const pdfRegex = /href="([^"]+\/([A-Za-z0-9_]+_ap_am_(qs|ans))\.pdf)"/g;
            let pdfMatch;

            const structuredPairs = {}; // term identifier -> { qs: url, ans: url }

            while ((pdfMatch = pdfRegex.exec(pageHtml)) !== null) {
                const relativeUrl = pdfMatch[1];
                const filenameWithoutExt = pdfMatch[2]; // e.g. 2024r06a_ap_am_qs
                const type = pdfMatch[3]; // qs or ans

                // Extract the season/year prefix, e.g. 2024r06a_ap_am -> term = 2024r06a_ap_am
                // Actually the term should just be the prefix before _qs or _ans
                const term = filenameWithoutExt.replace(/_(qs|ans)$/, '');

                if (!structuredPairs[term]) {
                    structuredPairs[term] = {};
                }

                // Resolve URL
                const absoluteUrl = new URL(relativeUrl, pageUrl).href;
                structuredPairs[term][type] = absoluteUrl;
            }

            // Now download them into specific folders
            for (const [term, links] of Object.entries(structuredPairs)) {
                if (links.qs && links.ans) {
                    const examDir = path.join(DATA_DIR, term); // e.g. data/pdf_exams/2024r06a_ap_am
                    if (!fs.existsSync(examDir)) {
                        fs.mkdirSync(examDir, { recursive: true });
                    }

                    console.log(`\nFound complete pair for ${term}`);
                    const qsDest = path.join(examDir, 'qs.pdf');
                    const ansDest = path.join(examDir, 'ans.pdf');

                    await downloadFile(links.qs, qsDest);
                    await downloadFile(links.ans, ansDest);

                    // Add a tiny delay to be polite to the IPA servers
                    await new Promise(r => setTimeout(r, 1000));
                } else {
                    console.log(`Found incomplete pair for ${term}. Skipping.`);
                }
            }

        } catch (err) {
            console.error(`Error processing ${pageUrl}: ${err.message}`);
        }
    }

    console.log("\nFinished scanning and downloading AP exams.");
}

scrapeIPAPDFs().catch(console.error);
