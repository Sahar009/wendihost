
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';



export default withIronSessionApiRoute(
  async function createMany(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

      const { workspaceId } = req.query

      const { payload  } = req.body

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

      const { user } = validatedInfo 
      
      const contacts = payload.map((payload: any) => {
        return {...payload, workspaceId: Number(workspaceId)}
      })

      const contact = await prisma.contact.createMany({
        data: contacts,
      })
      
      return res.send({ 
        status: 'success', 
        statusCode: 201,
        message: "Contacts added Successfully",
        data: contact, 
      });
        
    } catch (e) {
      //console.log(e)
      return new ServerError(res,  400, "Bad Request")
    }

  },
  sessionCookie(),
);

