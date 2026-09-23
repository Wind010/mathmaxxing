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

// prime-factor-finder.js
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

function getPrimeFactors(n) {
    const factors = [];
    let remaining = n;
    for (let p = 2; p * p <= remaining; p++) {
        while (remaining % p === 0) {
            factors.push(p);
            remaining /= p;
        }
    }
    if (remaining > 1) factors.push(remaining);
    return factors;
}

function renderFactorProgress(revealed) {
    factorProgressDiv.innerHTML = '';
    currentFactors.forEach((factor, i) => {
        const found = revealed[i];
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

    const min = digitCount === 1 ? 2 : Math.pow(10, digitCount - 1);
    const max = Math.pow(10, digitCount) - 1;
    currentNumber = getRandomInt(min, max);
    currentFactors = getPrimeFactors(currentNumber);

    difficultyDiv.textContent = `Digits: ${digitCount}`;
    questionDiv.textContent = `List the prime factorization of ${currentNumber}`;
    answerInput.value = '';
    feedbackDiv.textContent = '';
    answerInput.disabled = false;
    submitBtn.disabled = false;
    nextBtn.style.display = 'none';
    renderFactorProgress(currentFactors.map(() => false));
    answerInput.focus();
}

submitBtn.addEventListener('click', () => {
    if (timerInterval) clearInterval(timerInterval);
    const userFactors = answerInput.value
        .split(/[\s,]+/)
        .filter(s => s.length > 0)
        .map(s => parseInt(s, 10));

    const isValid = userFactors.length > 0 && userFactors.every(n => !isNaN(n));

    if (!isValid) {
        feedbackDiv.textContent = 'Please enter a list of numbers.';
        return;
    }

    const sortedTyped = [...userFactors].sort((a, b) => a - b);
    const sortedActual = [...currentFactors].sort((a, b) => a - b);
    const isCorrect = sortedTyped.length === sortedActual.length &&
        sortedTyped.every((n, i) => n === sortedActual[i]);

    if (isCorrect) {
        feedbackDiv.textContent = '✅ Correct!';
        feedbackDiv.style.color = 'green';
        renderFactorProgress(currentFactors.map(() => true));
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
        feedbackDiv.textContent = `❌ Incorrect. The prime factorization of ${currentNumber} is: ${sortedActual.join(' x ')}`;
        feedbackDiv.style.color = 'red';
        renderFactorProgress(currentFactors.map(() => true));
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
