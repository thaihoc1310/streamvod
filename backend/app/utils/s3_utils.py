import boto3
import os

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_SOURCE_BUCKET = os.getenv("S3_SOURCE_BUCKET", "streamvod-bucket")
PRESIGNED_EXPIRE_SECONDS = int(os.getenv("PRESIGNED_EXPIRE_SECONDS", "900"))

def generate_presigned_post(key: str, content_type: str = "video/mp4") -> dict:
    """
    Legacy: Presigned POST (không hỗ trợ Transfer Acceleration)
    Giữ lại để backward compatible
    Max size: 5GB
    """
    s3_client = boto3.client("s3", region_name=AWS_REGION)

    conditions = [
        {"key": key},
        {"Content-Type": content_type},
        ["content-length-range", 1, 5368709120]  # Max 5GB
    ]

    return s3_client.generate_presigned_post(
        Bucket=S3_SOURCE_BUCKET,
        Key=key,
        Fields={"Content-Type": content_type},
        Conditions=conditions,
        ExpiresIn=PRESIGNED_EXPIRE_SECONDS,
    )

def initiate_multipart_upload(key: str, content_type: str = "video/mp4") -> dict:
    """
    Khởi tạo multipart upload session với Transfer Acceleration
    Max size: 5TB (S3 multipart upload limit)
    """
    s3_client = boto3.client(
        "s3",
        region_name=AWS_REGION,
        config=boto3.session.Config(s3={'use_accelerate_endpoint': True})
    )
    
    # Tạo multipart upload session
    response = s3_client.create_multipart_upload(
        Bucket=S3_SOURCE_BUCKET,
        Key=key,
        ContentType=content_type
    )
    
    return {
        'upload_id': response['UploadId'],
        'key': key
    }

def generate_multipart_presigned_urls(
    key: str, 
    upload_id: str, 
    num_parts: int
) -> list:
    """
    Generate presigned URLs cho từng part (hỗ trợ Transfer Acceleration)
    """
    s3_client = boto3.client(
        "s3",
        region_name=AWS_REGION,
        config=boto3.session.Config(s3={'use_accelerate_endpoint': True})
    )
    
    # Generate presigned URL cho mỗi part
    urls = []
    for part_number in range(1, num_parts + 1):
        presigned_url = s3_client.generate_presigned_url(
            'upload_part',
            Params={
                'Bucket': S3_SOURCE_BUCKET,
                'Key': key,
                'UploadId': upload_id,
                'PartNumber': part_number
            },
            ExpiresIn=PRESIGNED_EXPIRE_SECONDS
        )
        urls.append({
            'part_number': part_number,
            'url': presigned_url  # URL sẽ dùng s3-accelerate endpoint
        })
    
    return urls

def complete_multipart_upload(key: str, upload_id: str, parts: list) -> dict:
    """
    Hoàn thành multipart upload
    parts: list of {'PartNumber': int, 'ETag': str}
    """
    s3_client = boto3.client(
        "s3",
        region_name=AWS_REGION,
        config=boto3.session.Config(s3={'use_accelerate_endpoint': True})
    )
    
    response = s3_client.complete_multipart_upload(
        Bucket=S3_SOURCE_BUCKET,
        Key=key,
        UploadId=upload_id,
        MultipartUpload={'Parts': parts}
    )
    
    return {
        'location': response['Location'],
        'bucket': response['Bucket'],
        'key': response['Key'],
        'etag': response['ETag']
    }

def abort_multipart_upload(key: str, upload_id: str):
    """
    Hủy multipart upload (dọn dẹp khi upload fail)
    """
    s3_client = boto3.client(
        "s3",
        region_name=AWS_REGION,
        config=boto3.session.Config(s3={'use_accelerate_endpoint': True})
    )
    
    s3_client.abort_multipart_upload(
        Bucket=S3_SOURCE_BUCKET,
        Key=key,
        UploadId=upload_id
    )