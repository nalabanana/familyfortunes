const state = {
  game: {
    title: "",
    teams: [
      { name: "Team A", score: 0 },
      { name: "Team B", score: 0 }
    ],
    rounds: []
  },
  currentRoundIndex: 0,
  gameEnded: false
};

const sounds = {
  correct: new Audio("correct.mp3"),
  incorrect: new Audio("incorrect.mp3"),
  theme: new Audio("theme.mp3")
};

const el = {
  setupPanel: document.getElementById("setup-panel"),
  playPanel: document.getElementById("play-panel"),
  gameTitle: document.getElementById("game-title"),
  teamNames: document.getElementById("team-names"),
  addRoundBtn: document.getElementById("add-round-btn"),
  startGameBtn: document.getElementById("start-game-btn"),
  saveGameBtn: document.getElementById("save-game-btn"),
  downloadSheetBtn: document.getElementById("download-sheet-btn"),
  loadGameInput: document.getElementById("load-game-input"),
  roundEditorList: document.getElementById("round-editor-list"),
  roundTemplate: document.getElementById("round-template"),
  answerEditorTemplate: document.getElementById("answer-editor-template"),
  playTitle: document.getElementById("play-title"),
  prevRoundBtn: document.getElementById("prev-round-btn"),
  nextRoundBtn: document.getElementById("next-round-btn"),
  roundIndicator: document.getElementById("round-indicator"),
  questionText: document.getElementById("question-text"),
  answersBoard: document.getElementById("answers-board"),
  leftTeamDisplay: document.getElementById("left-team-display"),
  rightTeamDisplay: document.getElementById("right-team-display"),
  incorrectControls: document.getElementById("incorrect-controls"),
  gameResult: document.getElementById("game-result"),
  backToEditBtn: document.getElementById("back-to-edit-btn"),
  resetScoresBtn: document.getElementById("reset-scores-btn")
};

function playSound(sound) {
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function createRound(question = "", answers = [{ text: "", points: 0, revealed: false }], strikes = [], roundScores = []) {
  return {
    question,
    answers: answers.map((a) => ({ ...a, revealed: !!a.revealed })),
    strikes: [...strikes],
    roundScores: [...roundScores]
  };
}

function ensureRoundTeamData(round) {
  if (!Array.isArray(round.strikes)) round.strikes = [];
  if (!Array.isArray(round.roundScores)) round.roundScores = [];

  while (round.strikes.length < state.game.teams.length) round.strikes.push(0);
  while (round.roundScores.length < state.game.teams.length) round.roundScores.push(0);

  round.strikes = round.strikes.slice(0, state.game.teams.length).map((n) => Math.max(0, Number(n) || 0));
  round.roundScores = round.roundScores.slice(0, state.game.teams.length).map((n) => Math.max(0, Number(n) || 0));
}

function addRound(round = createRound()) {
  state.game.rounds.push(round);
  renderRoundEditors();
}

function renderRoundEditors() {
  el.roundEditorList.innerHTML = "";

  state.game.rounds.forEach((round, roundIndex) => {
    const roundNode = el.roundTemplate.content.firstElementChild.cloneNode(true);
    roundNode.querySelector(".round-number").textContent = `Round ${roundIndex + 1}`;

    const qInput = roundNode.querySelector(".round-question");
    qInput.value = round.question;
    qInput.addEventListener("input", (event) => {
      state.game.rounds[roundIndex].question = event.target.value;
    });

    const answersEditor = roundNode.querySelector(".answers-editor");

    state.game.rounds[roundIndex].answers.forEach((answer, answerIndex) => {
      const answerNode = el.answerEditorTemplate.content.firstElementChild.cloneNode(true);
      const textInput = answerNode.querySelector(".answer-text");
      const pointsInput = answerNode.querySelector(".answer-points");

      textInput.value = answer.text;
      pointsInput.value = answer.points;

      textInput.addEventListener("input", (event) => {
        state.game.rounds[roundIndex].answers[answerIndex].text = event.target.value;
      });

      pointsInput.addEventListener("input", (event) => {
        state.game.rounds[roundIndex].answers[answerIndex].points = Math.max(0, Number(event.target.value) || 0);
      });

      answerNode.querySelector(".remove-answer-btn").addEventListener("click", () => {
        state.game.rounds[roundIndex].answers.splice(answerIndex, 1);
        if (state.game.rounds[roundIndex].answers.length === 0) {
          state.game.rounds[roundIndex].answers.push({ text: "", points: 0, revealed: false });
        }
        renderRoundEditors();
      });

      answersEditor.appendChild(answerNode);
    });

    roundNode.querySelector(".add-answer-btn").addEventListener("click", () => {
      state.game.rounds[roundIndex].answers.push({ text: "", points: 0, revealed: false });
      renderRoundEditors();
    });

    roundNode.querySelector(".remove-round-btn").addEventListener("click", () => {
      state.game.rounds.splice(roundIndex, 1);
      if (state.game.rounds.length === 0) {
        state.game.rounds.push(createRound());
      }
      renderRoundEditors();
    });

    el.roundEditorList.appendChild(roundNode);
  });
}

function parseTeamsFromInput() {
  const raw = el.teamNames.value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  if (raw.length === 0) {
    return [
      { name: "Team A", score: 0 },
      { name: "Team B", score: 0 }
    ];
  }

  return raw.map((name) => ({ name, score: 0 }));
}

function sanitizeGame() {
  state.game.title = el.gameTitle.value.trim() || "Family Fortunes Game";
  state.game.teams = parseTeamsFromInput();

  state.game.rounds = state.game.rounds
    .map((round) => ({
      question: (round.question || "").trim(),
      answers: (round.answers || [])
        .map((answer) => ({
          text: (answer.text || "").trim(),
          points: Math.max(0, Number(answer.points) || 0),
          revealed: false
        }))
        .filter((answer) => answer.text),
      strikes: Array.isArray(round.strikes) ? round.strikes : [],
      roundScores: Array.isArray(round.roundScores) ? round.roundScores : []
    }))
    .filter((round) => round.question && round.answers.length > 0);

  if (state.game.rounds.length === 0) {
    state.game.rounds.push(createRound("Sample question", [{ text: "Sample answer", points: 10, revealed: false }]));
  }

  state.game.rounds.forEach(ensureRoundTeamData);
  state.currentRoundIndex = Math.min(state.currentRoundIndex, state.game.rounds.length - 1);
}

function sortedTeams() {
  return [...state.game.teams].sort((a, b) => b.score - a.score);
}

function renderGameResult() {
  if (!state.gameEnded) {
    el.gameResult.classList.add("hidden");
    return;
  }

  const rankings = sortedTeams();
  const winner = rankings[0];
  const other = rankings[1];
  if (!winner) {
    el.gameResult.classList.add("hidden");
    return;
  }

  const otherLine = other ? `<div class="game-result-sub">${other.name}: ${other.score} points</div>` : "";
  el.gameResult.innerHTML = `<div>🏆 Winner: ${winner.name} — ${winner.score} points</div>${otherLine}`;
  el.gameResult.classList.remove("hidden");
}

function buildTeamSide(teamIndex, round) {
  const team = state.game.teams[teamIndex];
  if (!team) {
    return '<div class="team-side-card empty">Add a second team to see both side displays.</div>';
  }

  const strikeCount = Math.max(0, Number(round.strikes[teamIndex]) || 0);
  const strikeRows = Array.from({ length: strikeCount || 1 }, () => (strikeCount ? "❌" : "—"));
  const strikeHtml = strikeRows.map((item) => `<span>${item}</span>`).join("");

  return `
    <div class="team-side-card">
      <h4>${team.name}</h4>
      <p>Round points: <strong>${round.roundScores[teamIndex]}</strong></p>
      <p>Total points: <strong>${team.score}</strong></p>
      <div class="strike-stack">${strikeHtml}</div>
    </div>
  `;
}

function renderPlayView() {
  const round = state.game.rounds[state.currentRoundIndex];
  ensureRoundTeamData(round);

  el.playTitle.textContent = state.game.title;
  el.roundIndicator.textContent = `Round ${state.currentRoundIndex + 1} of ${state.game.rounds.length}`;
  el.questionText.textContent = `We asked 100 people... ${round.question}`;

  el.prevRoundBtn.disabled = state.currentRoundIndex <= 0;
  const isFinalRound = state.currentRoundIndex === state.game.rounds.length - 1;
  el.nextRoundBtn.textContent = isFinalRound ? "End Game" : "Next Round";

  el.answersBoard.innerHTML = "";
  round.answers.forEach((answer, answerIndex) => {
    const tile = document.createElement("article");
    tile.className = "answer-tile";

    const text = document.createElement("div");
    text.innerHTML = answer.revealed
      ? `<strong>${answer.text}</strong> <span>(${answer.points} pts)</span>`
      : `<span class="answer-hidden">ANSWER ${answerIndex + 1}</span>`;

    const controls = document.createElement("div");
    controls.className = "answer-controls";

    const revealBtn = document.createElement("button");
    revealBtn.className = "tiny";
    revealBtn.textContent = answer.revealed ? "Hide" : "Reveal";
    revealBtn.addEventListener("click", () => {
      if (!answer.revealed) playSound(sounds.correct);
      answer.revealed = !answer.revealed;
      renderPlayView();
    });
    controls.appendChild(revealBtn);

    if (answer.revealed) {
      state.game.teams.forEach((team, teamIndex) => {
        const addBtn = document.createElement("button");
        addBtn.className = "tiny";
        addBtn.textContent = `+${answer.points} ${team.name}`;
        addBtn.addEventListener("click", () => {
          state.game.teams[teamIndex].score += answer.points;
          round.roundScores[teamIndex] += answer.points;
          renderPlayView();
        });
        controls.appendChild(addBtn);
      });
    }

    tile.append(text, controls);
    el.answersBoard.appendChild(tile);
  });

  el.incorrectControls.innerHTML = "";
  state.game.teams.forEach((team, teamIndex) => {
    const btn = document.createElement("button");
    btn.className = "tiny danger";
    btn.textContent = `Add ❌ ${team.name}`;
    btn.addEventListener("click", () => {
      round.strikes[teamIndex] += 1;
      playSound(sounds.incorrect);
      renderPlayView();
    });
    el.incorrectControls.appendChild(btn);
  });

  el.leftTeamDisplay.innerHTML = buildTeamSide(0, round);
  el.rightTeamDisplay.innerHTML = buildTeamSide(1, round);
  renderGameResult();
}

function switchToPlay() {
  sanitizeGame();
  state.gameEnded = false;
  playSound(sounds.theme);
  el.setupPanel.classList.add("hidden");
  el.playPanel.classList.remove("hidden");
  renderPlayView();
}

function switchToSetup() {
  el.setupPanel.classList.remove("hidden");
  el.playPanel.classList.add("hidden");
}

function buildPrintableSheet() {
  sanitizeGame();
  const roundsHtml = state.game.rounds.map((round, index) => {
    const answers = round.answers
      .map((answer, i) => `<li>${i + 1}. ${answer.text} — ${answer.points} pts</li>`)
      .join("");
    return `<section><h2>Round ${index + 1}</h2><p><strong>Question:</strong> ${round.question}</p><ol>${answers}</ol></section>`;
  }).join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>${state.game.title} - Answer Sheet</title><style>body{font-family:Arial,sans-serif;padding:24px;}h1,h2{margin-bottom:8px;}section{margin-bottom:16px;border-bottom:1px solid #ccc;padding-bottom:10px;}li{margin:4px 0;}</style></head><body><h1>${state.game.title} - Printable Answer Sheet</h1>${roundsHtml}</body></html>`;
}

function downloadPrintableSheet() {
  const sheet = buildPrintableSheet();
  const blob = new Blob([sheet], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeTitle = (state.game.title || "family-fortunes").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  link.href = url;
  link.download = `${safeTitle}-answer-sheet.html`;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadGameFile() {
  sanitizeGame();
  const blob = new Blob([JSON.stringify(state.game, null, 2)], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeTitle = (state.game.title || "family-fortunes-game").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  link.href = url;
  link.download = `${safeTitle}.ffgame.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function loadGameFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const loaded = JSON.parse(String(reader.result));
      if (!loaded || !Array.isArray(loaded.rounds)) {
        throw new Error("Invalid game file format");
      }

      state.game = {
        title: String(loaded.title || "Family Fortunes Game"),
        teams: Array.isArray(loaded.teams) && loaded.teams.length
          ? loaded.teams.map((team) => ({ name: String(team.name || "Team"), score: Number(team.score) || 0 }))
          : [{ name: "Team A", score: 0 }, { name: "Team B", score: 0 }],
        rounds: loaded.rounds.map((round) => createRound(
          String(round.question || ""),
          Array.isArray(round.answers)
            ? round.answers.map((answer) => ({
                text: String(answer.text || ""),
                points: Math.max(0, Number(answer.points) || 0),
                revealed: false
              }))
            : [],
          Array.isArray(round.strikes) ? round.strikes : [],
          Array.isArray(round.roundScores) ? round.roundScores : []
        ))
      };

      if (state.game.rounds.length === 0) {
        state.game.rounds.push(createRound());
      }

      state.gameEnded = false;
      state.game.rounds.forEach(ensureRoundTeamData);
      state.currentRoundIndex = 0;
      el.gameTitle.value = state.game.title;
      el.teamNames.value = state.game.teams.map((team) => team.name).join(", ");
      renderRoundEditors();
      alert("Game file loaded.");
    } catch (error) {
      alert(`Could not load file: ${error.message}`);
    }
  };

  reader.readAsText(file);
}

function resetScores() {
  state.game.teams.forEach((team) => {
    team.score = 0;
  });

  state.game.rounds.forEach((round) => {
    round.answers.forEach((answer) => {
      answer.revealed = false;
    });
    round.strikes = round.strikes.map(() => 0);
    round.roundScores = round.roundScores.map(() => 0);
  });

  state.gameEnded = false;
  renderPlayView();
}

el.addRoundBtn.addEventListener("click", () => addRound());
el.startGameBtn.addEventListener("click", switchToPlay);
el.backToEditBtn.addEventListener("click", switchToSetup);
el.saveGameBtn.addEventListener("click", downloadGameFile);
el.downloadSheetBtn.addEventListener("click", downloadPrintableSheet);
el.loadGameInput.addEventListener("change", (event) => loadGameFile(event.target.files[0]));

el.prevRoundBtn.addEventListener("click", () => {
  state.currentRoundIndex = Math.max(0, state.currentRoundIndex - 1);
  state.gameEnded = false;
  renderPlayView();
});

el.nextRoundBtn.addEventListener("click", () => {
  const isFinalRound = state.currentRoundIndex === state.game.rounds.length - 1;
  if (isFinalRound) {
    state.gameEnded = true;
  } else {
    state.currentRoundIndex += 1;
    state.gameEnded = false;
  }
  renderPlayView();
});

el.resetScoresBtn.addEventListener("click", resetScores);

el.gameTitle.value = "Family Fortunes Classroom";
el.teamNames.value = "Team A, Team B";
addRound(
  createRound("Name something you bring to school every day", [
    { text: "Backpack", points: 30, revealed: false },
    { text: "Lunch box", points: 25, revealed: false },
    { text: "Pencil case", points: 20, revealed: false },
    { text: "Homework", points: 15, revealed: false },
    { text: "Water bottle", points: 10, revealed: false }
  ])
);
