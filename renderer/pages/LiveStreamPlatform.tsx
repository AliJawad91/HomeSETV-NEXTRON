import Image from 'next/image';
import React from 'react';
import FacebookSVG from '../public/assets/icons/SocialMediaIcons/Facebook.svg';
import YoutubeSVG from '../public/assets/icons/SocialMediaIcons/Youtube.svg';
import XSVG from '../public/assets/icons/SocialMediaIcons/X.svg';
import LinkdinSVG from '../public/assets/icons/SocialMediaIcons/LinkedIn.svg';
import AmazonSVG from '../public/assets/icons/SocialMediaIcons/Amazon.svg';
import TwitchSVG from '../public/assets/icons/SocialMediaIcons/twitch.svg';
import InstaSVG from '../public/assets/icons/SocialMediaIcons/Insta.svg';
import RTMPSVG from '../public/assets/icons/SocialMediaIcons/RTMP.svg';
import Link from 'next/link';

const LiveStreamPlatform = () => {
  return (
    <section className=' bg-gray-800 h-screen w-full '>
      <div className='w-full flex justify-center'>
        <h1 className=' text-white'>
          Choose a Streaming platform for your First Destination
        </h1>
      </div>

      <div className='w-full mt-16 flex gap-5 items-start justify-center  flex-wrap'>
        <div className='max-w-40 flex flex-col items-center'>
          <Image
            src={FacebookSVG}
            alt='Broadcast on Facebook'
            width={100}
            height={100}
          />
          <p className=' text-white text-center'>Broadcast on Facebook</p>
        </div>
        <Link href='/auth'>
          <div
            className='max-w-40 flex flex-col items-center cursor-pointer'
            onClick={() => {}}
          >
            <Image
              src={YoutubeSVG}
              alt='Broadcast on Youtube'
              width={100}
              height={100}
            />
            <p className=' text-white text-center'>Broadcast on Youtube</p>
          </div>
        </Link>
        <div className='max-w-40 flex flex-col items-center'>
          <Image src={XSVG} alt='Broadcast on X' width={100} height={100} />
          <p className=' text-white text-center'>Broadcast on X</p>
        </div>
        <div className='max-w-40 flex flex-col items-center'>
          <Image
            src={LinkdinSVG}
            alt='Broadcast on Linkdin'
            width={100}
            height={100}
          />
          <p className=' text-white text-center'>Broadcast on Linkdin</p>
        </div>
        <div className='max-w-40 flex flex-col items-center'>
          <Image
            src={AmazonSVG}
            alt='Broadcast on Amazon'
            width={100}
            height={100}
          />
          <p className=' text-white text-center'>Broadcast on Amazon</p>
        </div>
        <div className='max-w-40 flex flex-col items-center'>
          <Image
            src={TwitchSVG}
            alt='Broadcast on Twitch'
            width={100}
            height={100}
          />
          <p className=' text-white text-center'>Broadcast on Twitch</p>
        </div>
        <div className='max-w-40 flex flex-col items-center'>
          <Image
            src={InstaSVG}
            alt='Broadcast on Instagram'
            width={100}
            height={100}
          />
          <p className=' text-white text-center'>Broadcast on Instagram</p>
        </div>
        <div className='max-w-40 flex flex-col items-center'>
          <Image
            src={RTMPSVG}
            alt='Broadcast Using RTMP'
            width={100}
            height={100}
          />
          <p className=' text-white text-center'>Broadcast Using RTMP</p>
        </div>
      </div>
    </section>
  );
};

export default LiveStreamPlatform;
