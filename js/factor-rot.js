// Scoreboard variables
let correctCount = 0;
let wrongCount = 0;
const correctCountSpan = document.getElementById('correct-count');
const wrongCountSpan = document.getElementById('wrong-count');
const correctPercentSpan = document.getElementById('correct-percent');
const wrongPercentSpan = document.getElementById('wrong-percent');
const resetScoreBtn = document.getElementById('reset-score');

function updateScoreboard() {
    const total = correctCount + wrongCount;
    const correctPercent = total ? Math.round((correctCount / total) * 100) : 0;
    const wrongPercent = total ? Math.round((wrongCount / total) * 100) : 0;
    correctCountSpan.textContent = correctCount;
    wrongCountSpan.textContent = wrongCount;
    correctPercentSpan.textContent = correctPercent;
    wrongPercentSpan.textContent = wrongPercent;
}

resetScoreBtn.addEventListener('click', () => {
    correctCount = 0;
    wrongCount = 0;
    updateScoreboard();
});

// factor-finder.js
const questionDiv = document.getElementById('question');
const answerInput = document.getElementById('answer');
const submitBtn = document.getElementById('submit');
const feedbackDiv = document.getElementById('feedback');
const nextBtn = document.getElementById('next');
const timerDiv = document.getElementById('timer');
const difficultyDiv = document.getElementById('difficulty');
const factorProgressDiv = document.getElementById('factor-progress');

let timerInterval = null;
let timerStart = null;

const MAX_DIGITS = 4;
let digitCount = 1;
let currentNumber = 0;
let currentFactors = [];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getFactors(n) {
    const factors = [];
    for (let i = 1; i * i <= n; i++) {
        if (n % i === 0) {
            factors.push(i);
            if (i !== n / i) factors.push(n / i);
        }
    }
    return factors.sort((a, b) => a - b);
}

function renderFactorProgress(foundFactors) {
    factorProgressDiv.innerHTML = '';
    currentFactors.forEach(factor => {
        const found = foundFactors.has(factor);
        const pill = document.createElement('span');
        pill.className = 'factor-pill' + (found ? ' found' : '');
        pill.textContent = found ? factor : '?';
        factorProgressDiv.appendChild(pill);
    });
}

function generateQuestion() {
    // Timer logic
    if (timerInterval) clearInterval(timerInterval);
    timerStart = Date.now();
    timerDiv.textContent = 'Time: 0s';
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStart) / 1000);
        timerDiv.textContent = `Time: ${elapsed}s`;
    }, 1000);

    const min = digitCount === 1 ? 1 : Math.pow(10, digitCount - 1);
    const max = Math.pow(10, digitCount) - 1;
    currentNumber = getRandomInt(min, max);
    currentFactors = getFactors(currentNumber);

    difficultyDiv.textContent = `Digits: ${digitCount}`;
    questionDiv.textContent = `List all factors of ${currentNumber}`;
    answerInput.value = '';
    feedbackDiv.textContent = '';
    answerInput.disabled = false;
    submitBtn.disabled = false;
    nextBtn.style.display = 'none';
    renderFactorProgress(new Set());
    answerInput.focus();
}

submitBtn.addEventListener('click', () => {
    if (timerInterval) clearInterval(timerInterval);
    const userFactors = answerInput.value
        .split(/[\s,]+/)
        .filter(s => s.length > 0)
        .map(s => parseInt(s, 10));

    const isValid = userFactors.length > 0 && userFactors.every(n => !isNaN(n));
    const sortedUnique = [...new Set(userFactors)].sort((a, b) => a - b);
    const isCorrect = isValid &&
        sortedUnique.length === currentFactors.length &&
        sortedUnique.every((n, i) => n === currentFactors[i]);

    if (!isValid) {
        feedbackDiv.textContent = 'Please enter a list of numbers.';
        return;
    }

    if (isCorrect) {
        feedbackDiv.textContent = '✅ Correct!';
        feedbackDiv.style.color = 'green';
        renderFactorProgress(new Set(currentFactors));
        correctCount++;
        updateScoreboard();
        digitCount = Math.min(digitCount + 1, MAX_DIGITS);
        if (typeof correct_answer === 'function') {
            correct_answer();
        }
        if (typeof playCorrectSound === 'function') {
            playCorrectSound();
        }
    } else {
        feedbackDiv.textContent = `❌ Incorrect. The factors of ${currentNumber} are: ${currentFactors.join(', ')}`;
        feedbackDiv.style.color = 'red';
        renderFactorProgress(new Set(currentFactors));
        wrongCount++;
        updateScoreboard();
        if (typeof playErrorSound === 'function') {
            playErrorSound();
        }
    }

    answerInput.disabled = true;
    submitBtn.disabled = true;
    nextBtn.style.display = 'inline-block';
});

nextBtn.addEventListener('click', () => {
    if (timerInterval) clearInterval(timerInterval);
    generateQuestion();
});

answerInput.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        submitBtn.click();
    }
});

// Allow space bar to trigger next question
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && nextBtn.style.display !== 'none' && !nextBtn.disabled) {
        event.preventDefault();
        nextBtn.click();
    }
});

generateQuestion();
