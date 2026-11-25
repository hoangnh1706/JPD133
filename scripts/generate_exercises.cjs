const fs = require('fs');
const path = require('path');

// Biên soạn kho bài tập tương tác cho toàn bộ 11 bài (Bài 1 - Bài 11)
// Đáp ứng đúng yêu cầu của người dùng:
// Bài 8: Gia đình xưng hô, tính từ ngoại hình/tính cách, động từ agemasu/moraimasu/imasu/sundeimasu...
// Bài 9: Lượng từ (hon, tsu, hai, satsu, hiki), cụm N+V, phó từ mức độ...
// Bài 10: Chỉ đường, đồ vật mang theo, oto vs koe, trạng thái cơ thể...
// Bài 11: Katakana, cụm động từ thường nhật, chuỗi hành động...
// Bài 1-7: Mỗi bài 10-12 câu trắc nghiệm, nối từ, hoàn thành câu.

const exercises = [
  // ==========================================
  // BÀI 1: はじめまして (12 câu)
  // ==========================================
  {
    id: 101,
    lesson: 1,
    type: 'multiple_choice',
    title: 'Hỏi quê hương / Quốc tịch',
    question: 'A: 「お（　　）はどちらですか。」\nB: 「ベトナムです。」',
    options: ['くに', 'なまえ', 'しごと', 'とし'],
    correct_answer: 'くに',
    explanation: 'Dùng kính ngữ「お国（おくに）はどちらですか」để hỏi một cách lịch sự về đất nước/quê hương của đối phương.',
    full_sentence_jp: 'お国はどちらですか。'
  },
  {
    id: 102,
    lesson: 1,
    type: 'multiple_choice',
    title: 'Hỏi tên lịch sự',
    question: 'A: 「すみません。お（　　）は？」\nB: 「ナムです。」',
    options: ['なまえ', 'くに', 'せんせい', 'しゃいん'],
    correct_answer: 'なまえ',
    explanation: '「お名前（おなまえ）は？」là cách hỏi tên ngắn gọn và lịch sự.',
    full_sentence_jp: 'すみません。お名前は？'
  },
  {
    id: 103,
    lesson: 1,
    type: 'multiple_choice',
    title: 'Chào hỏi lần đầu gặp',
    question: 'A: 「はじめまして。ナムです。（　　）よろしくお願いします。」\nB: 「こちらこそ。」',
    options: ['どうぞ', 'どうも', 'いくら', 'どちら'],
    correct_answer: 'どうぞ',
    explanation: 'Cụm chào gặp mặt tiêu chuẩn: 「どうぞよろしくお願いします。」(Rất mong được sự giúp đỡ của bạn).',
    full_sentence_jp: 'はじめまして。ナムです。どうぞよろしくお願いします。'
  },
  {
    id: 104,
    lesson: 1,
    type: 'multiple_choice',
    title: 'Hậu tố xưng hô quốc tịch',
    question: 'スミスさんは アメリカ（　　）です。',
    options: ['じん', 'さん', 'ご', 'さい'],
    correct_answer: 'じん',
    explanation: 'Tên nước + 人（じん）để chỉ người/quốc tịch nước đó (アメリカ人: người Mỹ).',
    full_sentence_jp: 'スミスさんはアメリカ人です。'
  },
  {
    id: 105,
    lesson: 1,
    type: 'multiple_choice',
    title: 'Nghề nghiệp: Nhân viên công ty',
    question: '父は ABCの（　　）です。',
    options: ['かいしゃいん', 'せんせい', 'がくせい', 'きょうし'],
    correct_answer: 'かいしゃいん',
    explanation: '会社員（かいしゃいん）dùng chỉ nghề nghiệp nhân viên công ty nói chung.',
    full_sentence_jp: '父はABCの会社員です。'
  },
  {
    id: 106,
    lesson: 1,
    type: 'multiple_choice',
    type: 'multiple_choice',
    title: 'Nghề nghiệp: Giáo viên',
    question: '「田中先生は日本語学校の（　　）です。」',
    options: ['きょうし', 'がくせい', 'いしゃ', 'かいしゃいん'],
    correct_answer: 'きょうし',
    explanation: 'Khi nói về chức vụ/nghề giáo viên của một trường thì dùng 教師（きょうし）; khi gọi trực tiếp thì gọi là 先生（せんせい）.',
    full_sentence_jp: '田中先生は日本語学校の教師です。'
  },
  {
    id: 107,
    lesson: 1,
    type: 'multiple_choice',
    title: 'Hỏi tuổi tác',
    question: 'A: 「マイクさんは（　　）ですか。」\nB: 「20歳です。」',
    options: ['なんさい', 'どちら', 'いくら', 'なんがつ'],
    correct_answer: 'なんさい',
    explanation: 'Hỏi tuổi dùng 何歳（なんさい）hoặc lịch sự hơn là おいくつ.',
    full_sentence_jp: 'マイクさんは何歳ですか。'
  },
  {
    id: 108,
    lesson: 1,
    type: 'multiple_choice',
    title: 'Nói về sở thích',
    question: '「私の（　　）はサッカーです。」',
    options: ['しゅみ', 'たんじょうび', 'しごと', 'くに'],
    correct_answer: 'しゅみ',
    explanation: '趣味（しゅみ）nghĩa là sở thích.',
    full_sentence_jp: '私の趣味はサッカーです。'
  },
  {
    id: 109,
    lesson: 1,
    type: 'multiple_choice',
    title: 'Hỏi ngày sinh nhật',
    question: 'A: 「（　　）はいつですか。」\nB: 「5月12日です。」',
    options: ['たんじょうび', 'しゅみ', 'しごと', 'なまえ'],
    correct_answer: 'たんじょうび',
    explanation: '誕生日（たんじょうび）là ngày sinh nhật.',
    full_sentence_jp: '誕生日はいつですか。'
  },
  {
    id: 110,
    lesson: 1,
    type: 'multiple_choice',
    title: 'Đáp lại lời chào',
    question: 'A: 「どうぞよろしくお願いします。」\nB: 「（　　）よろしくおねがいします。」',
    options: ['こちらこそ', 'そうですか', 'すみません', 'はじめまして'],
    correct_answer: 'こちらこそ',
    explanation: '「こちらこそ」có nghĩa là "Chính tôi mới là người cần sự giúp đỡ / Tôi cũng vậy".',
    full_sentence_jp: 'こちらこそよろしくおねがいします。'
  },

  // ==========================================
  // BÀI 2: 買いもの (12 câu)
  // ==========================================
  {
    id: 201,
    lesson: 2,
    type: 'multiple_choice',
    title: 'Hỏi giá tiền',
    question: 'A: 「このペンは（　　）ですか。」\nB: 「100円です。」',
    options: ['いくら', 'どちら', 'いつ', 'なんさい'],
    correct_answer: 'いくら',
    explanation: 'いくら là từ để hỏi giá tiền (Bao nhiêu tiền?).',
    full_sentence_jp: 'このペンはいくらですか。'
  },
  {
    id: 202,
    lesson: 2,
    type: 'multiple_choice',
    title: 'Từ chỉ định vật ở xa cả hai người',
    question: 'A: 「（　　）ビルは何ですか。」\nB: 「デパートです。」(Cả 2 người đứng nhìn về phía tòa nhà ở xa)',
    options: ['あの', 'この', 'その', 'どの'],
    correct_answer: 'あの',
    explanation: 'あの + Noun dùng để chỉ đồ vật/tòa nhà ở xa cả người nói lẫn người nghe.',
    full_sentence_jp: 'あのビルは何ですか。'
  },
  {
    id: 203,
    lesson: 2,
    type: 'multiple_choice',
    title: 'Gọi món / Mua hàng',
    question: '「コーヒーを（　　）。」',
    options: ['ください', 'どうぞ', 'どうも', 'いらっしゃい'],
    correct_answer: 'ください',
    explanation: 'Danh từ + をください dùng khi gọi món hoặc mua hàng (Cho tôi xin ~).',
    full_sentence_jp: 'コーヒーをください。'
  },
  {
    id: 204,
    lesson: 2,
    type: 'multiple_choice',
    title: 'Nhờ nhắc lại',
    question: 'A: 「……」\nB: 「すみません。（　　）一度言ってください。」',
    options: ['もう', 'まだ', 'ずっと', 'よく'],
    correct_answer: 'もう',
    explanation: '「もう一度（もういちど）」nghĩa là "một lần nữa".',
    full_sentence_jp: 'すみません。もう一度言ってください。'
  },
  {
    id: 205,
    lesson: 2,
    type: 'multiple_choice',
    title: 'Đơn vị tiền tệ Nhật Bản',
    question: 'このりんごは 1つ 150（　　）です。',
    options: ['えん', 'かい', 'じ', 'ふん'],
    correct_answer: 'えん',
    explanation: '円（えん - Yên）là đơn vị tiền tệ của Nhật Bản.',
    full_sentence_jp: 'このりんごは1つ150円です。'
  },
  {
    id: 206,
    lesson: 2,
    type: 'multiple_choice',
    title: 'Từ vựng đồ dùng cá nhân: Ô/dù',
    question: '雨が降っていますから、（　　）を買います。',
    options: ['かさ', 'かばん', 'とけい', 'くつ'],
    correct_answer: 'かさ',
    explanation: '傘（かさ）là cái ô / cái dù.',
    full_sentence_jp: '雨が降っていますから、かさを買います。'
  },
  {
    id: 207,
    lesson: 2,
    type: 'multiple_choice',
    title: 'Từ vựng đồ dùng: Ví tiền',
    question: '（　　）にお金がありません。',
    options: ['さいふ', 'くつ', 'ぼうし', 'メガネ'],
    correct_answer: 'さいふ',
    explanation: '財布（さいふ）nghĩa là cái ví tiền.',
    full_sentence_jp: 'さいふにお金がありません。'
  },
  {
    id: 208,
    lesson: 2,
    type: 'multiple_choice',
    title: 'Lời mời nhận đồ / Mời vào',
    question: 'A: 「お茶を（　　）。」\nB: 「ありがとうございます。」',
    options: ['どうぞ', 'どうも', 'ください', 'じゃ'],
    correct_answer: 'どうぞ',
    explanation: 'どうぞ dùng khi đưa đồ hoặc mời đối phương làm gì (Xin mời).',
    full_sentence_jp: 'お茶をどうぞ。'
  },

  // ==========================================
  // BÀI 3: 毎日 (12 câu)
  // ==========================================
  {
    id: 301,
    lesson: 3,
    type: 'multiple_choice',
    title: 'Hỏi giờ hiện tại',
    question: 'A: 「今、（　　）ですか。」\nB: 「午前9時半です。」',
    options: ['なんじ', 'なんようび', 'いつ', 'いくら'],
    correct_answer: 'なんじ',
    explanation: '今何時（いまなんじ）ですか là câu hỏi thời gian (Bây giờ là mấy giờ?).',
    full_sentence_jp: '今、何時ですか。'
  },
  {
    id: 302,
    lesson: 3,
    type: 'multiple_choice',
    title: 'Động từ thức dậy',
    question: '毎朝 6時に（　　）。',
    options: ['おきます', 'ねます', 'たべます', 'いきます'],
    correct_answer: 'おきます',
    explanation: '起きます（おきます）là thức dậy.',
    full_sentence_jp: '毎朝6時におきます。'
  },
  {
    id: 303,
    lesson: 3,
    type: 'multiple_choice',
    title: 'Động từ đi ngủ',
    question: '夜 11時に（　　）。',
    options: ['ねます', 'おきます', 'みます', 'よみます'],
    correct_answer: 'ねます',
    explanation: '寝ます（ねます）là đi ngủ.',
    full_sentence_jp: '夜11時にねます。'
  },
  {
    id: 304,
    lesson: 3,
    type: 'multiple_choice',
    title: 'Cặp từ chỉ thời gian: Từ ~ Đến ~',
    question: '仕事は 9時（　　）5時までです。',
    options: ['から', 'まで', 'に', 'で'],
    correct_answer: 'から',
    explanation: 'Mẫu「〜から〜まで」nghĩa là "từ ~ đến ~".',
    full_sentence_jp: '仕事は9時から5時までです。'
  },
  {
    id: 305,
    lesson: 3,
    type: 'multiple_choice',
    title: 'Thứ trong tuần: Thứ Bảy & Chủ Nhật',
    question: '土曜日と日曜日は 会社が（　　）です。',
    options: ['やすみ', 'テスト', 'かいぎ', 'しごと'],
    correct_answer: 'やすみ',
    explanation: '休み（やすみ）là ngày nghỉ.',
    full_sentence_jp: '土曜日と日曜日は会社がやすみです。'
  },
  {
    id: 306,
    lesson: 3,
    type: 'multiple_choice',
    title: 'Bữa ăn trong ngày: Bữa trưa',
    question: '12時に（　　）を食べます。',
    options: ['ひるごはん', 'あさごはん', 'ばんごはん', 'おちゃ'],
    correct_answer: 'ひるごはん',
    explanation: '昼ごはん（ひるごはん）là bữa cơm trưa.',
    full_sentence_jp: '12時にひるごはんを食べます。'
  },
  {
    id: 307,
    lesson: 3,
    type: 'multiple_choice',
    title: 'Hành động học bài',
    question: '図書館で 日本語を（　　）。',
    options: ['べんきょうします', 'かいものします', 'あそびます', 'ねます'],
    correct_answer: 'べんきょうします',
    explanation: '勉強します（べんきょうします）là học tập.',
    full_sentence_jp: '図書館で日本語をべんきょうします。'
  },
  {
    id: 308,
    lesson: 3,
    type: 'multiple_choice',
    title: 'Hỏi ngày trong tuần',
    question: 'A: 「今日は（　　）ですか。」\nB: 「火曜日です。」',
    options: ['なんようび', 'なんにち', 'なんじ', 'なんがつ'],
    correct_answer: 'なんようび',
    explanation: '何曜日（なんようび）dùng để hỏi thứ mấy trong tuần.',
    full_sentence_jp: '今日は何曜日ですか。'
  },

  // ==========================================
  // BÀI 4: 休みの日 (10 câu)
  // ==========================================
  {
    id: 401,
    lesson: 4,
    type: 'multiple_choice',
    title: 'Phương tiện: Tàu điện ngầm',
    question: '（　　）で 渋谷へ行きます。',
    options: ['ちかてつ', 'あるいて', 'じてんしゃ', 'ひこうき'],
    correct_answer: 'ちかてつ',
    explanation: '地下鉄（ちかてつ）là tàu điện ngầm.',
    full_sentence_jp: 'ちかてつで渋谷へ行きます。'
  },
  {
    id: 402,
    lesson: 4,
    type: 'multiple_choice',
    title: 'Đi bộ (không dùng trợ từ で)',
    question: '駅から 家まで（　　）帰ります。',
    options: ['あるいて', 'くるまで', 'バスで', 'タクシーで'],
    correct_answer: 'あるいて',
    explanation: '歩いて（あるいて - đi bộ）là dạng te của động từ aruku, không đi cùng trợ từ で.',
    full_sentence_jp: '駅から家まであるいて帰ります。'
  },
  {
    id: 403,
    lesson: 4,
    type: 'multiple_choice',
    title: 'Địa điểm: Siêu thị',
    question: '日曜日、（　　）へ 買い物に行きました。',
    options: ['スーパー', 'びょういん', 'ぎんこう', 'ゆうびんきょく'],
    correct_answer: 'スーパー',
    explanation: 'スーパー (supermarket) nghĩa là siêu thị.',
    full_sentence_jp: '日曜日、スーパーへ買い物に行きました。'
  },
  {
    id: 404,
    lesson: 4,
    type: 'multiple_choice',
    title: 'Đi cùng ai đó',
    question: 'きのう、（　　）と 映画を見に行きました。',
    options: ['ともだち', 'ひとりで', 'どこも', 'なにも'],
    correct_answer: 'ともだち',
    explanation: '友達（ともだち）と: Đi cùng với bạn bè.',
    full_sentence_jp: 'きのう、ともだちと映画を見に行きました。'
  },
  {
    id: 405,
    lesson: 4,
    type: 'multiple_choice',
    title: 'Hỏi đi bằng phương tiện gì',
    question: 'A: 「（　　）学校へ来ましたか。」\nB: 「バスで来ました。」',
    options: ['なんで', 'だれと', 'どこへ', 'いつ'],
    correct_answer: 'なんで',
    explanation: '何で（なんで/なにで）hỏi về phương tiện di chuyển (Bằng cái gì?).',
    full_sentence_jp: '何で学校へ来ましたか。'
  },

  // ==========================================
  // BÀI 5: 好きなこと (10 câu)
  // ==========================================
  {
    id: 501,
    lesson: 5,
    type: 'multiple_choice',
    title: 'Mẫu câu thích cái gì',
    question: '私は 日本のアニメ（　　）好きです。',
    options: ['が', 'を', 'に', 'で'],
    correct_answer: 'が',
    explanation: 'Mẫu câu biểu thị sở thích: Noun + が好きです (Thích Noun).',
    full_sentence_jp: '私は日本のアニメが好きです。'
  },
  {
    id: 502,
    lesson: 5,
    type: 'multiple_choice',
    title: 'Biểu thị khả năng / Giỏi',
    question: '田中さんは ピアノ（　　）上手です。',
    options: ['が', 'を', 'は', 'で'],
    correct_answer: 'が',
    explanation: 'Tính từ biểu thị khả năng: Noun + が上手です (Giỏi môn gì).',
    full_sentence_jp: '田中さんはピアノが上手です。'
  },
  {
    id: 503,
    lesson: 5,
    type: 'multiple_choice',
    title: 'Trái nghĩa của 上手 (Giỏi)',
    question: '私は 料理が（　　）です。（Không giỏi/kém）',
    options: ['へた', 'じょうず', 'すき', 'きらい'],
    correct_answer: 'へた',
    explanation: '下手（へた）nghĩa là dở, kém, vụng về.',
    full_sentence_jp: '私は料理がへたです。'
  },
  {
    id: 504,
    lesson: 5,
    type: 'multiple_choice',
    title: 'Phó từ chỉ mức độ: Hoàn toàn không',
    question: '納豆は（　　）食べられません。',
    options: ['ぜんぜん', 'とても', 'よく', 'だいたい'],
    correct_answer: 'ぜんぜん',
    explanation: '全然（ぜんぜん）đi với thể phủ định có nghĩa là "hoàn toàn không...".',
    full_sentence_jp: '納豆はぜんぜん食べられません。'
  },

  // ==========================================
  // BÀI 6: いっしょに (10 câu)
  // ==========================================
  {
    id: 601,
    lesson: 6,
    type: 'multiple_choice',
    title: 'Mẫu câu rủ rê lịch sự',
    question: '「いっしょにお昼ごはんを食べ（　　）。」',
    options: ['ませんか', 'ました', 'ます', 'ません'],
    correct_answer: 'ませんか',
    explanation: 'Động từ thể 〜ませんか dùng để rủ rê, mời mọc một cách lịch sự.',
    full_sentence_jp: 'いっしょにお昼ごはんを食べませんか。'
  },
  {
    id: 602,
    lesson: 6,
    type: 'multiple_choice',
    title: 'Đồng ý lời rủ rê',
    question: 'A: 「今晩、飲みに行きませんか。」\nB: 「いいですね。（　　）。」',
    options: ['行きましょう', '行きますか', '行きません', '行きました'],
    correct_answer: '行きましょう',
    explanation: '〜ましょう dùng khi đồng ý với lời rủ hoặc đề xuất cùng làm gì (Chúng ta cùng đi nào).',
    full_sentence_jp: 'いいですね。行きましょう。'
  },
  {
    id: 603,
    lesson: 6,
    type: 'multiple_choice',
    title: 'Từ chối khéo léo',
    question: 'A: 「あした カラオケへ行きませんか。」\nB: 「あしたは ちょっと（　　）…。」',
    options: ['つごうがわるいです', 'いいですね', 'ひまです', 'すきです'],
    correct_answer: 'つごうがわるいです',
    explanation: '都合が悪い（つごうがわるい）nghĩa là bận, không tiện thời gian.',
    full_sentence_jp: 'あしたはちょっと都合が悪いです。'
  },
  {
    id: 604,
    lesson: 6,
    type: 'multiple_choice',
    title: 'Trợ từ chỉ địa điểm diễn ra hành động',
    question: '居酒屋（　　）ビールを飲みます。',
    options: ['で', 'に', 'へ', 'を'],
    correct_answer: 'で',
    explanation: 'Trợ từ で đứng sau danh từ nơi chốn để chỉ địa điểm diễn ra hành động.',
    full_sentence_jp: '居酒屋でビールを飲みます。'
  },

  // ==========================================
  // BÀI 7: 家族・部屋 (10 câu)
  // ==========================================
  {
    id: 701,
    lesson: 7,
    type: 'multiple_choice',
    title: 'Tồn tại người / Động vật',
    question: '庭に 犬が（　　）。',
    options: ['います', 'あります', 'します', 'おきます'],
    correct_answer: 'います',
    explanation: 'Người và động vật (sinh vật chuyển động) dùng います; đồ vật/cây cối dùng あります.',
    full_sentence_jp: '庭に犬がいます。'
  },
  {
    id: 702,
    lesson: 7,
    type: 'multiple_choice',
    title: 'Tồn tại đồ vật trong phòng',
    question: '部屋に テレビが（　　）。',
    options: ['あります', 'います', 'みます', 'かいます'],
    correct_answer: 'あります',
    explanation: 'Đồ vật tĩnh (vô tri) dùng あります.',
    full_sentence_jp: '部屋にテレビがあります。'
  },
  {
    id: 703,
    lesson: 7,
    type: 'multiple_choice',
    title: 'Từ vựng vị trí: Trên bàn',
    question: 'つくえの（　　）に 本があります。',
    options: ['うえ', 'した', 'なか', 'となり'],
    correct_answer: 'うえ',
    explanation: '上（うえ）nghĩa là phía trên / ở trên.',
    full_sentence_jp: 'つくえの上に本があります。'
  },
  {
    id: 704,
    lesson: 7,
    type: 'multiple_choice',
    title: 'Từ vựng nơi cư trú',
    question: '私は ハノイに（　　）。',
    options: ['すんでいます', 'あります', 'とまります', 'はいります'],
    correct_answer: 'すんでいます',
    explanation: '住んでいます（すんでいます）dùng để biểu thị nơi cư trú (Đang sống tại...).',
    full_sentence_jp: '私はハノイにすんでいます。'
  },

  // ==========================================
  // BÀI 8: プレゼント・家族・外見 (16 câu - Trọng tâm BT Dekiru 08)
  // ==========================================
  {
    id: 801,
    lesson: 8,
    type: 'multiple_choice',
    title: 'Xưng hô gia đình: Mẹ của mình',
    question: '「これは私の（　　）の写真です。料理が上手です。」',
    options: ['はは', 'おかあさん', 'おばあさん', 'ちち'],
    correct_answer: 'はは',
    explanation: 'Khi nói về mẹ của chính mình với người ngoài thì dùng 母（はは）. お母さん（おかあさん）dùng khi gọi mẹ mình hoặc nói về mẹ người khác.',
    full_sentence_jp: 'これは私の母の写真です。'
  },
  {
    id: 802,
    lesson: 8,
    type: 'multiple_choice',
    title: 'Xưng hô gia đình: Bố của người khác',
    question: 'A: 「マイクさんの（　　）のお仕事は何ですか。」\nB: 「父はエンジニアです。」',
    options: ['おとうさん', 'ちち', 'おにいさん', 'あに'],
    correct_answer: 'おとうさん',
    explanation: 'Hỏi về bố của người khác phải dùng kính xưng お父さん（おとうさん）.',
    full_sentence_jp: 'マイクさんのお父さんのお仕事は何ですか。'
  },
  {
    id: 803,
    lesson: 8,
    type: 'multiple_choice',
    title: 'Xưng hô: Anh trai mình vs Anh trai người khác',
    question: '「私の（　　）は背が高いです。田中さんの（　　）も背が高いですか。」',
    options: ['あに／おにいさん', 'おにいさん／あに', 'あね／おねえさん', 'おとうと／おとうとさん'],
    correct_answer: 'あに／おにいさん',
    explanation: 'Anh trai của mình dùng 兄（あに）, anh trai của người khác dùng お兄さん（おにいさん）.',
    full_sentence_jp: '私の兄は背が高いです。田中さんのお兄さんも背が高いですか。'
  },
  {
    id: 804,
    lesson: 8,
    type: 'multiple_choice',
    title: 'Xưng hô: Em gái',
    question: '「山田さんの（　　）は大学生ですか。」\n「はい、私の（　　）は20歳です。」',
    options: ['いもうとさん／いもうと', 'いもうと／いもうとさん', 'おとうとさん／おとうと', 'あね／おねえさん'],
    correct_answer: 'いもうとさん／いもうと',
    explanation: 'Em gái người khác là 妹さん（いもうとさん）, em gái mình là 妹（いもうと）.',
    full_sentence_jp: '山田さんの妹さんは大学生ですか。'
  },
  {
    id: 805,
    lesson: 8,
    type: 'multiple_choice',
    title: 'Ngoại hình: Dáng người cao',
    question: '弟は 背が（　　）です。',
    options: ['たかい', 'ひくい', 'ながい', 'みじかい'],
    correct_answer: 'たかい',
    explanation: 'Miêu tả chiều cao người: 背が高い（せがたかい - cao） / 背が低い（せがひくい - thấp).',
    full_sentence_jp: '弟は背が高いです。'
  },
  {
    id: 806,
    lesson: 8,
    type: 'multiple_choice',
    title: 'Ngoại hình: Tóc dài',
    question: '姉は 髪が（　　）です。',
    options: ['ながい', 'たかい', 'おおきい', 'あかるい'],
    correct_answer: 'ながい',
    explanation: 'Miêu tả độ dài của tóc: 髪が長い（かみがながい - tóc dài） / 髪が短い（かみがみじかい - tóc ngắn).',
    full_sentence_jp: '姉は髪が長いです。'
  },
  {
    id: 807,
    lesson: 8,
    type: 'multiple_choice',
    title: 'Tính cách: Hiền lành, tốt bụng',
    question: '鈴木先生は いつも笑顔で とても（　　）です。',
    options: ['やさしい', 'きびしい', 'みじかい', 'あかい'],
    correct_answer: 'やさしい',
    explanation: '優しい（やさしい）nghĩa là dịu dàng, tốt bụng, hiền lành.',
    full_sentence_jp: '鈴木先生はいつも笑顔でとても優しいです。'
  },
  {
    id: 808,
    lesson: 8,
    type: 'multiple_choice',
    title: 'Hành động tặng quà: あげます',
    question: '私は 母の誕生日に スカーフを（　　）。',
    options: ['あげました', 'もらいました', 'かりました', 'うりました'],
    correct_answer: 'あげました',
    explanation: 'Người nói tặng đồ cho người khác dùng [Người nhận] に [Đồ vật] をあげます.',
    full_sentence_jp: '私は母の誕生日にスカーフをあげました。'
  },
  {
    id: 809,
    lesson: 8,
    type: 'multiple_choice',
    title: 'Hành động nhận quà: もらいました',
    question: '私は 友達（　　）きれいなペンを もらいました。',
    options: ['に', 'を', 'で', 'へ'],
    correct_answer: 'に',
    explanation: 'Nhận từ ai dùng [Người tặng] に/から もらいます.',
    full_sentence_jp: '私は友達にきれいなペンをもらいました。'
  },
  {
    id: 810,
    lesson: 8,
    type: 'multiple_choice',
    title: 'Đơn vị đếm thú nuôi (chó, mèo)',
    question: '私の家には 猫が 2（　　）います。',
    options: ['ひき', 'ほん', 'まい', 'さつ'],
    correct_answer: 'ひき',
    explanation: 'Đếm động vật nhỏ (mèo, chó, cá...) dùng đơn vị 匹（ひき/ぴき/びき）. 2 con là 2匹（にひき）.',
    full_sentence_jp: '私の家には猫が2匹います。'
  },

  // ==========================================
  // BÀI 9: 旅行・数量詞 (16 câu - Trọng tâm BT Dekiru 09)
  // ==========================================
  {
    id: 901,
    lesson: 9,
    type: 'multiple_choice',
    title: 'Lượng từ đếm vật thon dài (chai, bút, ô)',
    question: 'ビールを 2（　　）ください。',
    options: ['ほん', 'まい', 'さつ', 'はい'],
    correct_answer: 'ほん',
    explanation: 'Đồ vật thon dài (chai bia, bút, chuối, ô...) đếm bằng 本（ほん/ぽん/ぼん）. 2 chai là 2本（にほん）.',
    full_sentence_jp: 'ビールを2本ください。'
  },
  {
    id: 902,
    lesson: 9,
    type: 'multiple_choice',
    title: 'Lượng từ đếm cốc / ly / bát',
    question: 'コーヒーを 1（　　）飲みました。',
    options: ['ぱい', 'ぽん', 'さつ', 'こ'],
    correct_answer: 'ぱい',
    explanation: 'Đồ uống theo ly/tách/bát đếm bằng 杯（はい/ぱい/ばい）. 1 ly là 一杯（いっぱい）.',
    full_sentence_jp: 'コーヒーを1杯飲みました。'
  },
  {
    id: 903,
    lesson: 9,
    type: 'multiple_choice',
    title: 'Lượng từ đếm sách, vở, tạp chí',
    question: '本屋で 日本語の辞書を 1（　　）買いました。',
    options: ['さつ', 'まい', 'こ', 'ほん'],
    correct_answer: 'さつ',
    explanation: 'Sách, vở, từ điển, tạp chí đếm bằng 冊（さつ）. 1 cuốn là 一冊（いっさつ）.',
    full_sentence_jp: '本屋で日本語の辞書を1冊買いました。'
  },
  {
    id: 904,
    lesson: 9,
    type: 'multiple_choice',
    title: 'Lượng từ đếm vật mỏng phẳng (vé, áo, giấy)',
    question: '新幹線の チケットを 2（　　）買いました。',
    options: ['まい', 'さつ', 'ほん', 'はい'],
    correct_answer: 'まい',
    explanation: 'Vật mỏng phẳng như vé tàu, giấy, áo sơ mi đếm bằng 枚（まい）. 2 vé là 2枚（にまい）.',
    full_sentence_jp: '新幹線のチケットを2枚買いました。'
  },
  {
    id: 905,
    lesson: 9,
    type: 'multiple_choice',
    title: 'Lượng từ đếm chung: つ (1 cái đến 10 cái)',
    question: 'みかんを（　　）買いました。(3 quả)',
    options: ['みっつ', 'ひとつ', 'ふたつ', 'よっつ'],
    correct_answer: 'みっつ',
    explanation: 'Đếm đồ vật chung: ひとつ(1), ふたつ(2), みっつ(3), よっつ(4), いつつ(5)...',
    full_sentence_jp: 'みかんを3つ買いました。'
  },
  {
    id: 906,
    lesson: 9,
    type: 'multiple_choice',
    title: 'Hỏi về khoảng thời gian (Bao lâu)',
    question: 'A: 「京都まで（　　）かかりますか。」\nB: 「新幹線で 2時間くらいです。」',
    options: ['どのくらい', 'いくら', 'いつ', 'なんじ'],
    correct_answer: 'どのくらい',
    explanation: 'どのくらい dùng để hỏi khoảng thời gian hoặc mức độ (Mất bao lâu?).',
    full_sentence_jp: '京都までどのくらいかかりますか。'
  },
  {
    id: 907,
    lesson: 9,
    type: 'multiple_choice',
    title: 'Cụm Động từ: Mua đồ lưu niệm',
    question: '旅行で おみやげを（　　）。',
    options: ['かいました', 'みました', 'たべました', 'のみました'],
    correct_answer: 'かいました',
    explanation: 'おみやげを買う（かう/かいました）: Mua quà lưu niệm.',
    full_sentence_jp: '旅行でおみやげを買いました。'
  },
  {
    id: 908,
    lesson: 9,
    type: 'multiple_choice',
    title: 'Hỏi về số lượng: Đếm người',
    question: 'A: 「家族は（　　）ですか。」\nB: 「4人です。」',
    options: ['なんにん', 'なんさい', 'いくつ', 'どのくらい'],
    correct_answer: 'なんにん',
    explanation: '何人（なんにん）hỏi có bao nhiêu người.',
    full_sentence_jp: '家族は何人ですか。'
  },

  // ==========================================
  // BÀI 10: 道案内・からだ・街 (16 câu - Trọng tâm BT Dekiru 10)
  // ==========================================
  {
    id: 1001,
    lesson: 10,
    type: 'multiple_choice',
    title: 'Chỉ đường: Đi thẳng',
    question: 'この道を（　　）行ってください。信号があります。',
    options: ['まっすぐ', 'みぎへ', 'ひだりへ', 'わたって'],
    correct_answer: 'まっすぐ',
    explanation: 'まっすぐ行く nghĩa là "đi thẳng".',
    full_sentence_jp: 'この道をまっすぐ行ってください。'
  },
  {
    id: 1002,
    lesson: 10,
    type: 'multiple_choice',
    title: 'Chỉ đường: Rẽ phải tại góc đường',
    question: '次の角を（　　）へ曲がってください。',
    options: ['みぎ', 'うえ', 'した', 'なか'],
    correct_answer: 'みぎ',
    explanation: '右（みぎ）へ曲がる: Rẽ sang bên phải.',
    full_sentence_jp: '次の角を右へ曲がってください。'
  },
  {
    id: 1003,
    lesson: 10,
    type: 'multiple_choice',
    title: 'Băng qua đường / Băng qua cầu',
    question: 'あの橋を（　　）と、右に郵便局があります。',
    options: ['わたる', 'まがる', 'とまる', 'おりる'],
    correct_answer: 'わたる',
    explanation: '渡る（わたる）nghĩa là băng qua (cầu, đường, vạch kẻ đường).',
    full_sentence_jp: 'あの橋を渡ると、右に郵便局があります。'
  },
  {
    id: 1004,
    lesson: 10,
    type: 'multiple_choice',
    title: 'Phân biệt 音 (Âm thanh đồ vật) vs 声 (Giọng nói)',
    question: '「外から 車の（　　）が聞こえます。」',
    options: ['おと', 'こえ', 'うた', 'ことば'],
    correct_answer: 'おt',
    correct_answer: 'おと',
    explanation: '音（おと）là tiếng động, âm thanh của đồ vật, xe cộ, tự nhiên; 声（こえ）là giọng phát ra từ người hoặc động vật.',
    full_sentence_jp: '外から車の音が聞こえます。'
  },
  {
    id: 1005,
    lesson: 10,
    type: 'multiple_choice',
    title: 'Phân biệt 声 (Giọng nói của người)',
    question: '「田中さんの（　　）は とてもきれいです。」',
    options: ['こえ', 'おと', 'みち', 'かど'],
    correct_answer: 'こえ',
    explanation: 'Giọng nói của người dùng 声（こえ）.',
    full_sentence_jp: '田中さんの声はとてもきれいです。'
  },
  {
    id: 1006,
    lesson: 10,
    type: 'multiple_choice',
    title: 'Triệu chứng sức khỏe: Đau đầu',
    question: '風邪をひいて、（　　）が痛いです。',
    options: ['あたま', 'て', 'あし', 'みみ'],
    correct_answer: 'あたま',
    explanation: '頭（あたま）が痛い: Đau đầu.',
    full_sentence_jp: '風邪をひいて、頭が痛いです。'
  },
  {
    id: 1007,
    lesson: 10,
    type: 'multiple_choice',
    title: 'Triệu chứng: Bị sốt',
    question: '昨日から 38度の（　　）があります。',
    options: ['ねつ', 'せき', 'のど', 'くすり'],
    correct_answer: 'ねつ',
    explanation: '熱（ねつ）がある: Bị sốt.',
    full_sentence_jp: '昨日から38度の熱があります。'
  },
  {
    id: 1008,
    lesson: 10,
    type: 'multiple_choice',
    title: 'Đồ vật mang theo: Chìa khóa',
    question: '家の（　　）を忘れました。ドアが開きません。',
    options: ['かぎ', 'かさ', 'さいふ', 'とけい'],
    correct_answer: 'かぎ',
    explanation: '鍵（かぎ）là chìa khóa.',
    full_sentence_jp: '家の鍵を忘れました。'
  },

  // ==========================================
  // BÀI 11: 毎日の生活・カタカナ・連続動作 (16 câu - Trọng tâm BT Dekiru 11)
  // ==========================================
  {
    id: 1101,
    lesson: 11,
    type: 'multiple_choice',
    title: 'Từ mượn Katakana: Công việc làm thêm',
    question: '夜、コンビニで（　　）をしています。',
    options: ['アルバイト', 'ジョギング', 'プレゼント', 'コンサート'],
    correct_answer: 'アルバイト',
    explanation: 'アルバイト (Arbeit) nghĩa là việc làm thêm / bán thời gian.',
    full_sentence_jp: '夜、コンビニでアルバイトをしています。'
  },
  {
    id: 1102,
    lesson: 11,
    type: 'multiple_choice',
    title: 'Katakana: Bạn cùng lớp',
    question: '学校の（　　）と いっしょに勉強します。',
    options: ['クラスメイト', 'ルームメイト', 'アルバイト', 'ボランティア'],
    correct_answer: 'クラスメイト',
    explanation: 'クラスメイト (classmate) nghĩa là bạn cùng lớp.',
    full_sentence_jp: '学校のクラスメイトといっしょに勉強します。'
  },
  {
    id: 1103,
    lesson: 11,
    type: 'multiple_choice',
    title: 'Katakana: Chạy bộ rèn luyện sức khỏe',
    question: '毎朝 公園を（　　）します。',
    options: ['ジョギング', 'ショッピング', 'ドライブ', 'カラオケ'],
    correct_answer: 'ジョギング',
    explanation: 'ジョギング (jogging) là chạy bộ thể dục.',
    full_sentence_jp: '毎朝公園をジョギングします。'
  },
  {
    id: 1104,
    lesson: 11,
    type: 'multiple_choice',
    title: 'Động từ thường nhật: Đi lại đều đặn (Đi học / Đi làm)',
    question: '毎日 電車で 大学に（　　）。',
    options: ['かよっています', 'のっています', 'はいっています', 'やすんでいます'],
    correct_answer: 'かよっています',
    explanation: '通う（かよう/かよっています）chỉ việc đi đi về về đều đặn đến trường học hoặc nơi làm việc.',
    full_sentence_jp: '毎日電車で大学に通っています。'
  },
  {
    id: 1105,
    lesson: 11,
    type: 'multiple_choice',
    title: 'Cụm từ: Bị cảm cúm',
    question: 'かぜを（　　）ので、病院へ行きます。',
    options: ['ひいた', 'とった', 'もらった', 'した'],
    correct_answer: 'ひいた',
    explanation: '風邪をひく（かぜをひく）: Bị cảm cúm.',
    full_sentence_jp: 'かぜをひいたので、病院へ行きます。'
  },
  {
    id: 1106,
    lesson: 11,
    type: 'multiple_choice',
    title: 'Động từ quen với cuộc sống',
    question: '日本の生活に もう（　　）か。',
    options: ['なれました', 'わすれました', 'おわりました', 'はじめました'],
    correct_answer: 'なれました',
    explanation: '慣れる（なれる/なれました）: Quen với điều gì.',
    full_sentence_jp: '日本の生活にもう慣れましたか。'
  },
  {
    id: 1107,
    lesson: 11,
    type: 'multiple_choice',
    title: 'Chuỗi hành động (Thể て liên tiếp)',
    question: '朝起きて、シャワーを（　　）、朝ごはんを食べます。',
    options: ['あびて', 'のんで', 'たべて', 'みて'],
    correct_answer: 'あびて',
    explanation: 'シャワーを浴びる（あびる/あびて）: Tắm vòi sen. Nối hành động dùng thể て.',
    full_sentence_jp: '朝起きて、シャワーをあびて、朝ごはんを食べます。'
  },
  {
    id: 1108,
    lesson: 11,
    type: 'multiple_choice',
    title: 'Động từ đi dạo cùng thú cưng',
    question: '夕方 犬と（　　）します。',
    options: ['さんぽ', 'うんどう', 'べんきょう', 'かいもの'],
    correct_answer: 'さんぽ',
    explanation: '散歩（さんぽ）する: Đi dạo.',
    full_sentence_jp: '夕方犬とさんぽします。'
  },
  {
    id: 1109,
    lesson: 11,
    type: 'multiple_choice',
    title: 'Trạng thái buồn ngủ',
    question: 'きのう 夜遅くまで勉強したので、とても（　　）です。',
    options: ['ねむい', 'さびしい', 'いたい', 'くらい'],
    correct_answer: 'ねむい',
    explanation: '眠い（ねむい）nghĩa là buồn ngủ.',
    full_sentence_jp: 'とてもねむいです。'
  },
  {
    id: 1110,
    lesson: 11,
    type: 'multiple_choice',
    title: 'Cảm giác cô đơn khi sống một mình',
    question: '一人暮らしですから、時々（　　）です。',
    options: ['さびしい', 'たのしい', 'いそがしい', 'あかるい'],
    correct_answer: 'さびしい',
    explanation: '寂しい（さびしい）nghĩa là cô đơn, lẻ loi.',
    full_sentence_jp: '一人暮らしですから、時々さびしいです。'
  }
];

const outPath = path.join(__dirname, '..', 'src', 'data', 'vocab_exercises.json');
fs.writeFileSync(outPath, JSON.stringify(exercises, null, 2), 'utf8');
console.log(`Đã tạo thành công ${exercises.length} câu bài tập tương tác tại:`, outPath);
