import vocabulary from './vocabulary_b1_11.json';
import baseExercises from './vocab_exercises.json';
import grammarExercises from './grammar_exercises.json';
import grammarSpeaking from './grammar_speaking.json';
import imageQuestions from './questions.json';
import noImageQuestions from './no_image_questions.json';
import readings from './reading_passages.json';
import { readingChallenges } from './readingChallenges.js';

export const exercises = [...baseExercises, ...grammarExercises];
export { vocabulary, imageQuestions, noImageQuestions, readings };
export const readingLibrary = [...readings, ...readingChallenges];
export const lessons = Array.from({ length: 11 }, (_, index) => {
  const id = index + 1;
  const words = vocabulary.filter(word => word.lesson === id);
  const questions = exercises.filter(question => question.lesson === id);
  return { id, title: words[0]?.topic?.split(' • ')[0] || `Bài ${id}`, words, questions, speaking: noImageQuestions.filter(question => question.lesson === id), images: imageQuestions.filter(question => question.lesson === id) };
});
export const speakingQuestions = [
  ...[...noImageQuestions, ...grammarSpeaking].map(item => ({ id: `${item.id >= 8000 ? 'g' : 'n'}-${item.id}`, lesson: item.lesson, japanese: item.q_jp, vietnamese: item.q_vi, answer: item.a_jp, answerVi: item.a_vi, grammar: item.grammar })),
  ...imageQuestions.flatMap(item => item.qa.map((qa, index) => ({ id: `i-${item.id}-${index}`, lesson: item.lesson, image: item.image, japanese: qa.q_jp, vietnamese: qa.q_vi, answer: qa.a_jp, answerVi: qa.a_vi, grammar: item.grammar })))
];
