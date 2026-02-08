/**
 * Text Case Converter Logic
 */

const inputText = document.getElementById('inputText');
const charCount = document.getElementById('charCount');
const wordCount = document.getElementById('wordCount');
const lineCount = document.getElementById('lineCount');
const toast = document.getElementById('toast');
const copyBtnText = document.getElementById('copyBtnText');

// Initial Setup
updateCounts();

// Event Listeners
inputText.addEventListener('input', updateCounts);

// Transform Functions
function transformText(type) {
    const text = inputText.value;
    if (!text) return;

    let result = '';

    switch (type) {
        case 'uppercase':
            result = text.toUpperCase();
            break;
        case 'lowercase':
            result = text.toLowerCase();
            break;
        case 'capitalize':
            result = toCapitalize(text);
            break;
        case 'sentence':
            result = toSentenceCase(text);
            break;
        case 'alternating':
            result = toAlternatingCase(text);
            break;
        case 'inverse':
            result = toInverseCase(text);
            break;
        default:
            return;
    }

    inputText.value = result;
    updateCounts();
}

function toCapitalize(str) {
    return str.replace(/\b\w/g, function (l) { return l.toUpperCase() });
}

function toSentenceCase(str) {
    // Regex explanation:
    // (^\s*\w) -> Start of string, optional space, then a word char
    // | -> OR
    // ([.?!]\s+\w) -> Punctuation, space(s), then a word char
    return str.toLowerCase().replace(/(^\s*\w)|([.?!]\s+\w)/g, function (c) {
        return c.toUpperCase();
    });
}

function toAlternatingCase(str) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        if (i % 2 === 0) {
            result += str.charAt(i).toLowerCase();
        } else {
            result += str.charAt(i).toUpperCase();
        }
    }
    return result;
}

function toInverseCase(str) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        const char = str.charAt(i);
        if (char === char.toUpperCase()) {
            result += char.toLowerCase();
        } else {
            result += char.toUpperCase();
        }
    }
    return result;
}

// Utility Functions
function updateCounts() {
    const text = inputText.value;

    // Char Count
    charCount.textContent = text.length.toLocaleString();

    // Word Count
    // Split by whitespace and filter out empty strings
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    wordCount.textContent = words.length.toLocaleString();

    // Line Count
    const lines = text.split(/\n/);
    // If text is empty, lines length is 1 (empty string), so check length
    lineCount.textContent = (text.length === 0 ? 0 : lines.length).toLocaleString();
}

function clearText() {
    inputText.value = '';
    updateCounts();
    inputText.focus();
}

function copyText() {
    if (!inputText.value) return;

    inputText.select();
    navigator.clipboard.writeText(inputText.value).then(() => {
        showToast();
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

function showToast() {
    toast.classList.remove('translate-y-20', 'opacity-0');

    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 2000);
}
