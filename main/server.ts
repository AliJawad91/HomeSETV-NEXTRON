import express, { Request, Response } from 'express';
import cors from 'cors';

import { execFile } from 'child_process';
import { Server } from 'socket.io';
import { youtubeSettings, inputSettings } from './helpers/ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
const { spawn } = require("child_process");

const app = express();
let streamDetails = {
  url: '',
  key: '',
};

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(
  express.urlencoded({ limit: '200mb', extended: true, parameterLimit: 50000 })
);

app.get('/', (req: Request, res: Response) => {
  res.send('Application works!');
});

app.post('/api/update-stream-details', (req: Request, res: Response) => {
  const { url, key } = req.body;
  if (!url || !key) {
    res.status(400).json({ error: 'Stream URL and key are required' });
    return;
  }
  streamDetails = { url, key };
  res.status(200).json({ message: 'Stream details updated successfully' });
  console.log(streamDetails);
});

const PORT = process.env.PORT || 5100;
const WS_PORT: number = Number(process.env.WS_PORT) || 3100;
app.listen(PORT, () => {
  console.log('Application started on port ', PORT);
});
console.log(`WebSocket server started on port ${WS_PORT}`);

const io = new Server(WS_PORT, {
  cors: {
    origin: '*',
  },
});

let currentBufferSize = 1024; // Initial buffer size in MB

io.on("connection", (socket) => {
  let ffmpeg;

  const startFFmpeg = () => {
    ffmpeg = spawn("ffmpeg", [
        '-f','avfoundation',
        "-rtbufsize", `${currentBufferSize}M`,
        '-framerate', '30',     // Set the framerate
        // “-video_size”, “640x480", // Set the video size (optional)
        '-i', '0',              // Input device index for the webcam (usually 0 for the default webcam)
        // '-i', 'sunset.jpg',  // Replace with your actual background video path
        '-i', 'backgroundVideo.mp4',  // Replace with your actual background video path
        '-filter_complex',
        `[0:v]chromakey=color=0x82bc75:similarity=0.06:blend=0.02, scale=720:-1[intro]; [1:v][intro]overlay=x=0:y=0`,
        '-an',
        '-c:v', 'libvpx',
        '-preset', 'medium',  // Change preset to ultrafast for lower latency
        '-deadline', 'realtime',
        // '-tune', 'zerolatency',
        // '-fflags', 'nobuffer',
        '-b:v', '2048k',
        // 'scale','640',
        '-r','60',
        '-f', 'webm',
        'pipe:1',
      ]);
    ffmpeg.stdout.on("data", (data) => {
        console.log("data of",data);
      socket.emit("video", data);
    });

    ffmpeg.stderr.on("data", (data) => {
      const log = data.toString();
      console.error(`ffmpeg stderr: ${log}`);

      // Analyze the stderr log for buffer overflow or performance issues
      if (log.includes("buffer underflow") || log.includes("buffer overflow") || log.includes("too full or near too full")) {
        adjustBufferSize();
      }
    });

    ffmpeg.on("close", () => {
      console.log("FFmpeg process closed");
    });
  };

  const adjustBufferSize = () => {
    if (currentBufferSize < 4096) {
      currentBufferSize += 256; // Increase buffer size by 128MB
      console.log(`Increasing buffer size to ${currentBufferSize}M`);
      restartFFmpeg();
    }
  };

  const restartFFmpeg = () => {
    if (ffmpeg) {
      ffmpeg.kill("SIGTERM");
      startFFmpeg();
    }
  };

  socket.on("start-stream", () => {
    startFFmpeg();
  });

  socket.on("disconnect", () => {
    if (ffmpeg) {
      ffmpeg.kill("SIGTERM");
    }
  });
});