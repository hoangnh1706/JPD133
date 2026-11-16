const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

// Phạm vi trang: Trang 2 đến trang 34 (Bài 1 đến Bài 11)
// 1-based page numbers
const LESSON_RANGES = [
  { lesson: 1, startPage: 2, endPage: 3, defaultTopic: 'Chào hỏi & Giới thiệu bản thân' },
  { lesson: 2, startPage: 4, endPage: 7, defaultTopic: 'Mua sắm & Giá cả' },
  { lesson: 3, startPage: 8, endPage: 11, defaultTopic: 'Thời gian & Lịch trình hàng ngày' },
  { lesson: 4, startPage: 12, endPage: 14, defaultTopic: 'Ngày nghỉ, Địa điểm & Đi lại' },
  { lesson: 5, startPage: 15, endPage: 17, defaultTopic: 'Sở thích & Hoạt động yêu thích' },
  { lesson: 6, startPage: 18, endPage: 20, defaultTopic: 'Rủ rê, Ăn uống & Địa điểm hẹn hò' },
  { lesson: 7, startPage: 21, endPage: 23, defaultTopic: 'Gia đình, Nhà cửa & Phòng ở' },
  { lesson: 8, startPage: 24, endPage: 26, defaultTopic: 'Gia đình, Ngoại hình & Quà tặng' },
  { lesson: 9, startPage: 27, endPage: 29, defaultTopic: 'Du lịch, Lượng từ & Trải nghiệm' },
  { lesson: 10, startPage: 30, endPage: 32, defaultTopic: 'Chỉ đường, Vị trí & Trạng thái cơ thể' },
  { lesson: 11, startPage: 33, endPage: 34, defaultTopic: 'Thói quen sinh hoạt, Chuỗi hành động & Katakana' }
];

async function main() {
  const pdfPath = 'D:\\JPD133\\New words list - Dekiru Nihongo Beginner.pdf';
  const buf = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  await parser.load();
  const pdfData = await parser.getText();

  const allVocab = [];
  let globalId = 1;

  for (const lr of LESSON_RANGES) {
    let pagesText = [];
    for (let p = lr.startPage - 1; p < lr.endPage; p++) {
      if (pdfData.pages[p]) {
        pagesText.push(pdfData.pages[p].text);
      }
    }

    const items = parseLesson(pagesText, lr.lesson, lr.defaultTopic);
    for (const item of items) {
      item.id = globalId++;
      allVocab.push(item);
    }
    console.log(`Bài ${lr.lesson}: Trích xuất ${items.length} mục từ vựng.`);
  }

  console.log(`\n===> TỔNG CỘNG Bài 1 đến Bài 11: ${allVocab.length} mục từ vựng.`);

  const outPath = path.join(__dirname, '..', 'src', 'data', 'vocabulary_b1_11.json');
  fs.writeFileSync(outPath, JSON.stringify(allVocab, null, 2), 'utf8');
  console.log('Đã ghi file vào:', outPath);
}

const LESSON_TOPIC_MAP = {
  1: 'Chào hỏi, Quốc tịch & Bản thân',
  2: 'Mua sắm, Đồ vật & Nhà hàng',
  3: 'Thời gian, Giờ giấc & Hoạt động hàng ngày',
  4: 'Ngày nghỉ, Phương tiện & Di chuyển',
  5: 'Sở thích, Thể thao & Hoạt động',
  6: 'Rủ rê, Đồ ăn thức uống & Hẹn hò',
  7: 'Gia đình, Nhà cửa & Phòng ốc',
  8: 'Xưng hô Gia đình, Ngoại hình & Quà tặng',
  9: 'Du lịch, Lượng từ & Trải nghiệm',
  10: 'Chỉ đường, Giao thông & Sức khỏe',
  11: 'Sinh hoạt hàng ngày, Chuỗi hành động & Katakana'
};

function parseLesson(pages, lessonNum, defaultTopic) {
  const items = [];
  const baseTopic = LESSON_TOPIC_MAP[lessonNum] || defaultTopic;
  let currentTopic = baseTopic;

  for (const pageText of pages) {
    const rawLines = pageText.split('\n').map(l => l.trim()).filter(Boolean);

    for (let idx = 0; idx < rawLines.length; idx++) {
      let line = rawLines[idx];

      // Bỏ qua số trang, footer
      if (/^\d+$/.test(line) || /第\s*[0-9０-９]+\s*課/.test(line) || line === 'ことば') {
        continue;
      }

      // Nhận diện topic con sạch sẽ
      const hasVi = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(line);
      if (!hasVi && /[ぁ-んァ-ヶ一-龯]/.test(line) && line.length < 20 && !line.includes('＝')) {
        let cleanTopic = line.replace(/\s+/g, '').replace(/[\n\r]+/g, '').trim();
        if (cleanTopic.length >= 3 && !cleanTopic.includes('しごと') && !cleanTopic.includes('なまえ') && !cleanTopic.includes('わたし')) {
          currentTopic = `${baseTopic} • ${cleanTopic}`;
        }
        continue;
      }

      if (!hasVi) {
        continue;
      }

      // Xử lý dòng từ vựng có tiếng Việt
      const parsed = parseVocabLine(line, lessonNum, currentTopic);
      if (parsed) {
        items.push(parsed);
      }
    }
  }

  // Khử trùng lặp
  const unique = [];
  const seen = new Set();
  for (const it of items) {
    const key = `${it.word_jp}_${it.reading}_${it.meaning_vi}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(it);
    }
  }

  return unique;
}

function parseVocabLine(line, lessonNum, topic) {
  line = line.replace(/\s+/g, ' ').trim();
  const tokens = line.split(' ');
  if (tokens.length < 2) return null;

  let viStartIdx = -1;
  for (let t = 0; t < tokens.length; t++) {
    const tok = tokens[t];
    const hasJp = /[ぁ-んァ-ヶ一-龯]/.test(tok);
    const isJpExtra = /^[123１２３]$/.test(tok) && t > 0;
    if (!hasJp && !isJpExtra) {
      viStartIdx = t;
      break;
    }
  }

  if (viStartIdx <= 0) return null;

  const jpTokens = tokens.slice(0, viStartIdx);
  const viTokens = tokens.slice(viStartIdx);

  const meaning_vi = viTokens.join(' ').trim();
  if (!meaning_vi || !/[a-zA-ZÀ-ỹ]/.test(meaning_vi)) return null;

  let word_jp = jpTokens[0];
  let reading = jpTokens[0];

  if (jpTokens.length === 1) {
    word_jp = jpTokens[0];
    reading = jpTokens[0];
  } else if (jpTokens.length === 2) {
    word_jp = jpTokens[0];
    reading = jpTokens[1];
  } else {
    // Ví dụ: 終わります［終わる］1 おわります
    word_jp = jpTokens.slice(0, -1).join(' ');
    reading = jpTokens[jpTokens.length - 1];
  }

  word_jp = word_jp.trim();
  reading = reading.trim();

  const isSentence = word_jp.includes('。') || word_jp.includes('？') || word_jp.length > 12;

  return {
    id: 0,
    lesson: lessonNum,
    topic,
    word_jp,
    reading,
    meaning_vi,
    example_jp: isSentence ? word_jp : '',
    example_vi: isSentence ? meaning_vi : ''
  };
}

main().catch(console.error);
