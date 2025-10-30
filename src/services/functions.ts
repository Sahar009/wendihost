import prisma from '@/libs/prisma';
import workspace from '@/pages/api/auth/workspace';
import bcryptjs  from 'bcryptjs';
import generateUniqueId from 'generate-unique-id';

export const hashPassword = async (password: string) => {
    return await bcryptjs.hash(password, 12)
}

export const comparePassword = async (password: string, passwordHash: string) => {
    return await bcryptjs.compare(password, passwordHash);
}

export const generateWorkspaceID = async (): Promise<string> => {
    const id = generateUniqueId({
        length: 10,
        useLetters: true
    });

    const workspaceId = await prisma.workspace.findFirst({
        where: {
            workspaceId: id
        }
    })

    if (workspaceId) return await generateWorkspaceID()

    return id
}



export const generateApiKey = async (): Promise<string> => {
    const id = generateUniqueId({
        length: 64,
        useLetters: true
    });
    return id
}


export const getContactTag = async (workspaceId: number) => {
    return await prisma.contact.findMany({
        distinct: ['tag'],
        where: {
            workspaceId: Number(workspaceId)
        },
        select: {
            tag: true
        }
    });
}