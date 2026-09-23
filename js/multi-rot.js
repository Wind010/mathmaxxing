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
const MISSED_REPEAT_MIN = 1;
const MISSED_REPEAT_MAX = 10;
const MASTERY_STREAK_TO_CLEAR = 2;
const missedQuestionSchedule = new Map();

function logRepetition(message, data) {
    if (data !== undefined) {
        console.log(`[repetition] ${message}`, data);
        return;
    }
    console.log(`[repetition] ${message}`);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getQuestionKey(question) {
    return `${question.a}x${question.b}`;
}

function getAdaptiveRepeatMax(missCount) {
    // More misses make the retry interval shorter.
    return Math.max(3, MISSED_REPEAT_MAX - missCount * 2);
}

function getAdaptiveDueIn(missCount) {
    return getRandomInt(MISSED_REPEAT_MIN, getAdaptiveRepeatMax(missCount));
}

function decrementMissedSchedule() {
    if (missedQuestionSchedule.size > 0) {
        logRepetition('Tick: decrementing due counters', { scheduledItems: missedQuestionSchedule.size });
    }
    missedQuestionSchedule.forEach((entry, key) => {
        missedQuestionSchedule.set(key, {
            question: entry.question,
            dueIn: entry.dueIn - 1,
            missCount: entry.missCount,
            masteryStreak: entry.masteryStreak
        });
    });
}

function getNextDueMissedQuestion() {
    for (const [key, entry] of missedQuestionSchedule) {
        if (entry.dueIn <= 0) {
            logRepetition('Serving due missed question', {
                key,
                question: entry.question,
                missCount: entry.missCount,
                masteryStreak: entry.masteryStreak
            });
            return { ...entry.question };
        }
    }
    return null;
}

function scheduleMissedQuestion(question) {
    const key = getQuestionKey(question);
    const existing = missedQuestionSchedule.get(key);

    if (existing) {
        const missCount = existing.missCount + 1;
        const adaptiveDueIn = getAdaptiveDueIn(missCount);
        const dueIn = Math.min(existing.dueIn, adaptiveDueIn);
        missedQuestionSchedule.set(key, {
            question: { ...question },
            dueIn,
            missCount,
            masteryStreak: 0
        });
        logRepetition('Rescheduled repeated miss', {
            key,
            question,
            missCount,
            dueIn,
            previousDueIn: existing.dueIn
        });
        return;
    }

    const dueIn = getAdaptiveDueIn(1);
    missedQuestionSchedule.set(key, {
        question: { ...question },
        dueIn,
        missCount: 1,
        masteryStreak: 0
    });
    logRepetition('Scheduled new missed question', {
        key,
        question,
        dueIn,
        missCount: 1
    });
}

function handleCorrectAnswer(question) {
    const key = getQuestionKey(question);
    const existing = missedQuestionSchedule.get(key);

    if (!existing) {
        logRepetition('Correct answer on unscheduled question', { key, question });
        return;
    }

    const masteryStreak = existing.masteryStreak + 1;

    if (masteryStreak >= MASTERY_STREAK_TO_CLEAR) {
        missedQuestionSchedule.delete(key);
        logRepetition('Mastered and removed from schedule', {
            key,
            question,
            masteryStreak,
            missCount: existing.missCount
        });
        return;
    }

    const dueIn = getRandomInt(2, 4);
    missedQuestionSchedule.set(key, {
        question: { ...question },
        dueIn,
        missCount: Math.max(1, existing.missCount - 1),
        masteryStreak
    });
    logRepetition('Correct but still in learning schedule', {
        key,
        question,
        dueIn,
        missCount: Math.max(1, existing.missCount - 1),
        masteryStreak
    });
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
        decrementMissedSchedule();
        const nextMissed = getNextDueMissedQuestion();

        if (nextMissed) {
            currentQuestion = nextMissed;
            logRepetition('Question source: scheduled repeat', {
                question: currentQuestion,
                queueSize: missedQuestionSchedule.size
            });
        } else {
            const a = getRandomInt(1, 12);
            const b = getRandomInt(1, 12);
            currentQuestion = { a, b, answer: a * b };
            if (missedQuestionSchedule.size > 0) {
                logRepetition('Question source: random (no due repeats yet)', {
                    question: currentQuestion,
                    queueSize: missedQuestionSchedule.size
                });
            }
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
        handleCorrectAnswer(currentQuestion);
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
        scheduleMissedQuestion(currentQuestion);
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

generateQuestion();
