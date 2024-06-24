import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import VideoCam from '../components/VideoCam';
import { useRouter } from 'next/router';
import YoutubeLiveStream from '../components/YoutubeLiveStream';

export default function HomePage() {
  const router = useRouter();
  const [tokens, setTokens] = useState(null);

  useEffect(() => {
    const { tokens: tokensFromURL } = router.query;

    if (tokensFromURL) {
      const decodedTokens = JSON.parse(
        decodeURIComponent(tokensFromURL as any)
      );
      sessionStorage.setItem('youtube_tokens', JSON.stringify(decodedTokens));
      setTokens(decodedTokens);
      router.replace('/home');
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

  return (
    <React.Fragment>
      <Head>
        <title>Live With YOUTUBE</title>
      </Head>
      <div className='relative h-screen w-screen'>
        <VideoCam />

        <div className='absolute inset-0 flex flex-col justify-end items-center p-4 bg-transparent'>
          <YoutubeLiveStream tokens={tokens} />
        </div>
      </div>
    </React.Fragment>
  );
}
