// import express, { Request, Response } from 'express';
// import cors from 'cors';

// import { execFile } from 'child_process';
// import { Server } from 'socket.io';
// import { youtubeSettings, inputSettings } from './helpers/ffmpeg';
// import ffmpegStatic from 'ffmpeg-static';
// import path from 'path';
// import fs from 'fs';
// const { spawn } = require("child_process");

// const app = express();
// let streamDetails = {
//   url: '',
//   key: '',
// };

// app.use(cors());
// app.use(express.json({ limit: '200mb' }));

// app.use(
//   express.urlencoded({ limit: '200mb', extended: true, parameterLimit: 50000 })
// );
// app.use(express.static(path.join(__dirname+'/public')));

// app.get('/', (req: Request, res: Response) => {
//   res.send('Application works!');
// });

// app.post('/api/update-stream-details', (req: Request, res: Response) => {
//   const { url, key } = req.body;
//   if (!url || !key) {
//     res.status(400).json({ error: 'Stream URL and key are required' });
//     return;
//   }
//   streamDetails = { url, key };
//   res.status(200).json({ message: 'Stream details updated successfully' });
//   console.log(streamDetails);
// });

// const PORT = process.env.PORT || 5100;
// const WS_PORT: number = Number(process.env.WS_PORT) || 3100;
// app.listen(PORT, () => {
//   console.log('Application started on port ', PORT);
// });
// console.log(`WebSocket server started on port ${WS_PORT}`);

// const io = new Server(WS_PORT, {
//   cors: {
//     origin: '*',
//   },
// });

// let currentBufferSize = 10; // Initial buffer size in MB

//   let ffmpeg;

//   console.log(
//         path.join(__dirname+ '/public'),"PATHHH"  

//       );
//       const outputPath = path.join(__dirname, 'public', 'stream.m3u8');
//       if (!fs.existsSync(path.dirname(outputPath))) {
//         fs.mkdirSync(path.dirname(outputPath), { recursive: true });
//       }
//   const startFFmpeg = () => {
//     ffmpeg = spawn("ffmpeg", [
//       '-f', 'avfoundation',
//       '-rtbufsize', `5M`,
//       '-framerate', '30',
//       '-i', '0',
//       '-i', 'homepage.webp',
//       '-filter_complex',//1280:720
//       `[0]scale=720:480,chromakey=color=0x6cd696:similarity=0.1:blend=0.01[intro]; [1]scale=720:480[background]; [background][intro]overlay=x=0:y=0`,
//       '-an',
//       '-c:v', 'libx264',
//       '-preset', 'ultrafast',  // Use a faster preset
//       '-tune', 'zerolatency', // Tune for low latency
//       '-g', '15',             // Keyframe interval for HLS (should match framerate)

//       '-deadline', 'realtime',
//       '-b:v', '500k',
//       '-maxrate', '500K',
//       // // '-r', '30',
//       '-fflags', 'nobuffer',
//       '-flags', 'low_delay',
//       '-hls_flags', 'delete_segments+append_list',
//       '-f', 'hls', 
//       '-hls_time', '0.1', 
//       '-hls_list_size', '3', 
//       // outputPath
//       path.join(__dirname, 'public', 'stream.m3u8'),
     
//     ]);
  
//     ffmpeg.stderr.on("data", (data) => {
//       const log = data.toString();
//       console.error(`ffmpeg stderr: ${log}`);
  
//       if (log.includes("buffer underflow") || log.includes("buffer overflow") || log.includes("too full or near too full")) {
//         adjustBufferSize();
//       }
//       if (log.includes("Error") || log.includes("Failed")) {
//         console.error("FFmpeg encountered an error:", log);
//         restartFFmpeg();
//       }
//     });
  
//     ffmpeg.on("close", () => {
//       console.log("FFmpeg process closed");
//     });
//   };
  
//   startFFmpeg();
  
//   const adjustBufferSize = () => {
//     if (currentBufferSize < 4096) {
//       currentBufferSize += 256; // Increase buffer size by 128MB
//       console.log(`Increasing buffer size to ${currentBufferSize}M`);
//       restartFFmpeg();
//     }
//   };

//   const restartFFmpeg = () => {
//     if (ffmpeg) {
//       ffmpeg.kill("SIGTERM");
//       startFFmpeg();
//     }
//   };
// import NodeRtmpServer from '@mediafish/rtmp-server'

// const NodeRtmpServer = require('@mediafish/rtmp-server');
import path from 'path';
import { app, ipcMain } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';
import NodeMediaServer from 'node-media-server';

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

(async () => {
  await app.whenReady();

  const config = {
    rtmp: {
      port: 1935,
      chunk_size: 60000,
      gop_cache: true,
      ping: 60,
      allow_anonymous: true
    },
    http: {
      port: 80,
      allow_origin: '*'
    }
  };

  const nms = new NodeMediaServer(config);
  nms.run();

  nms.on('publish', (id, streamPath) => {
    console.log('[NodeMediaServer] publish app:', id, ' streamPath:', streamPath);
    // Handle stream publishing events
  });

  nms.on('play', (id, streamPath) => {
    console.log('[NodeMediaServer] play app:', id, ' streamPath:', streamPath);
    // Handle stream playback events
  });

  // ... other Node Media Server event handlers ...

  const mainWindow = createWindow('main', {
    width: 720,
    height: 510,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation:true,
      nodeIntegration:true,
    },
  });

  if (isProd) {
    await mainWindow.loadURL('app://./home');
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    // mainWindow.webContents.openDevTools();
  }
})();

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`);
});
