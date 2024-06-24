import Link from 'next/link';
import React, { useState } from 'react';
import { Button } from '../common/Button';
import Image from 'next/image';
import MonitorIcon from '../../public/assets/icons/MonitorIcon.svg';
import VideoTrimming from '../../public/assets/icons/VideoTrimming.svg';
import VideoCallICon from '../../public/assets/icons/videoCall.svg';

const YoutubeLiveStream = ({ tokens }: { tokens: any }) => {
  const [liveStreamInfo, setLiveStreamInfo] = useState(null);
  const [isLive, setIsLive] = useState(false);

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

  const openThePopUpWIndows = () => {
    window.open('/LiveStreamPlatform');
  };

  return (
    <div className='absolute w-full mx-4 top-0 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg border border-white border-opacity-30 rounded-lg p-4 justify-between flex'>
      <div>
        <Button onClick={openThePopUpWIndows}>Stream & Record</Button>
      </div>

      <div className='flex justify-center items-start'>
        <Button>
          <Image src={VideoCallICon} width={20} height={20} alt='Video Call' />
        </Button>
        <Button>
          <Image src={MonitorIcon} width={20} height={20} alt='Monitor Icon' />
        </Button>
        <Button>
          <Image src={VideoTrimming} width={20} height={20} alt='Trim Video' />
        </Button>
      </div>

      {/* <div className='mt-1 w-full flex-wrap flex justify-center'>
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
      </div> */}
    </div>
  );
};

export default YoutubeLiveStream;
