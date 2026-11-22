export const KEY = 'jpd133_learning_v2';
export const initialProgress = { events: [], bookmarks: [], favorites: [], settings: { theme: 'light', furigana: true, sakura: true, sakuraIntensity: 'normal', rate: 1 } };

export function loadProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY));
    return validProgress(value) ? { ...initialProgress, ...value, settings: { ...initialProgress.settings, ...value.settings } } : initialProgress;
  } catch { return initialProgress; }
}

export function validProgress(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && Array.isArray(value.events) && value.events.every(event => event && typeof event === 'object' && typeof event.type === 'string' && typeof event.at === 'string' && !Number.isNaN(Date.parse(event.at)))
    && Array.isArray(value.bookmarks) && value.bookmarks.every(id => typeof id === 'number')
    && Array.isArray(value.favorites) && value.favorites.every(id => typeof id === 'number')
    && value.settings && typeof value.settings === 'object' && ['light', 'dark'].includes(value.settings.theme)
    && typeof value.settings.furigana === 'boolean' && typeof value.settings.sakura === 'boolean'
    && (value.settings.sakuraIntensity === undefined || ['slow','normal','fast'].includes(value.settings.sakuraIntensity))
    && typeof value.settings.rate === 'number' && value.settings.rate >= 0.6 && value.settings.rate <= 1.4;
}

export function recordEvent(progress, type, detail = {}) {
  return { ...progress, events: [...progress.events, { type, at: new Date().toISOString(), ...detail }] };
}

const legacyTypes = {
  lesson: ['lesson'], reading: ['reading'], speaking: ['speaking', 'speaking-rating'],
  fe: ['answer', 'exam-answer'], grammar: ['grammar'],
  vocab: ['vocab', 'vocab-review', 'vocab-quiz'], kanji: ['kanji-review', 'kanji-quiz'], 'speaking-exam': ['speaking-exam'], workbook: [],
};

export function getLearnedSet(progress, section) {
  const learned = new Set();
  for (const event of progress?.events || []) {
    if (event.type === 'learned' && event.section === section && event.id !== undefined) learned.add(String(event.id));
    if (legacyTypes[section]?.includes(event.type)) {
      const id = section === 'lesson' ? event.lesson : section === 'speaking-exam' ? event.exam : event.id;
      if (id !== undefined) learned.add(String(id));
    }
  }
  return learned;
}

export function markLearned(progress, section, id, lesson) {
  if (!progress || !legacyTypes[section] || id === undefined || id === null || getLearnedSet(progress, section).has(String(id))) return progress;
  return recordEvent(progress, 'learned', { section, id: String(id), ...(lesson ? { lesson } : {}) });
}

export function getStats(progress) {
  const localDay = value => { const date = new Date(value); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; };
  const answers = progress.events.filter(event => event.type === 'answer' || event.type === 'exam-answer');
  const correct = answers.filter(event => event.correct).length;
  const speaking = progress.events.filter(event => event.type === 'speaking').length;
  const days = [...new Set(progress.events.map(event => localDay(event.at)))].sort().reverse();
  let streak = 0;
  const day = new Date();
  if (days[0] !== localDay(day)) day.setDate(day.getDate() - 1);
  while (days.includes(localDay(day))) { streak++; day.setDate(day.getDate() - 1); }
  return { answers: answers.length, correct, accuracy: answers.length ? Math.round(correct / answers.length * 100) : 0, speaking, streak, days: days.length };
}
