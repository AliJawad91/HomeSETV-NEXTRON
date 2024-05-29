import { NextApiRequest, NextApiResponse } from 'next';
import { getTokens } from '../../utils/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'No code provided' });
    return;
  }

  try {
    const tokens = await getTokens(code);
    res.status(200).json(tokens);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to get tokens', details: error.message });
  }
}
