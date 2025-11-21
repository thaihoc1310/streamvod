import json
import boto3
from botocore.config import Config
import os

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


def sync_to_oss(video_id):
    """
    Sync video files from S3 to Alibaba OSS
    
    Args:
        video_id: Video identifier
        
    Returns:
        dict: Sync statistics
    """
    
    from botocore.client import Config
    
    # ======= OSS-compatible configuration =======
    oss_config = Config(
        signature_version='s3',  # Use S3 signature v2
        s3={
            'addressing_style': 'virtual',
            'payload_signing_enabled': False
        }
    )
    
    # Initialize OSS client (S3-compatible API)
    oss = boto3.client(
        's3',
        endpoint_url=f"https://{os.environ['OSS_ENDPOINT']}",
        aws_access_key_id=os.environ['OSS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['OSS_ACCESS_KEY_SECRET'],
        region_name='cn-hongkong',
        config=oss_config
    )
    
    # Initialize S3 client
    s3 = boto3.client('s3')
    
    synced_files = 0
    failed_files = 0
    total_bytes = 0
    
    try:
        # === Sync HLS files ===
        print(f"Syncing HLS files for video {video_id}")
        
        hls_response = s3.list_objects_v2(
            Bucket='streamvod-output',
            Prefix=f'hls/{video_id}/'
        )
        
        hls_files = hls_response.get('Contents', [])
        print(f"Found {len(hls_files)} HLS files to sync")
        
        for obj in hls_files:
            key = obj['Key']
            
            try:
                # Download from S3
                s3_obj = s3.get_object(Bucket='streamvod-output', Key=key)
                file_content = s3_obj['Body'].read()
                content_type = s3_obj.get('ContentType', 'application/octet-stream')
                
                # Upload to OSS
                oss.put_object(
                    Bucket='streamvod-output-oss',
                    Key=key,
                    Body=file_content,
                    ContentType=content_type
                )
                
                synced_files += 1
                total_bytes += len(file_content)
                print(f"✓ Synced: {key} ({len(file_content)} bytes)")
                
            except Exception as e:
                failed_files += 1
                print(f"✗ Failed to sync {key}: {str(e)}")
        
        # === Sync Thumbnail files ===
        print(f"Syncing thumbnails for video {video_id}")
        
        thumb_response = s3.list_objects_v2(
            Bucket='streamvod-output',
            Prefix=f'thumbs/{video_id}_'
        )
        
        thumb_files = thumb_response.get('Contents', [])
        print(f"Found {len(thumb_files)} thumbnail files to sync")
        
        for obj in thumb_files:
            key = obj['Key']
            
            try:
                # Download from S3
                s3_obj = s3.get_object(Bucket='streamvod-output', Key=key)
                file_content = s3_obj['Body'].read()
                
                # Upload to OSS
                oss.put_object(
                    Bucket='streamvod-output-oss',
                    Key=key,
                    Body=file_content,
                    ContentType='image/jpeg'
                )
                
                synced_files += 1
                total_bytes += len(file_content)
                print(f"✓ Synced: {key} ({len(file_content)} bytes)")
                
            except Exception as e:
                failed_files += 1
                print(f"✗ Failed to sync {key}: {str(e)}")
        
        # Summary
        print(f"=== Sync Summary for video {video_id} ===")
        print(f"Total synced: {synced_files} files")
        print(f"Total size: {total_bytes / (1024*1024):.2f} MB")
        print(f"Failed: {failed_files} files")
        
        return {
            'synced_files': synced_files,
            'failed_files': failed_files,
            'total_bytes': total_bytes,
            'success': failed_files == 0
        }
        
    except Exception as e:
        error_msg = f"Error syncing video {video_id}: {str(e)}"
        print(error_msg)
        return {
            'synced_files': synced_files,
            'failed_files': failed_files,
            'error': str(e),
            'success': False
        }
