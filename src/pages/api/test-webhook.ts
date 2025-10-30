import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Webhook test endpoint is working!',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });
  }

  if (req.method === 'POST') {
    return res.status(200).json({
      message: 'POST test successful!',
      body: req.body,
      timestamp: new Date().toISOString()
    });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
