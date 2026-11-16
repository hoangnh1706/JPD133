import vocabulary from '../data/vocabulary_b1_11.json';

const plainText = text => text.replace(/<rt>[\s\S]*?<\/rt>/g, '').replace(/<[^>]+>/g, '');
const isKatakana = word => /^[ァ-ヴー]+$/.test(word);

export function getReadingVocabulary(reading) {
  const text = plainText(reading.jp_text);
  const words = reading.focus
    ? reading.focus.map(word => {
      const entry = vocabulary.find(item => item.lesson === reading.lesson && item.word_jp === word);
      return entry && { word, reading: entry.reading, meaning: entry.meaning_vi, lesson: entry.lesson };
    })
    : [
      ...(reading.kanji_check || []).map(item => ({ word: item.word, reading: item.reading, meaning: item.meaning, lesson: Number(item.lesson?.match(/\d+/)?.[0]) })),
      ...[...new Set(text.match(/[ァ-ヴー]+/g) || [])].map(word => {
        const entry = vocabulary.find(item => item.word_jp === word && item.lesson >= 8 && item.lesson <= 11);
        return entry && { word, reading: entry.reading, meaning: entry.meaning_vi, lesson: entry.lesson };
      }),
    ];
  const unique = [...new Map(words.filter(item => item && text.includes(item.word)).map(item => [item.word, item])).values()];
  return { katakana: unique.filter(item => isKatakana(item.word)), kanji: unique.filter(item => !isKatakana(item.word)) };
}
