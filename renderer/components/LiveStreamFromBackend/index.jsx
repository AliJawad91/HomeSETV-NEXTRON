import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const LiveStreamFromBackend = () => {
  const [videoSrc, setVideoSrc] = useState('');
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    console.log("work 1");
    socketRef.current = io('ws://localhost:3100', {
    transports: ['websocket'],
  }); // Initialize socket connection

    const mediaSourceSupported = 'MediaSource' in window && MediaSource.isTypeSupported('video/webm; codecs="vp8"');

    if (mediaSourceSupported) {
      const mediaSource = new MediaSource();
    //   videoSrc = URL.createObjectURL(mediaSource);
        setVideoSrc(URL.createObjectURL(mediaSource));
      mediaSource.addEventListener('sourceopen', () => {
        const sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
        sourceBuffer.mode = 'sequence';

        socketRef.current.on('video', (data) => {
          console.log("Socket Responce from on VIDEO ");
          console.log(data,"datAA");
          if (sourceBuffer.updating || mediaSource.readyState !== 'open') {
            console.log("sourceBuffer not updating");
            
            return;
          }
          console.log("sourceBuffer is updating");
          sourceBuffer.appendBuffer(new Uint8Array(data));
        });

        socketRef.current.emit('start-stream'); // Request stream from backend
      });
    } else {
      setError('MediaSource or codecs not supported');
    }

    return () => { // Cleanup on component unmount
      if (mediaSource) {
        mediaSource.src = null;
        mediaSource.removeEventListener('sourceopen', () => {});
      }
      socketRef.current.disconnect(); // Close socket connection
    };
  }, []); // Empty dependency array for one-time initialization

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
