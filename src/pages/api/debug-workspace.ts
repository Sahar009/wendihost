import type { NextApiRequest, NextApiResponse } from 'next';
import { validateUser } from '@/services/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await validateUser(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userData = user as any;
    
    res.status(200).json({
      user: {
        id: userData.id,
        email: userData.email,
        currentWorkspaceId: userData.currentWorkspaceId,
        workspaces: userData.workspaces || []
      }
    });
  } catch (error) {
    console.error('Debug workspace error:', error);
    res.status(500).json({ 
      error: 'Failed to get workspace info',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
