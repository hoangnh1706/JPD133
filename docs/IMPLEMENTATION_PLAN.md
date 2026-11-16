# Kế hoạch triển khai · 16/11/2026

## Khảo sát

Repository ban đầu là React + Vite với một `App.jsx` lớn: 102 bộ câu Speaking có hình, 39 câu phản xạ, 16 bài đọc, từ vựng, AI lookup và một mô phỏng luyện nói. Dữ liệu gồm 977 từ vựng bài 1–11, 408 câu trắc nghiệm, 119 Kanji. Tài liệu nằm trong `documents/`; các script tạo/trích xuất dữ liệu nằm trong `scripts/`. Giao diện cũ chưa có dashboard thống nhất, route cho từng module hay lịch sử trả lời FE.

## Đã triển khai

1. Giữ giao diện cũ ở `LegacyApp.jsx` để bảo toàn nội dung.
2. Tạo shell responsive, điều hướng hash route, bộ màu Sakura và light/dark.
3. Tạo dashboard, bài học, flashcard, trắc nghiệm từ vựng, 16 bài đọc, ngữ pháp theo câu nguồn, Speaking, FE Practice, thi thử tự chọn, ôn câu sai, tiến độ và cài đặt.
4. Lưu sự kiện học tập bằng `localStorage`, xuất/nhập JSON có kiểm tra cấu trúc.
5. Thêm `scripts/validate-data.mjs` kiểm tra ID, lesson và đáp án câu FE.
6. Áp dụng `ui-ux-pro-max` cho landing page và hệ giao diện: giữ sắc Sakura, nâng tương phản nút, thiết kế desktop/mobile, thêm skip link và tách bundle theo route.

## Việc cần tiếp tục

- Đối chiếu thủ công từng từ, câu hỏi, nghĩa và giải thích với tài liệu gốc. Script chỉ kiểm tra cấu trúc.
- Bổ sung trang ngữ pháp đầy đủ, ví dụ và bài tập có nguồn rõ ràng. Hiện trang này dùng 39 chú thích trong câu phản xạ.
- Tài liệu `JPD133_FE_format.pdf` là ghi chú đáp án, chưa đủ để xác nhận thời lượng hay thang điểm FE chính thức. Thi thử mới dùng thiết lập của người học.
- Thêm audio riêng nếu cần giọng đọc ổn định trên mọi thiết bị. Web Speech API hiện phụ thuộc trình duyệt.
- Chưa có backend hay đồng bộ nhiều thiết bị; tiến độ nằm trong trình duyệt.
