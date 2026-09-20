import { calculateExpedition, calculatePlayerRound } from './scoring.js';
import { pickRandomPrefix } from './prefixes.js';

const COLORS = [
  { id: 'yellow', name: '사막', symbol: '●' },
  { id: 'blue', name: '아틀란티스', symbol: '◉' },
  { id: 'purple', name: '미지의 강가', symbol: '◆' },
  { id: 'green', name: '열대 우림', symbol: '▲' },
  { id: 'red', name: '협곡', symbol: '◎' },
];
const NUMBERS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const STORAGE_KEY = 'lost-cities-scorekeeper-v1';

const emptyExpeditions = () => COLORS.map(() => ({ numbers: [], wagers: 0 }));
const defaultState = () => ({
  round: 1,
  names: ['', ''],
  prefixes: ['', ''],
  totals: [0, 0],
  players: [emptyExpeditions(), emptyExpeditions()],
  history: [],
});

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.players?.length === 2 && saved?.totals?.length === 2) {
      saved.names = saved.names.map((name, player) => name === `탐험가 ${player + 1}` ? '' : name);
      saved.prefixes = Array.isArray(saved.prefixes) ? saved.prefixes : ['', ''];
      // 이전 버전에서 양쪽에 같은 카드가 입력된 경우 첫 번째 선택만 유지한다.
      saved.players[0].forEach((expedition, colorIndex) => {
        const claimedNumbers = new Set(expedition.numbers);
        saved.players[1][colorIndex].numbers = saved.players[1][colorIndex].numbers
          .filter((number) => !claimedNumbers.has(number));
      });
      return saved;
    }
  } catch { /* 손상된 저장 데이터는 새 게임으로 대체 */ }
  return defaultState();
}

let state = loadState();
const expeditionsEl = document.querySelector('#expeditions');
const toastEl = document.querySelector('#toast');

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function scoreForPlayer(playerIndex) {
  return calculatePlayerRound(state.players[playerIndex]);
}

function resizeNameInput(input) {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 82)}px`;
}

function cardButton(playerIndex, colorIndex, number) {
  const selected = state.players[playerIndex][colorIndex].numbers.includes(number);
  const ownedByOpponent = state.players[1 - playerIndex][colorIndex].numbers.includes(number);
  const unavailable = ownedByOpponent && !selected;
  return `<button type="button" class="card-number${selected ? ' selected' : ''}${unavailable ? ' unavailable' : ''}" data-action="number" data-player="${playerIndex}" data-color="${colorIndex}" data-number="${number}" aria-pressed="${selected}"${unavailable ? ' disabled aria-label="상대가 선택한 카드"' : ''}>${number}</button>`;
}

function playerCards(playerIndex, colorIndex) {
  const expedition = state.players[playerIndex][colorIndex];
  return `
    <div class="player-cards" data-player-side="${playerIndex}">
      <div class="wager-row" aria-label="투자 카드">
        ${[1, 2, 3].map((count) => `<button type="button" class="wager-card${expedition.wagers >= count ? ' selected' : ''}" data-action="wager" data-player="${playerIndex}" data-color="${colorIndex}" data-wager="${count}" aria-pressed="${expedition.wagers >= count}">×</button>`).join('')}
        <span class="expedition-score">${calculateExpedition(expedition.numbers, expedition.wagers)}</span>
      </div>
      <div class="number-grid">${NUMBERS.map((number) => cardButton(playerIndex, colorIndex, number)).join('')}</div>
    </div>`;
}

function renderExpeditions() {
  expeditionsEl.innerHTML = COLORS.map((color, colorIndex) => `
    <article class="expedition expedition-${color.id}">
      <div class="route-label"><span>${color.symbol}</span><small>${color.name}</small></div>
      ${playerCards(0, colorIndex)}
      ${playerCards(1, colorIndex)}
    </article>`).join('');
}

function renderScores() {
  const roundScores = [scoreForPlayer(0), scoreForPlayer(1)];
  for (let player = 0; player < 2; player += 1) {
    document.querySelector(`#player${player}RoundScore`).textContent = signed(roundScores[player]);
    document.querySelector(`#player${player}TotalScore`).textContent = signed(state.totals[player] + roundScores[player]);
    const nameInput = document.querySelector(`#player${player}Name`);
    if (document.activeElement !== nameInput) {
      nameInput.value = state.names[player];
    }
    document.querySelector(`#player${player}Prefix`).textContent = state.prefixes[player];
    resizeNameInput(nameInput);
    document.querySelector(`#player${player}Guide`).textContent = `${state.names[player] || `플레이어 ${player + 1}`}의 카드`;
  }
  document.querySelector('#roundNumber').textContent = state.round;
}

function renderHistory() {
  const section = document.querySelector('#historySection');
  section.hidden = state.history.length === 0;
  document.querySelector('#historyList').innerHTML = state.history.map((item) => `
    <div class="history-item"><span>ROUND ${item.round}</span><b>${signed(item.scores[0])}</b><i>:</i><b>${signed(item.scores[1])}</b></div>`).join('');
}

function render() {
  renderExpeditions();
  renderScores();
  renderHistory();
  saveState();
}

function signed(value) {
  return value > 0 ? `+${value}` : String(value);
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toastEl.classList.remove('show'), 2200);
}

expeditionsEl.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const player = Number(button.dataset.player);
  const color = Number(button.dataset.color);
  const expedition = state.players[player][color];

  if (button.dataset.action === 'number') {
    const number = Number(button.dataset.number);
    if (state.players[1 - player][color].numbers.includes(number)) return;
    expedition.numbers = expedition.numbers.includes(number)
      ? expedition.numbers.filter((item) => item !== number)
      : [...expedition.numbers, number].sort((a, b) => a - b);
  } else {
    const wager = Number(button.dataset.wager);
    expedition.wagers = expedition.wagers === wager ? wager - 1 : wager;
  }
  render();
});

for (let player = 0; player < 2; player += 1) {
  const nameInput = document.querySelector(`#player${player}Name`);
  nameInput.addEventListener('focus', (event) => {
    event.target.value = state.names[player];
    event.target.dataset.previousName = state.names[player];
    resizeNameInput(event.target);
    event.target.select();
  });
  nameInput.addEventListener('input', (event) => {
    state.names[player] = event.target.value;
    resizeNameInput(event.target);
    saveState();
  });
  nameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') event.target.blur();
  });
  nameInput.addEventListener('blur', (event) => {
    const name = event.target.value.trim();
    const changed = name !== event.target.dataset.previousName;
    state.names[player] = name;
    if (!name) state.prefixes[player] = '';
    else if (changed || !state.prefixes[player]) state.prefixes[player] = pickRandomPrefix(Math.random, state.prefixes[player]);
    renderScores();
    saveState();
  });

  document.querySelector(`[data-reroll-player="${player}"]`).addEventListener('click', () => {
    if (!state.names[player]) {
      nameInput.focus();
      showToast('이름을 먼저 입력해 주세요');
      return;
    }
    state.prefixes[player] = pickRandomPrefix(Math.random, state.prefixes[player]);
    renderScores();
    saveState();
    showToast(`${state.names[player]}의 별명을 다시 뽑았습니다`);
  });
}

document.querySelector('#finishRoundButton').addEventListener('click', () => {
  const scores = [scoreForPlayer(0), scoreForPlayer(1)];
  if (state.players.every((expeditions) => expeditions.every((item) => item.numbers.length === 0 && item.wagers === 0))) {
    showToast('선택된 카드가 없습니다');
    return;
  }
  state.history.push({ round: state.round, scores });
  state.totals = state.totals.map((total, index) => total + scores[index]);
  state.round += 1;
  state.players = [emptyExpeditions(), emptyExpeditions()];
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast(`${state.round - 1}라운드 점수를 저장했습니다`);
});

document.querySelector('#undoRoundButton').addEventListener('click', () => {
  const lastRound = state.history.pop();
  if (!lastRound) return;
  state.totals = state.totals.map((total, index) => total - lastRound.scores[index]);
  state.round = lastRound.round;
  state.players = [emptyExpeditions(), emptyExpeditions()];
  render();
  showToast('마지막 라운드를 취소했습니다');
});

document.querySelector('#resetButton').addEventListener('click', () => {
  if (!window.confirm('모든 라운드와 점수를 지우고 새 게임을 시작할까요?')) return;
  const names = state.names;
  const prefixes = state.prefixes;
  state = defaultState();
  state.names = names;
  state.prefixes = prefixes;
  render();
  showToast('새 게임을 시작합니다');
});

const rulesDialog = document.querySelector('#rulesDialog');
document.querySelector('#rulesButton').addEventListener('click', () => rulesDialog.showModal());
document.querySelector('#closeRulesButton').addEventListener('click', () => rulesDialog.close());
rulesDialog.addEventListener('click', (event) => {
  if (event.target === rulesDialog) rulesDialog.close();
});

render();
