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

// io.on('connection', (socket) => {
//   console.log(`Socket connected: ${socket.id}`);

//   const youtubeDestinationUrl = `${streamDetails.url}/${streamDetails.key}`;
//   const ffmpegArgs = inputSettings.concat(
//     youtubeSettings(youtubeDestinationUrl)
//   );

//   const ffmpegPath = path.resolve(ffmpegStatic);
//   console.log('Resolved FFMPEG PATH:', ffmpegPath);

//   // Check if the ffmpeg binary is accessible and executable
//   fs.access(ffmpegPath, fs.constants.X_OK, (err) => {
//     if (err) {
//       console.error('FFmpeg binary is not accessible or not executable:', err);
//       return;
//     } else {
//       console.log('FFmpeg binary is accessible and executable.');

//       const ffmpegProcess = execFile(
//         ffmpegPath,
//         ffmpegArgs,
//         (error, stdout, stderr) => {
//           if (error) {
//             console.error('FFmpeg execFile error:', error);
//             return;
//           }
//           console.log('FFmpeg stdout:', stdout);
//           console.log('FFmpeg stderr:', stderr);
//         }
//       );

//       ffmpegProcess.on('error', (err) => {
//         console.error('Failed to start FFmpeg process:', err);
//       });

//       ffmpegProcess.on('close', (code, signal) => {
//         console.log(`FFmpeg process closed, code ${code}, signal ${signal}`);
//       });

//       socket.on('message', (msg) => {
//         console.log('DATA', 'Streaming');
//         ffmpegProcess.stdin.write(msg);
//       });

//       socket.conn.on('close', (e) => {
//         console.log('kill: SIGINT');
//         ffmpegProcess.kill('SIGINT');
//       });
//     }
//   });
// });
let currentBufferSize = 1024; // Initial buffer size in MB

io.on("connection", (socket) => {
  let ffmpeg;

  const startFFmpeg = () => {
    ffmpeg = spawn("ffmpeg", [
        "-f", "dshow",
        "-rtbufsize", `${currentBufferSize}M`,
        "-i", "video=MyWebCamera", // Assuming your webcam device name
        "-i", "sunset.jpg",
        "-filter_complex",
        "[0:v]chromakey=color=0x42bba6:similarity=0.06:blend=0.02, scale=640:-1[intro]; [1:v][intro]overlay=x=0:y=-0",
        "-an", // Disable audio recording from input files (if needed)
        "-c:v", "libvpx",
        "-preset", "faster", // Prioritize speed over quality
        "-deadline", "realtime", // Ensure timely processing
        "-b:v", "2048k", // Reduce bitrate for less processing
        "-r", "60", // Reduce framerate for less processing
        "-f", "webm",
        // "-report",
        "pipe:1",
      ]);
    //   -r 30 -g 90 -s 1280x720 -quality realtime -speed 5 -threads 8  -qmin 4 -qmax 48 -b:v 3000k
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