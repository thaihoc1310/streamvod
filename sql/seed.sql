CREATE TABLE IF NOT EXISTS videos (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('uploading', 'processing', 'ready', 'failed') NOT NULL DEFAULT 'uploading',
    
    s3_source_key VARCHAR(1024),
    s3_dest_prefix VARCHAR(1024),
    hls_master_key VARCHAR(1024),
    playback_url VARCHAR(2048),
    thumbnail_url VARCHAR(2048),
    
    duration_seconds INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO videos (id, title, status, thumbnail_url, playback_url, duration_seconds) 
VALUES 
    ('d1a9a00e-1234-5678-9abc-def012345678', 'Sample Video 1', 'ready', 
     'https://app/sample1.jpg', 'https://cf.video.streamvod.site/hls/d1a9a00e/master.m3u8', 126),
    ('d1a9a00e-1234-5678-9abc-def012345679', 'Sample Video 2', 'processing', 
     'https://app/sample2.jpg', NULL, NULL),
    ('d1a9a00e-1234-5678-9abc-def012345680', 'Sample Video 3', 'ready', 
     'https://app/sample3.jpg', 'https://cf.video.streamvod.site/hls/d1a9a00f/master.m3u8', 89);
