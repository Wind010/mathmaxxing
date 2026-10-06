// Shared repetition scheduler: missed problems come back soon until answered
// correctly several times in a row. Progress is kept in localStorage.

// Repetition settings (tweak here)
// A missed (or still-learning) problem returns within this many questions.
const REPEAT_WINDOW_MIN = 1;
const REPEAT_WINDOW_MAX = 3;
// Consecutive correct answers needed before a missed problem is cleared.
const MASTERY_STREAK_TO_CLEAR = 3;

// getKey(question) -> unique string; isValid(question) -> whether a stored
// question is still sane (guards against corrupt or tampered storage).
function createRepeatScheduler({ storageKey, getKey, isValid }) {
    const schedule = new Map();

    function log(message, data) {
        if (data !== undefined) {
            console.log(`[repetition] ${message}`, data);
            return;
        }
        console.log(`[repetition] ${message}`);
    }

    function randomDueIn() {
        return REPEAT_WINDOW_MIN +
            Math.floor(Math.random() * (REPEAT_WINDOW_MAX - REPEAT_WINDOW_MIN + 1));
    }

    function save() {
        try {
            localStorage.setItem(storageKey, JSON.stringify(Array.from(schedule)));
        } catch (e) {
            // Storage unavailable or full; schedule just won't persist.
        }
    }

    function load() {
        try {
            JSON.parse(localStorage.getItem(storageKey) || '[]').forEach(([key, entry]) => {
                if (entry && entry.question && isValid(entry.question) &&
                    getKey(entry.question) === key &&
                    Number.isInteger(entry.dueIn) &&
                    Number.isInteger(entry.masteryStreak)) {
                    schedule.set(key, {
                        question: entry.question,
                        // Clamp in case the window was shrunk since this was saved.
                        dueIn: Math.min(entry.dueIn, REPEAT_WINDOW_MAX),
                        masteryStreak: entry.masteryStreak
                    });
                }
            });
        } catch (e) {
            schedule.clear();
        }
    }

    load();

    return {
        size: () => schedule.size,

        // Call once per new question, before nextDue().
        tick() {
            schedule.forEach(entry => { entry.dueIn -= 1; });
            save();
        },

        // Most overdue due problem that canServe() allows, or null. Skipped
        // problems stay scheduled and are served later.
        nextDue(canServe = () => true) {
            let next = null;
            for (const [key, entry] of schedule) {
                if (entry.dueIn <= 0 && canServe(entry.question) &&
                    (!next || entry.dueIn < next.entry.dueIn)) {
                    next = { key, entry };
                }
            }
            if (!next) return null;
            log('Serving due question', {
                key: next.key,
                masteryStreak: next.entry.masteryStreak
            });
            return { ...next.entry.question };
        },

        recordMiss(question) {
            const key = getKey(question);
            const existing = schedule.get(key);
            const dueIn = existing ? Math.min(existing.dueIn, randomDueIn()) : randomDueIn();
            schedule.set(key, { question: { ...question }, dueIn, masteryStreak: 0 });
            save();
            log(existing ? 'Rescheduled repeated miss' : 'Scheduled new missed question', { key, dueIn });
        },

        recordCorrect(question) {
            const key = getKey(question);
            const existing = schedule.get(key);
            if (!existing) return;

            const masteryStreak = existing.masteryStreak + 1;
            if (masteryStreak >= MASTERY_STREAK_TO_CLEAR) {
                schedule.delete(key);
                log('Mastered and removed from schedule', { key, masteryStreak });
            } else {
                const dueIn = randomDueIn();
                schedule.set(key, { question: { ...question }, dueIn, masteryStreak });
                log('Correct but still in learning schedule', { key, dueIn, masteryStreak });
            }
            save();
        }
    };
}
