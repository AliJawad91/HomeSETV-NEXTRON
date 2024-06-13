import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import LiveStreamComponent from '../components/LiveStream';
import { useRouter } from 'next/router';

export default function HomePage() {
  const router = useRouter();
  const [tokens, setTokens] = useState(null);
  const [liveStreamInfo, setLiveStreamInfo] = useState(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const { tokens: tokensFromURL } = router.query;

    if (tokensFromURL) {
      const decodedTokens = JSON.parse(
        decodeURIComponent(tokensFromURL as any)
      );
      sessionStorage.setItem('youtube_tokens', JSON.stringify(decodedTokens));
      setTokens(decodedTokens);
      router.replace('/home'); // Clean the URL
    } else {
      const storedTokens = sessionStorage.getItem('youtube_tokens');
      if (storedTokens) {
        setTokens(JSON.parse(storedTokens));
      } else {
        const code = router.query.code;
        if (code) {
          fetch(`/api/auth?code=${code}`)
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
      <Head>
        <title>Live With YOUTUBE</title>
      </Head>
      <div className='grid grid-col-1 text-2xl w-full text-center'>
        <LiveStreamComponent />
      </div>
      <div className='mt-1 w-full flex-wrap flex justify-center'>
        <Link href='/auth'>Authenticate to Youtube</Link>
      </div>
      <div className='mt-1 w-full flex-wrap flex justify-center'>
        <button onClick={startLiveStream} disabled={!tokens}>
          Start Broadcasting
        </button>
      </div>
      <div className='mt-1 w-full flex-wrap flex justify-center'>
        {!isLive ? (
          <button onClick={goLive} disabled={!tokens}>
            Go Live!
          </button>
        ) : (
          <button onClick={endStream} disabled={!tokens}>
            End Stream
          </button>
        )}
      </div>
      <div>
        {liveStreamInfo && (
          <div>
            <p>Stream URL: {liveStreamInfo.ingestionInfo.ingestionAddress}</p>
            <p>Stream Key: {liveStreamInfo.ingestionInfo.streamName}</p>
          </div>
        )}
      </div>
    </React.Fragment>
  );
}
