
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { getPage } from '@/libs/utils';
import { Prisma } from '@prisma/client';


export default withIronSessionApiRoute(
  async function getChats(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

      const { 
        workspaceId, 
        page, 
        filterBy, 
        sortedBy, 
        view, 
        source,
        campaignId,
        startDate,
        endDate
      } = req.query

      const { skip, take } = getPage(Number(page))

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

      const { user } = validatedInfo 
      
      let assigned = {}

      switch(view) {
        case "mine":
          if(user?.role)
            assigned = { memberId: user?.id }
          else assigned = { assigned: true, memberId: null }
          break
        case "unassigned":
          assigned = { assigned: false }
          break
      }

      // Build the where clause with all filters
      const where: any = {
        workspaceId: Number(workspaceId),
        status: filterBy,
        ...assigned
      };

      // Add source filter if provided
      if (source) {
        where.source = source;
      }

      // Add campaign filter if provided
      if (campaignId) {
        where.campaign = {
          some: {
            id: Number(campaignId)
          }
        };
      }

      // Add date range filter if provided
      if (startDate || endDate) {
        where.updatedAt = {};
        if (startDate) where.updatedAt.gte = new Date(startDate as string);
        if (endDate) where.updatedAt.lte = new Date(endDate as string);
      }

      // First get the conversations with basic includes
      const conversations = await prisma.conversation.findMany({
        where,
        include: {
          contact: true
        },
        skip, 
        take,
        orderBy: {
          updatedAt: sortedBy === "oldest" ? "asc" : "desc" 
        }
      });

      // If we need campaign details, fetch them separately
      const chats = await Promise.all(conversations.map(async (conversation) => {
        const include: any = { contact: true };
        
        if (campaignId) {
          include.campaign = true;
        }
        
        return prisma.conversation.findUnique({
          where: { id: conversation.id },
          include
        });
      }));

      const counts = await prisma.conversation.count({
        where: {
          workspaceId: Number(workspaceId)
        }
      })
        
      return res.send({ 
        status: 'success', 
        statusCode: 200,
        message: "fetch was successful",
        data: { chats, counts }, 
      });
        
    } catch (e) {
      return new ServerError(res,  500, "Internal server error")
    }

  },
  sessionCookie(),
);

