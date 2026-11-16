const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const LESSONS = [
  { lesson: 1, startPage: 3, endPage: 5, topic: 'はじめまして (Chào hỏi & Giới thiệu bản thân)' },
  { lesson: 2, startPage: 6, endPage: 9, topic: '買いもの (Mua sắm & Đồ vật)' },
  { lesson: 3, startPage: 10, endPage: 13, topic: '毎日 (Sinh hoạt hàng ngày & Thời gian)' },
  { lesson: 4, startPage: 14, endPage: 16, topic: '休みの日 (Ngày nghỉ, Địa điểm & Di chuyển)' },
  { lesson: 5, startPage: 17, endPage: 19, topic: '好きなこと (Sở thích & Hoạt động)' },
  { lesson: 6, startPage: 20, endPage: 22, topic: 'いっしょに (Rủ rê & Ăn uống)' },
  { lesson: 7, startPage: 23, endPage: 26, topic: '家族・部屋 (Gia đình, Nhà cửa & Đồ đạc)' },
  { lesson: 8, startPage: 27, endPage: 30, topic: 'プレゼント・人 (Quà tặng, Ngoại hình & Tính cách)' },
  { lesson: 9, startPage: 31, endPage: 33, topic: '旅行・体験 (Du lịch, Lượng từ & Trải nghiệm)' },
  { lesson: 10, startPage: 34, endPage: 37, topic: '街・道案内 (Chỉ đường, Vị trí & Sức khỏe)' },
  { lesson: 11, startPage: 38, endPage: 40, topic: '毎日の生活 (Thói quen sinh hoạt & Chuỗi hành động)' }
];

async function run() {
  const pdfPath = path.join(__dirname, '..', 'documents', 'pdf', 'Dekiru Shokyu Tu moi - 4 ngon ngu.pdf');
  const buf = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  await parser.load();
  const pdfData = await parser.getText();

  const allVocab = [];
  let globalId = 1;

  for (const item of LESSONS) {
    let pagesText = [];
    for (let p = item.startPage - 1; p < item.endPage; p++) {
      if (pdfData.pages[p]) {
        pagesText.push(pdfData.pages[p].text);
      }
    }
    const words = parsePages(pagesText, item.lesson, item.topic);
    for (const w of words) {
      w.id = globalId++;
      allVocab.push(w);
    }
    console.log(`Bài ${item.lesson}: Trích xuất ${words.length} từ vựng.`);
  }

  console.log(`=> TỔNG CỘNG Bài 1-11: ${allVocab.length} từ vựng.`);
  const outPath = path.join(__dirname, '..', 'src', 'data', 'vocabulary_b1_11.json');
  fs.writeFileSync(outPath, JSON.stringify(allVocab, null, 2), 'utf8');
  console.log('Đã lưu file thành công tại:', outPath);
}

function parsePages(pages, lessonNum, defaultTopic) {
  const items = [];
  let currentSubTopic = defaultTopic;

  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const pageText = pages[pIdx];
    const rawLines = pageText.split('\n').map(l => l.trim()).filter(Boolean);
    let i = 0;

    // Chỉ trang đầu tiên của bài học mới có phần giới thiệu trước bảng từ vựng
    if (pIdx === 0) {
      while (i < rawLines.length) {
        const line = rawLines[i];
        if (line.includes('ことば') && (line.includes('語') || line.includes('英'))) {
          i++;
          break;
        }
        i++;
      }
    }

    // Duyệt qua các dòng còn lại trong trang
    while (i < rawLines.length) {
      const line = rawLines[i];

      // Bỏ qua header trang
      if (line.startsWith('できる日本語') || /^\d+$/.test(line) || line.startsWith('第') || line.startsWith('だい') || line.endsWith('課') || line === 'か') {
        i++;
        continue;
      }

      // Cập nhật Subtopic nếu gặp mục số lớn
      if (/^[１２３456789]\s+[^\n\r]+/.test(line) && !line.includes('tôi') && !line.includes('Nhật') && !line.includes('tên')) {
        let clean = line.replace(/^[１２３456789]\s*/, '').replace(/\s+/g, ' ').trim();
        if (clean.length > 2 && !clean.includes('student')) {
          currentSubTopic = `Bài ${lessonNum} - Mục ${line.charAt(0)}: ${clean}`;
        }
        i++;
        continue;
      }

      // Bỏ qua các dòng hướng dẫn giáo trình
      if (line.startsWith('Bạn có thể') || line.startsWith('Bạn đang') || line.includes('ベトナム語訳のみ') || line.includes('ことば') && line.includes('ベトナム')) {
        i++;
        continue;
      }

      // Phát hiện từ vựng:
      // Trường hợp 1: Dòng đơn Katakana / Hiragana kèm nghĩa (ví dụ: アメリカ America 美国 미국 Mỹ)
      if (/[\uAC00-\uD7AF]/.test(line) && /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(line)) {
        const parsed = parseSingleLineVocab(line, lessonNum, currentSubTopic);
        if (parsed) {
          items.push(parsed);
          i++;
          continue;
        }
      }

      // Trường hợp 2: Khối nhiều dòng (Kanji xen kẽ Furigana, tiếng Anh, Hàn, và tiếng Việt)
      // Bắt đầu bằng chữ Nhật (Kanji hoặc Kana)
      if (/[ぁ-んァ-ヶ一-龯]/.test(line)) {
        let blockLines = [line];
        let j = i + 1;
        let foundVi = false;

        while (j < rawLines.length && j - i < 15) {
          const nextL = rawLines[j];
          if (nextL.startsWith('できる日本語') || /^\d+$/.test(nextL) || /^[１２３456789]\s+/.test(nextL)) {
            break;
          }
          blockLines.push(nextL);
          if (/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(nextL) && !nextL.startsWith('Bạn có thể')) {
            foundVi = true;
            // gom thêm dòng tiếp theo nếu vẫn là tiếng Việt liền mạch (chú thích nhiều dòng)
            if (j + 1 < rawLines.length && /^[a-zA-ZÀ-ỹ0-9\s,\/()~"'.?!-–—]+$/.test(rawLines[j + 1]) && /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(rawLines[j + 1])) {
              blockLines.push(rawLines[j + 1]);
              j++;
            }
            j++;
            break;
          }
          j++;
        }

        if (foundVi) {
          const parsed = parseMultiLineBlock(blockLines, lessonNum, currentSubTopic);
          if (parsed) {
            items.push(parsed);
          }
          i = j;
          continue;
        }
      }

      i++;
    }
  }

  // Khử trùng lặp theo word_jp trong cùng bài
  const uniqueItems = [];
  const seen = new Set();
  for (const it of items) {
    const key = `${it.word_jp}_${it.meaning_vi}`;
    if (!seen.has(key) && it.word_jp.length > 0 && it.meaning_vi.length > 0) {
      seen.add(key);
      uniqueItems.push(it);
    }
  }

  return uniqueItems;
}

// Xử lý dòng đơn (ví dụ: アメリカ America 美国 미국 Mỹ hoặc テスト test 考试 시험 bài kiểm tra)
function parseSingleLineVocab(line, lessonNum, topic) {
  // Tách tiếng Việt sau ký tự Hàn cuối cùng
  const m = line.match(/[\uAC00-\uD7AF]+(.*)$/);
  if (!m) return null;
  const viText = m[1].replace(/^[^\p{L}]+/u, '').trim();
  if (!viText || !/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(viText)) return null;

  // Lấy phần đầu là từ tiếng Nhật
  const beforeEnglish = line.split(/[A-Za-z]/)[0].trim();
  let word_jp = beforeEnglish;
  if (!word_jp || !/[ぁ-んァ-ヶ一-龯]/.test(word_jp)) {
    // Thử lấy cụm tiếng Nhật đầu tiên
    const jm = line.match(/^([ぁ-んァ-ヶ一-龯0-9〜～（）()]+)/);
    if (jm) word_jp = jm[1];
  }

  if (!word_jp) return null;

  return {
    id: 0,
    lesson: lessonNum,
    topic,
    word_jp: word_jp.trim(),
    reading: word_jp.trim(),
    meaning_vi: viText,
    example_jp: '',
    example_vi: ''
  };
}

// Xử lý khối nhiều dòng (Kanji xen kẽ Furigana)
function parseMultiLineBlock(block, lessonNum, topic) {
  // Lấy tiếng Việt từ dòng cuối (hoặc các dòng cuối có tiếng Việt)
  let viLines = [];
  let k = block.length - 1;
  while (k >= 0) {
    const l = block[k];
    if (/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(l)) {
      // Tách phần tiếng Việt nếu dòng đó có dính tiếng Hàn
      let cleanVi = l;
      if (/[\uAC00-\uD7AF]/.test(l)) {
        const m = l.match(/[\uAC00-\uD7AF]+(.*)$/);
        if (m) cleanVi = m[1];
      }
      viLines.unshift(cleanVi.replace(/^[^\p{L}]+/u, '').trim());
      k--;
    } else {
      break;
    }
  }

  const meaning_vi = viLines.join(' ').trim();
  if (!meaning_vi) return null;

  // Thu thập các dòng tiếng Nhật ở đầu block trước khi gặp tiếng Anh thuần
  const jpLines = [];
  for (let idx = 0; idx <= k; idx++) {
    const l = block[idx];
    if (/^[A-Za-z0-9\s,\/()~"'.?!-]+$/.test(l) && !/[ぁ-んァ-ヶ一-龯]/.test(l)) {
      break;
    }
    if (/[ぁ-んァ-ヶ一-龯]/.test(l)) {
      // Nếu dòng chứa tiếng Nhật kèm tiếng Anh (ví dụ: Japan, high school...) thì cắt trước tiếng Anh
      let jPart = l;
      const engIdx = l.search(/[A-Za-z]/);
      if (engIdx > 0) {
        jPart = l.substring(0, engIdx).trim();
      }
      if (jPart) jpLines.push(jPart);
    }
  }

  if (jpLines.length === 0) return null;

  // Tách cặp Kanji và Hiragana
  let word_jp = '';
  let reading = '';

  if (jpLines.length === 1) {
    word_jp = jpLines[0];
    reading = jpLines[0];
  } else if (jpLines.length === 2 && jpLines.every(l => l.length <= 6)) {
    // 1 Kanji + 1 Hiragana
    word_jp = jpLines[0];
    reading = jpLines[1];
  } else if (jpLines.length % 2 === 0 && jpLines.every(l => l.length <= 4)) {
    // Xen kẽ: 高(こう) 校(こう)
    let w = '';
    let r = '';
    for (let m = 0; m < jpLines.length; m += 2) {
      w += jpLines[m];
      r += jpLines[m + 1];
    }
    word_jp = w;
    reading = r;
  } else {
    // Ghép lại
    word_jp = jpLines[0];
    reading = jpLines.slice(1).join('');
    if (!reading) reading = word_jp;
  }

  word_jp = word_jp.replace(/\s+/g, '').replace(/（お）/g, 'お').replace(/～/g, '〜');
  reading = reading.replace(/\s+/g, '').replace(/（お）/g, 'お').replace(/～/g, '〜');

  // Kiểm tra nếu là câu đàm thoại hoặc câu ví dụ (có dấu 。hoặc ？)
  let example_jp = '';
  let example_vi = '';
  if (word_jp.includes('。') || word_jp.includes('？') || word_jp.length > 12) {
    example_jp = word_jp;
    example_vi = meaning_vi;
  }

  return {
    id: 0,
    lesson: lessonNum,
    topic,
    word_jp,
    reading,
    meaning_vi,
    example_jp,
    example_vi
  };
}

run().catch(console.error);
