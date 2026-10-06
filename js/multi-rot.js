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
// script.js
const questionDiv = document.getElementById('question');
const answerInput = document.getElementById('answer');
const submitBtn = document.getElementById('submit');
const feedbackDiv = document.getElementById('feedback');
const nextBtn = document.getElementById('next');
const timerDiv = document.getElementById('timer');

let timerInterval = null;
let timerStart = null;


let currentQuestion = {};
const scheduler = createRepeatScheduler({
    storageKey: 'multiRot.missedSchedule',
    getKey: q => `${q.a}x${q.b}`,
    isValid: q => Number.isInteger(q.a) && Number.isInteger(q.b) &&
        q.a >= 1 && q.a <= 12 && q.b >= 1 && q.b <= 12 &&
        q.answer === q.a * q.b
});

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const excludeCheckboxes = document.querySelectorAll('.exclude-factor');

function getExcludedFactors() {
    return new Set(
        Array.from(excludeCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => parseInt(cb.value, 10))
    );
}

function isExcluded(question, excluded) {
    return excluded.has(question.a) || excluded.has(question.b);
}

function getRandomFactor(excluded) {
    const allowed = [];
    for (let n = 1; n <= 12; n++) {
        if (!excluded.has(n)) allowed.push(n);
    }
    return allowed[getRandomInt(0, allowed.length - 1)];
}

let isFirstQuestion = true;
function generateQuestion() {
    // Timer logic
    if (timerInterval) clearInterval(timerInterval);
    timerStart = Date.now();
    timerDiv.textContent = 'Time: 0s';
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStart) / 1000);
        timerDiv.textContent = `Time: ${elapsed}s`;
    }, 1000);
    if (isFirstQuestion) {
        currentQuestion = { a: 6, b: 7, answer: 42 };
        isFirstQuestion = false;
    } else {
        scheduler.tick();
        const excluded = getExcludedFactors();
        const nextMissed = scheduler.nextDue(q => !isExcluded(q, excluded));

        if (nextMissed) {
            currentQuestion = nextMissed;
        } else {
            const a = getRandomFactor(excluded);
            const b = getRandomFactor(excluded);
            currentQuestion = { a, b, answer: a * b };
        }
    }
    questionDiv.textContent = `What is ${currentQuestion.a} × ${currentQuestion.b}?`;
    answerInput.value = '';
    feedbackDiv.textContent = '';
    answerInput.disabled = false;
    submitBtn.disabled = false;
    nextBtn.style.display = 'none';
    // Set color group on quiz-container
    const container = document.getElementById('quiz-container');
    // Remove all group classes
    container.className = container.className
        .split(' ')
        .filter(c => !/^group-\d+$/.test(c))
        .join(' ');
    container.classList.add(`group-${currentQuestion.a}`);
    answerInput.focus();
}

submitBtn.addEventListener('click', () => {
    if (timerInterval) clearInterval(timerInterval);
    const userAnswer = parseInt(answerInput.value, 10);
    if (isNaN(userAnswer)) {
        feedbackDiv.textContent = 'Please enter a number.';
        return;
    }
    if (userAnswer === currentQuestion.answer) {
        feedbackDiv.textContent = '✅ Correct!';
        feedbackDiv.style.color = 'green';
        correctCount++;
        scheduler.recordCorrect(currentQuestion);
        updateScoreboard();
        if (typeof correct_answer === 'function') {
            correct_answer();
            if (currentQuestion.a === 6 && currentQuestion.b === 7) {
                if (typeof playSixSevenSound === 'function') {
                    playSixSevenSound();
                }
            } else {
                playCorrectSound();
            }
        }
    } else {
        // Show full equation and nearest equations
        const a = currentQuestion.a;
        const b = currentQuestion.b;
        let feedback = `❌ Incorrect. The answer is <strong>${a} × ${b} = ${a * b}</strong>.<br>`;
        // Nearest equations: b-1 and b+1 (within 1-12)
        let neighbors = [];
        if (b - 1 >= 1) neighbors.push(`${a} × ${b - 1} = ${a * (b - 1)}`);
        if (b + 1 <= 12) neighbors.push(`${a} × ${b + 1} = ${a * (b + 1)}`);
        if (neighbors.length > 0) {
            feedback += 'Nearby: ' + neighbors.join(', ');
        }
        feedbackDiv.innerHTML = feedback;
        feedbackDiv.style.color = 'red';
        wrongCount++;
        updateScoreboard();
        if (typeof playErrorSound === 'function') {
            playErrorSound();
        }
        // Schedule this question to reappear within the next 10 questions
        scheduler.recordMiss(currentQuestion);
        updateScoreboard();
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
    // Only trigger if Next button is visible and enabled
    if (event.code === 'Space' && nextBtn.style.display !== 'none' && !nextBtn.disabled) {
        event.preventDefault();
        nextBtn.click();
    }
});

// Replace an unanswered question if its factor just got excluded
excludeCheckboxes.forEach(cb => cb.addEventListener('change', () => {
    if (!submitBtn.disabled && isExcluded(currentQuestion, getExcludedFactors())) {
        generateQuestion();
    }
}));

generateQuestion();
