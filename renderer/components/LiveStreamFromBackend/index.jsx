import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const LiveStreamFromBackend = () => {
  const [videoSrc, setVideoSrc] = useState('');
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const queue = useRef([]);

  useEffect(() => {
    socketRef.current = io('ws://localhost:3100', {
      transports: ['websocket'],
    });

    const mediaSourceSupported = 'MediaSource' in window && MediaSource.isTypeSupported('video/webm; codecs="vp8"');

    if (mediaSourceSupported) {
      const mediaSource = new MediaSource();
      setVideoSrc(URL.createObjectURL(mediaSource));
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
    };
  }, []);

  return (
    <div>
      <h1>Video Stream</h1>
      {error ? (
        <p>Error: {error}</p>
      ) : (
        <video id="videoElement" controls autoPlay ref={videoRef} src={videoSrc} />
      )}
    </div>
  );
};

export default LiveStreamFromBackend;
