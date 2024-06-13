import { getAuthUrl, getTokens } from '../utils/auth';
import { GetServerSideProps } from 'next';

const AuthPage = () => {
  // No need to render anything for this page
  return null;
};

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const { code } = query;

  if (code) {
    const tokens = await getTokens(code as string);

    // Pass the tokens to the client via the URL
    return {
      redirect: {
        destination: `/?tokens=${encodeURIComponent(JSON.stringify(tokens))}`,
        permanent: false,
      },
    };
  }

  const url = getAuthUrl();
  return {
    redirect: {
      destination: url,
      permanent: false,
    },
  };
};

export default AuthPage;
