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

// div-rot.js
const questionDiv = document.getElementById('question');
const answerInput = document.getElementById('answer');
const submitBtn = document.getElementById('submit');
const feedbackDiv = document.getElementById('feedback');
const nextBtn = document.getElementById('next');
const timerDiv = document.getElementById('timer');
const difficultyDiv = document.getElementById('difficulty');

let timerInterval = null;
let timerStart = null;

const MAX_DIGITS = 2;
let digitCount = 1;
let currentQuestion = {};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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
    const dividend = getRandomInt(min, max);
    const divisor = getRandomInt(2, 9);
    currentQuestion = {
        dividend,
        divisor,
        quotient: Math.floor(dividend / divisor),
        remainder: dividend % divisor
    };

    difficultyDiv.textContent = `Digits: ${digitCount}`;
    questionDiv.innerHTML = `<span class="operand" data-label="Dividend">${currentQuestion.dividend}</span> ÷ <span class="operand" data-label="Divisor">${currentQuestion.divisor}</span> = ?`;
    answerInput.value = '';
    feedbackDiv.textContent = '';
    answerInput.disabled = false;
    submitBtn.disabled = false;
    nextBtn.style.display = 'none';
    answerInput.focus();
}

submitBtn.addEventListener('click', () => {
    if (timerInterval) clearInterval(timerInterval);
    const parts = answerInput.value
        .split(/[\s,]+/)
        .filter(s => s.length > 0)
        .map(s => parseInt(s, 10));

    if (parts.length !== 2 || parts.some(n => isNaN(n))) {
        feedbackDiv.textContent = 'Please enter both a quotient and remainder, e.g. "12, 3".';
        return;
    }

    const [userQuotient, userRemainder] = parts;
    const isCorrect = userQuotient === currentQuestion.quotient &&
        userRemainder === currentQuestion.remainder;

    if (isCorrect) {
        feedbackDiv.textContent = '✅ Correct!';
        feedbackDiv.style.color = 'green';
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
        feedbackDiv.textContent = `❌ Incorrect. ${currentQuestion.dividend} ÷ ${currentQuestion.divisor} = ${currentQuestion.quotient} remainder ${currentQuestion.remainder}.`;
        feedbackDiv.style.color = 'red';
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
