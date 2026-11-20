# Phạm vi và nguồn nội dung

| Nội dung | Số lượng | Nguồn | Cách dùng |
|---|---:|---|---|
| Từ vựng | 977 | `src/data/vocabulary_b1_11.json`, script trích xuất và PDF Dekiru | Bài học, tra từ, flashcard |
| Câu trắc nghiệm FE | 66 | `fe_exercises.json` | Chọn cách viết Kanji cho từ được đánh dấu bằng kana trong câu tiếng Nhật |
| Câu có hình | 102 bộ | `src/data/questions.json`, PDF ôn nói và `public/images` | Speaking, kho luyện gốc |
| Câu không hình | 47 | 39 câu từ `no_image_questions.json`, 8 câu từ `grammar_speaking.json` | Speaking, mẫu ngữ pháp |
| Bài đọc | 16 | `src/data/reading_passages.json`, DOCX ôn đọc | Trang Đọc hiểu và kho luyện gốc |
| Kanji | 119 | `src/data/kanji_b1_11.json` | Giữ dữ liệu, chưa có màn hình riêng |
| Bài tập ngữ pháp gốc | 26 trang | 4 PDF Dekiru bài 8–11 trong `documents/pdf` | Giữ làm dữ liệu tham khảo; không hiển thị trên giao diện |

Các bài 8–11 có câu Speaking theo lesson. Từ vựng và câu trắc nghiệm FE có dữ liệu từ bài 1–11. Ví dụ FE người dùng cung cấp có câu tiếng Nhật với từ kana trong ngoặc và bốn cách viết Kanji; bộ câu trên website là tài liệu ôn luyện tự biên soạn, chưa xác nhận là đề chính thức. Bộ 408 câu cũ trong `vocab_exercises.json` vẫn được giữ làm dữ liệu tham khảo nhưng không xuất hiện trong trang Luyện FE vì nhiều câu hỏi bằng tiếng Việt hoặc không thuộc dạng chọn cách viết Kanji.

Mỗi bài đọc hiển thị 2 câu theo mẫu thi Speaking, câu dư nằm ở mục luyện thêm. 16 đề nói mẫu ghép 16 bài đọc với một câu có tranh và hai câu không tranh, theo trình tự của `2. JPD133 Speaking demo.pdf` và tài liệu hướng dẫn. Đây là đề tự luyện, không phải đề chính thức.

Bốn PDF ngữ pháp là bản quét ảnh, không có lớp chữ để trích xuất. Toàn bộ 26 trang được giữ trong dự án nhưng không hiển thị trên giao diện. 8 câu luyện nói được biên soạn từ các điểm ngữ pháp rõ trên trang đầu từng PDF; các câu PDF chưa xác thực đáp án không được chấm điểm.

`npm run validate:data` kiểm tra ID trùng, lesson hợp lệ, trường bắt buộc, ảnh Speaking tồn tại, mỗi câu FE có một từ kana trong ngoặc, bốn lựa chọn không trùng và đáp án FE có trong lựa chọn. Kiểm tra này không xác nhận độ đúng của tiếng Nhật hay bản dịch.

Dữ liệu từ vựng hiện không có trường Romaji và loại từ chuẩn hóa, nên giao diện chưa hỗ trợ tìm theo Romaji hoặc lọc theo loại từ. Câu FE hiện chỉ có loại trắc nghiệm nhiều lựa chọn; các dạng như sắp xếp câu chưa có đáp án được xác minh trong dữ liệu.
