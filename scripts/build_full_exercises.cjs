const fs = require('fs');
const path = require('path');

const { lesson1Exercises, lesson2Exercises, lesson3Exercises } = require('./data_lessons_1_3.cjs');
const { lesson4Exercises, lesson5Exercises, lesson6Exercises, lesson7Exercises } = require('./data_lessons_4_7.cjs');
const { lesson8Exercises, lesson9Exercises, lesson10Exercises, lesson11Exercises } = require('./data_lessons_8_11.cjs');

const allExercises = [
  ...lesson1Exercises,
  ...lesson2Exercises,
  ...lesson3Exercises,
  ...lesson4Exercises,
  ...lesson5Exercises,
  ...lesson6Exercises,
  ...lesson7Exercises,
  ...lesson8Exercises,
  ...lesson9Exercises,
  ...lesson10Exercises,
  ...lesson11Exercises
];

console.log('--- EXERCISE COUNTS BY LESSON ---');
const counts = {};
allExercises.forEach(ex => {
  counts[ex.lesson] = (counts[ex.lesson] || 0) + 1;
});
console.log(counts);
console.log('TOTAL EXERCISES:', allExercises.length);

const outPath = path.join(__dirname, '..', 'src', 'data', 'vocab_exercises.json');
fs.writeFileSync(outPath, JSON.stringify(allExercises, null, 2), 'utf-8');
console.log('Successfully written to:', outPath);
