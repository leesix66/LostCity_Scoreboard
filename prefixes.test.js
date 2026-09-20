import test from 'node:test';
import assert from 'node:assert/strict';
import { TITLE_PREFIXES, formatPlayerName, pickRandomPrefix } from './prefixes.js';

test('우승꽝스러운 접두어 100개가 중복 없이 준비되어 있다', () => {
  assert.equal(TITLE_PREFIXES.length, 100);
  assert.equal(new Set(TITLE_PREFIXES).size, 100);
});

test('이름 앞에 선택된 접두어를 붙인다', () => {
  assert.equal(formatPlayerName('김진혁', '지옥에서 돌아온'), '지옥에서 돌아온 김진혁');
  assert.equal(formatPlayerName('', '지옥에서 돌아온'), '');
});

test('재추첨 시 현재 접두어를 제외한다', () => {
  assert.notEqual(pickRandomPrefix(() => 0, TITLE_PREFIXES[0]), TITLE_PREFIXES[0]);
});
