import express, { Request, Response } from 'express';
import cors from 'cors';

import { spawn } from 'child_process';

import { Server } from 'socket.io';
import { youtubeSettings, inputSettings } from './helpers/ffmpeg';
import path from 'path';

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
const WS_PORT: number = Number(process.env.PORT) || 3100;
app.listen(PORT, () => {
  console.log('Application started on port ', PORT);
});
console.log(WS_PORT);

const io = new Server(WS_PORT, {
  /* options */
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log(`socket connected to ${socket.id}`);

  const socketQueryParams = socket.handshake.query;

  const youtubeDestinationUrl = `${streamDetails.url}/${streamDetails.key}`;
  const ffmpegInput = inputSettings.concat(
    youtubeSettings(youtubeDestinationUrl)
  );

  const ffmpegPath = path.join(__dirname, './ffmpeg/bin/ffmpeg.exe');
  const ffmpeg = spawn(ffmpegPath, ffmpegInput);
  // console.log('ffmpeg', ffmpeg);
  // If FFmpeg stops for any reason, close the WebSocket connection.
  ffmpeg.on('close', (code: any, signal: any) => {
    console.log(
      'FFmpeg child process closed, code ' + code + ', signal ' + signal
    );
    // ws.terminate()
  });

  // Handle STDIN pipe errors by logging to the console.
  // These errors most commonly occur when FFmpeg closes and there is still
  // data to write.  If left unhandled, the server will crash.
  ffmpeg.stdin.on('error', (e: any) => {
    console.log('FFmpeg STDIN Error', e);
  });

  // FFmpeg outputs all of its messages to STDERR.  Let's log them to the console.
  ffmpeg.stderr.on('data', (data: any) => {
    console.log('FFmpeg STDERR:', data.toString());
  });

  // When data comes in from the WebSocket, write it to FFmpeg's STDIN.
  socket.on('message', (msg) => {
    console.log('DATA Streaming');
    ffmpeg.stdin.write(msg);
  });

  // If the client disconnects, stop FFmpeg.
  socket.conn.on('close', (e) => {
    console.log('kill: SIGINT');
    ffmpeg.kill('SIGINT');
  });
});
