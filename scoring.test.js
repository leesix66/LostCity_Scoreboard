import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateExpedition, calculatePlayerRound } from './scoring.js';

test('시작하지 않은 탐험은 0점이다', () => {
  assert.equal(calculateExpedition([], 0), 0);
});

test('탐험 비용 20점을 차감한다', () => {
  assert.equal(calculateExpedition([2, 5, 8], 0), -5);
});

test('투자 카드는 비용 차감 후 점수를 배수로 만든다', () => {
  assert.equal(calculateExpedition([5, 10], 2), -15);
  assert.equal(calculateExpedition([], 1), -40);
});

test('투자 카드를 포함해 8장 이상이면 배수 계산 뒤 20점을 더한다', () => {
  assert.equal(calculateExpedition([2, 3, 4, 5, 6, 7, 8], 1), 50);
});

test('공식 규칙 예시의 합계는 18점이다', () => {
  const expeditions = [
    { numbers: [5, 8, 10], wagers: 0 },
    { numbers: [], wagers: 0 },
    { numbers: [], wagers: 1 },
    { numbers: [5, 10], wagers: 1 },
    { numbers: [2, 3, 4, 5, 6, 7, 8], wagers: 2 },
  ];
  assert.equal(calculatePlayerRound(expeditions), 18);
});
