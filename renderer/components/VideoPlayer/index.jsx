import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

const VideoPlayer = () => {
    const [error, setError] = useState(null);
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const socketRef = useRef(null);
    const queue = useRef([]);
  
    useEffect(() => {
      socketRef.current = io('ws://localhost:3100', {
        transports: ['websocket'],
      });
  
      const mediaSourceSupported = 'MediaSource' in window && MediaSource.isTypeSupported('video/webm; codecs="vp8"');
  
      if (mediaSourceSupported) {
        const mediaSource = new MediaSource();
        mediaSource.addEventListener('sourceopen', () => {
          const sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
          sourceBuffer.mode = 'sequence';
  
          sourceBuffer.addEventListener('updateend', () => {
            if (queue.current.length > 0 && !sourceBuffer.updating) {
              sourceBuffer.appendBuffer(queue.current.shift());
            }
          });
  
          socketRef.current.on('video', (data) => {
            if (mediaSource.readyState === 'open') {
              if (sourceBuffer.updating || queue.current.length > 0) {
                queue.current.push(new Uint8Array(data));
              } else {
                sourceBuffer.appendBuffer(new Uint8Array(data));
              }
            }
          });
  
          socketRef.current.emit('start-stream');
        });
  
        mediaSource.addEventListener('error', (e) => {
          console.error('MediaSource error:', e);
          setError('MediaSource encountered an error');
        });
  
        playerRef.current = videojs(videoRef.current, {
          controls: true,
          autoplay: true,
          preload: 'auto',
          sources: [{
            src: URL.createObjectURL(mediaSource),
            type: 'video/webm'
          }]
        });
  
      } else {
        setError('MediaSource or codecs not supported');
      }
  
      return () => {
        if (mediaSource) {
          mediaSource.removeEventListener('sourceopen', () => {});
          mediaSource.removeEventListener('error', () => {});
        }
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
        if (playerRef.current) {
          playerRef.current.dispose();
        }
      };
    }, []);
  
    return (
      <div>
        {error ? (
          <p>Error: {error}</p>
        ) : (
          <div data-vjs-player>
            <video ref={videoRef} className="video-js vjs-default-skin" />
          </div>
        )}
      </div>
    );
  };
  
  export default VideoPlayer;
  