# JPD133 · Nihongo Learning Space

Website tự học tiếng Nhật bằng React, Vite và máy chủ Node.js. Mở ngay tại `/nihongo`; đăng nhập là tùy chọn.

## Chạy dự án

Yêu cầu Node.js 24 (ứng dụng dùng `node:sqlite`).

```bash
npm install
npm run dev
```

Mở URL Vite in ra trong terminal và thêm `/nihongo` (thường là `http://localhost:5173/nihongo`). `npm run dev` chạy đồng thời Vite và API tại cổng 3001. Nếu cổng 5173 đã dùng, Vite tự chọn cổng tiếp theo.

Để chạy bản dựng production trên máy này:

```bash
npm run build
npm run server
```

Mở `http://localhost:3001/nihongo`. Nếu triển khai ra Internet, đặt ứng dụng sau HTTPS và đặt `COOKIE_SECURE=1`; sao lưu thư mục `server/data/` vì đây là nơi lưu tài khoản và tiến độ. Máy chủ Node dùng SQLite tích hợp trong Node 24. Chưa có dịch vụ gửi email nên chưa có xác minh email hoặc khôi phục mật khẩu qua email.

## Nội dung

- Landing page, dashboard, bài học 1–11, từ vựng, ngữ pháp, Reading, Speaking, FE, thi thử và tiến độ.
- 16 bài đọc với 2 câu theo phần Reading của mẫu thi; câu hỏi dư được giữ ở mục luyện thêm.
- 16 đề nói mẫu: đọc đoạn văn, 2 câu hỏi về đoạn đọc, 1 câu có tranh và 2 câu không tranh, có 20 giây chuẩn bị và ghi âm nghe lại.
- 66 câu luyện FE chọn cách viết Kanji cho từ được đánh dấu trong câu tiếng Nhật; 229 câu luyện nói, gồm 8 câu phản xạ mới.
- Bốn PDF bài tập ngữ pháp bài 8–11 (26 trang) được giữ làm dữ liệu tham khảo trong dự án và không hiển thị trên giao diện.
- Khách có thể học ngay; tiến độ lưu trong trình duyệt. Đăng ký/đăng nhập để lưu tiến độ riêng theo tài khoản trên máy chủ. Có xuất/nhập JSON trong Cài đặt.

Các URL dùng đường dẫn `/nihongo/...`, không cần hash route. Liên kết hash cũ được chuyển sang đường dẫn mới khi mở lại.

## Kiểm tra

```bash
npm run validate:data
npm test
npm run lint
npm run build
```

Thi thử FE và đề nói trên website là mô phỏng tự luyện, không phải đề thi chính thức. Ghi âm và phát âm phụ thuộc vào trình duyệt và quyền microphone. Xem [phạm vi nội dung](docs/CONTENT_COVERAGE.md) và [QA](docs/QA_REPORT.md).
