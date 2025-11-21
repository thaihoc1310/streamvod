import json
import boto3
import os
import urllib.parse

mediaconvert = boto3.client('mediaconvert', endpoint_url=os.environ['MEDIACONVERT_ENDPOINT'])

def lambda_handler(event, context):
    # Parse S3 event
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])
    
    # Extract video_id from key: uploads/<video_id>.mp4
    video_id = key.split('/')[-1].replace('.mp4', '')
    
    input_path = f"s3://{bucket}/{key}"
    output_path = f"s3://{os.environ['OUTPUT_BUCKET']}/"
    
    # MediaConvert job settings
    job_settings = {
        "OutputGroups": [
            {
                "Name": "HLS Group",
                "OutputGroupSettings": {
                    "Type": "HLS_GROUP_SETTINGS",
                    "HlsGroupSettings": {
                        "SegmentLength": 6,
                        "MinSegmentLength": 0,
                        "Destination": f"{output_path}hls/{video_id}/",
                        "ManifestDurationFormat": "INTEGER",
                        "SegmentControl": "SEGMENTED_FILES"
                    }
                },
                "Outputs": [
                    {
                        "ContainerSettings": {"Container": "M3U8"},
                        "VideoDescription": {
                            "CodecSettings": {
                                "Codec": "H_264",
                                "H264Settings": {
                                    "MaxBitrate": 5000000,
                                    "RateControlMode": "QVBR",
                                    "SceneChangeDetect": "TRANSITION_DETECTION"
                                }
                            }
                        },
                        "AudioDescriptions": [
                            {
                                "CodecSettings": {
                                    "Codec": "AAC",
                                    "AacSettings": {
                                        "Bitrate": 96000,
                                        "CodingMode": "CODING_MODE_2_0",
                                        "SampleRate": 48000
                                    }
                                }
                            }
                        ],
                        "NameModifier": "_hls"
                    }
                ]
            },
            {
                "Name": "Thumbnail Group",
                "OutputGroupSettings": {
                    "Type": "FILE_GROUP_SETTINGS",
                    "FileGroupSettings": {
                        "Destination": f"{output_path}thumbs/{video_id}_"
                    }
                },
                "Outputs": [
                    {
                        "ContainerSettings": {"Container": "RAW"},
                        "VideoDescription": {
                            "CodecSettings": {
                                "Codec": "FRAME_CAPTURE",
                                "FrameCaptureSettings": {
                                    "FramerateNumerator": 1,
                                    "FramerateDenominator": 1,
                                    "MaxCaptures": 1,
                                    "Quality": 80
                                }
                            }
                        }
                    }
                ]
            }
        ],
        "Inputs": [
            {
                "FileInput": input_path,
                "AudioSelectors": {
                    "Audio Selector 1": {"DefaultSelection": "DEFAULT"}
                },
                "VideoSelector": {}
            }
        ]
    }
    
    # Create MediaConvert job
    response = mediaconvert.create_job(
        Role=os.environ['MEDIACONVERT_ROLE_ARN'],
        Settings=job_settings,
        UserMetadata={
            'video_id': video_id
        }
    )
    
    print(f"MediaConvert job created: {response['Job']['Id']}")
    
    return {
        'statusCode': 200,
        'body': json.dumps({'jobId': response['Job']['Id']})
    }
