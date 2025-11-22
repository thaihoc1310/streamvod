import json
import boto3
from botocore.config import Config
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

SOURCE_BUCKET = os.environ.get("OUTPUT_BUCKET", "streamvod-output")
DEST_BUCKET = os.environ.get("OSS_OUTPUT_BUCKET", "streamvod-output-oss")
OSS_REGION = os.environ.get("OSS_REGION", "cn-hongkong")

def lambda_handler(event, context):
    """
    Sync S3 to OSS when MediaConvert job completes successfully
    Triggered by EventBridge on MediaConvert Job State Change
    """
    
    # Parse EventBridge event
    detail = event.get('detail', {})
    status = detail.get('status')
    job_id = detail.get('jobId')
    
    print(f"Received event for job {job_id} with status: {status}")
    
    # ONLY process COMPLETE jobs
    if status != 'COMPLETE':
        print(f"Job status is {status}, skipping sync")
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Skipped sync for status: {status}',
                'job_id': job_id
            })
        }
    
    # Get MediaConvert job details
    try:
        mediaconvert = boto3.client(
            'mediaconvert', 
            endpoint_url=os.environ['MEDIACONVERT_ENDPOINT']
        )
        job_response = mediaconvert.get_job(Id=job_id)
        job = job_response['Job']
    except Exception as e:
        print(f"Error getting MediaConvert job: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Failed to get job: {str(e)}'})
        }
    
    # Get video_id from UserMetadata
    video_id = job.get('UserMetadata', {}).get('video_id')
    
    if not video_id:
        print("No video_id in job UserMetadata, cannot sync")
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing video_id in job metadata'})
        }
    
    print(f"Starting sync for video: {video_id}")
    
    # Sync S3 to OSS
    sync_result = sync_to_oss(video_id)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'video_id': video_id,
            'job_id': job_id,
            'sync_result': sync_result
        })
    }

def list_all_objects(s3_client, bucket, prefix):
    """
    List ALL objects under a prefix, with pagination.
    Return: list of dict objects like in Contents.
    """
    objects = []
    continuation_token = None

    while True:
        params = {
            "Bucket": bucket,
            "Prefix": prefix,
        }
        if continuation_token:
            params["ContinuationToken"] = continuation_token

        resp = s3_client.list_objects_v2(**params)
        contents = resp.get("Contents", [])
        objects.extend(contents)

        if resp.get("IsTruncated"):
            continuation_token = resp.get("NextContinuationToken")
        else:
            break

    return objects


def sync_to_oss(video_id):
    """
    Sync video files from S3 to Alibaba OSS (S3-compatible).
    - Copy HLS: hls/{video_id}/...
    - Copy thumbnails: thumbs/{video_id}_...

    Use multi-thread to speed up.
    """

    # ======= Config OSS client (S3-compatible) =======
    oss_config = Config(
        signature_version="s3",
        s3={
            "addressing_style": "virtual",
            "payload_signing_enabled": False,
        },
    )

    # S3 client (AWS)
    s3 = boto3.client("s3")

    # OSS client (Alibaba, use S3 API)
    oss = boto3.client(
        "s3",
        endpoint_url=f"https://{os.environ['OSS_ENDPOINT']}",
        aws_access_key_id=os.environ["OSS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["OSS_ACCESS_KEY_SECRET"],
        region_name=OSS_REGION,
        config=oss_config,
    )

    synced_files = 0
    failed_files = 0
    total_bytes = 0

    try:
        # === 1) List HLS files ===
        hls_prefix = f"hls/{video_id}/"
        print(f"[HLS] Listing objects in s3://{SOURCE_BUCKET}/{hls_prefix}")

        hls_files = list_all_objects(s3, SOURCE_BUCKET, hls_prefix)
        print(f"[HLS] Found {len(hls_files)} objects to sync")

        # === 2) List thumbnail files ===
        thumbs_prefix = f"thumbs/{video_id}_"
        print(f"[THUMB] Listing objects in s3://{SOURCE_BUCKET}/{thumbs_prefix}")

        thumb_files = list_all_objects(s3, SOURCE_BUCKET, thumbs_prefix)
        print(f"[THUMB] Found {len(thumb_files)} objects to sync")

        # Merge all files to sync: (kind, key)
        all_files = [("hls", obj["Key"]) for obj in hls_files] + \
                    [("thumb", obj["Key"]) for obj in thumb_files]

        print(f"[SYNC] Total files to sync for video {video_id}: {len(all_files)}")

        if not all_files:
            print("[SYNC] No files to sync, returning")
            return {
                "synced_files": 0,
                "failed_files": 0,
                "total_bytes": 0,
                "success": True,
            }

        # === 3) Function to sync 1 single file ===
        def sync_one(kind, key):
            try:
                # Download from S3
                s3_obj = s3.get_object(Bucket=SOURCE_BUCKET, Key=key)
                body = s3_obj["Body"].read()

                if kind == "hls":
                    content_type = s3_obj.get("ContentType", "application/octet-stream")
                else:
                    # Thumbnail
                    content_type = "image/jpeg"

                # Upload to OSS
                oss.put_object(
                    Bucket=DEST_BUCKET,
                    Key=key,
                    Body=body,
                    ContentType=content_type,
                )

                size = len(body)
                print(f"✓ Synced: {key} ({size} bytes)")
                return True, size

            except Exception as e:
                print(f"✗ Failed to sync {key}: {e}")
                return False, 0

        # === 4) Run sync in parallel ===
        max_workers = int(os.environ.get("SYNC_MAX_WORKERS", "8"))
        print(f"[SYNC] Using ThreadPoolExecutor with max_workers={max_workers}")

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [
                executor.submit(sync_one, kind, key)
                for kind, key in all_files
            ]

            for fut in as_completed(futures):
                ok, size = fut.result()
                if ok:
                    synced_files += 1
                    total_bytes += size
                else:
                    failed_files += 1

        # === 5) Summary ===
        print(f"=== Sync Summary for video {video_id} ===")
        print(f"Total synced : {synced_files} files")
        print(f"Total size   : {total_bytes / (1024 * 1024):.2f} MB")
        print(f"Failed       : {failed_files} files")

        return {
            "synced_files": synced_files,
            "failed_files": failed_files,
            "total_bytes": total_bytes,
            "success": failed_files == 0,
        }

    except Exception as e:
        error_msg = f"Error syncing video {video_id}: {e}"
        print(error_msg)
        return {
            "synced_files": synced_files,
            "failed_files": failed_files,
            "total_bytes": total_bytes,
            "error": str(e),
            "success": False,
        }
