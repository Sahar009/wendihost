import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

export default withIronSessionApiRoute(
  async function deleteWorkspace(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'DELETE') {
      return new ServerError(res, 405, 'Method not allowed');
    }

    try {
      const { workspaceId } = req.query;

      if (!workspaceId || typeof workspaceId !== 'string') {
        return new ServerError(res, 400, 'Workspace ID is required');
      }

      // Validate user and workspace access (must be owner)
      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) {
        return new ServerError(res, 401, 'Unauthorized');
      }

      const { workspace, user } = validatedInfo;

      // Verify user is the owner
      if (workspace.ownerId !== user.id) {
        return new ServerError(res, 403, 'Only workspace owner can delete the workspace');
      }

      // Delete all related data in the correct order to avoid foreign key constraints

      // 1. Delete Assistant Knowledge Chunks (via Assistant)
      await prisma.assistantKnowledgeChunk.deleteMany({
        where: {
          assistant: {
            workspaceId: workspace.id
          }
        }
      });

      // 2. Delete Assistants
      await prisma.assistant.deleteMany({
        where: { workspaceId: workspace.id }
      });

      // 3. Delete Response Materials
      await prisma.responseMaterial.deleteMany({
        where: { workspaceId: workspace.id }
      });

      // 4. Delete Automation Settings
      await prisma.automationSettings.deleteMany({
        where: { workspaceId: workspace.id }
      });

      // 5. Delete WhatsApp Link Clicks
      await prisma.whatsappLinkClick.deleteMany({
        where: { workspaceId: workspace.id }
      });

      // 6. Delete Meta Ads
      await prisma.metaAd.deleteMany({
        where: { workspaceId: workspace.id }
      });

      // 7. Delete Uploads
      await prisma.upload.deleteMany({
        where: { workspaceId: workspace.id }
      });

      // 8. Delete Campaigns (Sequences will be deleted automatically due to CASCADE)
      await prisma.campaign.deleteMany({
        where: { workspaceId: workspace.id }
      });

      // 9. Delete Tags
      await prisma.tag.deleteMany({
        where: { workspaceId: workspace.id }
      });

      // 10. Get all broadcast IDs for this workspace
      const broadcasts = await prisma.broadcast.findMany({
        where: { workspaceId: workspace.id },
        select: { id: true }
      });

      // 11. Delete Broadcast Jobs (via broadcast IDs)
      if (broadcasts.length > 0) {
        const broadcastIds = broadcasts.map(b => b.id);
        await prisma.broadcastJob.deleteMany({
          where: {
            broadcastId: {
              in: broadcastIds
            }
          }
        });
      }

      // 12. Delete Broadcasts
      await prisma.broadcast.deleteMany({
        where: { workspaceId: workspace.id }
      });

      // 13. Delete WhatsApp Links
      await prisma.whatsappLink.deleteMany({
        where: { workspaceId: workspace.id }
      });

      // 14. Delete Chatbots
      await prisma.chatbot.deleteMany({
        where: { workspaceId: workspace.id }
      });

      // 15. Delete Messages
      await prisma.message.deleteMany({
        where: { workspaceId: workspace.id }
      });

      // 16. Delete Conversations
      await prisma.conversation.deleteMany({
        where: { workspaceId: workspace.id }
      });

      // 17. Delete Contacts
      await prisma.contact.deleteMany({
        where: { workspaceId: workspace.id }
      });

      // 18. Delete Snippets
      await prisma.snippet.deleteMany({
        where: { workspaceId: workspace.id }
      });

      // 19. Delete Templates
      await prisma.template.deleteMany({
        where: { workspaceId: workspace.id }
      });

      // 20. Delete Members
      await prisma.member.deleteMany({
        where: { workspaceId: workspace.id }
      });

      // 21. Delete WhatsApp Widgets
      await prisma.whatsAppWidget.deleteMany({
        where: { workspaceId: workspace.id }
      });

      // 22. Finally, delete the workspace
      await prisma.workspace.delete({
        where: { id: workspace.id }
      });

      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Workspace and all related data deleted successfully',
        data: null
      });

    } catch (error: any) {
      console.error('Error deleting workspace:', error);
      
      // Handle specific Prisma errors
      if (error.code === 'P2003') {
        return new ServerError(res, 400, 'Cannot delete workspace: Related data still exists');
      }
      
      return new ServerError(res, 500, 'Failed to delete workspace');
    }
  },
  sessionCookie(),
);
