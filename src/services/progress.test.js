import test from 'node:test';
import assert from 'node:assert/strict';
import { getStats, initialProgress, recordEvent, validProgress } from './progress.js';

test('progress records real attempts and calculates accuracy', () => {
  const first = recordEvent(initialProgress, 'answer', { id: 1, lesson: 8, correct: false });
  const second = recordEvent(first, 'answer', { id: 2, lesson: 8, correct: true });
  assert.equal(getStats(second).answers, 2);
  assert.equal(getStats(second).accuracy, 50);
  assert.equal(getStats(initialProgress).accuracy, 0);
});

test('import validation rejects incomplete or malformed progress', () => {
  assert.equal(validProgress(initialProgress), true);
  assert.equal(validProgress({ ...initialProgress, events: [{ type: 'answer' }] }), false);
  assert.equal(validProgress({ ...initialProgress, events: [{ type: 'answer', at: 'not-a-date' }] }), false);
  assert.equal(validProgress({ ...initialProgress, bookmarks: ['bad'] }), false);
  assert.equal(validProgress({ ...initialProgress, settings: { theme: 'unknown' } }), false);
});
