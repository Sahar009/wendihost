import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if prisma is defined
    if (!prisma) {
      return res.status(500).json({ 
        error: 'Prisma client is undefined',
        prismaExists: false,
        models: []
      });
    }

    // Check available models
    const models = Object.keys(prisma).filter(key => 
      typeof (prisma as any)[key] === 'object' && 
      (prisma as any)[key].findMany
    );

    // Check specific models we need
    const hasAutomationSettings = !!(prisma as any).automationSettings;
    const hasResponseMaterial = !!(prisma as any).responseMaterial;
    const hasWorkspace = !!(prisma as any).workspace;

    // Try a simple query to test connection
    let connectionTest = null;
    try {
      const workspaceCount = await prisma.workspace.count();
      connectionTest = { success: true, workspaceCount };
    } catch (err: any) {
      connectionTest = { success: false, error: err.message };
    }

    return res.status(200).json({
      prismaExists: true,
      models,
      requiredModels: {
        automationSettings: hasAutomationSettings,
        responseMaterial: hasResponseMaterial,
        workspace: hasWorkspace
      },
      connectionTest,
      prismaVersion: require('@prisma/client/package.json').version
    });

  } catch (error: any) {
    return res.status(500).json({
      error: 'Debug check failed',
      details: error.message,
      stack: error.stack
    });
  }
}
