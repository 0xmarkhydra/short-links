# SHARE LINK

SHARE LINK là website Next.js full-stack để người dùng tạo, quản lý và chia sẻ liên kết, đồng thời theo dõi lượt truy cập thực tế.

## Stack

- Next.js 16.3.3 App Router + React 19.2.8 + TypeScript
- PostgreSQL qua `pg`
- Server Actions cho auth và CRUD
- Session token lưu server-side, cookie HttpOnly/SameSite
- Mật khẩu hash bằng Node.js `scrypt`
- Mobile-first, Dark Mode mặc định, responsive Android/iPhone/tablet/desktop

## Tính năng đã có

- Landing page SHARE LINK
- Đăng ký / đăng nhập / remember session / đăng xuất
- Ghi nhận yêu cầu quên mật khẩu mà không lộ việc tài khoản có tồn tại
- User Dashboard với tổng link, tổng visit, active/locked
- Tạo Share Link với slug tự động hoặc tùy chỉnh
- My Links: tìm kiếm, copy, xem, sửa, xóa có xác nhận
- Public share page `/s/[slug]`
- Visit tracking thật: thời gian, User Agent, thiết bị, trình duyệt, OS, quốc gia nếu proxy cung cấp, referrer
- Anti-spam cơ bản: cùng fingerprint trên cùng link trong 60 giây chỉ tính một visit
- Analytics 30 ngày + device/browser + top/low link
- Hồ sơ, đổi email/tên hiển thị/mật khẩu, logout toàn bộ thiết bị
- Admin Panel server-side: thống kê, khóa/mở khóa user, khóa/mở khóa/xóa link, audit log
- Admin bootstrap một lần qua `/admin/setup`
- Terms / Privacy / 404 / 500 states
- GitHub Actions kiểm tra migration, TypeScript và production build

## Chạy local

```bash
cp .env.example .env.local
npm install
npm run db:migrate
npm run dev
```

Mở `http://localhost:3000`.

## Biến môi trường

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/share_link
APP_BASE_URL=http://localhost:3000
ANALYTICS_HASH_SECRET=replace-with-a-long-random-secret
ADMIN_BOOTSTRAP_CODE=2012
```

Trong production, hãy đổi `ADMIN_BOOTSTRAP_CODE` khỏi `2012` và dùng secret dài, ngẫu nhiên cho `ANALYTICS_HASH_SECRET`.

## Admin đầu tiên

1. Chạy migration.
2. Mở `/admin/setup`.
3. Nhập mã bootstrap từ `ADMIN_BOOTSTRAP_CODE` (mẫu local là `2012`).
4. Tạo tài khoản Admin.
5. Sau khi Admin đầu tiên tồn tại, bootstrap tự khóa.

Mã `2012` không phải mật khẩu Admin và không thể dùng để vượt qua auth. Mọi route và thao tác Admin đều được kiểm tra lại ở server.

## Database

Migration hiện tại: `db/migrations/001_init.sql`.

Các bảng chính: `users`, `sessions`, `share_links`, `visits`, `password_reset_requests`, `audit_logs`.

Hệ thống không lưu IP thô trong bảng `visits`. IP + User Agent được băm/HMAC thành fingerprint phục vụ anti-spam.

## Quy tắc dữ liệu

- User chỉ đọc/sửa/xóa link có `user_id` của chính họ.
- Xóa link là soft-delete (`DELETED`).
- Link bị Admin khóa không thể truy cập URL đích.
- Analytics chỉ lấy từ dữ liệu DB, không seed/fake số liệu production.
- Visit counter chỉ tăng sau khi một visit hợp lệ được ghi thành công.

## Production checklist

- Dùng PostgreSQL managed có backup.
- Bật HTTPS ở reverse proxy/platform.
- Đổi Admin bootstrap code và analytics secret.
- Cấu hình retention cho bảng `visits` theo chính sách riêng.
- Kết nối email provider nếu muốn tự động hóa hoàn toàn luồng reset password.
