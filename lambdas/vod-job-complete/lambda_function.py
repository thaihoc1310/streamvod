import json
import boto3
import os
import pymysql

mediaconvert = boto3.client('mediaconvert', endpoint_url=os.environ['MEDIACONVERT_ENDPOINT'])

def get_db_connection():
    return pymysql.connect(
        host=os.environ['DB_HOST'],
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASSWORD'],
        database=os.environ['DB_NAME'],
        port=int(os.environ.get('DB_PORT', 3306)),
        connect_timeout=5
    )

def lambda_handler(event, context):
    detail = event['detail']
    job_id = detail['jobId']
    status = detail['status']
    
    job_response = mediaconvert.get_job(Id=job_id)
    job = job_response['Job']
    
    video_id = job['UserMetadata'].get('video_id')
    
    if not video_id:
        print("No video_id in job metadata")
        return {'statusCode': 400, 'body': 'Missing video_id'}
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if status == 'COMPLETE':
            # Sử dụng CloudFront domain
            multicdn_domain = os.environ.get('MULTICDN_DOMAIN', 'cfvideo.th285.site')
            
            # Master playlist path
            hls_master_key = f"hls/{video_id}/{video_id}.m3u8"
            
            # Thumbnail path
            thumbnail_key = f"thumbs/{video_id}_.0000000.jpg"
            
            # Get duration
            duration_ms = job['OutputGroupDetails'][0]['OutputDetails'][0].get('DurationInMs', 0)
            duration_seconds = int(duration_ms / 1000)
            
            # Build CloudFront URLs (HTTPS)
            playback_url = f"https://{multicdn_domain}/{hls_master_key}"
            thumbnail_url = f"https://{multicdn_domain}/{thumbnail_key}"
            
            # Update database
            sql = """
                UPDATE videos 
                SET status = 'ready',
                    hls_master_key = %s,
                    playback_url = %s,
                    thumbnail_url = %s,
                    duration_seconds = %s,
                    s3_dest_prefix = %s,
                    updated_at = NOW()
                WHERE id = %s
            """
            cursor.execute(sql, (
                hls_master_key,
                playback_url,
                thumbnail_url,
                duration_seconds,
                f"hls/{video_id}/",
                video_id
            ))
            
            print(f"Video {video_id} marked as ready")
            print(f"Playback URL: {playback_url}")
            print(f"Thumbnail URL: {thumbnail_url}")
            
        elif status in ['ERROR', 'CANCELED']:
            sql = "UPDATE videos SET status = 'failed', updated_at = NOW() WHERE id = %s"
            cursor.execute(sql, (video_id,))
            print(f"Video {video_id} marked as failed")
        
        conn.commit()
        
    except Exception as e:
        print(f"Database error: {str(e)}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()
    
    return {
        'statusCode': 200,
        'body': json.dumps({'video_id': video_id, 'status': status})
    }
