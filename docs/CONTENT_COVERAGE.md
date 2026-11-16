# Phạm vi và nguồn nội dung

| Nội dung | Số lượng | Nguồn | Cách dùng |
|---|---:|---|---|
| Từ vựng | 977 | `src/data/vocabulary_b1_11.json`, script trích xuất và PDF Dekiru | Bài học, tra từ, flashcard |
| Câu trắc nghiệm | 424 | 408 câu từ `vocab_exercises.json`, 16 câu từ `grammar_exercises.json` | FE Practice và thi thử tự luyện |
| Câu có hình | 102 bộ | `src/data/questions.json`, PDF ôn nói và `public/images` | Speaking, kho luyện gốc |
| Câu không hình | 47 | 39 câu từ `no_image_questions.json`, 8 câu từ `grammar_speaking.json` | Speaking, mẫu ngữ pháp |
| Bài đọc | 16 | `src/data/reading_passages.json`, DOCX ôn đọc | Trang Đọc hiểu và kho luyện gốc |
| Kanji | 119 | `src/data/kanji_b1_11.json` | Giữ dữ liệu, chưa có màn hình riêng |
| Bài tập ngữ pháp gốc | 26 trang | 4 PDF Dekiru bài 8–11 trong `documents/pdf` | Xem nguyên bản trong Speaking và FE |

Các bài 8–11 có câu Speaking theo lesson. Từ vựng và câu trắc nghiệm có dữ liệu từ bài 1–11. `JPD133_FE_format.pdf` chứa ghi chú đáp án, không đủ để xác nhận cấu trúc FE chính thức. Bộ câu trên website là tài liệu ôn luyện của dự án; chưa xác nhận toàn bộ câu là đề chính thức. Nhiều câu trắc nghiệm được tạo bằng script nên cần người dạy tiếng Nhật kiểm duyệt nội dung.

Mỗi bài đọc hiển thị 2 câu theo mẫu thi Speaking, câu dư nằm ở mục luyện thêm. 16 đề nói mẫu ghép 16 bài đọc với một câu có tranh và hai câu không tranh, theo trình tự của `2. JPD133 Speaking demo.pdf` và tài liệu hướng dẫn. Đây là đề tự luyện, không phải đề chính thức.

Bốn PDF ngữ pháp là bản quét ảnh, không có lớp chữ để trích xuất. Toàn bộ 26 trang có thể xem trên website. 16 câu FE và 8 câu luyện nói mới được biên soạn từ các điểm ngữ pháp rõ trên trang đầu từng PDF; chưa chuyển toàn bộ bài tập PDF thành câu có chấm điểm. Các câu PDF chưa xác thực đáp án được dùng để tự luyện và không tính điểm.

`npm run validate:data` kiểm tra ID trùng, lesson hợp lệ, trường bắt buộc, ảnh Speaking tồn tại và đáp án FE có trong lựa chọn. Kiểm tra này không xác nhận độ đúng của tiếng Nhật hay bản dịch.

Dữ liệu từ vựng hiện không có trường Romaji và loại từ chuẩn hóa, nên giao diện chưa hỗ trợ tìm theo Romaji hoặc lọc theo loại từ. Câu FE hiện chỉ có loại trắc nghiệm nhiều lựa chọn; các dạng như sắp xếp câu chưa có đáp án được xác minh trong dữ liệu.
