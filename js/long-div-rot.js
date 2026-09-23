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

// long-div-rot.js
const questionDiv = document.getElementById('question');
const stepsDiv = document.getElementById('long-division-steps');
const stepPromptDiv = document.getElementById('step-prompt');
const guidedCheckbox = document.getElementById('guided-mode');
const checkBtn = document.getElementById('submit');
const feedbackDiv = document.getElementById('feedback');
const nextBtn = document.getElementById('next');
const timerDiv = document.getElementById('timer');
const difficultyDiv = document.getElementById('difficulty');

let timerInterval = null;
let timerStart = null;

const START_DIGITS = 3;
const MAX_DIGITS = 5;
let digitCount = START_DIGITS;

let dividendDigits = [];
let divisor = 0;
let finished = false;
let guidedOrder = [];

const GUIDED_KIND_PRIORITY = { quotient: 0, multiplication: 1, remainder: 2 };

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Precompute every long-division step up front so the grid can be laid out
// with correctly-sized/positioned blanks, the way a printed worksheet would be.
function computeSteps(digits, div) {
    let rem = 0;
    return digits.map(digit => {
        const runningValue = rem * 10 + digit;
        const quotientDigit = Math.floor(runningValue / div);
        const multiplication = quotientDigit * div;
        rem = runningValue - multiplication;
        return { digit, runningValue, quotientDigit, multiplication, remainder: rem };
    });
}

function makeInputCell(row, col, expected) {
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 1;
    input.inputMode = 'numeric';
    input.dataset.expected = String(expected);
    input.addEventListener('input', () => {
        input.value = input.value.replace(/[^0-9]/g, '').slice(-1);

        if (guidedCheckbox.checked) {
            if (input.value === '') {
                input.classList.remove('correct', 'wrong');
                return;
            }
            const isRight = input.value === input.dataset.expected;
            input.classList.toggle('correct', isRight);
            input.classList.toggle('wrong', !isRight);
            if (isRight) applyGuidedLock();
            return;
        }

        input.classList.remove('correct', 'wrong');
        if (input.value && !input.disabled) {
            const cells = Array.from(stepsDiv.querySelectorAll('.ld-grid input'));
            const idx = cells.indexOf(input);
            if (idx !== -1 && idx + 1 < cells.length) cells[idx + 1].focus();
        }
    });
    const cell = document.createElement('div');
    cell.className = 'ld-cell';
    cell.style.gridRow = String(row);
    cell.style.gridColumn = String(col);
    cell.appendChild(input);
    return { cell, input };
}

function makeStaticCell(row, col, text) {
    const cell = document.createElement('div');
    cell.className = 'ld-cell ld-static';
    cell.style.gridRow = String(row);
    cell.style.gridColumn = String(col);
    cell.textContent = text;
    return cell;
}

function makeLineCell(row, colStart, colSpan) {
    const cell = document.createElement('div');
    cell.className = 'ld-cell ld-line';
    cell.style.gridRow = String(row);
    cell.style.gridColumn = `${colStart} / span ${colSpan}`;
    return cell;
}

function makeSignCell(row) {
    const cell = document.createElement('div');
    cell.className = 'ld-cell ld-static';
    cell.style.gridRow = String(row);
    cell.style.gridColumn = '1';
    cell.textContent = '-';
    return cell;
}

// Content column c (0-indexed, aligned with dividend digit index) lives at
// grid column c+2; grid column 1 is a reserved gutter for minus signs.
const colOf = c => c + 2;

function buildGrid(steps, firstSignificant, divisor) {
    const n = steps.length;
    const grid = document.createElement('div');
    grid.className = 'ld-grid';
    grid.style.gridTemplateColumns = `max-content repeat(${n}, 1.4em)`;

    const inputs = [];
    let row = 1;

    // Quotient row
    for (let c = 0; c < n; c++) {
        if (c >= firstSignificant) {
            const { cell, input } = makeInputCell(row, colOf(c), steps[c].quotientDigit);
            input.dataset.kind = 'quotient';
            input.dataset.stepIndex = String(c);
            input.dataset.hint = `${steps[c].runningValue} ÷ ${divisor} = ?`;
            grid.appendChild(cell);
            inputs.push(input);
        }
    }
    row++;

    // Bracket rule
    grid.appendChild(makeLineCell(row, colOf(0), n));
    row++;

    // Divisor label, aligned with the dividend digit row
    const divisorCell = document.createElement('div');
    divisorCell.className = 'ld-cell ld-static ld-divisor';
    divisorCell.style.gridRow = String(row);
    divisorCell.style.gridColumn = '1';
    divisorCell.textContent = `${divisor})`;
    grid.appendChild(divisorCell);

    // Dividend digits (given, not editable)
    for (let c = 0; c < n; c++) {
        grid.appendChild(makeStaticCell(row, colOf(c), String(steps[c].digit)));
    }
    row++;

    // Multiplication + remainder rows per step
    steps.forEach((step, i) => {
        const multDigits = String(step.multiplication).split('');
        const startCol = i - multDigits.length + 1;

        grid.appendChild(makeSignCell(row));
        multDigits.forEach((ch, j) => {
            const { cell, input } = makeInputCell(row, colOf(startCol + j), Number(ch));
            input.dataset.kind = 'multiplication';
            input.dataset.stepIndex = String(i);
            input.dataset.hint = `${step.quotientDigit} × ${divisor} = ?`;
            grid.appendChild(cell);
            inputs.push(input);
        });
        row++;

        grid.appendChild(makeLineCell(row, colOf(startCol), multDigits.length));
        row++;

        const { cell: remCell, input: remInput } = makeInputCell(row, colOf(i), step.remainder);
        remInput.dataset.kind = 'remainder';
        remInput.dataset.stepIndex = String(i);
        remInput.dataset.hint = `${step.runningValue} − ${step.multiplication} = ?`;
        grid.appendChild(remCell);
        inputs.push(remInput);
        row++;
    });

    return { grid, inputs };
}

function applyGuidedLock() {
    if (finished) return;

    if (!guidedCheckbox.checked) {
        guidedOrder.forEach(input => { input.disabled = false; });
        checkBtn.style.display = 'inline-block';
        stepPromptDiv.textContent = 'Fill in the grid, then press Check.';
        return;
    }

    checkBtn.style.display = 'none';
    const idx = guidedOrder.findIndex(input => input.value !== input.dataset.expected);

    if (idx === -1) {
        finishQuestion(true);
        return;
    }

    guidedOrder.forEach((input, i) => { input.disabled = i !== idx; });
    const current = guidedOrder[idx];
    stepPromptDiv.textContent = current.dataset.hint;
    current.focus();
}

guidedCheckbox.addEventListener('change', applyGuidedLock);

function generateQuestion() {
    // Timer logic
    if (timerInterval) clearInterval(timerInterval);
    timerStart = Date.now();
    timerDiv.textContent = 'Time: 0s';
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStart) / 1000);
        timerDiv.textContent = `Time: ${elapsed}s`;
    }, 1000);

    const min = Math.pow(10, digitCount - 1);
    const max = Math.pow(10, digitCount) - 1;
    const dividend = getRandomInt(min, max);
    divisor = getRandomInt(2, 9);
    dividendDigits = String(dividend).split('').map(Number);
    finished = false;

    const steps = computeSteps(dividendDigits, divisor);
    let firstSignificant = steps.findIndex(s => s.quotientDigit !== 0);
    if (firstSignificant === -1) firstSignificant = steps.length - 1;

    difficultyDiv.textContent = `Digits: ${digitCount}`;
    questionDiv.textContent = 'Solve using long division:';
    stepPromptDiv.textContent = 'Fill in the grid, then press Check.';

    stepsDiv.innerHTML = '';
    const { grid, inputs } = buildGrid(steps, firstSignificant, divisor);
    stepsDiv.appendChild(grid);

    guidedOrder = inputs.slice().sort((a, b) => {
        const stepDiff = Number(a.dataset.stepIndex) - Number(b.dataset.stepIndex);
        if (stepDiff !== 0) return stepDiff;
        return GUIDED_KIND_PRIORITY[a.dataset.kind] - GUIDED_KIND_PRIORITY[b.dataset.kind];
    });

    feedbackDiv.textContent = '';
    checkBtn.disabled = false;
    checkBtn.textContent = 'Check';
    nextBtn.style.display = 'none';

    applyGuidedLock();
    if (!guidedCheckbox.checked) {
        const firstInput = grid.querySelector('input');
        if (firstInput) firstInput.focus();
    }
}

function finishQuestion(allCorrect) {
    finished = true;
    if (allCorrect) {
        feedbackDiv.textContent = `✅ Correct! ${dividendDigits.join('')} ÷ ${divisor} solved.`;
        feedbackDiv.style.color = 'green';
        correctCount++;
        updateScoreboard();
        digitCount = Math.min(digitCount + 1, MAX_DIGITS);
        if (typeof correct_answer === 'function') correct_answer();
        if (typeof playCorrectSound === 'function') playCorrectSound();
    } else {
        feedbackDiv.textContent = '❌ Not quite. Wrong digits are shown in red, correct answer revealed.';
        feedbackDiv.style.color = 'red';
        wrongCount++;
        updateScoreboard();
        if (typeof playErrorSound === 'function') playErrorSound();
    }

    stepsDiv.querySelectorAll('.ld-grid input').forEach(input => {
        if (input.value !== input.dataset.expected) {
            input.value = input.dataset.expected;
            input.classList.add('wrong');
        }
        input.disabled = true;
    });

    if (timerInterval) clearInterval(timerInterval);
    checkBtn.disabled = true;
    nextBtn.style.display = 'inline-block';
}

checkBtn.addEventListener('click', () => {
    if (finished) return;
    const inputs = Array.from(stepsDiv.querySelectorAll('.ld-grid input'));
    let filledCount = 0;
    let allFilledCorrect = true;

    inputs.forEach(input => {
        if (input.value === '') {
            input.classList.remove('correct', 'wrong');
            allFilledCorrect = false;
            return;
        }
        filledCount++;
        const isRight = input.value === input.dataset.expected;
        input.classList.toggle('correct', isRight);
        input.classList.toggle('wrong', !isRight);
        if (!isRight) allFilledCorrect = false;
    });

    if (filledCount < inputs.length) {
        feedbackDiv.textContent = 'Keep going — checked digits are marked so far.';
        feedbackDiv.style.color = '#132b5f';
        return;
    }

    finishQuestion(allFilledCorrect);
});

nextBtn.addEventListener('click', () => {
    if (timerInterval) clearInterval(timerInterval);
    generateQuestion();
});

// Allow space bar to trigger next question
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && nextBtn.style.display !== 'none' && !nextBtn.disabled) {
        const active = document.activeElement;
        if (active && active.tagName === 'INPUT') return;
        event.preventDefault();
        nextBtn.click();
    }
});

generateQuestion();
