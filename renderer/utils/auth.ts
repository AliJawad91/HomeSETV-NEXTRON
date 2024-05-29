import { google } from 'googleapis';

const OAuth2Client = new google.auth.OAuth2(
  process.env.NEXT_PUBLIC_CLIENT_ID,
  process.env.NEXT_PUBLIC_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_REDIRECT_URI
);

export const getAuthUrl = () => {
  const scopes = ['https://www.googleapis.com/auth/youtube'];

  return OAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
};

export const getTokens = async (code: string) => {
  const { tokens } = await OAuth2Client.getToken(code);
  return tokens;
};

export default OAuth2Client;
