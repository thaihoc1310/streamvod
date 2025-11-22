# Multipart Upload with S3 Transfer Acceleration

## 📋 Tổng quan

Đã implement multipart upload với S3 Transfer Acceleration để upload video nhanh hơn, đặc biệt cho file lớn (>100MB).

## ✅ Lợi ích

1. **Transfer Acceleration**: Upload nhanh hơn 50-500% thông qua AWS edge locations
2. **File lớn**: Không giới hạn 5GB như POST, có thể lên tới 5TB
3. **Resume**: Có thể retry từng part riêng lẻ nếu fail
4. **Parallel uploads**: Có thể upload nhiều part đồng thời (hiện tại upload tuần tự)

## 🔧 Implementation

### Backend Changes

#### 1. `backend/app/utils/s3_utils.py`
Thêm 4 functions mới:
- `initiate_multipart_upload()`: Khởi tạo multipart session
- `generate_multipart_presigned_urls()`: Tạo presigned URLs cho các parts
- `complete_multipart_upload()`: Hoàn thành upload
- `abort_multipart_upload()`: Hủy upload nếu fail

Tất cả đều config `use_accelerate_endpoint: True` để dùng Transfer Acceleration.

#### 2. `backend/app/schemas/video.py`
Thêm schemas:
- `MultipartInitiateResponse`
- `MultipartUrlsRequest`
- `MultipartUrlsResponse`
- `CompletedPart`
- `MultipartCompleteRequest`
- `MultipartCompleteResponse`

#### 3. `backend/app/routes/videos.py`
Thêm 3 endpoints mới:
- `POST /videos/multipart/initiate`: Khởi tạo upload
- `POST /videos/multipart/get-urls`: Lấy presigned URLs cho các parts
- `POST /videos/multipart/complete`: Hoàn thành upload

### Frontend Changes

#### 1. `frontend/streamvod/src/config/api.js`
Thêm endpoints:
- `MULTIPART_INITIATE`
- `MULTIPART_GET_URLS`
- `MULTIPART_COMPLETE`

#### 2. `frontend/streamvod/src/services/videoService.js`
Thêm functions:
- `initiateMultipartUpload()`: Call API initiate
- `getMultipartUploadUrls()`: Call API get URLs
- `uploadPart()`: Upload 1 part lên S3 bằng PUT
- `completeMultipartUpload()`: Call API complete
- `uploadVideoMultipart()`: Main function orchestrate toàn bộ flow

**Part size**: 10MB/part (có thể điều chỉnh biến `PART_SIZE`)

#### 3. `frontend/streamvod/src/pages/UploadPage/UploadPage.jsx`
Thay đổi từ:
```javascript
await initiateVideoUpload()
await uploadVideoToS3(file, presigned)
```

Sang:
```javascript
const video_id = await uploadVideoMultipart(file)
```

UI giữ nguyên - không thêm progress bar cho từng part.

## 🔄 Upload Flow

```
Frontend                    Backend                     S3
   |                           |                         |
   |---(1) Initiate---------->|                         |
   |                           |---(create session)---->|
   |<----video_id, upload_id---|                         |
   |                           |                         |
   |---(2) Get URLs---------->|                         |
   |<----presigned URLs--------|                         |
   |                           |                         |
   |---(3) Upload Part 1-------------------------------->|
   |---(3) Upload Part 2-------------------------------->|
   |---(3) Upload Part N-------------------------------->|
   |                           |                         |
   |---(4) Complete---------->|                         |
   |                           |---(finalize)---------->|
   |<----success--------------|                         |
```

## 🌍 Transfer Acceleration URLs

### Presigned POST (cũ):
```
https://streamvod-bucket.s3.us-east-1.amazonaws.com/
```
❌ Không dùng Transfer Acceleration

### Multipart PUT (mới):
```
https://streamvod-bucket.s3-accelerate.amazonaws.com/
```
✅ Dùng Transfer Acceleration qua edge locations

## ⚙️ Configuration

### Yêu cầu:
1. **S3 bucket** phải enable Transfer Acceleration:
   ```bash
   aws s3api put-bucket-accelerate-configuration \
       --bucket streamvod-bucket \
       --accelerate-configuration Status=Enabled
   ```

2. **Environment variables** (đã có sẵn):
   - `S3_SOURCE_BUCKET`: Tên bucket
   - `AWS_REGION`: Region của bucket
   - `PRESIGNED_EXPIRE_SECONDS`: Thời gian hết hạn của presigned URL (default: 900s)

### Chi phí:
- Transfer Acceleration: ~$0.04/GB qua edge location
- Data transfer out: Standard S3 pricing
- Multipart upload: Miễn phí

## 🧪 Testing

### Test upload nhỏ (<10MB):
File sẽ upload 1 part duy nhất.

### Test upload lớn (>100MB):
File sẽ được chia thành nhiều parts, mỗi part 10MB.

### Verify Transfer Acceleration:
Check network tab trong browser DevTools:
- URL phải chứa `s3-accelerate.amazonaws.com`
- Request method phải là `PUT`
- Response headers phải có `ETag`

## 📝 Notes

1. **Backward compatible**: Code cũ (`initiateVideoUpload`, `uploadVideoToS3`) vẫn còn, có thể dùng nếu cần
2. **Error handling**: Nếu complete fail, system sẽ tự động abort để cleanup
3. **Sequential upload**: Hiện tại upload tuần tự từng part. Có thể optimize bằng parallel upload sau
4. **Part size**: 10MB là balance tốt giữa số lượng requests và performance. Có thể tăng lên 50-100MB cho video rất lớn

## 🚀 Future Improvements

1. **Parallel upload**: Upload nhiều parts đồng thời để nhanh hơn
2. **Progress tracking**: Thêm progress bar chi tiết cho từng part
3. **Resume capability**: Lưu trạng thái upload để có thể resume sau khi refresh
4. **Dynamic part size**: Tự động điều chỉnh part size dựa trên file size
5. **Retry logic**: Tự động retry part bị fail thay vì fail toàn bộ upload
