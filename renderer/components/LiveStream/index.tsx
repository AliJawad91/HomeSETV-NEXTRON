import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

function LiveStreamComponent() {
  const videoRef = useRef<HTMLVideoElement>();
  let socket = io('ws://localhost:3100', {
    transports: ['websocket'],
  });
  const [stream, setStream] = useState<MediaStream>();

  const startStreaming = () => {
    let liveStream = (videoRef.current as any).captureStream(30);

    let mediaRecorder = new MediaRecorder(liveStream!, {
      mimeType: 'video/webm;codecs=h264',
      videoBitsPerSecond: 3 * 1024 * 1024,
    });

    console.log(mediaRecorder, mediaRecorder.ondataavailable);
    mediaRecorder.ondataavailable = (e: any) => {
      console.log('sending chunks', e.data, socket);
      socket.send(e.data);
    };
    mediaRecorder.start(100);
  };

  const getStream = async () => {
    if (stream && videoRef.current) return;
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        height: { min: 480, max: 1280 },
        width: { min: 640, max: 1920 },
        // height: { min: 720, max: 1280 },
        // width: { min: 1080, max: 1920 },
        frameRate: { min: 15, ideal: 24, max: 30 },
        facingMode: 'user',
      },
    });

    setStream(mediaStream);
    if (videoRef.current) {
      console.log(videoRef.current);
      videoRef.current.srcObject = mediaStream;
    }
  };

  useEffect(() => {
    getStream();
  }, [videoRef]);

  return (
    <div className='App'>
      <header className='App-header'>
        {/* <video
          width={800}
          height={600}
          className='video-container'
          ref={videoRef}
          autoPlay
          playsInline
          muted={true}
        /> */}
        <video
          autoPlay
          playsInline
          muted={true}
          controls
          className='video-container'
          src={'/sample.mp4'}
          style={{ width: '400px', height: '400px' }}
        />
        <button
          className=' border-1 border-red-300 rounded bg-gray-50 text-gray-900 mt-10'
          onClick={startStreaming}
        >
          Start Streaming
        </button>
      </header>
    </div>
  );
}

export default LiveStreamComponent;
