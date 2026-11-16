# Báo cáo QA · 16/11/2026

## Đã chạy

- `npm run validate:data`: đạt sau cập nhật, 977 từ, 424 câu trắc nghiệm, 102 bộ câu có hình, 47 câu không hình, 16 bài đọc và 119 Kanji; 0 lỗi cấu trúc.
- `npm run build`: đạt. Các trang học và ngân hàng dữ liệu được tách theo route; bản dựng mới không còn cảnh báo chunk quá lớn.
- `npm run lint`: hết lỗi nghiêm trọng sau khi sửa thứ tự hook trong `GeneralDrawer.jsx`; còn cảnh báo trong component/script cũ.
- `npm test`: đạt 3 test, gồm đăng ký/đăng nhập, tách dữ liệu hai tài khoản, lưu tiến độ, mở URL sâu, thống kê và kiểm tra dữ liệu nhập.

## Đã kiểm thử trên trình duyệt

- Dashboard hiển thị trạng thái trống và số liệu bằng 0 từ dữ liệu thật.
- Chọn sai một câu FE, thấy giải thích, mở Ôn câu sai và tải lại trang: câu sai vẫn còn.
- Thi thử 2 câu, chọn một đáp án, xác nhận nộp, xem kết quả 1/2 và giải thích từng câu.
- Lật flashcard, đánh dấu “Đã nhớ”, làm đúng câu trắc nghiệm từ vựng và thấy phản hồi.
- Mở bài đọc, bật bản dịch và đáp án tham khảo.
- Landing page ở desktop và 375px: hero, mục nội dung, menu mobile, CTA vào dashboard và không tràn ngang. Đã xem cả light/dark mode; sau kiểm tra khôi phục light mode.
- Kiểm tra bố cục dashboard ở viewport hẹp của in-app browser.
- Đã tạo tài khoản thử trong trình duyệt, vào dashboard, mở Reading với đúng 2 câu hỏi và đi qua Reading đến câu có tranh trong đề Speaking mẫu.
- Đã mở PDF ngữ pháp bài 8 trong khung tài liệu trên trang đề nói.
- Sau khi đăng xuất, đã vào dashboard và FE trực tiếp dưới vai trò Khách; PDF ngữ pháp cũng mở được mà không cần tài khoản.

## Giới hạn xác minh

- Chưa kiểm thử quyền microphone và giọng đọc trên từng hệ điều hành; giao diện có xử lý từ chối và trình duyệt không hỗ trợ.
- Chưa xác nhận bố cục trên thiết bị di động thực hoặc toàn bộ thao tác bàn phím.
- Chưa kiểm duyệt tiếng Nhật với tài liệu gốc từng dòng.
- Từ vựng mới có flashcard và tra cứu; bài tập từ vựng cũ ở mục Kho luyện gốc.
- Chưa kiểm thử trên thiết bị khác hoặc gửi email; đăng nhập dùng SQLite trên máy chủ cục bộ, chưa có xác minh email/khôi phục mật khẩu.
