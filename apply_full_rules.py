import json
import re

kanji_b8_11 = set([
    '家', '族', '父', '母', '兄', '弟', '姉', '妹', '犬', '高', '短', '長',
    '好', '歌', '音', '楽', '車', '映', '画', '旅', '海', '外',
    '駅', '上', '下', '地', '図', '館', '右', '左', '道',
    '起', '歩', '乗', '始', '終', '勉', '強', '朝', '昼', '夜'
])

kanji_pattern = re.compile(r'[\u3400-\u4dbf\u4e00-\u9fff]')

with open(r'src/data/reading_passages.json', 'r', encoding='utf-8') as f:
    passages = json.load(f)

# Danh sách từ vựng chuẩn hóa
# Lưu ý: Các chữ thuộc Bài 8-11 không có ruby. 
# Từ lai giữa B8-11 và B1-7/ngoài:
# - 図書館 -> 図<ruby>書<rt>しょ</rt></ruby>館 (図, 館 thuộc B10, 書 thuộc B6)
# - 旅行 -> 旅<ruby>行<rt>こう</rt></ruby> (旅 thuộc B9, 行 thuộc B5)
# - 外国 -> 外<ruby>国<rt>こく</rt></ruby> (外 thuộc B9, 国 thuộc B4)
# - 電車 -> <ruby>電<rt>でん</rt></ruby>車 (電 ngoài, 車 thuộc B9)
# - 観覧車 -> <ruby>観覧<rt>かんらん</rt></ruby>車 (観覧 ngoài, 車 thuộc B9)
# - 高校生 -> 高校<ruby>生<rt>せい</rt></ruby> (高 thuộc B8, 生 thuộc B1)
# - 高校 -> 高<ruby>校<rt>こう</rt></ruby> (高 thuộc B8, 校 thuộc B1)
# - 毎朝 -> <ruby>毎<rt>まい</rt></ruby>朝 (毎 thuộc B5, 朝 thuộc B11)
# - 駅の前 -> 駅の<ruby>前<rt>まえ</rt></ruby> (駅 thuộc B10, 前 thuộc B4)
# - 地下鉄 -> 地下<ruby>鉄<rt>てつ</rt></ruby> (地下 thuộc B10, 鉄 ngoài)
# - 上手 -> 上手 (上 thuộc B10, từ vựng B10, không có ruby)
# - 散歩 -> 散歩 (歩 thuộc B11, từ vựng B11, không có ruby)

RAW_PAIRS = [
    # Cụm 4-5 chữ
    ('一週間', '<ruby>一週間<rt>いっしゅうかん</rt></ruby>'),
    ('大江戸温泉', '<ruby>大江戸<rt>だいえど</rt></ruby>温泉'),
    ('秋葉原', '<ruby>秋葉原<rt>あきはばら</rt></ruby>'),
    ('中国語', '<ruby>中国語<rt>ちゅうごくご</rt></ruby>'),
    ('日本語', '<ruby>日本語<rt>にほんご</rt></ruby>'),
    ('高校生', '高校<ruby>生<rt>せい</rt></ruby>'),
    ('※原文: あげました', '※<ruby>原文<rt>げんぶん</rt></ruby>: あげました'),
    ('（※原文: あげました）', '（※<ruby>原文<rt>げんぶん</rt></ruby>: あげました）'),
    
    # Cụm 3 chữ
    ('何曜日', '<ruby>何曜日<rt>なんようび</rt></ruby>'),
    ('土曜日', '<ruby>土曜日<rt>どようび</rt></ruby>'),
    ('日曜日', '<ruby>日曜日<rt>にちようび</rt></ruby>'),
    ('月曜日', '<ruby>月曜日<rt>げつようび</rt></ruby>'),
    ('金曜日', '<ruby>金曜日<rt>きんようび</rt></ruby>'),
    ('誕生日', '<ruby>誕生日<rt>たんじょうび</rt></ruby>'),
    ('買い物', '<ruby>買い物<rt>かいもの</rt></ruby>'),
    ('飲み物', '<ruby>飲<rt>の</rt></ruby>み<ruby>物<rt>もの</rt></ruby>'),
    ('観覧車', '<ruby>観覧<rt>かんらん</rt></ruby>車'),
    ('図書館', '図<ruby>書<rt>しょ</rt></ruby>館'),
    ('お土産', 'お<ruby>土産<rt>みやげ</rt></ruby>'),
    ('気持ち', '<ruby>気持<rt>きも</rt></ruby>ち'),
    ('男の子', '<ruby>男<rt>おとこ</rt></ruby>の<ruby>子<rt>こ</rt></ruby>'),
    ('次の日', '<ruby>次<rt>つぎ</rt></ruby>の<ruby>日<rt>ひ</rt></ruby>'),
    ('雨の日', '<ruby>雨<rt>あめ</rt></ruby>の<ruby>日<rt>ひ</rt></ruby>'),
    ('休みの日', '<ruby>休<rt>やす</rt></ruby>みの<ruby>日<rt>ひ</rt></ruby>'),
    ('夏休み', '<ruby>夏<rt>なつ</rt></ruby><ruby>休<rt>やす</rt></ruby>み'),
    ('地下鉄', '地下<ruby>鉄<rt>てつ</rt></ruby>'),
    ('一つ目', '<ruby>一<rt>ひと</rt></ruby>つ<ruby>目<rt>め</rt></ruby>'),
    ('1か月', '1<ruby>か月<rt>かげつ</rt></ruby>'),
    ('4時半', '4<ruby>時半<rt>じはん</rt></ruby>'),
    
    # Từ ghép 2 chữ
    ('趣味', '<ruby>趣味<rt>しゅみ</rt></ruby>'),
    ('友達', '<ruby>友達<rt>ともだち</rt></ruby>'),
    ('果物', '<ruby>果物<rt>くだもの</rt></ruby>'),
    ('公園', '<ruby>公園<rt>こうえん</rt></ruby>'),
    ('台場', '<ruby>台場<rt>だいば</rt></ruby>'),
    ('大江戸', '<ruby>大江戸<rt>だいえど</rt></ruby>'),
    ('浴衣', '<ruby>浴衣<rt>ゆかた</rt></ruby>'),
    ('温泉', '<ruby>温泉<rt>おんせん</rt></ruby>'),
    ('写真', '<ruby>写真<rt>しゃしん</rt></ruby>'),
    ('山口', '<ruby>山口<rt>やまぐち</rt></ruby>'),
    ('春子', '<ruby>春子<rt>はるこ</rt></ruby>'),
    ('一緒', '<ruby>一緒<rt>いっしょ</rt></ruby>'),
    ('生活', '<ruby>生活<rt>せいかつ</rt></ruby>'),
    ('平日', '<ruby>平日<rt>へいじつ</rt></ruby>'),
    ('有名', '<ruby>有名<rt>ゆうめい</rt></ruby>'),
    ('松本', '<ruby>松本<rt>まつもと</rt></ruby>'),
    ('山田', '<ruby>山田<rt>やまだ</rt></ruby>'),
    ('太郎', '<ruby>太郎<rt>たろう</rt></ruby>'),
    ('残念', '<ruby>残念<rt>ざんねん</rt></ruby>'),
    ('食事', '<ruby>食事<rt>しょくじ</rt></ruby>'),
    ('電車', '<ruby>電<rt>でん</rt></ruby>車'),
    ('学校', '<ruby>学校<rt>がっこう</rt></ruby>'),
    ('高校', '高<ruby>校<rt>こう</rt></ruby>'),
    ('先生', '<ruby>先生<rt>せんせい</rt></ruby>'),
    ('先週', '<ruby>先週<rt>せんしゅう</rt></ruby>'),
    ('毎週', '<ruby>毎週<rt>まいしゅう</rt></ruby>'),
    ('来週', '<ruby>来週<rt>らいしゅう</rt></ruby>'),
    ('来月', '<ruby>来月<rt>らいげつ</rt></ruby>'),
    ('来年', '<ruby>来年<rt>らいねん</rt></ruby>'),
    ('今年', '<ruby>今年<rt>ことし</rt></ruby>'),
    ('去年', '<ruby>去年<rt>きょねん</rt></ruby>'),
    ('今朝', '<ruby>今朝<rt>けさ</rt></ruby>'),
    ('今日', '<ruby>今日<rt>きょう</rt></ruby>'),
    ('毎日', '<ruby>毎日<rt>まいにち</rt></ruby>'),
    ('毎朝', '<ruby>毎<rt>まい</rt></ruby>朝'),
    ('毎晩', '<ruby>毎<rt>まい</rt></ruby><ruby>晩<rt>ばん</rt></ruby>'),
    ('午後', '<ruby>午後<rt>ごご</rt></ruby>'),
    ('会社', '<ruby>会社<rt>かいしゃ</rt></ruby>'),
    ('名前', '<ruby>名前<rt>なまえ</rt></ruby>'),
    ('東京', '<ruby>東京<rt>とうきょう</rt></ruby>'),
    ('時間', '<ruby>時間<rt>じかん</rt></ruby>'),
    ('日本', '<ruby>日本<rt>にほん</rt></ruby>'),
    ('大変', '<ruby>大変<rt>たいへん</rt></ruby>'),
    ('大学', '<ruby>大学<rt>だいがく</rt></ruby>'),
    ('旅行', '旅<ruby>行<rt>こう</rt></ruby>'),
    ('外国', '外<ruby>国<rt>こく</rt></ruby>'),
    ('何回', '<ruby>何回<rt>なんかい</rt></ruby>'),
    ('1回', '1<ruby>回<rt>かい</rt></ruby>'),
    ('2回', '2<ruby>回<rt>かい</rt></ruby>'),
    ('何時', '<ruby>何時<rt>なんじ</rt></ruby>'),
    ('何人', '<ruby>何人<rt>なんにん</rt></ruby>'),
    ('900円', '900<ruby>円<rt>えん</rt></ruby>'),
    ('7時', '7<ruby>時<rt>じ</rt></ruby>'),
    ('1時', '1<ruby>時<rt>じ</rt></ruby>'),
    ('4人', '4<ruby>人<rt>にん</rt></ruby>'),
    ('5人', '5<ruby>人<rt>にん</rt></ruby>'),
    ('3人', '3<ruby>人<rt>にん</rt></ruby>'),
    ('1人', '1<ruby>人<rt>ひとり</rt></ruby>'),
    ('休み', '<ruby>休<rt>やす</rt></ruby>み'),
    
    # Động từ Bài 1-7 và ngoài giáo trình
    ('見に行きます', '<ruby>見<rt>み</rt></ruby>に行きます'),
    ('見に行きたい', '<ruby>見<rt>み</rt></ruby>に行きたい'),
    ('見に行く', '<ruby>見<rt>み</rt></ruby>に行く'),
    ('見ること', '<ruby>見<rt>み</rt></ruby>ること'),
    ('見ました', '<ruby>見<rt>み</rt></ruby>ました'),
    ('見たい', '<ruby>見<rt>み</rt></ruby>たい'),
    ('見ます', '<ruby>見<rt>み</rt></ruby>ます'),
    ('見たり', '<ruby>見<rt>み</rt></ruby>たり'),
    ('見て', '<ruby>見<rt>み</rt></ruby>て'),
    ('見る', '<ruby>見<rt>み</rt></ruby>る'),
    ('見え', '<ruby>見<rt>み</rt></ruby>え'),
    
    ('行きます', '<ruby>行<rt>い</rt></ruby>きます'),
    ('行きました', '<ruby>行<rt>い</rt></ruby>きました'),
    ('行きません', '<ruby>行<rt>い</rt></ruby>きません'),
    ('行きませんでした', '<ruby>行<rt>い</rt></ruby>きませんでした'),
    ('行ったり', '<ruby>行<rt>い</rt></ruby>ったり'),
    ('行って', '<ruby>行<rt>い</rt></ruby>って'),
    ('行きたい', '<ruby>行<rt>い</rt></ruby>きたい'),
    ('行く', '<ruby>行<rt>い</rt></ruby>く'),
    
    ('食べます', '<ruby>食<rt>た</rt></ruby>べます'),
    ('食べました', '<ruby>食<rt>た</rt></ruby>べました'),
    ('食べて', '<ruby>食<rt>た</rt></ruby>べて'),
    ('食べる', '<ruby>食<rt>た</rt></ruby>べる'),
    
    ('飲みます', '<ruby>飲<rt>の</rt></ruby>みます'),
    ('飲んで', '<ruby>飲<rt>の</rt></ruby>んで'),
    ('飲む', '<ruby>飲<rt>の</rt></ruby>む'),
    
    ('買います', '<ruby>買<rt>か</rt></ruby>います'),
    ('買って', '<ruby>買<rt>か</rt></ruby>って'),
    ('買う', '<ruby>買<rt>か</rt></ruby>う'),
    
    ('聞きます', '<ruby>聞<rt>き</rt></ruby>きます'),
    ('聞いて', '<ruby>聞<rt>き</rt></ruby>いて'),
    ('聞いたり', '<ruby>聞<rt>き</rt></ruby>いたり'),
    ('聞く', '<ruby>聞<rt>き</rt></ruby>く'),
    
    ('読みます', '<ruby>読<rt>よ</rt></ruby>みます'),
    ('読んだ', '<ruby>読<rt>よ</rt></ruby>んだ'),
    ('読んで', '<ruby>読<rt>よ</rt></ruby>んで'),
    ('読む', '<ruby>読<rt>よ</rt></ruby>む'),
    ('読みませんでした', '<ruby>読<rt>よ</rt></ruby>みませんでした'),
    
    ('話します', '<ruby>話<rt>はな</rt></ruby>します'),
    ('話して', '<ruby>話<rt>はな</rt></ruby>して'),
    ('話です', '<ruby>話<rt>はなし</rt></ruby>です'),
    ('話', '<ruby>話<rt>はなし</rt></ruby>'),
    
    ('帰ります', '<ruby>帰<rt>かえ</rt></ruby>ります'),
    ('帰って', '<ruby>帰<rt>かえ</rt></ruby>って'),
    ('帰る', '<ruby>帰<rt>かえ</rt></ruby>る'),
    
    ('来ました', '<ruby>来<rt>き</rt></ruby>ました'),
    ('来て', '<ruby>来<rt>き</rt></ruby>て'),
    ('来ます', '<ruby>来<rt>き</rt></ruby>ます'),
    
    ('会いました', '<ruby>会<rt>あ</rt></ruby>いました'),
    ('会います', '<ruby>会<rt>あ</rt></ruby>います'),
    ('会う', '<ruby>会<rt>あ</rt></ruby>う'),
    
    ('借りました', '<ruby>借<rt>か</rt></ruby>りました'),
    ('借る', '<ruby>借<rt>か</rt></ruby>る'),
    
    ('返しました', '<ruby>返<rt>かえ</rt></ruby>しました'),
    ('返す', '<ruby>返<rt>かえ</rt></ruby>す'),
    
    ('習います', '<ruby>習<rt>なら</rt></ruby>います'),
    ('習う', '<ruby>習<rt>なら</rt></ruby>う'),
    
    ('教え方', '<ruby>教<rt>おし</rt></ruby>え<ruby>方<rt>かた</rt></ruby>'),
    ('教えて', '<ruby>教<rt>おし</rt></ruby>えて'),
    ('教えます', '<ruby>教<rt>おし</rt></ruby>えます'),
    
    ('遊びに', '<ruby>遊<rt>あそ</rt></ruby>びに'),
    ('遊ぶ', '<ruby>遊<rt>あそ</rt></ruby>ぶ'),
    
    ('慣れました', '<ruby>慣<rt>な</rt></ruby>れました'),
    ('慣れる', '<ruby>慣<rt>な</rt></ruby>れる'),
    
    ('初めは', '<ruby>初<rt>はじ</rt></ruby>めは'),
    ('初めて', '<ruby>初<rt>はじ</rt></ruby>めて'),
    
    ('座って', '<ruby>座<rt>すわ</rt></ruby>って'),
    ('座ります', '<ruby>座<rt>すわ</rt></ruby>ります'),
    ('座る', '<ruby>座<rt>すわ</rt></ruby>る'),
    
    ('曲がります', '<ruby>曲<rt>ま</rt></ruby>がります'),
    ('曲がって', '<ruby>曲<rt>ま</rt></ruby>がって'),
    ('曲がる', '<ruby>曲<rt>ま</rt></ruby>がる'),
    
    ('着ることができます', '<ruby>着<rt>き</rt></ruby>ることができます'),
    ('着たり', '<ruby>着<rt>き</rt></ruby>たり'),
    ('着る', '<ruby>着<rt>き</rt></ruby>る'),
    
    ('入ることができます', '<ruby>入<rt>はい</rt></ruby>ることができます'),
    ('入ったり', '<ruby>入<rt>はい</rt></ruby>ったり'),
    ('入る', '<ruby>入<rt>はい</rt></ruby>る'),
    
    ('出て', '<ruby>出<rt>で</rt></ruby>て'),
    ('出る', '<ruby>出<rt>で</rt></ruby>る'),
    
    # Tính từ & Danh từ đơn
    ('大きい', '<ruby>大<rt>おお</rt></ruby>きい'),
    ('小さい', '<ruby>小<rt>ちい</rt></ruby>さい'),
    ('少し', '<ruby>少<rt>すこ</rt></ruby>し'),
    ('特に', '<ruby>特<rt>とく</rt></ruby>に'),
    ('近く', '<ruby>近<rt>ちか</rt></ruby>く'),
    ('角', '<ruby>角<rt>かど</rt></ruby>'),
    ('店', '<ruby>店<rt>みせ</rt></ruby>'),
    ('猫', '<ruby>猫<rt>ねこ</rt></ruby>'),
    ('机', '<ruby>机<rt>つくえ</rt></ruby>'),
    ('花', '<ruby>花<rt>はな</rt></ruby>'),
    ('木の下', '<ruby>木<rt>き</rt></ruby>の下'),
    ('木', '<ruby>木<rt>き</rt></ruby>'),
    ('ご飯', 'ご<ruby>飯<rt>はん</rt></ruby>'),
    ('皆', '<ruby>皆<rt>みな</rt></ruby>'),
    ('国へ', '<ruby>国<rt>くに</rt></ruby>へ'),
    ('本や', '<ruby>本<rt>ほん</rt></ruby>や'),
    ('本を', '<ruby>本<rt>ほん</rt></ruby>を'),
    ('本が', '<ruby>本<rt>ほん</rt></ruby>が'),
    ('本の', '<ruby>本<rt>ほん</rt></ruby>の'),
    ('本で', '<ruby>本<rt>ほん</rt></ruby>で'),
    ('本', '<ruby>本<rt>ほん</rt></ruby>'),
    ('人です', '<ruby>人<rt>ひと</rt></ruby>です'),
    ('人に', '<ruby>人<rt>ひと</rt></ruby>に'),
    ('人の', '<ruby>人<rt>ひと</rt></ruby>の'),
    ('人は', '<ruby>人<rt>ひと</rt></ruby>は'),
    ('人', '<ruby>人<rt>ひと</rt></ruby>'),
    ('私', '<ruby>私<rt>わたし</rt></ruby>'),
    ('前', '<ruby>前<rt>まえ</rt></ruby>'),
    ('何を', '<ruby>何<rt>なに</rt></ruby>を'),
    ('何で', '<ruby>何<rt>なに</rt></ruby>で'),
    ('何が', '<ruby>何<rt>なに</rt></ruby>が'),
    ('何に', '<ruby>何<rt>なに</rt></ruby>に'),
    ('何/', '<ruby>何<rt>なに</rt></ruby>/'),
    ('何', '<ruby>何<rt>なに</rt></ruby>'),
    ('今、', '<ruby>今<rt>いま</rt></ruby>、'),
    ('今は', '<ruby>今<rt>いま</rt></ruby>は'),
    ('今', '<ruby>今<rt>いま</rt></ruby>'),
]

# Sắp xếp theo độ dài của target giảm dần (longest match first)
REPLACEMENTS = sorted(RAW_PAIRS, key=lambda x: len(x[0]), reverse=True)

def strip_all_rubies(text):
    """Bóc toàn bộ thẻ ruby để có văn bản trần sạch sẽ."""
    return re.sub(r'<ruby>(.*?)<rt>.*?</rt></ruby>', r'\1', text)

def apply_full_transformation(text):
    # Bước 1: Bóc hết ruby cũ để chuẩn hóa từ văn bản trần sạch
    base_text = strip_all_rubies(text)
    
    # Bước 2: Thay thế theo thứ tự ưu tiên (dài -> ngắn)
    for target, rep in REPLACEMENTS:
        if target in base_text:
            base_text = base_text.replace(target, rep)
            
    # Chống lồng thẻ
    base_text = re.sub(r'<ruby><ruby>(.*?)<rt>(.*?)</rt></ruby><rt>.*?</rt></ruby>', r'<ruby>\1<rt>\2</rt></ruby>', base_text)
    return base_text

updated_passages = []
for p in passages:
    p_copy = dict(p)
    p_copy['jp_text'] = apply_full_transformation(p['jp_text'])
    new_questions = []
    for q in p.get('questions', []):
        q_copy = dict(q)
        q_copy['q_jp'] = apply_full_transformation(q.get('q_jp', ''))
        q_copy['a_jp'] = apply_full_transformation(q.get('a_jp', ''))
        new_questions.append(q_copy)
    p_copy['questions'] = new_questions
    updated_passages.append(p_copy)

# KIỂM ĐỊNH TOÁN HỌC TUYỆT ĐỐI
print("=== BẮT ĐẦU KIỂM ĐỊNH TOÁN HỌC ===")
ruby_reg = re.compile(r'<ruby>(.*?)<rt>(.*?)</rt></ruby>')

missing_ruby = []
illegal_ruby = []

for p in updated_passages:
    # 1. Quét ngoài ruby: có kanji nào không thuộc B8-11 không?
    t_no_ruby = re.sub(r'<ruby>.*?<rt>.*?</rt></ruby>', '', p['jp_text'])
    for c in t_no_ruby:
        if kanji_pattern.match(c) and c not in kanji_b8_11:
            missing_ruby.append((p['id'], 'jp_text', c))

    # 2. Quét trong ruby: có kanji nào thuộc B8-11 không?
    for m in ruby_reg.finditer(p['jp_text']):
        base = m.group(1)
        kanjis = [c for c in base if kanji_pattern.match(c)]
        for c in kanjis:
            if c in kanji_b8_11:
                illegal_ruby.append((p['id'], 'jp_text', m.group(0), c))

    # Quét questions
    for q_idx, q in enumerate(p.get('questions', [])):
        for fld in ['q_jp', 'a_jp']:
            v_no_ruby = re.sub(r'<ruby>.*?<rt>.*?</rt></ruby>', '', q[fld])
            for c in v_no_ruby:
                if kanji_pattern.match(c) and c not in kanji_b8_11:
                    missing_ruby.append((p['id'], f'Q{q_idx+1}_{fld}', c))
            for m in ruby_reg.finditer(q[fld]):
                base = m.group(1)
                kanjis = [c for c in base if kanji_pattern.match(c)]
                for c in kanjis:
                    if c in kanji_b8_11:
                        illegal_ruby.append((p['id'], f'Q{q_idx+1}_{fld}', m.group(0), c))

print(f"1. Số chữ ngoài B8-11 còn thiếu ruby: {len(missing_ruby)}")
if missing_ruby:
    print(f"   Các chữ thiếu: {' '.join(set(x[2] for x in missing_ruby))}")
    for item in missing_ruby:
        print(f"   Bài {item[0]} [{item[1]}]: Chữ '{item[2]}'")

print(f"2. Số chữ thuộc B8-11 bị dính ruby: {len(illegal_ruby)}")
if illegal_ruby:
    for item in illegal_ruby:
        print(f"   Bài {item[0]} [{item[1]}]: Thẻ '{item[2]}' (Chữ phạm quy: '{item[3]}')")

if len(missing_ruby) == 0 and len(illegal_ruby) == 0:
    print("\n✓ HOÀN HẢO 100%! Ghi kết quả vào reading_passages.json...")
    with open(r'src/data/reading_passages.json', 'w', encoding='utf-8') as f:
        json.dump(updated_passages, f, ensure_ascii=False, indent=2)
    print("✓ ĐÃ LƯU THÀNH CÔNG VÀO reading_passages.json!")
