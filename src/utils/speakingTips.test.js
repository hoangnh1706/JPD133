import test from 'node:test';
import assert from 'node:assert/strict';
import { getReadingTip, getSpeakingTip } from './speakingTips.js';

test('speaking tips follow the question when a grammar label lists several patterns', () => {
  const grammar = 'V て + もいいですか / V ない + でください';
  assert.equal(getSpeakingTip({ grammar, question: '写真を とっても いいですか。' }).focus, 'Xin phép');
  assert.equal(getSpeakingTip({ grammar, question: 'ここで はなさないで ください。' }).focus, 'Đề nghị không làm');
  assert.equal(getSpeakingTip({ grammar: 'N1は N2が Aです • Nが〜人います', question: 'ご家族は何人いますか。' }).focus, 'Số người');
});

test('reading hint points to passage facts without disclosing the answer', () => {
  const hint = getReadingTip('しゅみはなんですか。');
  assert.equal(hint.focus, 'Tìm sở thích');
  assert.match(hint.action, /trong đoạn/);
  assert.doesNotMatch(hint.pattern, /ミュージカル/);
});
