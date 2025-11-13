import boto3
import os

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_SOURCE_BUCKET = os.getenv("S3_SOURCE_BUCKET", "streamvod-bucket")
PRESIGNED_EXPIRE_SECONDS = int(os.getenv("PRESIGNED_EXPIRE_SECONDS", "900"))

def generate_presigned_post(key: str, content_type: str = "video/mp4") -> dict:
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