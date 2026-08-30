import { calculateExpedition, calculatePlayerRound } from './scoring.js';

const COLORS = [
  { id: 'red', name: '화산', symbol: '▲' },
  { id: 'blue', name: '심해', symbol: '≋' },
  { id: 'green', name: '밀림', symbol: '✦' },
  { id: 'yellow', name: '사막', symbol: '◆' },
  { id: 'white', name: '설산', symbol: '△' },
];
const NUMBERS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const STORAGE_KEY = 'lost-cities-scorekeeper-v1';

const emptyExpeditions = () => COLORS.map(() => ({ numbers: [], wagers: 0 }));
const defaultState = () => ({
  round: 1,
  names: ['탐험가 1', '탐험가 2'],
  totals: [0, 0],
  players: [emptyExpeditions(), emptyExpeditions()],
  history: [],
});

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.players?.length === 2 && saved?.totals?.length === 2) return saved;
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

function cardButton(playerIndex, colorIndex, number) {
  const selected = state.players[playerIndex][colorIndex].numbers.includes(number);
  return `<button type="button" class="card-number${selected ? ' selected' : ''}" data-action="number" data-player="${playerIndex}" data-color="${colorIndex}" data-number="${number}" aria-pressed="${selected}">${number}</button>`;
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
    if (document.activeElement !== nameInput) nameInput.value = state.names[player];
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
  document.querySelector(`#player${player}Name`).addEventListener('input', (event) => {
    state.names[player] = event.target.value || `탐험가 ${player + 1}`;
    saveState();
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
  state = defaultState();
  state.names = names;
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
