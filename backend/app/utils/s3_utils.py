import boto3
import os
import logging

# Setup logger
logger = logging.getLogger(__name__)

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
    logger.info(f"[Multipart] Initiating upload for key: {key}")
    logger.info(f"[Multipart] Bucket: {S3_SOURCE_BUCKET}, Region: {AWS_REGION}")
    logger.info(f"[Multipart] Content-Type: {content_type}")
    
    try:
        s3_client = boto3.client(
            "s3",
            region_name=AWS_REGION,
            config=boto3.session.Config(s3={'use_accelerate_endpoint': True})
        )
        
        logger.info(f"[Multipart] S3 client created with Transfer Acceleration enabled")
        
        # Tạo multipart upload session
        response = s3_client.create_multipart_upload(
            Bucket=S3_SOURCE_BUCKET,
            Key=key,
            ContentType=content_type
        )
        
        upload_id = response['UploadId']
        logger.info(f"[Multipart] Upload initiated successfully. UploadId: {upload_id}")
        
        return {
            'upload_id': upload_id,
            'key': key
        }
    except Exception as e:
        logger.error(f"[Multipart] Failed to initiate upload: {str(e)}", exc_info=True)
        raise

def generate_multipart_presigned_urls(
    key: str, 
    upload_id: str, 
    num_parts: int
) -> list:
    """
    Generate presigned URLs cho từng part (hỗ trợ Transfer Acceleration)
    """
    logger.info(f"[Multipart] Generating presigned URLs for {num_parts} parts")
    logger.info(f"[Multipart] Key: {key}, UploadId: {upload_id}")
    
    try:
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
            
            # Log first URL to verify endpoint
            if part_number == 1:
                logger.info(f"[Multipart] Sample URL (part 1): {presigned_url[:100]}...")
            
            urls.append({
                'part_number': part_number,
                'url': presigned_url  # URL sẽ dùng s3-accelerate endpoint
            })
        
        logger.info(f"[Multipart] Generated {len(urls)} presigned URLs successfully")
        return urls
        
    except Exception as e:
        logger.error(f"[Multipart] Failed to generate presigned URLs: {str(e)}", exc_info=True)
        raise

def complete_multipart_upload(key: str, upload_id: str, parts: list) -> dict:
    """
    Hoàn thành multipart upload
    parts: list of {'PartNumber': int, 'ETag': str}
    """
    logger.info(f"[Multipart] Completing upload")
    logger.info(f"[Multipart] Key: {key}, UploadId: {upload_id}")
    logger.info(f"[Multipart] Number of parts: {len(parts)}")
    
    try:
        s3_client = boto3.client(
            "s3",
            region_name=AWS_REGION,
            config=boto3.session.Config(s3={'use_accelerate_endpoint': True})
        )
        
        # Log first few parts for debugging
        if parts:
            logger.info(f"[Multipart] Sample parts: {parts[:3]}")
        
        response = s3_client.complete_multipart_upload(
            Bucket=S3_SOURCE_BUCKET,
            Key=key,
            UploadId=upload_id,
            MultipartUpload={'Parts': parts}
        )
        
        logger.info(f"[Multipart] Upload completed successfully")
        logger.info(f"[Multipart] Location: {response.get('Location')}")
        logger.info(f"[Multipart] ETag: {response.get('ETag')}")
        
        return {
            'location': response['Location'],
            'bucket': response['Bucket'],
            'key': response['Key'],
            'etag': response['ETag']
        }
        
    except Exception as e:
        logger.error(f"[Multipart] Failed to complete upload: {str(e)}", exc_info=True)
        raise

def abort_multipart_upload(key: str, upload_id: str):
    """
    Hủy multipart upload (dọn dẹp khi upload fail)
    """
    logger.warning(f"[Multipart] Aborting upload")
    logger.warning(f"[Multipart] Key: {key}, UploadId: {upload_id}")
    
    try:
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
        
        logger.info(f"[Multipart] Upload aborted successfully")
        
    except Exception as e:
        logger.error(f"[Multipart] Failed to abort upload: {str(e)}", exc_info=True)