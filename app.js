const state = {
  game: {
    title: "",
    options: {
      theme: "classic",
      randomRoundOrder: false,
      themeMusic: true,
      bonusAnswers: false
    },
    teams: [
      { name: "Team A", score: 0 },
      { name: "Team B", score: 0 }
    ],
    rounds: []
  },
  currentRoundIndex: 0,
  gameEnded: false,
  gamesLibraryIndex: null,
  confettiActive: false
};

const sounds = {
  correct: new Audio("correct.mp3"),
  incorrect: new Audio("incorrect.mp3"),
  theme: new Audio("theme.mp3"),
  bonus: new Audio("bonus.mp3")
};

const el = {
  setupPanel: document.getElementById("setup-panel"),
  playPanel: document.getElementById("play-panel"),
  confettiLayer: document.getElementById("confetti-layer"),
  gamesLibraryPanel: document.getElementById("games-library-panel"),
  gamesLibraryList: document.getElementById("games-library-list"),
  closeLibraryBtn: document.getElementById("close-library-btn"),
  gameTitle: document.getElementById("game-title"),
  teamName1: document.getElementById("team-name-1"),
  teamName2: document.getElementById("team-name-2"),
  themePicker: document.getElementById("theme-picker"),
  randomOrderOn: document.getElementById("random-order-on"),
  randomOrderOff: document.getElementById("random-order-off"),
  themeMusicOn: document.getElementById("theme-music-on"),
  themeMusicOff: document.getElementById("theme-music-off"),
  bonusAnswersOn: document.getElementById("bonus-answers-on"),
  bonusAnswersOff: document.getElementById("bonus-answers-off"),
  addRoundBtn: document.getElementById("add-round-btn"),
  openGameBtn: document.getElementById("open-game-btn"),
  gamesLibraryBtn: document.getElementById("games-library-btn"),
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
  gameLiveContent: document.getElementById("game-live-content"),
  leftTeamDisplay: document.getElementById("left-team-display"),
  rightTeamDisplay: document.getElementById("right-team-display"),
  incorrectControls: document.getElementById("incorrect-controls"),
  gameResult: document.getElementById("game-result"),
  endgameActions: document.getElementById("endgame-actions"),
  endgameBackBtn: document.getElementById("endgame-back-btn"),
  endGameBtn: document.getElementById("end-game-btn"),
  resetScoresBtn: document.getElementById("reset-scores-btn")
};

function playSound(sound) {
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function applyTheme(themeName = "classic") {
  const theme = ["classic", "light", "sunset", "ocean", "forest"].includes(themeName) ? themeName : "classic";
  document.body.dataset.theme = theme;
  state.game.options.theme = theme;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.text();
}

async function ensureGamesLibraryIndex() {
  if (Array.isArray(state.gamesLibraryIndex)) {
    return state.gamesLibraryIndex;
  }

  const games = await fetchJson("games/index.json");
  state.gamesLibraryIndex = Array.isArray(games) ? games : [];
  return state.gamesLibraryIndex;
}

async function loadBuiltInGame(filename) {
  const contents = await fetchText(`games/${encodeURIComponent(filename)}`);
  loadGameFromString(contents);
}

async function renderGamesLibrary() {
  el.gamesLibraryList.innerHTML = "";

  let games;
  try {
    games = await ensureGamesLibraryIndex();
  } catch (error) {
    el.gamesLibraryList.innerHTML = `<p class="library-empty">Could not read the games folder. Try opening the app through a local web server. (${error.message})</p>`;
    return;
  }

  if (games.length === 0) {
    el.gamesLibraryList.innerHTML = '<p class="library-empty">No bundled game files were found.</p>';
    return;
  }

  games.forEach((game) => {
    const card = document.createElement("article");
    card.className = "library-item";

    const title = document.createElement("h4");
    title.textContent = game.title || game.filename;

    const meta = document.createElement("p");
    meta.className = "library-meta";
    meta.textContent = game.filename;

    const loadBtn = document.createElement("button");
    loadBtn.type = "button";
    loadBtn.textContent = "Load This Game";
    loadBtn.addEventListener("click", async () => {
      try {
        await loadBuiltInGame(game.filename);
        el.gamesLibraryPanel.classList.add("hidden");
      } catch (error) {
        alert(`Could not load game file: ${error.message}`);
      }
    });

    card.append(title, meta, loadBtn);
    el.gamesLibraryList.appendChild(card);
  });
}

function createRound(
  question = "",
  answers = [{ text: "", points: 0, revealed: false }],
  strikes = [],
  roundScores = [],
  bonusAnswerIndex = null,
  questionRevealed = false
) {
  return {
    question,
    answers: answers.map((a) => ({ ...a, revealed: !!a.revealed })),
    strikes: [...strikes],
    roundScores: [...roundScores],
    bonusAnswerIndex: Number.isInteger(bonusAnswerIndex) ? bonusAnswerIndex : null,
    questionRevealed: !!questionRevealed
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

function moveRound(fromIndex, toIndex) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= state.game.rounds.length ||
    toIndex >= state.game.rounds.length
  ) {
    return;
  }

  const [round] = state.game.rounds.splice(fromIndex, 1);
  state.game.rounds.splice(toIndex, 0, round);
  renderRoundEditors();
}

function shuffleRounds() {
  for (let i = state.game.rounds.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [state.game.rounds[i], state.game.rounds[j]] = [state.game.rounds[j], state.game.rounds[i]];
  }
}

function renderRoundEditors() {
  el.roundEditorList.innerHTML = "";

  state.game.rounds.forEach((round, roundIndex) => {
    const roundNode = el.roundTemplate.content.firstElementChild.cloneNode(true);
    roundNode.querySelector(".round-number").textContent = `Round ${roundIndex + 1}`;

    const moveUpBtn = roundNode.querySelector(".move-round-up-btn");
    const moveDownBtn = roundNode.querySelector(".move-round-down-btn");
    moveUpBtn.disabled = roundIndex === 0;
    moveDownBtn.disabled = roundIndex === state.game.rounds.length - 1;
    moveUpBtn.addEventListener("click", () => moveRound(roundIndex, roundIndex - 1));
    moveDownBtn.addEventListener("click", () => moveRound(roundIndex, roundIndex + 1));

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
  const team1 = el.teamName1.value.trim();
  const team2 = el.teamName2.value.trim();

  return [
    { name: team1 || "Team A", score: 0 },
    { name: team2 || "Team B", score: 0 }
  ];
}

function syncOptionsFromInputs() {
  state.game.options.theme = el.themePicker.value || "classic";
  state.game.options.randomRoundOrder = el.randomOrderOn.checked;
  state.game.options.themeMusic = el.themeMusicOn.checked;
  state.game.options.bonusAnswers = el.bonusAnswersOn.checked;
  applyTheme(state.game.options.theme);
}

function syncInputsFromOptions() {
  el.themePicker.value = state.game.options.theme || "classic";
  el.randomOrderOn.checked = !!state.game.options.randomRoundOrder;
  el.randomOrderOff.checked = !state.game.options.randomRoundOrder;
  el.themeMusicOn.checked = !!state.game.options.themeMusic;
  el.themeMusicOff.checked = !state.game.options.themeMusic;
  el.bonusAnswersOn.checked = !!state.game.options.bonusAnswers;
  el.bonusAnswersOff.checked = !state.game.options.bonusAnswers;
  applyTheme(state.game.options.theme || "classic");
}

function sanitizeGame() {
  state.game.title = el.gameTitle.value.trim() || "Family Fortunes Game";
  state.game.teams = parseTeamsFromInput();
  syncOptionsFromInputs();

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
      roundScores: Array.isArray(round.roundScores) ? round.roundScores : [],
      bonusAnswerIndex: Number.isInteger(round.bonusAnswerIndex) ? round.bonusAnswerIndex : null,
      questionRevealed: false
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

function clearConfetti() {
  el.confettiLayer.innerHTML = "";
  el.confettiLayer.classList.remove("active");
  state.confettiActive = false;
}

function launchConfetti() {
  if (state.confettiActive) return;

  state.confettiActive = true;
  el.confettiLayer.innerHTML = "";
  el.confettiLayer.classList.add("active");

  const colors = ["#f59e0b", "#38bdf8", "#84cc16", "#fb7185", "#facc15", "#ffffff"];
  for (let i = 0; i < 120; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.8}s`;
    piece.style.animationDuration = `${4 + Math.random() * 1.8}s`;
    piece.style.transform = `translateY(-12vh) rotate(${Math.random() * 360}deg)`;
    el.confettiLayer.appendChild(piece);
  }

  window.setTimeout(() => {
    clearConfetti();
  }, 6500);
}

function renderGameResult() {
  if (!state.gameEnded) {
    el.playPanel.classList.remove("endgame-screen");
    el.gameLiveContent.classList.remove("hidden");
    el.endgameActions.classList.add("hidden");
    el.gameResult.classList.add("hidden");
    clearConfetti();
    return;
  }

  const rankings = sortedTeams();
  const winner = rankings[0];
  const other = rankings[1];
  if (!winner) {
    el.gameResult.classList.add("hidden");
    return;
  }

  el.playPanel.classList.add("endgame-screen");
  el.gameLiveContent.classList.add("hidden");
  el.endgameActions.classList.remove("hidden");

  const otherLine = other ? `<div class="game-result-sub">${other.name}: ${other.score} points</div>` : "";
  el.gameResult.innerHTML = `<div>🏆 Winner: ${winner.name} — ${winner.score} points</div>${otherLine}`;
  el.gameResult.classList.remove("hidden");
  launchConfetti();
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
      <button type="button" class="tiny danger side-strike-btn" data-team-index="${teamIndex}">Add ❌</button>
    </div>
  `;
}

function assignBonusAnswersToRounds() {
  state.game.rounds.forEach((round) => {
    const candidateIndexes = round.answers
      .map((_, index) => index)
      .filter((index) => index > 0);

    if (state.game.options.bonusAnswers && candidateIndexes.length > 0) {
      const pick = candidateIndexes[Math.floor(Math.random() * candidateIndexes.length)];
      round.bonusAnswerIndex = pick;
    } else {
      round.bonusAnswerIndex = null;
    }
  });
}

function renderPlayView() {
  const round = state.game.rounds[state.currentRoundIndex];
  ensureRoundTeamData(round);

  el.playTitle.textContent = state.game.title;
  el.roundIndicator.textContent = `Round ${state.currentRoundIndex + 1} of ${state.game.rounds.length}`;
  if (round.questionRevealed) {
    el.questionText.innerHTML = `<span>We asked 100 people... ${round.question}</span>`;
    el.questionText.classList.remove("question-reveal-prompt");
  } else {
    el.questionText.innerHTML = '<button type="button" class="question-reveal-btn">Reveal Question</button>';
    el.questionText.classList.add("question-reveal-prompt");
    el.questionText.querySelector(".question-reveal-btn").addEventListener("click", () => {
      round.questionRevealed = true;
      renderPlayView();
    });
  }

  el.prevRoundBtn.disabled = state.currentRoundIndex <= 0;
  const isFinalRound = state.currentRoundIndex === state.game.rounds.length - 1;
  el.nextRoundBtn.textContent = isFinalRound ? "End Game" : "Next Round";

  el.answersBoard.innerHTML = "";
  round.answers.forEach((answer, answerIndex) => {
    const tile = document.createElement("article");
    const isBonusAnswer = round.bonusAnswerIndex === answerIndex;
    tile.className = `answer-tile${answer.revealed && isBonusAnswer ? " bonus-revealed" : ""}`;

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
      if (!answer.revealed) {
        if (isBonusAnswer) {
          playSound(sounds.bonus);
        } else {
          playSound(sounds.correct);
        }
      }
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

  el.leftTeamDisplay.innerHTML = buildTeamSide(0, round);
  el.rightTeamDisplay.innerHTML = buildTeamSide(1, round);
  [el.leftTeamDisplay, el.rightTeamDisplay].forEach((side) => {
    side.querySelector(".side-strike-btn")?.addEventListener("click", (event) => {
      const teamIndex = Number(event.currentTarget.dataset.teamIndex);
      round.strikes[teamIndex] += 1;
      playSound(sounds.incorrect);
      renderPlayView();
    });
  });
  el.incorrectControls.innerHTML = "";
  renderGameResult();
}

function switchToPlay() {
  sanitizeGame();
  if (state.game.options.randomRoundOrder) {
    shuffleRounds();
  }
  assignBonusAnswersToRounds();
  state.gameEnded = false;
  if (state.game.options.themeMusic) {
    playSound(sounds.theme);
  }
  el.setupPanel.classList.add("hidden");
  el.playPanel.classList.remove("hidden");
  renderPlayView();
}

function switchToSetup() {
  el.setupPanel.classList.remove("hidden");
  el.playPanel.classList.add("hidden");
  el.playPanel.classList.remove("endgame-screen");
}

function endGame() {
  state.gameEnded = true;
  renderPlayView();
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

function buildMinimalGameData() {
  return {
    title: state.game.title,
    rounds: state.game.rounds.map((round) => ({
      question: round.question,
      answers: round.answers.map((answer) => ({
        text: answer.text,
        points: answer.points
      }))
    }))
  };
}

function downloadGameFile() {
  sanitizeGame();
  const blob = new Blob([JSON.stringify(buildMinimalGameData(), null, 2)], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeTitle = (state.game.title || "family-fortunes-game").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  link.href = url;
  link.download = `${safeTitle}.ffgame.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function applyLoadedGame(loaded) {
  state.game = {
    title: String(loaded.title || "Family Fortunes Game"),
    options: {
      theme: "classic",
      randomRoundOrder: false,
      themeMusic: true,
      bonusAnswers: false
    },
    teams: [{ name: "Team A", score: 0 }, { name: "Team B", score: 0 }],
    rounds: loaded.rounds.map((round) => createRound(
      String(round.question || ""),
      Array.isArray(round.answers)
        ? round.answers.map((answer) => ({
            text: String(answer.text || ""),
            points: Math.max(0, Number(answer.points) || 0),
            revealed: false
          }))
        : [],
      [],
      [],
      null,
      false
    ))
  };

  if (state.game.rounds.length === 0) {
    state.game.rounds.push(createRound());
  }

  state.gameEnded = false;
  state.game.rounds.forEach(ensureRoundTeamData);
  state.currentRoundIndex = 0;
  el.gameTitle.value = state.game.title;
  el.teamName1.value = state.game.teams[0]?.name || "Team A";
  el.teamName2.value = state.game.teams[1]?.name || "Team B";
  syncInputsFromOptions();
  renderRoundEditors();
}

function loadGameFromString(rawText) {
  const loaded = JSON.parse(String(rawText));
  if (!loaded || !Array.isArray(loaded.rounds)) {
    throw new Error("Invalid game file format");
  }
  applyLoadedGame(loaded);
}

function loadGameFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      loadGameFromString(reader.result);
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
    round.questionRevealed = false;
  });

  state.gameEnded = false;
  renderPlayView();
}

el.addRoundBtn.addEventListener("click", () => addRound());
el.openGameBtn.addEventListener("click", () => el.loadGameInput.click());
el.gamesLibraryBtn.addEventListener("click", async () => {
  await renderGamesLibrary();
  el.gamesLibraryPanel.classList.toggle("hidden");
});
el.closeLibraryBtn.addEventListener("click", () => el.gamesLibraryPanel.classList.add("hidden"));
el.startGameBtn.addEventListener("click", switchToPlay);
el.endgameBackBtn.addEventListener("click", switchToSetup);
el.saveGameBtn.addEventListener("click", downloadGameFile);
el.downloadSheetBtn.addEventListener("click", downloadPrintableSheet);
el.loadGameInput.addEventListener("change", (event) => loadGameFile(event.target.files[0]));
el.endGameBtn.addEventListener("click", endGame);
el.themePicker.addEventListener("change", (event) => applyTheme(event.target.value));

el.prevRoundBtn.addEventListener("click", () => {
  state.currentRoundIndex = Math.max(0, state.currentRoundIndex - 1);
  state.gameEnded = false;
  renderPlayView();
});

el.nextRoundBtn.addEventListener("click", () => {
  const isFinalRound = state.currentRoundIndex === state.game.rounds.length - 1;
  if (isFinalRound) {
    endGame();
  } else {
    state.currentRoundIndex += 1;
    state.gameEnded = false;
    renderPlayView();
  }
});

el.resetScoresBtn.addEventListener("click", resetScores);

el.gameTitle.value = "Family Fortunes Classroom";
el.teamName1.value = "Team A";
el.teamName2.value = "Team B";
syncInputsFromOptions();
addRound(
  createRound("Name something you bring to school every day", [
    { text: "Backpack", points: 30, revealed: false },
    { text: "Lunch box", points: 25, revealed: false },
    { text: "Pencil case", points: 20, revealed: false },
    { text: "Homework", points: 15, revealed: false },
    { text: "Water bottle", points: 10, revealed: false }
  ])
);
