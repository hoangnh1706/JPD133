const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

// Định nghĩa dải trang cho từng bài học trong PDF Dekiru Shokyu Tu moi - 4 ngon ngu.pdf
// Trang 1-based (trang 3 là index 2)
const LESSON_PAGES = [
  { lesson: 1, startPage: 3, endPage: 5, defaultTopic: 'はじめまして (Chào hỏi & Giới thiệu bản thân)' },
  { lesson: 2, startPage: 6, endPage: 9, defaultTopic: '買いもの (Mua sắm & Đồ vật)' },
  { lesson: 3, startPage: 10, endPage: 13, defaultTopic: '毎日 (Sinh hoạt hàng ngày & Thời gian)' },
  { lesson: 4, startPage: 14, endPage: 16, defaultTopic: '休みの日 (Ngày nghỉ, Địa điểm & Di chuyển)' },
  { lesson: 5, startPage: 17, endPage: 19, defaultTopic: '好きなこと (Sở thích & Hoạt động)' },
  { lesson: 6, startPage: 20, endPage: 22, defaultTopic: 'いっしょに (Rủ rê & Ăn uống)' },
  { lesson: 7, startPage: 23, endPage: 26, defaultTopic: '家族・部屋 (Gia đình, Nhà cửa & Đồ đạc)' },
  { lesson: 8, startPage: 27, endPage: 30, defaultTopic: 'プレゼント・人 (Quà tặng, Ngoại hình & Tính cách)' },
  { lesson: 9, startPage: 31, endPage: 33, defaultTopic: '旅行・体験 (Du lịch, Lượng từ & Trải nghiệm)' },
  { lesson: 10, startPage: 34, endPage: 37, defaultTopic: '街・道案内 (Chỉ đường, Vị trí & Tình trạng)' },
  { lesson: 11, startPage: 38, endPage: 40, defaultTopic: '毎日の生活 (Thói quen sinh hoạt, Chuỗi hành động & Katakana)' }
];

async function extract() {
  const pdfPath = path.join(__dirname, '..', 'documents', 'pdf', 'Dekiru Shokyu Tu moi - 4 ngon ngu.pdf');
  const buf = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  await parser.load();
  const pdfData = await parser.getText();

  console.log('PDF loaded, total pages:', pdfData.pages.length);

  const allVocab = [];
  let currentId = 1;

  for (const lp of LESSON_PAGES) {
    console.log(`Processing Lesson ${lp.lesson} (Pages ${lp.startPage} - ${lp.endPage})...`);
    let lessonText = '';
    for (let p = lp.startPage - 1; p < lp.endPage; p++) {
      if (pdfData.pages[p]) {
        lessonText += '\n---PAGE---\n' + pdfData.pages[p].text;
      }
    }

    // Phân tích text theo từng khối từ
    // Lưu các từ vựng tìm được
    const vocabList = parseLessonText(lessonText, lp.lesson, lp.defaultTopic);
    for (const v of vocabList) {
      v.id = currentId++;
      allVocab.push(v);
    }
    console.log(`Lesson ${lp.lesson}: extracted ${vocabList.length} words.`);
  }

  console.log(`Total words extracted across Lessons 1-11: ${allVocab.length}`);

  const outputPath = path.join(__dirname, '..', 'src', 'data', 'vocabulary_b1_11.json');
  fs.writeFileSync(outputPath, JSON.stringify(allVocab, null, 2), 'utf-8');
  console.log('Saved to:', outputPath);
}

function parseLessonText(text, lesson, defaultTopic) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const results = [];

  let currentTopic = defaultTopic;
  let i = 0;

  // Bỏ qua header trang
  while (i < lines.length) {
    const line = lines[i];

    if (line === '---PAGE---' || line.startsWith('できる日本語') || /^\d+$/.test(line) || line.startsWith('第') || line.startsWith('だい') || line.endsWith('課') || line === 'か') {
      i++;
      continue;
    }

    // Nhận diện topic mới (ví dụ: １ 私の名・国・仕事, ２ 私の誕生日...)
    if (/^[１２３４5678910]\s*[^\n\r]+/.test(line) && !line.includes('I ') && !line.includes('you') && !line.includes('tôi')) {
      // Làm sạch tên topic
      let cleanTopic = line.replace(/^[１２３４5678910]\s*/, '').trim();
      // Bỏ furigana xen kẽ nếu có
      cleanTopic = cleanTopic.replace(/\s+/g, ' ');
      if (cleanTopic.length > 2 && !cleanTopic.includes('student') && !cleanTopic.includes('teacher')) {
        currentTopic = `Bài ${lesson} - Phần ${line.charAt(0)}: ${cleanTopic}`;
      }
      i++;
      continue;
    }

    // Bỏ qua các dòng tiêu đề bảng hoặc mô tả mục tiêu
    if (line.includes('ことば') && line.includes('語')) {
      i++;
      continue;
    }
    if (line.startsWith('Bạn có thể') || line.startsWith('Bạn đang') || line.includes('（ベトナム語') || line.includes('スモールトピック')) {
      i++;
      continue;
    }

    // Xử lý một mục từ vựng
    // Định dạng điển hình:
    // [Kanji/Từ] [Furigana...] [Tiếng Anh] [Tiếng Trung] [Tiếng Hàn] [Tiếng Việt]
    // Hoặc cả dòng gộp: "高校 high school 高中 고등학교 trung học phổ thông"
    // Hãy bắt các mẫu dòng chứa tiếng Việt hoặc cụm từ
    
    // Kiểm tra nếu dòng hiện tại có chứa cả tiếng Nhật và tiếng Việt ở cuối
    // Dấu hiệu tiếng Việt: có dấu tiếng Việt (à, á, ả, ã, ạ, ô, ơ, ư, đ, ...)
    const vietnameseRegex = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i;

    // Gom cụm dòng từ i cho đến khi gặp tiếng Việt
    let block = [];
    let foundVi = false;
    let lookAhead = 0;

    while (i + lookAhead < lines.length && lookAhead < 12) {
      const cur = lines[i + lookAhead];
      if (cur === '---PAGE---' || cur.startsWith('できる日本語') || /^[１２３４]\s+[^\n]+/.test(cur)) {
        break;
      }
      block.push(cur);
      if (vietnameseRegex.test(cur) && !cur.startsWith('Bạn có thể') && !cur.startsWith('Bạn đang')) {
        foundVi = true;
        lookAhead++;
        break;
      }
      lookAhead++;
    }

    if (foundVi && block.length > 0) {
      const item = parseBlock(block, lesson, currentTopic);
      if (item && item.word_jp && item.meaning_vi) {
        results.push(item);
      }
      i += lookAhead;
    } else {
      i++;
    }
  }

  return results;
}

function parseBlock(block, lesson, topic) {
  // Gom các dòng tiếng Nhật (ở đầu), tiếng Anh/Hàn/Trung (ở giữa), và tiếng Việt (ở cuối)
  const fullText = block.join(' ');

  // Tách tiếng Việt ở cuối dòng
  // Dòng cuối thường chứa tiếng Việt
  let viText = '';
  for (let k = block.length - 1; k >= 0; k--) {
    const l = block[k];
    if (/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(l)) {
      // Lấy phần tiếng Việt
      // Đôi khi có tiếng Hàn/Trung dính trước
      const viMatch = l.match(/([a-zA-ZÀ-ỹ0-9\s,\/()~"'.?!-–—]+)$/);
      if (viMatch && /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(viMatch[1])) {
        viText = viMatch[1].trim();
      } else {
        viText = l.trim();
      }
      break;
    }
  }

  if (!viText) return null;

  // Lấy phần tiếng Nhật ở đầu block
  // Tiếng Nhật thường có Kanji hoặc Kana
  const jpLines = [];
  for (let k = 0; k < block.length; k++) {
    const l = block[k];
    // Nếu gặp chữ tiếng Anh rõ ràng (như "high school", "university", "Mr.", "teacher") thì dừng gom tiếng Nhật
    if (/^[A-Za-z][A-Za-z\s\/()~"'.?-]+$/.test(l) && !/[ぁ-んァ-ヶ一-龯]/.test(l)) {
      break;
    }
    if (/[ぁ-んァ-ヶ一-龯]/.test(l)) {
      jpLines.push(l);
    }
  }

  if (jpLines.length === 0) return null;

  // Xử lý jpLines để tách word_jp và reading (Hiragana)
  // Trong PDF:
  // Thường là [Kanji1] \n [Kana1] \n [Kanji2] \n [Kana2] ...
  // Hoặc từ đơn: [Từ Kana thuần]
  let word_jp = '';
  let reading = '';

  // Phân tích các cặp chữ Hán và phiên âm xen kẽ
  if (jpLines.length === 1) {
    word_jp = jpLines[0];
    reading = jpLines[0];
  } else if (jpLines.length % 2 === 0 && jpLines.every(l => l.length <= 4)) {
    // Kiểu xen kẽ: High (高) - kou (こう) - school (校) - kou (こう)
    let w = '';
    let r = '';
    for (let k = 0; k < jpLines.length; k += 2) {
      w += jpLines[k];
      r += jpLines[k + 1];
    }
    word_jp = w;
    reading = r;
  } else {
    // Gom lại
    word_jp = jpLines.join('');
    reading = word_jp;
  }

  // Làm sạch
  word_jp = word_jp.replace(/\s+/g, '').replace(/（お）/g, 'お').replace(/～/g, '〜');
  reading = reading.replace(/\s+/g, '').replace(/（お）/g, 'お').replace(/～/g, '〜');

  return {
    id: 0,
    lesson,
    topic,
    word_jp,
    reading,
    meaning_vi: viText,
    example_jp: '',
    example_vi: ''
  };
}

extract().catch(console.error);
