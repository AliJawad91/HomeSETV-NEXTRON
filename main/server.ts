import express, { Request, Response } from 'express';
import cors from 'cors';
import { Server } from 'socket.io';

import { execFile } from 'child_process';
import { youtubeSettings, inputSettings } from './helpers/ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

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
let videoStreamBuffer: Buffer[] = [];
app.listen(PORT, () => {
  console.log('Application started on port ', PORT);
});


  // const youtubeDestinationUrl = `${streamDetails.url}/${streamDetails.key}`;
  // const ffmpegArgs = inputSettings.concat(
  //   youtubeSettings(youtubeDestinationUrl)
  // );

  const ffmpegPath = path.resolve(ffmpegStatic);
  console.log('Resolved FFMPEG PATH:', ffmpegPath);

  // Check if the ffmpeg binary is accessible and executable
  fs.access(ffmpegPath, fs.constants.X_OK, (err) => {
    if (err) {
      console.error('FFmpeg binary is not accessible or not executable:', err);
      return;
    } else {
      console.log('FFmpeg binary is accessible and executable.');
      const startFFmpeg=(newBufferSize:any)=> {
        
        let currentBufferSize = newBufferSize ; // Initial buffer size in MB
        console.log("NEW APPLE",newBufferSize);

      const myARGS = [
        "-f", "dshow",
        "-rtbufsize", `${currentBufferSize}M`,
        "-i", "video=USB2.0 Camera", // Assuming your webcam device name
        "-i", "sunset.jpg",
        "-filter_complex",
        "[0:v]chromakey=color=0x42bba6:similarity=0.06:blend=0.02, scale=640:-1[intro]; [1:v][intro]overlay=x=0:y=-0",
        "-an", // Disable audio recording from input files (if needed)
        "-c:v", "libvpx",
        "-preset", "faster", // Prioritize speed over quality
        // "-deadline", "realtime", // Ensure timely processing
        "-b:v", "1048k", // Reduce bitrate for less processing
        "-r", "30", // Reduce framerate for less processing
        "-f", "webm",
        // "-report",
        "pipe:1",
        // "outputnew.mp4"
      ];
      const ffmpegProcess = execFile(
        ffmpegPath,
        myARGS,
      );
      ffmpegProcess.stdout.on('data', (data) => {
        console.log("TEST");
        
        // console.log(data.toString(),"stream output from ffmpeg");
        videoStreamBuffer.push(Buffer.from(data));
        // videoStreamBuffer.push(data);
      });
      let adjustBufferSize = (message:any)=> {
        let newBufferSize = 1024; // Default buffer size (in MB)
      
        if (message.includes("buffer underflow")) {
          newBufferSize *= 2; // Double the buffer size on underflow
          console.log("buffer underflow",newBufferSize);
          
        } else if (message.includes("buffer overflow") || message.includes("too full")) {
          newBufferSize = Math.floor(newBufferSize / 2); // Halve the buffer size on overflow
          console.log("buffer overflow",newBufferSize);
        }
      
        // Update the ffmpeg process with the new buffer size
        // (This requires additional modifications)
      
        console.log(`Adjusted buffer size to ${newBufferSize} MB`);
        startFFmpeg(newBufferSize);
      }
      ffmpegProcess.stderr.on('data', (data) => {
        const log = data.toString();
        // console.error(`ffmpeg stderr: ${log}`);
    
        console.log("buffer issue occurs", data);
        if (log.includes("buffer underflow") || log.includes("buffer overflow") || log.includes("too full or near too full")) {
          console.log("ABCD");
          
          adjustBufferSize(log);
        }
      });
      
      
      ffmpegProcess.on('error', (err) => {
        console.error('Failed to start FFmpeg process:', err);
      });

      ffmpegProcess.on('close', (code, signal) => {
        console.log(`FFmpeg process closed, code ${code}, signal ${signal}`);
        // startFFmpeg(5);
        
      });
    }
    startFFmpeg(4);
    }
  });

//   const WS_PORT: number = Number(process.env.WS_PORT) || 3100;

  
//   const io = new Server(WS_PORT, {
//     cors: {
//       origin: '*',
//     },
//   });
//   console.log(`WebSocket server started on port ${WS_PORT}`);
  

//   io.on('connection', (socket) => {
//   console.log(`Socket connected: ${socket.id}`);
//   // socket.emit('video',videoStreamBuffer)
// });
// const sendVideoStreamToClients = () => {
//   const videoStream = Buffer.concat(videoStreamBuffer);
//   io.emit('video', "videoStream");
//   console.log(videoStreamBuffer,"videoStreamBuffer");
//   videoStreamBuffer = [];
  
// };
// const getConnectedClients = () => {
//   console.log("io.sockets.sockets.size",io.sockets.sockets.size);
  
//   return io.sockets.sockets.size;
// };
//   setInterval(() => {
//     const connectedClients = getConnectedClients();
//     if (connectedClients > 0) {
//       sendVideoStreamToClients();
//     }
//   }, 1000 / 30);