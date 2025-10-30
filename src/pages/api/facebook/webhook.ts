
import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { handleMsgCallback } from '@/services/facebook';



export default async function webhooks(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    console.log("|**********************MSG**********************|")

    try {
        const query : any = req.query

        if (query['hub.mode'] === "subscribe") {
            return res.send(query['hub.challenge'])
        }

        const { entry } = req.body

        const results = await handleMsgCallback(entry)

        if (!results) throw new Error("Failed to handle message callback")

        return res.send({
            status: "success",
            statusCode: 200,
            message: "success",
            data: null
        })

    } catch (e) {
        return new ServerError(res,  500, "Internal server error")
    }

};

