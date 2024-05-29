import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

function LiveStreamComponent({greenByUserRef}) {
  const videoRef = useRef<HTMLVideoElement>();
  let socket = io('ws://localhost:3100', {
    transports: ['websocket'],
  });
  const [stream, setStream] = useState<MediaStream>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const settings = useRef({ height: 0, width: 0 });

  const startStreaming = () => {
    let liveStream = (videoRef.current as any).captureStream(30);

    let mediaRecorder = new MediaRecorder(liveStream!, {
      mimeType: 'video/webm;codecs=h264',
      videoBitsPerSecond: 3 * 1024 * 1024,
    });

    mediaRecorder.ondataavailable = (e: any) => {
      socket.send(e.data);
    };
    mediaRecorder.start(100);
  };

  const getStream = async () => {
    if (stream && videoRef.current) return;
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        // height: { min: 720, max: 1280 },
        // width: { min: 1080, max: 1920 },
        // frameRate: { min: 15, ideal: 24, max: 30 },
        // facingMode: 'user',
      },
    });
    const videoTrack = mediaStream.getVideoTracks()[0];
    if (videoTrack) {
      settings.current.width = videoTrack.getSettings().width;
      settings.current.height = videoTrack.getSettings().height;
    }
    if (webcamVideoRef.current) {
      webcamVideoRef.current.srcObject = mediaStream;
    }
    setStream(mediaStream);
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  };

  const processFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (settings.current.width > 0 && ctx) {
      canvas.width = settings.current.width;
      canvas.height = settings.current.height;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const pixels = imageData.data;

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        if (g > r && g > b && g > greenByUserRef.current) {
          imageData.data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      requestAnimationFrame(processFrame);
    }
  };

  useEffect(() => {
    getStream();
      processFrame();
  }, [videoRef]);

  return (
    <div className='App'>
      <header className='App-header'>
        <video
          width={800}
          height={600}
          className='video-container'
          ref={videoRef}
          autoPlay
          playsInline
          muted={true}
          style={{ display: 'none' }}
        />
        <canvas
          ref={canvasRef}
          height={100}
          width={100}
          className="canvas-bg"
        />
        <button
          className=' border-1 border-red-300 rounded bg-gray-50 text-gray-900 mt-10'
          onClick={startStreaming}
        >
          Start Streaming
        </button>
        <input
          onChange={(e) => {
            greenByUserRef.current = parseInt(e.target.value);
            console.log(greenByUserRef.current,"--",parseInt(e.target.value));
          }}
          type="range"
          min={0}
          max={255}
          className="h-4 appearance-none rounded-full w-64 bg-green-300"
          // value={greenByUserRef?.current}
        />
      </header>
    </div>
  );
}

export default LiveStreamComponent;
