import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET_ACCESS;
const REFRESH_TOKEN_SECRET = process.env.JWT_SECRET_REFRESH;
console.log(REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET);

/* Refreshing token api call, 
GPT: create an api route for refreshing the access token using the refresh token*/
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const refreshToken = req.headers['x-refresh-token']; // Get refresh token from header

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const { userId, role } = decoded;

    const accessToken = jwt.sign(
      { userId, role },
      ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    res.status(200).json({ message: 'Token refreshed successfully', accessToken:accessToken });
  } catch (error) {
    console.error('Error in refresh token handler:', error);
    res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
}
