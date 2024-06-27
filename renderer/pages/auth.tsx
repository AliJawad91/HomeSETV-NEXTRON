import { useEffect } from 'react';
import { useRouter } from 'next/router';

const AuthPage = () => {
  const router = useRouter();

  useEffect(() => {
    const { code } = router.query;
    if (code) {
      const authYoutube = async () => {
        try {
          const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          });

          if (response.ok) {
            const tokens = await response.json();
            router.push(
              `/?tokens=${encodeURIComponent(JSON.stringify(tokens))}`
            );
          } else {
            console.error('Failed to fetch tokens:', await response.json());
          }
        } catch (error) {
          console.error('Error fetching tokens:', error);
        }
      };

      authYoutube();
    } else {
      const authUrl = `${process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL}?client_id=${process.env.NEXT_PUBLIC_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/youtube`;
      window.location.href = authUrl;
    }
  }, [router.query]);

  return null;
};

export default AuthPage;
