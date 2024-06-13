import express, { Request, Response } from 'express';
import cors from 'cors';

import { execFile } from 'child_process';
import { Server } from 'socket.io';
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

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  const youtubeDestinationUrl = `${streamDetails.url}/${streamDetails.key}`;
  const ffmpegArgs = inputSettings.concat(
    youtubeSettings(youtubeDestinationUrl)
  );

  const ffmpegPath = path.resolve(ffmpegStatic);
  console.log('Resolved FFMPEG PATH:', ffmpegPath);

  // Check if the ffmpeg binary is accessible and executable
  fs.access(ffmpegPath, fs.constants.X_OK, (err) => {
    if (err) {
      console.error('FFmpeg binary is not accessible or not executable:', err);
      return;
    } else {
      console.log('FFmpeg binary is accessible and executable.');

      const ffmpegProcess = execFile(
        ffmpegPath,
        ffmpegArgs,
        (error, stdout, stderr) => {
          if (error) {
            console.error('FFmpeg execFile error:', error);
            return;
          }
          console.log('FFmpeg stdout:', stdout);
          console.log('FFmpeg stderr:', stderr);
        }
      );

      ffmpegProcess.on('error', (err) => {
        console.error('Failed to start FFmpeg process:', err);
      });

      ffmpegProcess.on('close', (code, signal) => {
        console.log(`FFmpeg process closed, code ${code}, signal ${signal}`);
      });

      socket.on('message', (msg) => {
        console.log('DATA', 'Streaming');
        ffmpegProcess.stdin.write(msg);
      });

      socket.conn.on('close', (e) => {
        console.log('kill: SIGINT');
        ffmpegProcess.kill('SIGINT');
      });
    }
  });
});
