import json
import re
import difflib

with open('src/data/reading_passages.json', 'r', encoding='utf-8') as f:
    passages = json.load(f)

print(f"Tổng số bài đọc: {len(passages)}")

def strip_ruby(text):
    text = re.sub(r'<ruby>([^<]+)<rt>[^<]*</rt></ruby>', r'\1', text)
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'\s+', '', text)
    return text

cleaned = []
for p in passages:
    cleaned.append({
        'id': p['id'],
        'title': p.get('title', ''),
        'raw_jp': p.get('jp_text', ''),
        'clean_jp': strip_ruby(p.get('jp_text', '')),
        'vi_text': p.get('vi_text', ''),
        'clean_vi': re.sub(r'\s+', '', p.get('vi_text', '')),
        'questions': [q.get('question_jp', '') for q in p.get('questions', [])]
    })

print("\n--- SO SÁNH ĐỘ TƯƠNG ĐỒNG CÁC CẶP BÀI ĐỌC (Độ tương đồng JP >= 20%) ---")
found_dup = False
for i in range(len(cleaned)):
    for j in range(i + 1, len(cleaned)):
        p1 = cleaned[i]
        p2 = cleaned[j]
        ratio_jp = difflib.SequenceMatcher(None, p1['clean_jp'], p2['clean_jp']).ratio()
        ratio_vi = difflib.SequenceMatcher(None, p1['clean_vi'], p2['clean_vi']).ratio()
        if ratio_jp >= 0.2 or ratio_vi >= 0.2:
            found_dup = True
            print(f"\n[!] Cặp Bài {p1['id']} và Bài {p2['id']}:")
            print(f"    - Bài {p1['id']}: {p1['title']}")
            print(f"    - Bài {p2['id']}: {p2['title']}")
            print(f"    - Độ tương đồng tiếng Nhật (clean): {ratio_jp*100:.1f}%")
            print(f"    - Độ tương đồng tiếng Việt: {ratio_vi*100:.1f}%")
            print(f"    - Nội dung Bài {p1['id']} (đầu): {p1['clean_jp'][:60]}...")
            print(f"    - Nội dung Bài {p2['id']} (đầu): {p2['clean_jp'][:60]}...")
            print(f"    - Câu hỏi Bài {p1['id']}: {p1['questions']}")
            print(f"    - Câu hỏi Bài {p2['id']}: {p2['questions']}")

if not found_dup:
    print("Không có cặp bài nào có độ tương đồng >= 20%.")
