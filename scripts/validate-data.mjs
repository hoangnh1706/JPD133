import { existsSync, readFileSync } from 'node:fs';
import { landingCounts, landingLessons } from '../src/data/landingMeta.js';
import { readingChallenges } from '../src/data/readingChallenges.js';
const read = name => JSON.parse(readFileSync(new URL(`../src/data/${name}.json`, import.meta.url)));
const vocab = read('vocabulary_b1_11');
const exercises = [...read('vocab_exercises'), ...read('grammar_exercises')];
const imageQuestions = read('questions');
const noImageQuestions = read('no_image_questions');
const grammarSpeaking = read('grammar_speaking');
const readings = read('reading_passages');
const kanji = read('kanji_b1_11');
const errors = [];
for (const [name, rows] of [['vocabulary', vocab], ['exercises', exercises], ['image questions', imageQuestions], ['no-image questions', [...noImageQuestions, ...grammarSpeaking]], ['readings', readings], ['kanji', kanji]]) {
  const ids = new Set();
  for (const row of rows) {
    if (ids.has(row.id)) errors.push(`${name}: duplicate id ${row.id}`);
    ids.add(row.id);
    if (['vocabulary','exercises','image questions','no-image questions'].includes(name) && (!Number.isInteger(row.lesson) || row.lesson < 1 || row.lesson > 11)) errors.push(`${name}: invalid lesson ${row.id}`);
  }
}
for (const row of exercises) {
  if (!row.question || !Array.isArray(row.options) || row.options.length < 2 || !row.options.includes(row.correct_answer)) errors.push(`exercise ${row.id}: invalid answer/options`);
  if (!row.explanation) errors.push(`exercise ${row.id}: missing explanation`);
}
for (const row of vocab) if (!row.word_jp || !row.meaning_vi) errors.push(`vocabulary ${row.id}: missing word/meaning`);
for (const row of kanji) if (!Number.isInteger(row.lesson) || row.lesson < 1 || row.lesson > 11 || !row.kanji || !row.meaning || !Array.isArray(row.examples)) errors.push(`kanji ${row.id}: invalid lesson or content`);
for (const row of imageQuestions) {
  if (!row.image || !existsSync(new URL(`../public${row.image}`, import.meta.url))) errors.push(`image question ${row.id}: missing image`);
  if (!Array.isArray(row.qa) || !row.qa.every(qa => qa.q_jp && qa.a_jp)) errors.push(`image question ${row.id}: incomplete Q&A`);
}
for (const row of [...noImageQuestions, ...grammarSpeaking]) if (!row.q_jp || !row.a_jp) errors.push(`no-image question ${row.id}: incomplete Q&A`);
for (const row of readings) if (!row.jp_text || !Array.isArray(row.questions) || !row.questions.every(qa => qa.q_jp && qa.a_jp)) errors.push(`reading ${row.id}: incomplete text/Q&A`);
for (const row of readingChallenges) {
  if (readings.some(item => item.id === row.id)) errors.push(`reading ${row.id}: duplicate id`);
  if (!Number.isInteger(row.lesson) || row.lesson < 8 || row.lesson > 11 || !row.jp_text || row.questions.length !== 2) errors.push(`reading ${row.id}: invalid lesson or format`);
  const plain = row.jp_text.replace(/<rt>[\s\S]*?<\/rt>/g, '').replace(/<[^>]+>/g, '');
  for (const word of row.focus) if (!plain.includes(word) || !vocab.some(item => item.lesson === row.lesson && item.word_jp === word)) errors.push(`reading ${row.id}: focus word ${word} is outside lesson ${row.lesson} or missing from passage`);
  if (row.focus.filter(word => /^[ァ-ヴー]+$/.test(word)).length < 4 || row.focus.filter(word => /[一-龯]/.test(word)).length < 6) errors.push(`reading ${row.id}: insufficient Katakana or Kanji focus words`);
}
const actualCounts = { vocabulary: vocab.length, exercises: exercises.length, speaking: noImageQuestions.length + grammarSpeaking.length + imageQuestions.reduce((sum, row) => sum + row.qa.length, 0), readings: readings.length + readingChallenges.length };
for (const [name, count] of Object.entries(actualCounts)) if (landingCounts[name] !== count) errors.push(`landing count ${name}: expected ${count}, found ${landingCounts[name]}`);
for (const lesson of landingLessons) if (vocab.filter(word => word.lesson === lesson.id).length !== lesson.words) errors.push(`landing lesson ${lesson.id}: wrong word count`);
console.log(`Validated ${vocab.length} words, ${exercises.length} exercises, ${imageQuestions.length} image sets, ${noImageQuestions.length + grammarSpeaking.length} speaking prompts, ${readings.length + readingChallenges.length} readings and ${kanji.length} Kanji. ${errors.length} structural errors.`);
if (errors.length) { console.error(errors.slice(0, 30).join('\n')); process.exitCode = 1; }
