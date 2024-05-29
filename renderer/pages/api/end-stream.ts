// pages/api/end-stream.ts
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
    const { broadcastId, accessToken } = req.body;

    if (!broadcastId || !accessToken) {
      res
        .status(400)
        .json({ error: 'Broadcast ID and access token are required' });
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
      const transitionResponse = await youtube.liveBroadcasts.transition({
        id: broadcastId,
        part: ['id', 'snippet', 'contentDetails', 'status'],
        broadcastStatus: 'complete',
      });

      console.log('Transition to complete response:', transitionResponse.data);

      res
        .status(200)
        .json({ message: 'Broadcast transitioned to complete successfully' });
    } catch (error) {
      console.error('Error transitioning to complete:', error);
      res.status(500).json({
        error: 'Failed to transition broadcast to complete',
        details: error.message,
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
