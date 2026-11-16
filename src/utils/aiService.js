// Quản lý cấu hình và dịch vụ AI (Gemini & DeepSeek)
// jpd133-web: AI Translation & Linguistic Analysis
import vocabData from '../data/vocabulary_b1_11.json';
import readingPassagesData from '../data/reading_passages.json';
import kanjiData from '../data/kanji_b1_11.json';

const AI_CONFIG_KEY = 'jpd133_ai_config_v1';
const CUSTOM_VOCAB_KEY = 'jpd133_custom_vocab_v1';
const AI_HISTORY_KEY = 'jpd133_ai_lookup_history_v1';
const AI_CACHE_KEY = 'jpd133_ai_translation_cache_v1';
const MAX_CACHE_ENTRIES = 150;

export const DEFAULT_AI_CONFIG = {
  provider: 'gemini', // 'gemini' | 'deepseek'
  apiKey: '',
  model: 'gemini-3.8-flash' // gemini: 'gemini-3.8-flash' | 'gemini-3.8-pro' | 'gemini-1.5-flash'; deepseek: 'deepseek-chat'
};

// ====================================================================
// QUẢN LÝ CẤU HÌNH & TỰ ĐỘNG CHUYỂN ĐỔI MODEL CŨ
// ====================================================================
export function getAiConfig() {
  try {
    const saved = localStorage.getItem(AI_CONFIG_KEY);
    if (saved) {
      const config = { ...DEFAULT_AI_CONFIG, ...JSON.parse(saved) };
      // Tự động chuyển đổi các cấu hình cũ gemini-2.5-flash sang gemini-3.8-flash
      if (config.provider === 'gemini') {
        if (!config.model || config.model === 'gemini-2.5-flash') {
          config.model = 'gemini-3.8-flash';
          localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
        }
      }
      return config;
    }
  } catch (e) {
    console.error('Error reading AI config:', e);
  }
  return DEFAULT_AI_CONFIG;
}

export function saveAiConfig(config) {
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch (e) {
    console.error('Error saving AI config:', e);
    return false;
  }
}

// ====================================================================
// BỘ NHỚ ĐỆM (CACHE) KẾT QUẢ AI VÀO LOCALSTORAGE (0ms cho từ đã tra)
// ====================================================================
function normalizeCacheKey(text) {
  if (!text) return '';
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function getAiCache() {
  try {
    const saved = localStorage.getItem(AI_CACHE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function getCachedAiResult(query) {
  const key = normalizeCacheKey(query);
  if (!key) return null;
  const cache = getAiCache();
  return cache[key] || null;
}

export function saveCachedAiResult(query, result) {
  try {
    const key = normalizeCacheKey(query);
    if (!key || !result) return;
    const cache = getAiCache();
    cache[key] = {
      ...result,
      _cachedAt: Date.now()
    };
    
    // Giới hạn số lượng mục trong cache để tránh đầy bộ nhớ trình duyệt
    const keys = Object.keys(cache);
    if (keys.length > MAX_CACHE_ENTRIES) {
      const keysToDelete = keys.slice(0, keys.length - MAX_CACHE_ENTRIES);
      keysToDelete.forEach(k => delete cache[k]);
    }
    
    localStorage.setItem(AI_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('Error saving AI cache:', e);
  }
}

// ====================================================================
// QUẢN LÝ TỪ VỰNG CUSTOM & LỊCH SỬ TRA CỨU
// ====================================================================
export function getCustomVocab() {
  try {
    const saved = localStorage.getItem(CUSTOM_VOCAB_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveCustomVocab(item) {
  try {
    const list = getCustomVocab();
    const exists = list.some(x => x.word === item.word || x.word_jp === item.word);
    if (!exists) {
      const newItem = {
        id: 'custom_' + Date.now(),
        word_jp: item.word || item.word_jp,
        reading: item.reading || item.reading_hiragana || '',
        meaning_vi: item.meaning || item.meaning_vi || '',
        han_viet: item.han_viet || '',
        grammar: item.grammar || item.grammar_notes || '',
        lesson: 'Tự thêm',
        topic: 'Tra cứu AI',
        createdAt: new Date().toISOString()
      };
      const updated = [newItem, ...list];
      localStorage.setItem(CUSTOM_VOCAB_KEY, JSON.stringify(updated));
      return newItem;
    }
  } catch (e) {
    console.error('Error saving custom vocab:', e);
  }
  return null;
}

export function getAiLookupHistory() {
  try {
    const saved = localStorage.getItem(AI_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveAiLookupHistory(record) {
  try {
    const list = getAiLookupHistory();
    const filtered = list.filter(item => item.query.trim().toLowerCase() !== record.query.trim().toLowerCase());
    const updated = [record, ...filtered].slice(0, 20);
    localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error saving history:', e);
    return [];
  }
}

export function clearAiLookupHistory() {
  try {
    localStorage.removeItem(AI_HISTORY_KEY);
    return true;
  } catch {
    return false;
  }
}

// Helper: Làm sạch chuỗi JSON nếu model bọc trong ```json ... ```
function cleanJsonString(str) {
  if (!str) return '{}';
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/```\s*$/i, '');
  }
  return cleaned.trim();
}

// ====================================================================
// KIỂM TRA KẾT NỐI AI API (Siêu tốc với thinkingBudget: 0)
// ====================================================================
export async function testAiConnection(config) {
  const { provider, apiKey, model } = config;
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'Vui lòng nhập API Key.' };
  }

  try {
    if (provider === 'gemini') {
      let targetModel = model || 'gemini-3.8-flash';
      if (targetModel === 'gemini-2.5-flash') {
        targetModel = 'gemini-3.8-flash';
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey.trim()}`;
      
      const generationConfig = {
        maxOutputTokens: 10,
        temperature: 0.1
      };
      if (targetModel.includes('gemini-3.8') || targetModel.includes('gemini-2.5')) {
        generationConfig.thinkingConfig = { thinkingBudget: 0 };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Trả lời đúng 1 chữ: OK' }] }],
          generationConfig
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error?.message || `Lỗi HTTP ${res.status}: ${res.statusText}`;
        return { success: false, message: `Kết nối Gemini thất bại: ${errMsg}` };
      }

      const data = await res.json();
      if (data.candidates && data.candidates.length > 0) {
        return { success: true, message: `Kết nối Gemini (${targetModel}) thành công! Phản hồi tức thì.` };
      }
      return { success: false, message: 'Gemini không trả về phản hồi hợp lệ.' };

    } else if (provider === 'deepseek') {
      const targetModel = model || 'deepseek-chat';
      const url = 'https://api.deepseek.com/chat/completions';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [{ role: 'user', content: 'Trả lời đúng 1 chữ: OK' }],
          max_tokens: 10
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error?.message || `Lỗi HTTP ${res.status}: ${res.statusText}`;
        return { success: false, message: `Kết nối DeepSeek thất bại: ${errMsg}` };
      }

      return { success: true, message: `Kết nối DeepSeek (${targetModel}) thành công!` };
    }

    return { success: false, message: 'Nhà cung cấp không hợp lệ.' };
  } catch (error) {
    return { success: false, message: `Lỗi kết nối mạng: ${error.message}` };
  }
}

// ====================================================================
// GỌI AI THỰC HIỆN PROMPT (Tối ưu phản hồi trong ~1s & Hỗ trợ AbortSignal)
// ====================================================================
async function callAiRaw(prompt, systemInstruction = '', signal = null) {
  const config = getAiConfig();
  const { provider, apiKey, model } = config;

  if (!apiKey || !apiKey.trim()) {
    throw new Error('Chưa cài đặt API Key. Vui lòng mở Cài đặt AI (⚙️) ở góc trên để cấu hình.');
  }

  if (provider === 'gemini') {
    let targetModel = model || 'gemini-3.8-flash';
    if (targetModel === 'gemini-2.5-flash') {
      targetModel = 'gemini-3.8-flash';
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey.trim()}`;
    
    const contents = [];
    if (systemInstruction) {
      contents.push({ role: 'user', parts: [{ text: `[HƯỚNG DẪN HỆ THỐNG]: ${systemInstruction}` }] });
      contents.push({ role: 'model', parts: [{ text: 'Đã hiểu. Sẵn sàng trả về DUY NHẤT chuỗi JSON hợp lệ.' }] });
    }
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    // Cấu hình tối ưu tốc độ phản hồi tức thì
    const generationConfig = {
      temperature: 0.2,
      maxOutputTokens: 800,
      responseMimeType: 'application/json'
    };

    // Tắt thinking cho gemini-3.8-flash để phản hồi tức thì trong ~1s
    if (targetModel.includes('gemini-3.8') || targetModel.includes('gemini-2.5')) {
      generationConfig.thinkingConfig = {
        thinkingBudget: 0
      };
    }

    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          contents,
          generationConfig
        })
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Yêu cầu tra cứu AI đã được hủy.');
      }
      throw err;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      // Dự phòng nếu model không hỗ trợ thinkingConfig
      if (generationConfig.thinkingConfig && err.error?.message?.toLowerCase().includes('thinking')) {
        delete generationConfig.thinkingConfig;
        const retryRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal,
          body: JSON.stringify({ contents, generationConfig })
        });
        if (retryRes.ok) {
          const retryData = await retryRes.json();
          return retryData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      }
      throw new Error(err.error?.message || `Lỗi Gemini API (${res.status})`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  } else if (provider === 'deepseek') {
    const targetModel = model || 'deepseek-chat';
    const url = 'https://api.deepseek.com/chat/completions';

    const messages = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        signal,
        body: JSON.stringify({
          model: targetModel,
          messages,
          temperature: 0.2,
          max_tokens: 800,
          response_format: { type: 'json_object' }
        })
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Yêu cầu tra cứu AI đã được hủy.');
      }
      throw err;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Lỗi DeepSeek API (${res.status})`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  throw new Error('Nhà cung cấp AI không được hỗ trợ.');
}

// ====================================================================
// PHẦN 1: TỰ ĐỘNG TRA CỨU GIÁO TRÌNH NỘI BỘ (0ms - Miễn phí)
// ====================================================================
export function searchInCurriculum(query) {
  if (!query || !query.trim()) return null;
  const q = query.trim();
  const qLower = q.toLowerCase();
  const qNoSpace = q.replace(/\s+/g, '');
  const qNoSpaceLower = qLower.replace(/\s+/g, '');

  // Chỉ kích hoạt tự động với từ hoặc cụm từ ngắn (1 đến 3 từ hoặc độ dài <= 25 ký tự)
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 3 || q.length > 25) {
    return null;
  }

  // 0. Tra cứu 119 chữ Kanji Bài 1 - Bài 11 (Tong_hop_Kanji_Bai_1-11.docx)
  const kDirect = kanjiData.find(k => 
    k.kanji === q ||
    k.kanji === qNoSpace ||
    k.han_viet.toLowerCase() === qLower ||
    k.han_viet.toLowerCase() === qNoSpaceLower
  );
  if (kDirect) {
    const reading = kDirect.kun_reading && kDirect.kun_reading !== '—' 
      ? kDirect.kun_reading 
      : kDirect.on_reading;
    return {
      isFromCurriculum: true,
      source: `Kanji Bài ${kDirect.lesson} (${kDirect.han_viet})`,
      input_text: q,
      source_lang: /[\u3400-\u4dbf\u4e00-\u9fff]/.test(q) ? 'ja' : 'vi',
      japanese_ruby_html: `<ruby>${kDirect.kanji}<rt>${kDirect.han_viet}</rt></ruby>`,
      japanese_plain: kDirect.kanji,
      reading_hiragana: reading,
      vietnamese_translation: `${kDirect.meaning} (Âm Hán Việt: ${kDirect.han_viet})`,
      grammar_explanation: `Chữ Hán thuộc phạm vi Bài ${kDirect.lesson}. Âm Kun: ${kDirect.kun_reading || '—'} • Âm On: ${kDirect.on_reading || '—'}. Nghĩa: ${kDirect.meaning}.`,
      breakdown: [
        {
          word: kDirect.kanji,
          reading: reading,
          han_viet: kDirect.han_viet,
          meaning: kDirect.meaning
        },
        ...(kDirect.examples || []).slice(0, 4).map(ex => ({
          word: ex.word,
          reading: ex.reading,
          han_viet: '',
          meaning: ex.meaning || kDirect.meaning
        }))
      ]
    };
  }

  // 1. Tìm trong kho từ vựng Bài 1 - Bài 11 (Dekiru Shokyu)
  let matchedVocab = vocabData.find(v => 
    v.word_jp === q ||
    v.reading === q ||
    v.word_jp.replace(/\s+/g, '') === qNoSpace ||
    v.reading.replace(/\s+/g, '') === qNoSpace
  );

  if (!matchedVocab) {
    matchedVocab = vocabData.find(v => 
      v.meaning_vi.toLowerCase().trim() === qLower ||
      v.meaning_vi.toLowerCase().replace(/\s+/g, '') === qNoSpaceLower
    );
  }

  if (!matchedVocab && q.length >= 2) {
    matchedVocab = vocabData.find(v => 
      v.word_jp.includes(q) || v.reading.includes(q)
    );
  }

  if (matchedVocab) {
    const isKanji = /[\u3400-\u4dbf\u4e00-\u9fff]/.test(matchedVocab.word_jp);
    const rubyHtml = isKanji && matchedVocab.reading && matchedVocab.reading !== matchedVocab.word_jp
      ? `<ruby>${matchedVocab.word_jp}<rt>${matchedVocab.reading}</rt></ruby>`
      : matchedVocab.word_jp;

    return {
      isFromCurriculum: true,
      source: `Bài ${matchedVocab.lesson} (${matchedVocab.topic})`,
      input_text: q,
      source_lang: /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(q) ? 'ja' : 'vi',
      japanese_ruby_html: rubyHtml,
      japanese_plain: matchedVocab.word_jp,
      reading_hiragana: matchedVocab.reading,
      vietnamese_translation: matchedVocab.meaning_vi,
      example_jp: matchedVocab.example_jp,
      example_vi: matchedVocab.example_vi,
      grammar_explanation: matchedVocab.example_jp 
        ? `Câu ví dụ giáo trình: "${matchedVocab.example_jp}" (${matchedVocab.example_vi}). Thuộc Bài ${matchedVocab.lesson}, chủ đề "${matchedVocab.topic}".`
        : `Từ vựng cốt lõi Bài ${matchedVocab.lesson}, chủ đề "${matchedVocab.topic}".`,
      breakdown: [
        {
          word: matchedVocab.word_jp,
          reading: matchedVocab.reading,
          han_viet: '',
          meaning: matchedVocab.meaning_vi
        }
      ]
    };
  }

  // 2. Tìm trong 16 bài luyện đọc (Reading Passages)
  for (const passage of readingPassagesData) {
    if (passage.kanji_check && passage.kanji_check.length > 0) {
      const kMatch = passage.kanji_check.find(k => 
        k.word === q ||
        k.reading === q ||
        k.meaning.toLowerCase().trim() === qLower ||
        k.word.replace(/\s+/g, '') === qNoSpace ||
        k.meaning.toLowerCase().replace(/\s+/g, '') === qNoSpaceLower
      );
      if (kMatch) {
        return {
          isFromCurriculum: true,
          source: `${passage.title} (${kMatch.lesson || 'Kanji Bài 8-11'})`,
          input_text: q,
          source_lang: /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(q) ? 'ja' : 'vi',
          japanese_ruby_html: `<ruby>${kMatch.word}<rt>${kMatch.reading}</rt></ruby>`,
          japanese_plain: kMatch.word,
          reading_hiragana: kMatch.reading,
          vietnamese_translation: kMatch.meaning,
          grammar_explanation: `Chữ Hán thuộc phạm vi ${kMatch.lesson || 'Bài 8-11'}, xuất hiện trong ${passage.title}.`,
          breakdown: [
            {
              word: kMatch.word,
              reading: kMatch.reading,
              han_viet: '',
              meaning: kMatch.meaning
            }
          ]
        };
      }
    }

    if (passage.all_kanji_words && passage.all_kanji_words.length > 0) {
      const akMatch = passage.all_kanji_words.find(k => 
        k.word === q ||
        k.reading === q ||
        k.meaning.toLowerCase().trim() === qLower ||
        k.word.replace(/\s+/g, '') === qNoSpace
      );
      if (akMatch) {
        return {
          isFromCurriculum: true,
          source: `${passage.title} (Từ Kanji bài đọc)`,
          input_text: q,
          source_lang: /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(q) ? 'ja' : 'vi',
          japanese_ruby_html: `<ruby>${akMatch.word}<rt>${akMatch.reading}</rt></ruby>`,
          japanese_plain: akMatch.word,
          reading_hiragana: akMatch.reading,
          vietnamese_translation: akMatch.meaning,
          grammar_explanation: `Từ vựng chữ Hán xuất hiện trong bài đọc "${passage.title}".`,
          breakdown: [
            {
              word: akMatch.word,
              reading: akMatch.reading,
              han_viet: '',
              meaning: akMatch.meaning
            }
          ]
        };
      }
    }
  }

  // 3. Kiểm tra trong danh sách Flashcard cá nhân đã lưu
  const customList = getCustomVocab();
  const cMatch = customList.find(c => 
    (c.word_jp && (c.word_jp === q || c.word_jp.replace(/\s+/g, '') === qNoSpace)) ||
    (c.reading && c.reading === q) ||
    (c.meaning_vi && c.meaning_vi.toLowerCase().trim() === qLower)
  );
  if (cMatch) {
    return {
      isFromCurriculum: true,
      source: 'Flashcard cá nhân (Đã lưu)',
      input_text: q,
      source_lang: /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(q) ? 'ja' : 'vi',
      japanese_ruby_html: cMatch.reading 
        ? `<ruby>${cMatch.word_jp}<rt>${cMatch.reading}</rt></ruby>`
        : cMatch.word_jp,
      japanese_plain: cMatch.word_jp,
      reading_hiragana: cMatch.reading,
      vietnamese_translation: cMatch.meaning_vi,
      grammar_explanation: cMatch.grammar || 'Từ vựng đã lưu vào bộ nhớ Flashcard.',
      breakdown: [
        {
          word: cMatch.word_jp,
          reading: cMatch.reading,
          han_viet: cMatch.han_viet || '',
          meaning: cMatch.meaning_vi
        }
      ]
    };
  }

  return null;
}

// ====================================================================
// PHẦN 2: DỊCH & GIẢI THÍCH TỪ/CỤM TỪ NGOÀI TÀI LIỆU (Có cache & rút gọn prompt)
// ====================================================================
export async function explainWordOrPhraseWithAi(phrase, contextSentence = '', signal = null, bypassCache = false) {
  const target = phrase.trim();
  const cacheKey = contextSentence ? `${target}__${contextSentence.trim()}` : target;

  // Kiểm tra cache trước
  if (!bypassCache) {
    const cached = getCachedAiResult(cacheKey);
    if (cached) {
      return { ...cached, isCached: true };
    }
  }

  // System instruction cực kỳ ngắn gọn
  const systemInstruction = 'Giáo viên tiếng Nhật N5-N4. Trả về DUY NHẤT một chuỗi JSON hợp lệ theo đúng schema.';
  const prompt = `Phân tích từ: "${target}"${contextSentence ? ` (Ngữ cảnh: "${contextSentence}")` : ''}.
Schema JSON:
{
  "word_jp": "${target}",
  "reading": "hiragana",
  "meaning_vi": "nghĩa tiếng Việt ngắn gọn",
  "han_viet": "Âm Hán Việt",
  "grammar_notes": "1 câu ngắn giải thích dạng từ/ngữ pháp nếu có",
  "breakdown": [
    {"word":"thành phần","reading":"hiragana","han_viet":"Hán Việt","meaning":"nghĩa"}
  ]
}`;

  const raw = await callAiRaw(prompt, systemInstruction, signal);
  const cleaned = cleanJsonString(raw);
  const result = JSON.parse(cleaned);

  // Lưu cache
  saveCachedAiResult(cacheKey, result);
  return result;
}

// ====================================================================
// PHẦN 3: TRA CỨU & DỊCH AI ĐỘC LẬP (Nhật ↔ Việt) (Có cache & rút gọn prompt)
// ====================================================================
export async function translateAndAnalyzeWithAi(text, signal = null, bypassCache = false) {
  const target = text.trim();
  if (!target) throw new Error('Văn bản cần tra cứu không được để trống.');

  // Kiểm tra cache trước (0ms)
  if (!bypassCache) {
    const cached = getCachedAiResult(target);
    if (cached) {
      return { ...cached, isCached: true };
    }
  }

  // System instruction cực kỳ ngắn gọn
  const systemInstruction = 'Chuyên gia dịch thuật & ngữ pháp Nhật-Việt N5-N4. Trả về DUY NHẤT một chuỗi JSON hợp lệ theo đúng schema.';
  const prompt = `Dịch & phân tích câu: "${target}"
Schema JSON:
{
  "input_text": "${target}",
  "source_lang": "ja|vi",
  "japanese_ruby_html": "<ruby>Kanji<rt>hiragana</rt></ruby>",
  "japanese_plain": "câu tiếng Nhật chuẩn",
  "reading_hiragana": "phiên âm hiragana toàn câu",
  "vietnamese_translation": "bản dịch tiếng Việt tự nhiên",
  "grammar_explanation": "1-2 câu giải thích ngữ pháp ngắn gọn, dễ hiểu",
  "breakdown": [
    {"word":"từ vựng/kanji","reading":"hiragana","han_viet":"Âm Hán Việt","meaning":"nghĩa tiếng Việt"}
  ]
}`;

  const raw = await callAiRaw(prompt, systemInstruction, signal);
  const cleaned = cleanJsonString(raw);
  const result = JSON.parse(cleaned);

  // Lưu cache
  saveCachedAiResult(target, result);
  return result;
}

// Giữ hàm tra cứu tương thích ngược cho ReadingPracticeCard nếu cần
export function searchInLocalKnowledge(query, currentPassage, allVocabList) {
  if (!query || !query.trim()) return null;
  const q = query.trim().replace(/\s+/g, '');
  const vocabListToSearch = (allVocabList && allVocabList.length > 0) ? allVocabList : vocabData;

  // 1. Kiểm tra nếu là 1 chữ Kanji đơn lẻ nằm trong 119 chữ Bài 1-11
  const exactKanji = kanjiData.find(k => k.kanji === q);
  if (exactKanji) {
    return {
      isKanji: true,
      word: exactKanji.kanji,
      kanji: exactKanji.kanji,
      han_viet: exactKanji.han_viet,
      on_reading: exactKanji.on_reading,
      kun_reading: exactKanji.kun_reading,
      reading: exactKanji.kun_reading && exactKanji.kun_reading !== '—'
        ? exactKanji.kun_reading
        : exactKanji.on_reading,
      meaning: exactKanji.meaning,
      lesson: exactKanji.lesson,
      examples: exactKanji.examples || [],
      source: `Kanji Bài ${exactKanji.lesson}`,
      sourceType: 'local'
    };
  }

  // 2. Kiểm tra trong all_kanji_words của bài đọc hiện tại
  if (currentPassage && currentPassage.all_kanji_words) {
    const found = currentPassage.all_kanji_words.find(item => 
      item.word.replace(/\s+/g, '') === q
    );
    if (found) {
      const kInfo = kanjiData.find(k => found.word.includes(k.kanji));
      return {
        word: found.word,
        reading: found.reading,
        meaning: found.meaning,
        han_viet: kInfo ? kInfo.han_viet : '',
        source: 'Bài đọc hiện tại (all_kanji_words)',
        sourceType: 'local'
      };
    }
  }

  // 3. Kiểm tra trong kanji_check của bài đọc hiện tại
  if (currentPassage && currentPassage.kanji_check) {
    const found = currentPassage.kanji_check.find(item => 
      item.word.replace(/\s+/g, '') === q
    );
    if (found) {
      const kInfo = kanjiData.find(k => found.word.includes(k.kanji));
      return {
        word: found.word,
        reading: found.reading,
        meaning: found.meaning,
        han_viet: kInfo ? kInfo.han_viet : '',
        source: `Kanji ${found.lesson || 'Bài 8-11'}`,
        sourceType: 'local'
      };
    }
  }

  // 4. Khớp chính xác trong kho từ vựng Bài 1-11
  const exact = vocabListToSearch.find(item => 
    item.word_jp.replace(/\s+/g, '') === q ||
    item.reading.replace(/\s+/g, '') === q
  );
  if (exact) {
    const kInfo = kanjiData.find(k => exact.word_jp.includes(k.kanji));
    return {
      word: exact.word_jp,
      reading: exact.reading,
      meaning: exact.meaning_vi,
      han_viet: kInfo ? kInfo.han_viet : '',
      source: `Từ vựng Bài ${exact.lesson}`,
      sourceType: 'local'
    };
  }

  // 5. Khớp một phần trong kho từ vựng (chứa trọn từ hoặc ngược lại)
  if (q.length >= 2) {
    const partial = vocabListToSearch.find(item => {
      const wClean = item.word_jp.replace(/\s+/g, '');
      return (wClean.length >= 2 && (wClean.includes(q) || q.includes(wClean)));
    });
    if (partial) {
      const kInfo = kanjiData.find(k => partial.word_jp.includes(k.kanji));
      return {
        word: partial.word_jp,
        reading: partial.reading,
        meaning: partial.meaning_vi,
        han_viet: kInfo ? kInfo.han_viet : '',
        source: `Từ vựng Bài ${partial.lesson}`,
        sourceType: 'local'
      };
    }
  }

  // 6. Nếu chuỗi bôi có chứa ít nhất 1 chữ Kanji nằm trong 119 chữ Bài 1-11 (ví dụ 飲みます, 飲んだ, 飲んで...)
  const kanjiChars = q.match(/[\u3400-\u4dbf\u4e00-\u9fff]/g);
  if (kanjiChars && kanjiChars.length > 0) {
    for (const char of kanjiChars) {
      const kFound = kanjiData.find(k => k.kanji === char);
      if (kFound) {
        // Tìm xem trong các ví dụ của chữ Kanji này có từ nào gần giống không
        const exMatch = kFound.examples?.find(e => e.word === q || q.includes(e.word) || e.word.includes(q));
        return {
          isKanji: true,
          word: q,
          kanji: kFound.kanji,
          han_viet: kFound.han_viet,
          on_reading: kFound.on_reading,
          kun_reading: kFound.kun_reading,
          reading: exMatch?.reading || (kFound.kun_reading && kFound.kun_reading !== '—' ? kFound.kun_reading : kFound.on_reading),
          meaning: exMatch?.meaning || `${kFound.meaning} (chứa Hán tự ${kFound.kanji} - ${kFound.han_viet})`,
          lesson: kFound.lesson,
          examples: kFound.examples || [],
          source: `Chứa Kanji Bài ${kFound.lesson} (${kFound.kanji} - ${kFound.han_viet})`,
          sourceType: 'local'
        };
      }
    }
  }

  // 7. Flashcard cá nhân đã lưu
  const customList = getCustomVocab();
  const customFound = customList.find(item => 
    (item.word_jp && item.word_jp.replace(/\s+/g, '') === q) ||
    (item.reading && item.reading.replace(/\s+/g, '') === q)
  );
  if (customFound) {
    return {
      word: customFound.word_jp,
      reading: customFound.reading,
      meaning: customFound.meaning_vi,
      source: 'Từ đã lưu trong Flashcard',
      sourceType: 'local'
    };
  }

  return null;
}
