import test from 'node:test';
import assert from 'node:assert/strict';
import { getStats, getLearnedSet, initialProgress, markLearned, recordEvent, validProgress } from './progress.js';

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

test('opening content marks it once and preserves earlier completion history', () => {
  const first = markLearned(initialProgress, 'speaking', 'n-1', 8);
  assert.equal(getLearnedSet(first, 'speaking').has('n-1'), true);
  assert.equal(markLearned(first, 'speaking', 'n-1', 8), first);
  const old = recordEvent(initialProgress, 'answer', { id: 101, lesson: 1, correct: true });
  assert.equal(getLearnedSet(old, 'fe').has('101'), true);
  assert.equal(markLearned(old, 'fe', 101, 1), old);
  assert.equal(getStats(first).answers, 0);
  const workbook = markLearned(first, 'workbook', 8, 8);
  assert.equal(getLearnedSet(workbook, 'workbook').has('8'), true);
  assert.equal(validProgress(workbook), true);
});
