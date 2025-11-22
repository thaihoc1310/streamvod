import json
import boto3
import os
import urllib.parse


mediaconvert = boto3.client('mediaconvert', endpoint_url=os.environ['MEDIACONVERT_ENDPOINT'])


def lambda_handler(event, context):
    # Parse S3 event
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])
    
    filename = key.split('/')[-1]
    video_id = os.path.splitext(filename)[0]
    
    input_path = f"s3://{bucket}/{key}"
    output_path = f"s3://{os.environ['OUTPUT_BUCKET']}/"
    
    # ======= UPDATED: ABR với 3 quality levels =======
    job_settings = {
        "OutputGroups": [
            {
                "Name": "HLS Group",
                "OutputGroupSettings": {
                    "Type": "HLS_GROUP_SETTINGS",
                    "HlsGroupSettings": {
                        "SegmentLength": 4,  # Giảm từ 6s xuống 4s để ABR học nhanh hơn
                        "MinSegmentLength": 0,
                        "Destination": f"{output_path}hls/{video_id}/",
                        "ManifestDurationFormat": "INTEGER",
                        "SegmentControl": "SEGMENTED_FILES",
                        "DirectoryStructure": "SINGLE_DIRECTORY"
                    }
                },
                "Outputs": [
                    # ===== Output 1: 1080p (4 Mbps) =====
                    {
                        "ContainerSettings": {"Container": "M3U8"},
                        "VideoDescription": {
                            "Width": 1920,
                            "Height": 1080,
                            "CodecSettings": {
                                "Codec": "H_264",
                                "H264Settings": {
                                    "MaxBitrate": 4000000,  
                                    "RateControlMode": "QVBR",
                                    "QualityTuningLevel": "SINGLE_PASS_HQ",
                                    "SceneChangeDetect": "TRANSITION_DETECTION",
                                    "CodecProfile": "HIGH",
                                    "CodecLevel": "LEVEL_4_1",
                                    "GopSize": 2.0,
                                    "GopSizeUnits": "SECONDS"
                                }
                            }
                        },
                        "AudioDescriptions": [
                            {
                                "CodecSettings": {
                                    "Codec": "AAC",
                                    "AacSettings": {
                                        "Bitrate": 128000,  
                                        "CodingMode": "CODING_MODE_2_0",
                                        "SampleRate": 48000
                                    }
                                }
                            }
                        ],
                        "NameModifier": "_1080p"
                    },
                    # ===== Output 2: 720p (2.2 Mbps) =====
                    {
                        "ContainerSettings": {"Container": "M3U8"},
                        "VideoDescription": {
                            "Width": 1280,
                            "Height": 720,
                            "CodecSettings": {
                                "Codec": "H_264",
                                "H264Settings": {
                                    "MaxBitrate": 2200000,  
                                    "RateControlMode": "QVBR",
                                    "QualityTuningLevel": "SINGLE_PASS_HQ",
                                    "SceneChangeDetect": "TRANSITION_DETECTION",
                                    "CodecProfile": "HIGH",
                                    "CodecLevel": "LEVEL_4_0",
                                    "GopSize": 2.0,
                                    "GopSizeUnits": "SECONDS"
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
                        "NameModifier": "_720p"
                    },
                    # ===== Output 3: 360p (1.2 Mbps) =====
                    {
                        "ContainerSettings": {"Container": "M3U8"},
                        "VideoDescription": {
                            "Width": 640,
                            "Height": 360,
                            "CodecSettings": {
                                "Codec": "H_264",
                                "H264Settings": {
                                    "MaxBitrate": 1200000, 
                                    "RateControlMode": "QVBR",
                                    "QualityTuningLevel": "SINGLE_PASS_HQ",
                                    "SceneChangeDetect": "TRANSITION_DETECTION",
                                    "CodecProfile": "MAIN",
                                    "CodecLevel": "LEVEL_3_1",
                                    "GopSize": 2.0,
                                    "GopSizeUnits": "SECONDS"
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
                        "NameModifier": "_360p"
                    }
                ]
            },
            # ===== Thumbnail Output (unchanged) =====
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
    print(f"Output qualities: 1080p (4Mbps), 720p (2.2Mbps), 360p (1.2Mbps)")
    print(f"Segment length: 4 seconds (optimized for faster ABR)")
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'jobId': response['Job']['Id'],
            'video_id': video_id,
            'qualities': ['1080p', '720p', '360p'],
            'bitrates': ['4Mbps', '2.2Mbps', '1.2Mbps']
        })
    }
