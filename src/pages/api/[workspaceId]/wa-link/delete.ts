import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse } from '@/libs/types';
import prisma from '@/libs/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(400).json({
      status: 'failed',
      statusCode: 400,
      message: 'Method not allowed',
      data: null
    });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      status: 'failed',
      statusCode: 400,
      message: 'Missing link id',
      data: null
    });
  }

  try {
    await prisma.whatsappLink.delete({
      where: { id: Number(id) },
    });
    return res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'WhatsApp link deleted successfully',
      data: null
    });
  } catch (error) {
    return res.status(500).json({
      status: 'failed',
      statusCode: 500,
      message: 'Failed to delete WhatsApp link',
      data: null
    });
  }
} 