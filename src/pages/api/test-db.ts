// src/pages/api/test-db.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/libs/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const hasDbUrl = !!process.env.DATABASE_URL
  const dbUrlPreview = process.env.DATABASE_URL
    ? `${process.env.DATABASE_URL.slice(0, 8)}...${process.env.DATABASE_URL.slice(-6)}`
    : null

  if (!hasDbUrl) {
    return res.status(500).json({
      success: false,
      hasDatabaseUrl: hasDbUrl,
      error: 'process.env.DATABASE_URL is undefined',
      envKeys: Object.keys(process.env).filter((key) => key.includes('DATABASE'))
    })
  }

  try {
    const workspaceCount = await prisma.workspace.count()
    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      dbUrlPreview,
      workspaceCount
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      hasDatabaseUrl: hasDbUrl,
      dbUrlPreview,
      error: error.message
    })
  }
}