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

            // Check if Cloudinary is configured
            if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
                !process.env.CLOUDINARY_API_KEY || 
                !process.env.CLOUDINARY_API_SECRET) {
                return new ServerError(res, 500, "Cloudinary is not configured. Please set Cloudinary environment variables.");
            } 

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
            const errors: string[] = []

            for (const file of filesArray) {
                const fileName = file.originalFilename || 'unknown'
                const fileSize = file.size
                const fileType = file.mimetype

                try {
                    console.log(`Uploading ${fileName} to Cloudinary...`);
                    
                    // Upload to Cloudinary
                    const result = await cloudinary.uploader.upload(file.filepath, {
                        folder: `workspace-${workspaceId}`,
                        public_id: `${Date.now()}-${fileName}`,
                        resource_type: 'auto',
                    });

                    console.log(`Successfully uploaded ${fileName} to Cloudinary`);

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
                } catch (uploadError: any) {
                    // Extract error information from nested error objects
                    // Cloudinary errors can be nested: uploadError.error.error
                    const actualError = uploadError.error?.error || uploadError.error || uploadError;
                    const errorCode = actualError.code || uploadError.code;
                    const errorSyscall = actualError.syscall || uploadError.syscall;
                    const errorMessage = actualError.message || uploadError.message || 'Unknown error';
                    const errorErrno = actualError.errno || uploadError.errno;
                    
                    console.error('Cloudinary upload error for', fileName, ':', {
                        code: errorCode,
                        syscall: errorSyscall,
                        message: errorMessage,
                        errno: errorErrno,
                        http_code: uploadError.http_code,
                        hasNestedError: !!uploadError.error?.error
                    });
                    
                    // Build user-friendly error message
                    let userErrorMessage = `Failed to upload ${fileName}`;
                    
                    // If it's a DNS error
                    if (errorCode === 'EAI_AGAIN' || errorSyscall === 'getaddrinfo' || errorCode === 'ENOTFOUND') {
                        userErrorMessage = `Cloudinary connection failed for ${fileName}. This is usually a network/DNS issue. Please check your internet connection and Cloudinary service status.`;
                        errors.push(userErrorMessage);
                        // Don't return immediately - continue to try other files
                        continue;
                    }
                    
                    // If it's a connection refused error
                    if (errorCode === 'ECONNREFUSED') {
                        userErrorMessage = `Cloudinary connection refused for ${fileName}. Please check your Cloudinary configuration and service status.`;
                        errors.push(userErrorMessage);
                        continue;
                    }
                    
                    // Other Cloudinary errors
                    if (uploadError.http_code) {
                        userErrorMessage = `Cloudinary API error for ${fileName}: ${errorMessage} (HTTP ${uploadError.http_code})`;
                    } else if (errorMessage && errorMessage !== 'Unknown error') {
                        userErrorMessage = `Failed to upload ${fileName}: ${errorMessage}`;
                    } else {
                        userErrorMessage = `Failed to upload ${fileName}. Please check your Cloudinary configuration and try again.`;
                    }
                    
                    errors.push(userErrorMessage);
                    console.error(userErrorMessage);
                }
            }

            // Check if any files were successfully uploaded
            if (uploads.length === 0) {
                const errorMsg = errors.length > 0 
                    ? `Failed to upload any files. Errors: ${errors.join('; ')}`
                    : "Failed to upload any files. Please check your Cloudinary configuration and try again.";
                return new ServerError(res, 500, errorMsg);
            }

            // Return success response
            const message = uploads.length === filesArray.length 
                ? "Files uploaded successfully" 
                : `Uploaded ${uploads.length} of ${filesArray.length} files successfully${errors.length > 0 ? `. Some files failed: ${errors.join('; ')}` : ''}`;
            
            res.status(201).json({
                status: 'success',
                statusCode: 201,
                message,
                data: uploads
            });

        } catch (e) {
            console.error(e)
            return new ServerError(res, 500, "Server Error")
        }
    },
    sessionCookie(),
);

