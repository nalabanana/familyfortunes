# Family Fortunes Classroom Game

A self-contained browser game inspired by TV's **Family Fortunes** for classroom use.

## Features

- Create a game with multiple rounds.
- Each round has one survey-style question and multiple answers with point values.
- Reveal answers live during play as the teacher hosts the game.
- Track incorrect guesses per team per round using red ❌ strikes.
- Keep team scores throughout all rounds.
- Automatically show the winning team and their points in the final round.
- Save a full game to a local text file (`.ffgame.txt`).
- Load a previously saved game file from local disk.
- Plays `correct.mp3` and `incorrect.mp3` sound effects when actions are recorded.

## Run locally

No installation required.

1. Download this folder.
2. Place `correct.mp3` and `incorrect.mp3` in the same folder as `index.html`.
3. Open `index.html` in any modern browser.
4. Use the setup panel to edit rounds and teams.
5. Click **Start Game** to switch to host/play mode.

## Save / Load format

Saved files are plain text containing JSON data.
They include:

- game title
- teams and scores
- rounds with questions, answers, and per-team strike counts
