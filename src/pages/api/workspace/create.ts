import { ApiResponse } from "@/libs/types";
import ServerError from "@/services/errors/serverError";
import { sessionCookie, validateUserApiNoWorkspace } from "@/services/session";
import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiRequest, NextApiResponse } from "next";
import { generateWorkspaceID } from "@/services/functions";
import prisma from "@/libs/prisma";

export default withIronSessionApiRoute(
    async function createApiKey(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

        try {

            const { name, description } = req.body

            const user = await validateUserApiNoWorkspace(req)

            if (!user) return new ServerError(res, 401, "Unauthorized")
            
            const workspace = await prisma.workspace.create({
                data: {
                    ownerId: user.id,
                    name: name,
                    description: description,
                    workspaceId: await generateWorkspaceID(),
                }    
            })

            return res.send({ 
                status: 'success', 
                statusCode: 201,
                message: "Workspace Created Successfully",
                data: workspace
            });
            
        } catch (e) {
            console.error('Workspace creation error:', e);
            if (e instanceof Error) {
                return new ServerError(res, 500, e.message);
            }
            return new ServerError(res, 500, 'Failed to create workspace');
        }

    },
    sessionCookie(),
);
