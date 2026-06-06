# PCVT Sáng Kiến Dashboard

Dashboard quản lý & phân loại 4307 sáng kiến cấp cơ sở EVNHCMC — phục vụ công tác xét duyệt tại Công ty Điện lực Vũng Tàu (PCVT).

## Tính năng

- 📊 **Tổng quan phân bổ** — Biểu đồ phân bổ sáng kiến theo 13 Phòng/Đội
- 📋 **Bảng dữ liệu** — Lọc, tìm kiếm, sắp xếp theo phòng/đội
- ✏️ **Chấm điểm** — Modal chấm 5 tiêu chí, tính điểm real-time
- 📈 **Kanban Tracking** — Theo dõi tiến độ triển khai (Chờ duyệt → Đang TK → Hoàn thành)
- 🔗 **100% Online** — Dữ liệu fetch từ Google Sheet API, không nhúng offline

## Kiến trúc

```
index.html          ← Dashboard (static HTML, ~76KB)
vercel.json         ← Vercel config
Code.gs             ← Google Apps Script API (deploy riêng trên GAS)
```

## Deploy

### Vercel (Frontend)
1. Push repo lên GitHub
2. Import repo vào Vercel → Auto deploy
3. Mở URL Vercel → Dashboard hiển thị

### Google Apps Script (Backend API)
1. Mở Google Sheet chứa dữ liệu
2. Extensions → Apps Script → Paste `Code.gs`
3. Deploy → New deployment → Web app → Anyone
4. Copy URL API → Cập nhật biến `API_URL` trong `index.html`

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS (không framework)
- **Backend:** Google Apps Script (doGet/doPost)
- **Database:** Google Sheets
- **Hosting:** Vercel (static)
- **Charts:** Chart.js (CDN)

## Dữ liệu

- **Sheet `ThongTinChung`**: 4307 sáng kiến phân loại bởi AI
- **Sheet `ChamDiem`**: Kết quả chấm điểm 5 tiêu chí
- **Sheet `TrienKhai`**: Theo dõi tiến độ triển khai

---

**PCVT © 2026** — Công ty Điện lực Vũng Tàu
