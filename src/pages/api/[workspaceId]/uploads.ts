import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import formidable from 'formidable';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
    api: {
        bodyParser: false,
        responseLimit: '50mb',
    },
};

export default withIronSessionApiRoute(
    async function uploads(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
        try {
            const { workspaceId } = req.query
    
            const validatedInfo = await validateUserApi(req, Number(workspaceId))
    
            if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")
    
            const { user } = validatedInfo 

            const form = formidable({ multiples: true });

            const formFiles = await new Promise((resolve, reject) => {
                form.parse(req, (err: any, fields: any, files: any) => {
                    if (err) reject(err);
                    resolve(files);
                });
            });

            if (!formFiles || Object.keys(formFiles).length === 0) {
                return new ServerError(res, 400, "No files were uploaded");
            }

            const filesArray = Object.values(formFiles).flat();

            const uploads = []

            for (const file of filesArray) {
                const fileName = file.originalFilename
                const fileSize = file.size
                const fileType = file.mimetype

                try {
                    // Upload to Cloudinary
                    const result = await cloudinary.uploader.upload(file.filepath, {
                        folder: `workspace-${workspaceId}`,
                        public_id: `${Date.now()}-${fileName}`,
                        resource_type: 'auto',
                    });

                    // Save file info to database
                    const upload = await prisma.upload.create({
                        data: {
                            workspaceId: Number(workspaceId),
                            filename: fileName,
                            url: result.secure_url, // Use Cloudinary secure URL
                            type: fileType,
                            size: fileSize
                        }
                    })

                    uploads.push(upload)
                } catch (uploadError) {
                    console.error('Cloudinary upload error:', uploadError);
                    throw new Error(`Failed to upload ${fileName} to Cloudinary`);
                }
            }

            return res.send({
                status: 'success',
                statusCode: 201,
                message: "Files uploaded successfully",
                data: uploads
            })

        } catch (e) {
            console.error(e)
            return new ServerError(res, 500, "Server Error")
        }
    },
    sessionCookie(),
);
