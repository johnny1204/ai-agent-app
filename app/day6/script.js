document.addEventListener('DOMContentLoaded', () => {
    const lengthInput = document.getElementById('length');
    const quantityInput = document.getElementById('quantity');
    const uppercaseCb = document.getElementById('uppercase');
    const lowercaseCb = document.getElementById('lowercase');
    const numbersCb = document.getElementById('numbers');
    const symbolsCb = document.getElementById('symbols');
    const generateBtn = document.getElementById('generate-btn');
    const resultArea = document.getElementById('result-area');
    const passwordList = document.getElementById('password-list');

    const CHAR_SETS = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    generateBtn.addEventListener('click', () => {
        const length = parseInt(lengthInput.value);
        const quantity = parseInt(quantityInput.value);

        // Validation
        if (isNaN(length) || length < 4 || length > 64) {
            alert('文字数は4〜64の間で指定してください。');
            return;
        }
        if (isNaN(quantity) || quantity < 1 || quantity > 10) {
            alert('発行件数は1〜10件の間で指定してください。');
            return;
        }

        const options = {
            uppercase: uppercaseCb.checked,
            lowercase: lowercaseCb.checked,
            numbers: numbersCb.checked,
            symbols: symbolsCb.checked
        };

        if (!Object.values(options).some(Boolean)) {
            alert('少なくとも1つの文字タイプを選択してください。');
            return;
        }

        const passwords = generatePasswords(length, quantity, options);
        displayPasswords(passwords);
    });

    function generatePasswords(length, count, options) {
        let availableChars = '';
        let guaranteedChars = [];

        // Build character pools
        if (options.uppercase) {
            availableChars += CHAR_SETS.uppercase;
            guaranteedChars.push(getRandomChar(CHAR_SETS.uppercase));
        }
        if (options.lowercase) {
            availableChars += CHAR_SETS.lowercase;
            guaranteedChars.push(getRandomChar(CHAR_SETS.lowercase));
        }
        if (options.numbers) {
            availableChars += CHAR_SETS.numbers;
            guaranteedChars.push(getRandomChar(CHAR_SETS.numbers));
        }
        if (options.symbols) {
            availableChars += CHAR_SETS.symbols;
            guaranteedChars.push(getRandomChar(CHAR_SETS.symbols));
        }

        const results = [];
        for (let i = 0; i < count; i++) {
            let password = [...guaranteedChars];

            // Fill the rest
            while (password.length < length) {
                password.push(getRandomChar(availableChars));
            }

            // Shuffle
            password = shuffleArray(password);

            // Trim if exceeds length (though our logic shouldn't exceed unless guaranteed > length, which is handled by validation ideally, but min length 4 covers it)
            // But if guaranteedChars has 4 and length is 4, we are good.

            results.push(password.join(''));
        }
        return results;
    }

    function getRandomChar(str) {
        return str.charAt(Math.floor(Math.random() * str.length));
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function displayPasswords(passwords) {
        passwordList.innerHTML = '';
        passwords.forEach(pwd => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-lg group hover:border-sky-500/50 transition-colors';

            const span = document.createElement('span');
            span.className = 'font-mono text-lg text-slate-200 tracking-wider break-all mr-4';
            span.textContent = pwd;

            const btn = document.createElement('button');
            btn.className = 'w-10 h-10 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-sky-600 transition-all duration-300 flex-shrink-0 flex items-center justify-center';
            btn.innerHTML = '<i class="far fa-copy"></i>';
            btn.title = 'コピー';
            btn.onclick = () => copyToClipboard(pwd, btn);

            li.appendChild(span);
            li.appendChild(btn);
            passwordList.appendChild(li);
        });
        resultArea.classList.remove('hidden');
    }

    function copyToClipboard(text, btnElement) {
        navigator.clipboard.writeText(text).then(() => {
            const originalIcon = btnElement.innerHTML;
            btnElement.innerHTML = '<i class="fas fa-check"></i>';
            btnElement.style.color = 'green';

            setTimeout(() => {
                btnElement.innerHTML = originalIcon;
                btnElement.style.color = '';
            }, 2000);
        }).catch(err => {
            console.error('Copy failed', err);
            alert('コピーに失敗しました');
        });
    }
});
