const state = {
  game: {
    title: "",
    teams: [
      { name: "Team A", score: 0 },
      { name: "Team B", score: 0 }
    ],
    rounds: []
  },
  currentRoundIndex: 0
};

const el = {
  setupPanel: document.getElementById("setup-panel"),
  playPanel: document.getElementById("play-panel"),
  gameTitle: document.getElementById("game-title"),
  teamNames: document.getElementById("team-names"),
  addRoundBtn: document.getElementById("add-round-btn"),
  startGameBtn: document.getElementById("start-game-btn"),
  saveGameBtn: document.getElementById("save-game-btn"),
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
  teamsList: document.getElementById("teams-list"),
  backToEditBtn: document.getElementById("back-to-edit-btn"),
  resetScoresBtn: document.getElementById("reset-scores-btn")
};

function createRound(question = "", answers = [{ text: "", points: 0, revealed: false }]) {
  return { question, answers: answers.map((a) => ({ ...a, revealed: !!a.revealed })) };
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

    const renderAnswers = () => {
      answersEditor.innerHTML = "";

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
    };

    renderAnswers();

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
        .filter((answer) => answer.text)
    }))
    .filter((round) => round.question && round.answers.length > 0);

  if (state.game.rounds.length === 0) {
    state.game.rounds.push(createRound("Sample question", [{ text: "Sample answer", points: 10, revealed: false }]));
  }

  state.currentRoundIndex = Math.min(state.currentRoundIndex, state.game.rounds.length - 1);
}

function renderPlayView() {
  const round = state.game.rounds[state.currentRoundIndex];

  el.playTitle.textContent = state.game.title;
  el.roundIndicator.textContent = `Round ${state.currentRoundIndex + 1} of ${state.game.rounds.length}`;
  el.questionText.textContent = round.question;

  el.prevRoundBtn.disabled = state.currentRoundIndex <= 0;
  el.nextRoundBtn.disabled = state.currentRoundIndex >= state.game.rounds.length - 1;

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
          renderPlayView();
        });
        controls.appendChild(addBtn);
      });
    }

    tile.append(text, controls);
    el.answersBoard.appendChild(tile);
  });

  el.teamsList.innerHTML = "";
  [...state.game.teams]
    .sort((a, b) => b.score - a.score)
    .forEach((team) => {
      const row = document.createElement("div");
      row.className = "team-row";
      row.innerHTML = `<strong>${team.name}</strong><span>${team.score} pts</span>`;
      el.teamsList.appendChild(row);
    });
}

function switchToPlay() {
  sanitizeGame();
  el.setupPanel.classList.add("hidden");
  el.playPanel.classList.remove("hidden");
  renderPlayView();
}

function switchToSetup() {
  el.setupPanel.classList.remove("hidden");
  el.playPanel.classList.add("hidden");
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
        rounds: loaded.rounds.map((round) => ({
          question: String(round.question || ""),
          answers: Array.isArray(round.answers)
            ? round.answers.map((answer) => ({
                text: String(answer.text || ""),
                points: Math.max(0, Number(answer.points) || 0),
                revealed: false
              }))
            : []
        }))
      };

      if (state.game.rounds.length === 0) {
        state.game.rounds.push(createRound());
      }

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
  });

  renderPlayView();
}

el.addRoundBtn.addEventListener("click", () => addRound());
el.startGameBtn.addEventListener("click", switchToPlay);
el.backToEditBtn.addEventListener("click", switchToSetup);
el.saveGameBtn.addEventListener("click", downloadGameFile);
el.loadGameInput.addEventListener("change", (event) => loadGameFile(event.target.files[0]));

el.prevRoundBtn.addEventListener("click", () => {
  state.currentRoundIndex = Math.max(0, state.currentRoundIndex - 1);
  renderPlayView();
});

el.nextRoundBtn.addEventListener("click", () => {
  state.currentRoundIndex = Math.min(state.game.rounds.length - 1, state.currentRoundIndex + 1);
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
