import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/router';
import LiveStreamFromBackend from '../components/LiveStreamFromBackend'
import VideoPlayer from '../components/VideoPlayer';
export default function HomePage() {
  const router = useRouter();
  const [tokens, setTokens] = useState(null);
  const [liveStreamInfo, setLiveStreamInfo] = useState(null);
  const [isLive, setIsLive] = useState(false);
  useEffect(() => {
    const { tokens: tokensFromURL, code } = router.query;

    if (tokensFromURL) {
      const decodedTokens = JSON.parse(
        decodeURIComponent(tokensFromURL as string)
      );
      sessionStorage.setItem('youtube_tokens', JSON.stringify(decodedTokens));
      setTokens(decodedTokens);
      router.replace('/home'); // Clean the URL
    } else {
      const storedTokens = sessionStorage.getItem('youtube_tokens');
      if (storedTokens) {
        setTokens(JSON.parse(storedTokens));
      } else if (code) {
        fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        })
          .then((response) => response.json())
          .then((data) => {
            sessionStorage.setItem('youtube_tokens', JSON.stringify(data));
            setTokens(data);
            router.replace('/home'); // Clean the URL
          })
          .catch((error) => {
            console.error('Error fetching tokens:', error);
          });
      }
    }
  }, [router.query]);

  const startLiveStream = async () => {
    if (tokens) {
      const response = await fetch('/api/start-live-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: tokens.access_token,
          expiry_date: tokens.expiry_date,
          refresh_token: tokens.refresh_token,
          scope: tokens.scope,
          token_type: tokens.token_type,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Stream Data', data);
        setLiveStreamInfo(data);
        await fetch('http://localhost:5100/api/update-stream-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: data.ingestionInfo.ingestionAddress,
            key: data.ingestionInfo.streamName,
            broadcastId: data.broadcastId,
            accessToken: tokens.access_token,
          }),
        });
      } else {
        console.error('Failed to start live stream:', data.error);
      }
    }
  };

  const goLive = async () => {
    if (liveStreamInfo) {
      const response = await fetch('/api/go-live', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: liveStreamInfo.ingestionInfo.ingestionAddress,
          key: liveStreamInfo.ingestionInfo.streamName,
          broadcastId: liveStreamInfo.broadcastId,
          streamId: liveStreamInfo.streamId,
          accessToken: tokens.access_token,
        }),
      });
      const data = await response.json();
      console.log('GO Live Data', data);
      if (response.ok) {
        setIsLive(true);
      }
    }
  };

  const endStream = async () => {
    if (liveStreamInfo) {
      const response = await fetch('/api/end-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          broadcastId: liveStreamInfo.broadcastId,
          accessToken: tokens.access_token,
        }),
      });
      const data = await response.json();
      console.log('End Stream Data', data);
      if (response.ok) {
        setIsLive(false);
      }
    }
  };

  return (
    <React.Fragment>

      {/* <LiveStreamFromBackend /> */}
   
      <VideoPlayer/>
    </React.Fragment>
  );
}
