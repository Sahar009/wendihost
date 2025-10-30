import { ApiResponse, StatusCode } from "@/libs/types";
import { NextApiResponse } from "next";

export default class ServerError extends Error {

    constructor(res : NextApiResponse<ApiResponse>, statusCode: StatusCode, message: string) {
      super(message);
      
    //   this.statusCode = statusCode;
    //   this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    //   this.isOperational = true;

      res?.status(statusCode).send({status: "failed", statusCode, message, data: null})
  
      Error.captureStackTrace(this, this.constructor);
    }
}
  

  