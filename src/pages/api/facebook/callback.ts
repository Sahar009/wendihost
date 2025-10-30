
import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { handleMsgCallback } from '@/services/facebook';



export default async function callback(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

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

