// src/pages/api/auth/firebase.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import  * as admin from '@/libs/firebase-admin';
import { createSession, sessionCookie } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';

const adminAuth: any = admin.adminAuth;

// Helper function to log errors consistently
const logError = (error: unknown, context: string) => {
  console.error(`[Firebase Auth] Error in ${context}:`, error);
  if (error instanceof Error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      ...(error as any).code && { code: (error as any).code },
      ...(error as any).details && { details: (error as any).details }
    });
  }
};

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(400).json({
      status: 'failed',
      statusCode: 400,
      message: 'Method not allowed',
      data: null
    });
  }

  try {
    console.log('[Firebase Auth] Request body:', req.body);
    
    const { token } = req.body;

    if (!token) {
      console.error('[Firebase Auth] No token provided');
      return res.status(400).json({ 
        status: 'failed',
        statusCode: 400,
        message: 'No authentication token provided',
        data: null
      });
    }

    // Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
      console.log('[Firebase Auth] Decoded token:', JSON.stringify(decodedToken, null, 2));
    } catch (tokenError) {
      logError(tokenError, 'token verification');
      return res.status(401).json({
        status: 'failed',
        statusCode: 401,
        message: 'Invalid or expired authentication token',
        data: null
      });
    }
    
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({
        status: 'failed',
        statusCode: 400,
        message: 'No email found in token',
        data: null
      });
    }

    // Check if user exists, create if not
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      try {
        // Create new user if doesn't exist
        user = await prisma.user.create({
          data: {
            email,
            firstName: name?.split(' ')[0] || 'User',
            lastName: name?.split(' ').slice(1).join(' ') || name ? '' : 'User',
            password: 'google-oauth2-password-placeholder', // Required field, will never be used
            emailVerified: true,
            tokenExpireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            emailToken: null,
            resetToken: null,
            reseller: false,
            resellerId: 0,
          },
        });
      } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ 
          status: 'failed',
          statusCode: 500,
          message: 'Failed to create user',
          data: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    }

    // Create session using your existing session service
    await createSession(user, req, true);

    // Return the same response structure as the regular login
    return res.status(200).json({ 
      status: 'success',
      statusCode: 200,
      message: 'Authentication successful redirecting...',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        workspaces: [] // Add empty workspaces array to match the regular login response
      }
    });

  } catch (error) {
    logError(error, 'authentication flow');
    return res.status(500).json({ 
      status: 'failed',
      statusCode: 500,
      message: 'Authentication failed due to an internal server error',
      data: process.env.NODE_ENV === 'development' ? {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      } : null
    });
  }
}

export default withIronSessionApiRoute(handler, sessionCookie());