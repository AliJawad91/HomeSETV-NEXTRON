// go-live.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.NEXT_PUBLIC_CLIENT_ID,
  process.env.NEXT_PUBLIC_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_REDIRECT_URI
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { url, key, broadcastId, accessToken } = req.body;

    if (!url || !key || !broadcastId || !accessToken) {
      res.status(400).json({
        error: 'Stream URL, key, broadcastId, and accessToken are required',
      });
      return;
    }

    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    try {
      // Transition the broadcast to "testing" status
      let transitionResponse = await youtube.liveBroadcasts.transition({
        id: broadcastId,
        part: ['id', 'snippet', 'contentDetails', 'status'],
        broadcastStatus: 'testing',
      });

      console.log('Transition to testing response:', transitionResponse.data);

      // Wait for the broadcast lifeCycleStatus to become "testing"
      let broadcast = await youtube.liveBroadcasts.list({
        part: ['id', 'snippet', 'contentDetails', 'status'],
        id: broadcastId,
      });

      while (broadcast.data.items[0].status.lifeCycleStatus !== 'testing') {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        broadcast = await youtube.liveBroadcasts.list({
          part: ['id', 'snippet', 'contentDetails', 'status'],
          id: broadcastId,
        });
      }

      // Transition the broadcast to "live" status
      transitionResponse = await youtube.liveBroadcasts.transition({
        id: broadcastId,
        part: ['id', 'snippet', 'contentDetails', 'status'],
        broadcastStatus: 'live',
      });

      // console.log('Transition to live response:', transitionResponse.data);

      // Wait for the broadcast lifeCycleStatus to become "live"
      broadcast = await youtube.liveBroadcasts.list({
        part: ['id', 'snippet', 'contentDetails', 'status'],
        id: broadcastId,
      });

      while (broadcast.data.items[0].status.lifeCycleStatus !== 'live') {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        broadcast = await youtube.liveBroadcasts.list({
          part: ['id', 'snippet', 'contentDetails', 'status'],
          id: broadcastId,
        });
      }

      res
        .status(200)
        .json({ message: 'Broadcast transitioned to live successfully' });
    } catch (error) {
      console.error('Error transitioning to live:', error);
      res.status(500).json({
        error: 'Failed to transition broadcast to live',
        details: error.message,
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
