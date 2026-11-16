import React from 'react';

/**
 * Loại bỏ phiên âm Hiragana trong thẻ <rt> và ngoặc đơn
 * để Web Speech API đọc tiếng Nhật tự nhiên, không bị lặp âm hoặc đọc dính thẻ HTML.
 */
export function cleanForTTS(text) {
  if (!text) return '';
  return text
    .replace(/<rt>[\s\S]*?<\/rt>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/（[^）]*）/g, '')
    .replace(/\([^)]*\)/g, '')
    .trim();
}

/**
 * Tách văn bản chứa <ruby>Kanji<rt>furigana</rt></ruby> hoặc Kanji（furigana） thành các node React.
 * Khi showFurigana = true: hiển thị chữ Hán kèm Hiragana bên trên (thẻ <ruby>) với user-select: none trên <rt>.
 * Khi showFurigana = false: chỉ hiển thị chữ Hán (ẩn hoàn toàn phần furigana).
 */
export function renderJapaneseWithFurigana(text, showFurigana = true) {
  if (!text) return null;

  // Pattern nhận diện cả 2 dạng:
  // 1. Thẻ HTML <ruby>Kanji<rt>furigana</rt></ruby>
  // 2. Dạng ngoặc cũ: 漢字（ひらがな） hoặc 漢字(ひらがな)
  const rubyTagRegex = /<ruby>([^<]+)<rt>([^<]+)<\/rt><\/ruby>/g;
  const parenRegex = /([一-龯々〆ヵヶ0-9A-Za-z]+)[（\(]([ぁ-んァ-ヶー0-9]+)[）\)]/g;

  if (!showFurigana) {
    // Ẩn furigana, chỉ giữ lại chữ gốc
    return text
      .replace(rubyTagRegex, '$1')
      .replace(parenRegex, '$1');
  }

  // Kết hợp cả 2 regex
  const combinedRegex = /<ruby>([^<]+)<rt>([^<]+)<\/rt><\/ruby>|([一-龯々〆ヵヶ0-9A-Za-z]+)[（\(]([ぁ-んァ-ヶー0-9]+)[）\)]/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const kanji = match[1] || match[3];
    const furigana = match[2] || match[4];

    parts.push(
      <ruby key={`${match.index}-${kanji}`} className="inline-ruby mx-[1px] leading-tight group">
        <span className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
          {kanji}
        </span>
        <rt className="text-[11px] text-indigo-600 font-normal select-none px-0.5">
          {furigana}
        </rt>
      </ruby>
    );

    lastIndex = combinedRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}
