const fs = require('fs');
const pdfParse = require('pdf-parse');

const targetPdf = process.argv[2];

if (!targetPdf) {
    console.error("No PDF provided");
    process.exit(1);
}

try {
    const dataBuffer = fs.readFileSync(targetPdf);
    pdfParse(dataBuffer).then(function (data) {
        console.log(data.text);
    }).catch(function (err) {
        console.error("PDF Parse error:", err);
        process.exit(1);
    });
} catch (error) {
    console.error("File read error:", error);
    process.exit(1);
}
