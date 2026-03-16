# Family Fortunes Classroom Game

A self-contained browser game inspired by TV's **Family Fortunes** for classroom use.

## Features

- Create a game with multiple rounds.
- Each round has one survey-style question and multiple answers with point values.
- Reveal answers live during play as the teacher hosts the game.
- Keep team scores throughout all rounds.
- Save a full game to a local text file (`.ffgame.txt`).
- Load a previously saved game file from local disk.

## Run locally

No installation required.

1. Download this folder.
2. Open `index.html` in any modern browser.
3. Use the setup panel to edit rounds and teams.
4. Click **Start Game** to switch to host/play mode.

## Save / Load format

Saved files are plain text containing JSON data.
They include:

- game title
- teams and scores
- rounds with questions and answers
