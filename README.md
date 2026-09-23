# Mathmaxxing

## Overview

This is a vibrant, interactive collection of math practice games designed to make learning math more engaging and rewarding for children. Each game features a playful theme, confetti effects, and a color-coded quiz container to help reinforce number groupings.  Vibe coded with psychological professional.

## The Games

Pick a game from the menu on `index.html`:

- **Multi-Rot:** The original 12x12 multiplication table quiz described below.
- **Factor-Rot:** Type every factor of a growing number, from smallest to largest. A progress bar fills in as correct factors are found, but the numbers stay hidden until submitted so kids can't just watch the answer appear.
- **Prime Factor-Rot:** Same idea as Factor-Rot, but only the prime factorization counts (e.g. 12 → 2, 2, 3).
- **Div-Rot:** Quick division practice — find the quotient and remainder for a growing dividend (up to 2 digits).
- **Long Div-Rot:** Work through full long division in an editable grid, just like on paper. Fill in the quotient, multiplication, and remainder boxes yourself, then press Check to see which digits are right (green) or wrong (red). There's also a "Help me through it step by step" checkbox that walks kids through the grid one box at a time with hints, for when they need more guidance.

Every game shares the same reward system: confetti and sound effects for correct answers, error sounds for incorrect ones, a live scoreboard, and a growing difficulty level as questions are answered correctly.

## ADHD-Friendly Features

Children with ADHD often benefit from immediate feedback, visual stimulation, and clear progress tracking. This app provides:

- **Instant Feedback:** Correct and incorrect answers are tracked and displayed, with confetti and sound effects for correct answers, making the experience more rewarding.
- **Scoreboard:** A live scoreboard shows the number and percentage of correct and wrong answers, helping children see their progress and stay motivated.
- **Reset Button:** Allows for quick restarts, supporting short attention spans and frequent breaks.
- **Visual Stimulation:** The quiz container uses color-coded backgrounds for each number group, making patterns and groupings easier to recognize and remember.
- **Grouping by Color:** Each multiplication group (e.g., 6x, 7x, etc.) is associated with a specific color in the quiz container, helping children visually connect similar numbers and build memory associations.

## How It Works

- The app presents multiplication questions up to 12x12.
- The first question is always 6x7, with a special sound effect for extra reward.
- Each question's group (the first number) determines the background color of the quiz container.
- Correct answers trigger confetti and positive sounds; wrong answers are tracked and repeated using a spaced-repetition scheduler.
- The scoreboard updates in real time, and a reset button is available.

## Wrong-Answer Repetition Scheduler

The app includes a session-based repetition engine that helps children practice the facts they miss most.

- **Session only:** Scheduling data is kept in memory for the current browser session (it resets on page refresh).
- **Adaptive retries:** When a question is answered wrong, it is scheduled to return in a future slot. If the same question is missed again, it is scheduled even sooner.
- **Deduplicated tracking:** Each multiplication fact (for example, 7x8) is tracked as a single scheduled item, so repeats do not create conflicting duplicates.
- **Reliable due handling:** Scheduled items count down each new question and are shown when due, without dropping other pending items.
- **Mastery rule:** A previously missed question must be answered correctly **2 times in a row** before it is removed from the learning schedule.
- **Retention check:** After the first correct answer on a missed fact, the app schedules it again soon (within a few questions) to confirm retention.

## Why Color Grouping?

Color grouping helps children, especially those with ADHD, visually organize information and recognize patterns. By associating each number group with a unique color, the app makes it easier to spot similarities, recall facts, and stay engaged.

## Getting Started

Open `index.html` in your browser and pick a game from the menu. No installation required.

## Customization

You can easily adjust colors, sounds, and confetti images in the CSS and JS files to suit your child's preferences.
