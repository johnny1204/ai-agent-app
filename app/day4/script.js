const textInput = document.getElementById('textInput');
const charCountDisplay = document.getElementById('charCount');
const lineCountDisplay = document.getElementById('lineCount');
const noSpaceCountDisplay = document.getElementById('noSpaceCount');

function updateCounts() {
    const text = textInput.value;

    // Character Count
    const charCount = text.length; // Uses standard length including newlines/spaces

    // Line Count
    // If text is empty, 0 lines. Otherwise split by newline + 1
    // But if it's just empty string, it's 0.
    const lineCount = text.length === 0 ? 0 : text.split('\n').length;

    // No Spaces Count (excluding spaces, tabs, newlines)
    const noSpaceCount = text.replace(/\s/g, '').length;

    // Update DOM with animation (simple fade/number swap could be done, but simple text updates are fast enough for "real-time")
    animateValue(charCountDisplay, parseInt(charCountDisplay.textContent), charCount, 200);
    animateValue(lineCountDisplay, parseInt(lineCountDisplay.textContent), lineCount, 200);
    animateValue(noSpaceCountDisplay, parseInt(noSpaceCountDisplay.textContent), noSpaceCount, 200);
}

// Simple counter animation function
function animateValue(obj, start, end, duration) {
    if (start === end) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end;
        }
    };
    window.requestAnimationFrame(step);
}

// Optimization: Use input event for real-time updates
textInput.addEventListener('input', updateCounts);

// Initialize on load
updateCounts();
