const tip = (focus, action, pattern) => ({ focus, action, pattern });
const plainQuestion = text => String(text || '').replace(/<rt>[\s\S]*?<\/rt>/gi, '').replace(/<[^>]+>/g, '').replace(/（[^）]*）/g, '').trim();

export function getSpeakingTip({ grammar = '', question = '' } = {}) {
  const q = plainQuestion(question).replace(/[\s　]+/g, '');
  const g = grammar.replace(/[\s　]+/g, '');

  if (/何人|なんにん/.test(q))
    return tip('Số người', 'Nói số người trước, rồi thêm います. Có thể kể thêm họ là ai bằng một câu ngắn.', '［số người］人います。');
  if (/何歳|なんさい/.test(q))
    return tip('Tuổi', 'Trả lời bằng con số + 歳です; có thể nhắc lại chủ thể để câu đầy đủ hơn.', '［người］は［số tuổi］歳です。');
  if (/何回|なんかい/.test(q))
    return tip('Tần suất', 'Trả lời bằng khoảng thời gian + に + số lần, rồi nói hoạt động.', '１週間に［số lần］回［Vます］。');
  if (/趣味|しゅみ/.test(q))
    return tip('Sở thích', 'Đặt động từ ở thể từ điển trước ことです; có thể thêm tần suất hoặc lý do ngắn.', '私の趣味は［Vる］ことです。');
  if (/てもいい|ていい/.test(q) || (/てもいい|ていい/.test(g) && !/ないでください/.test(q)))
    return tip('Xin phép', 'Trả lời はい hoặc いいえ trước, rồi nhắc lại hành động ở dạng ～てもいいです / ～てはいけません.', 'はい、［động từ thể て］もいいです。');
  if (/ないでください/.test(q) || /ないでください/.test(g))
    return tip('Đề nghị không làm', 'Dùng thể ない của động từ rồi thêm でください. Giữ giọng lịch sự khi nhờ người khác.', '［động từ thể ない］でください。');
  if (/どうやって|道を|曲が|渡り|行き方/.test(q) || /どうやって|道案内|曲が|渡り/.test(g))
    return tip('Cách làm hoặc chỉ đường', 'Nêu các bước theo thứ tự; nối hành động bằng thể て và kết thúc bằng động từ chính.', 'まず［Vて］、それから［Vて］、［Vます］。');
  if (/もら|くれ|あげ/.test(q) || /もら|くれ|あげ/.test(g))
    return tip('Cho và nhận', 'Xác định ai cho, ai nhận. Dùng もらいます khi mình nhận, くれます khi người khác cho mình, あげます khi mình cho người khác.', '［người cho］に［đồ vật］をもらいました。');
  if (/たり/.test(q) || /たり/.test(g))
    return tip('Liệt kê hoạt động', 'Nêu hai việc tiêu biểu bằng thể た + り; không cần kể tất cả hoạt động.', '［Vた］り、［Vた］りします。');
  if (/とき/.test(q) || /とき/.test(g))
    return tip('Nói về một thời điểm', 'Nêu tình huống trước とき, sau đó nói bạn làm gì. Tính từ な cần thêm な trước とき.', '［tình huống］とき、［việc bạn làm］。');
  if (/ことができます|ことができ|ができます/.test(q) || /ことができます|ことができ|ができます/.test(g))
    return tip('Khả năng', 'Nếu nói về môn hoặc kỹ năng, dùng danh từ + ができます. Nếu nói về hành động, dùng động từ thể từ điển + ことができます.', '［môn／kỹ năng］ができます。／［Vる］ことができます。');
  if (/趣味|しゅみ|ことです/.test(q) || /趣味|しゅみ|ことです/.test(g))
    return tip('Sở thích', 'Đặt động từ ở thể từ điển trước ことです; có thể thêm tần suất hoặc lý do ngắn.', '私の趣味は［Vる］ことです。');
  if (/何回|なんかい|週間|か月/.test(q) || /に.*回|tần suất|Thời gian.*số lần/.test(g))
    return tip('Tần suất', 'Trả lời bằng khoảng thời gian + に + số lần, rồi nói hoạt động.', '１週間に［số lần］回［Vます］。');
  if (/見え|聞こえ/.test(q) || /見え|聞こえ/.test(g))
    return tip('Nhìn thấy hoặc nghe thấy', 'Nêu vị trí quan sát với から nếu có, rồi dùng が見えます hoặc が聞こえます.', '［địa điểm］から［vật］が見えます。');
  if (/なりま|なります/.test(q) || /なりま|なります/.test(g))
    return tip('Sự thay đổi', 'Tính từ い đổi thành ～くなります; danh từ và tính từ な dùng ～になります.', '［tính từ い bỏ い］くなりました。');
  if (/友達言葉|～ない？|ていい？/.test(grammar))
    return tip('Nói với bạn bè', 'Dùng thể thường cho tình huống thân mật; đừng thêm です／ます vào cuối nếu đang luyện lời nói với bạn.', '［động từ thể thường］？');
  if (/何人|なんにん|〜人|～人/.test(q) || /人います/.test(g))
    return tip('Số người', 'Nói số người trước, rồi thêm います. Có thể kể thêm họ là ai bằng một câu ngắn.', '［số người］人います。');
  if (/何歳|なんさい/.test(q))
    return tip('Tuổi', 'Trả lời bằng con số + 歳です; có thể nhắc lại chủ thể để câu đầy đủ hơn.', '［người］は［số tuổi］歳です。');
  if (/背|髪|どんな人|上手/.test(q) || /がAです|くて|ナAで|上手/.test(g))
    return tip('Miêu tả', 'Nêu chủ thể với は, đặc điểm với が. Muốn nối hai đặc điểm thì dùng ～くて hoặc ～で.', '［người］は［đặc điểm 1］くて、［đặc điểm 2］です。');
  if (/住んで|どこに住/.test(q) || /住んで/.test(g))
    return tip('Nơi ở', 'Chọn địa điểm cụ thể rồi dùng trợ từ に trước 住んでいます.', '［địa điểm］に住んでいます。');
  if (/働いて|はたらいて|教えています/.test(q) || /ています|て形.*います/.test(g))
    return tip('Hoạt động hoặc trạng thái hiện tại', 'Dùng động từ thể て + います. Nếu câu hỏi nhắc nơi làm việc, thêm địa điểm + で trước động từ.', '［Vて］います。／［địa điểm］で［Vて］います。');
  if (/何時|なんじ/.test(q))
    return tip('Mốc giờ', 'Tìm giờ trong tình huống, rồi trả lời bằng giờ + に + động từ được hỏi.', '［giờ］に［Vます］。');
  if (/何を|なにを/.test(q))
    return tip('Hành động', 'Nêu đối tượng với を rồi dùng động từ phù hợp; giữ đúng thời quá khứ nếu câu hỏi dùng ました.', '［đối tượng］を［Vます／Vました］。');
  if (/どこ|どちら/.test(q))
    return tip('Địa điểm', 'Trả lời một nơi cụ thể. Dùng で cho nơi diễn ra hành động, に／へ cho nơi đến.', '［địa điểm］で／に［Vます］。');
  if (/いつ/.test(q))
    return tip('Thời gian', 'Nêu ngày hoặc thời điểm cụ thể trước hành động; dùng quá khứ nếu câu hỏi ở quá khứ.', '［thời gian］［Vます／Vました］。');
  return tip('Câu trả lời ngắn, đủ ý', 'Nghe từ để hỏi, lấy thông tin chính rồi trả lời bằng một câu đầy đủ. Kiểm tra trợ từ và thì của động từ.', '［chủ thể］は［thông tin chính］です／ます。');
}

export function getReadingTip(question = '') {
  const q = plainQuestion(question).replace(/[\s　]+/g, '');
  if (/趣味|しゅみ/.test(q)) return tip('Tìm sở thích', 'Tìm hành động được gọi là sở thích trong đoạn, rồi trả lời bằng nội dung của nhân vật.', '趣味は［hành động trong bài］ことです。');
  if (/何時|なんじ/.test(q)) return tip('Tìm mốc giờ', 'Đọc lại câu có thời gian trong đoạn văn; trả lời bằng giờ và hành động của nhân vật.', '［giờ trong bài］に［hành động］。');
  if (/何回|なんかい/.test(q)) return tip('Tìm tần suất', 'Tìm số lần và khoảng thời gian đi kèm; giữ cả hai trong câu trả lời.', '［khoảng thời gian］に［số lần］回です。');
  if (/何を|なにを|どんなこと/.test(q)) return tip('Tìm hoạt động', 'Gạch ra một hoặc hai hành động được nêu trong đoạn; dùng đúng thì của câu hỏi.', '［hoạt động trong bài］をします／しました。');
  if (/どこ/.test(q)) return tip('Tìm địa điểm', 'Xác định nơi ở, nơi đến hoặc nơi diễn ra hành động; chọn đúng に／へ／で.', '［địa điểm trong bài］に／へ／で［động từ］。');
  if (/だれ|誰/.test(q)) return tip('Tìm người', 'Tìm tên hoặc mối quan hệ được nhắc trong đoạn, rồi trả lời bằng câu ngắn.', '［người được nhắc］です。');
  return tip('Dựa vào đoạn đọc', 'Tìm câu chứa từ khóa trong câu hỏi. Trả lời bằng thông tin của nhân vật, không dùng thông tin của bản thân.', '［thông tin có trong đoạn］です／ます。');
}
