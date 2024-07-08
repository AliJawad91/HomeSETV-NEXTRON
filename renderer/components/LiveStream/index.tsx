import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

function LiveStreamComponent() {
  const [osDetail, setOsDetail] = useState('');

  useEffect(() => {
    const electron = (window as any).electron;
    console.log(electron.platform(), "platform details");
    // setOsDetail(detail);
  }, []);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  let socket = io('ws://localhost:3100', {
    transports: ['websocket'],
  });
  const [stream, setStream] = useState<MediaStream>();

  const startStreaming = () => {
    if (iframeRef.current) {
      let liveStream = iframeRef.current.contentWindow?.document.getElementById(
        'videoElement'
      ) as HTMLVideoElement;

      let mediaRecorder = new MediaRecorder(
        liveStream!.srcObject! as MediaStream,
        {
          mimeType: 'video/webm;codecs=h264',
          videoBitsPerSecond: 3 * 1024 * 1024,
        }
      );

      console.log(mediaRecorder, mediaRecorder.ondataavailable);
      mediaRecorder.ondataavailable = (e: any) => {
        console.log('sending chunks', e.data);
        socket.send(e.data);
      };
      mediaRecorder.start(100);
    }
  };

  const getStream = async () => {
    if (stream) return; // Already have a stream

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
        frameRate: { ideal: 10, max: 15 },
        facingMode: 'user',
      },
    });

    setStream(mediaStream);
  };

  useEffect(() => {
    getStream();
  }, []);

  useEffect(() => {
    if (stream && iframeRef.current) {
      const videoElement = document.createElement('video');
      videoElement.srcObject = stream;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.id = 'videoElement';
      iframeRef.current.contentWindow?.document.body.appendChild(videoElement);
    }
  }, [stream]);

  return (
    <div className='App'>
      <header className='App-header'>
        <iframe
          ref={iframeRef}
          width={800}
          height={600}
          className='video-container'
          title='Live Stream'
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
