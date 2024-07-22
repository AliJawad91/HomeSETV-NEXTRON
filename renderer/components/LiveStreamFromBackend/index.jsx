import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const LiveStreamFromBackend = () => {
  const [videoSrc, setVideoSrc] = useState('');
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const mediaSourceRef = useRef(null);
  const sourceBufferRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('ws://localhost:3100', {
      transports: ['websocket'],
    });

    const mediaSourceSupported = 'MediaSource' in window && MediaSource.isTypeSupported('video/webm; codecs="vp8"');

    if (mediaSourceSupported) {
      mediaSourceRef.current = new MediaSource();
      setVideoSrc(URL.createObjectURL(mediaSourceRef.current));

      mediaSourceRef.current.addEventListener('sourceopen', () => {
        sourceBufferRef.current = mediaSourceRef.current.addSourceBuffer('video/webm; codecs="vp8"');
        sourceBufferRef.current.mode = 'sequence';

        socketRef.current.on('video', (data) => {
          if (sourceBufferRef.current.updating || mediaSourceRef.current.readyState !== 'open') {
            console.log('sourceBufferRef.current.updating || mediaSourceRef.current.readyState !== "open"');
            return;
          }
          try {
            sourceBufferRef.current.appendBuffer(new Uint8Array(data));
          } catch (e) {
            console.error('Error appending buffer', e);
          }
        });

        // socketRef.current.emit('start-stream');
      });
    } else {
      setError('MediaSource or codecs not supported');
    }

    return () => {
      if (mediaSourceRef.current) {
        mediaSourceRef.current.removeEventListener('sourceopen', () => {});
      }
      socketRef.current.disconnect();
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
