# Family Fortunes Classroom Game

A self-contained browser game inspired by TV's **Family Fortunes** for classroom use.

## Features

- Create a game with multiple rounds.
- Enter team names using two separate team input boxes.
- Each round has one survey-style question and multiple answers with point values.
- Reveal answers live during play as the teacher hosts the game.
- Play `theme.mp3` when the game starts (optional toggle in setup).
- Play `correct.mp3` when an answer is revealed and `incorrect.mp3` when a strike is recorded.
- Track incorrect guesses per team per round using vertical red ❌ strikes.
- Show left/right team side displays (team name, current-round points, total points, strikes).
- Configure options in setup:
  - Random round order (radio On/Off)
  - Theme music On/Off (radio)
- In the final round, the Next Round button changes to **End Game**, then shows the winner (with emoji) and the other team score.
- Download a printable answer sheet for teachers.
- Open a full game file (`.ffgame.txt`) from disk and save game files locally.
- Quick link to the online preset games library.
- Includes a `games/` library with preset GCSE Computer Science sample game files.
- Each round has one survey-style question and multiple answers with point values.
- Reveal answers live during play as the teacher hosts the game.
- Keep team scores throughout all rounds.
- Save a full game to a local text file (`.ffgame.txt`).
- Load a previously saved game file from local disk.

## Run locally

No installation required.

1. Download this folder.
2. Place `correct.mp3`, `incorrect.mp3`, and `theme.mp3` in the same folder as `index.html`.
3. Open `index.html` in any modern browser.
4. Use the setup panel to edit rounds and teams.
5. Click **Start Game** to switch to host/play mode.
2. Open `index.html` in any modern browser.
3. Use the setup panel to edit rounds and teams.
4. Click **Start Game** to switch to host/play mode.

## Save / Load format

Saved files are plain text containing JSON data.
They include:

- game title
- options (random order/theme music)
- teams and scores
- rounds with questions, answers, per-team strike counts, and per-round team scores
- teams and scores
- rounds with questions and answers
