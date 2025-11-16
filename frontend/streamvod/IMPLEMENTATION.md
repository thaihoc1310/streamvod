# StreamVOD Frontend - Video Upload & Management

## 🎯 Tổng quan

Frontend application cho hệ thống video streaming với khả năng upload, xử lý và quản lý video.

## 🏗️ Kiến trúc

### Backend Architecture
- **Backend**: FastAPI server chạy trên ASG (Auto Scaling Group)
- **Load Balancer**: ALB phân phối traffic đến các EC2 instances
- **Database**: RDS (MySQL/PostgreSQL)
- **Storage**: S3 cho video storage
- **Frontend**: Static hosting trên S3 + CloudFront

### Upload Flow
```
1. User chọn file → Frontend gọi POST /videos/initiate
2. Backend tạo record trong DB + trả presigned URL
3. Frontend upload trực tiếp lên S3 bằng presigned POST
4. Frontend navigate sang /upload-details với video_id
5. Frontend poll GET /videos/{id} mỗi 5s để cập nhật status
6. Khi status = "ready", user nhập metadata và gọi PUT /videos/{id}
```

## 📁 Cấu trúc Project

```
src/
├── config/
│   └── api.js                  # API configuration & endpoints
├── services/
│   └── videoService.js         # API service layer
├── utils/
│   └── formatters.js           # Format duration, file size, time ago
├── components/
│   ├── Dropzone/              # File upload với drag & drop
│   ├── VideoPreviewCard/      # Preview video với status icons
│   ├── VideoCard/             # Video card cho homepage
│   └── ...
└── pages/
    ├── UploadPage/            # Chọn file và upload
    ├── UploadDetailsPage/     # Nhập metadata & polling status
    └── HomePage/              # Danh sách videos
```

## 🔧 Setup

### 1. Environment Variables

Tạo file `.env`:

```bash
VITE_BACKEND_URL=http://localhost:8000
# Hoặc cho production:
# VITE_BACKEND_URL=https://your-alb-endpoint.region.elb.amazonaws.com
```

### 2. Install Dependencies

```bash
cd frontend/streamvod
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

## 🎬 Workflow Chi tiết

### Upload Video Flow

#### 1. **UploadPage** (`/upload`)
- User chọn file video (max 30GB)
- Validate file type và size
- Gọi `POST /videos/initiate` để lấy:
  - `video_id`: UUID của video
  - `presigned`: Object chứa `url` và `fields` để upload lên S3
- Upload file lên S3 bằng FormData với presigned POST
- Navigate sang `/upload-details` với `videoId`, `fileName`, `fileSize`

#### 2. **UploadDetailsPage** (`/upload-details`)
- Nhận `videoId` từ navigation state
- Poll `GET /videos/{id}` mỗi 5 giây
- Hiển thị status realtime:
  - **processing** → "Đang xử lý" (icon spinning)
  - **ready** → "Sẵn sàng" (icon check, màu xanh)
  - **failed** → "Thất bại" (icon X, màu đỏ)
- Khi `status = "ready"`:
  - Enable form nhập title & description
  - Enable nút "Tạo video"
  - User click → gọi `PUT /videos/{id}` với metadata
  - Navigate về `/` (HomePage)
- Khi `status = "failed"`:
  - Ẩn form
  - Hiển thị nút "Về trang chủ"

### View Videos Flow

#### 3. **HomePage** (`/`)
- Gọi `GET /videos?page=1&per_page=20`
- Hiển thị grid videos với:
  - `thumbnail_url` → Thumbnail
  - `title` → Tiêu đề
  - `duration_seconds` → Format thành "MM:SS" hoặc "HH:MM:SS"
  - `created_at` → Format thành "X phút trước", "X giờ trước", etc.

## 🎨 Status Mapping

| Backend Status | Tiếng Việt | Icon | Màu |
|---------------|-----------|------|-----|
| `processing` | Đang xử lý | FiLoader (spinning) | Blue |
| `ready` | Sẵn sàng | FiCheckCircle | Green |
| `failed` | Thất bại | FiXCircle | Red |

## 📡 API Endpoints

### POST `/videos/initiate`
Khởi tạo video upload session

**Response:**
```json
{
  "video_id": "uuid-string",
  "s3_source_key": "uploads/uuid.mp4",
  "presigned": {
    "url": "https://s3.amazonaws.com/...",
    "fields": {
      "key": "uploads/uuid.mp4",
      "Content-Type": "video/mp4",
      "AWSAccessKeyId": "...",
      "policy": "...",
      "signature": "..."
    }
  }
}
```

### GET `/videos/{id}`
Lấy thông tin chi tiết video

**Response:**
```json
{
  "id": "uuid",
  "title": "Video title",
  "description": "Description",
  "status": "ready",
  "duration_seconds": 227,
  "thumbnail_url": "https://...",
  "playback_url": "https://...",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:05:00Z"
}
```

### PUT `/videos/{id}`
Cập nhật metadata video

**Request Body:**
```json
{
  "title": "New title",
  "description": "New description"
}
```

### GET `/videos?page=1&per_page=10&q=search`
Lấy danh sách videos với pagination

**Response:**
```json
{
  "page": 1,
  "per_page": 10,
  "total_items": 100,
  "total_pages": 10,
  "has_next": true,
  "has_prev": false,
  "videos": [
    {
      "id": "uuid",
      "title": "Video title",
      "thumbnail_url": "https://...",
      "duration_seconds": 227,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

## 🔍 S3 Upload Example (curl)

Sau khi nhận presigned data từ backend:

```bash
curl -X POST "https://streamvod-source.s3.amazonaws.com/" \
  -F "key=uploads/0f48d155-bac7-4b3d-b129-f3809bdf2190.mp4" \
  -F "Content-Type=video/mp4" \
  -F "AWSAccessKeyId=ASIAZR5JBHHKJFSCIAU5" \
  -F "x-amz-security-token=IQoJb3JpZ2luX2VjE…" \
  -F "policy=eyJleHBpcmF0aW9uIjogIjIw…" \
  -F "signature=hfVByW46NASb/Q5alGfs1b+1pEs=" \
  -F "file=@/path/to/video.mp4"
```

## 🎯 Key Features

✅ **Direct S3 Upload** - Upload trực tiếp lên S3 không qua backend server  
✅ **Presigned POST** - Bảo mật với temporary credentials  
✅ **Real-time Polling** - Cập nhật status mỗi 5s  
✅ **Status Icons** - Visual feedback với icons động  
✅ **Disabled States** - UI feedback rõ ràng  
✅ **Drag & Drop** - Upload bằng kéo thả  
✅ **File Validation** - Validate type và size trước khi upload  
✅ **Error Handling** - Xử lý lỗi toàn diện  
✅ **Responsive Design** - Hỗ trợ mobile và tablet  

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Deploy to S3

```bash
aws s3 sync dist/ s3://your-bucket-name/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## 📝 Notes

- Video max size: **5GB**
- Supported format: **MP4 only** (.mp4)
- Presigned URL expires: **15 phút** (900s)
- Polling interval: **5 giây**
- Recommended resolution: 480p, 720p, 1080p
- Recommended aspect ratio: 16:9 (landscape), 9:16 (portrait)

## 🔗 Related

- Backend API: [Backend README](../../backend/README.md)
- Infrastructure: [Infra README](../../infra/README.md)
