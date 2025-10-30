import prisma from "@/libs/prisma"
import { Member, User, Workspace } from "@prisma/client"
import { IncomingMessage } from "http"

export const sessionCookie = (cookieName: string = "auth", age: number = 3600 * 24 * 7) => {

  const password : string = String(process.env.SESSION_PASSWORD)
  // console.log("SESSION_PASSWORD:", process.env.SESSION_PASSWORD);

  return ({
    cookieName,
    password,
    secure: true,// should be used in production (HTTPS) but can't be used in development (HTTP)
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      maxAge: age
    },
  })
}


export const createSession = async (user: User | Member, req: any, isUser = true) => {
  await req.session.destroy();
  req.session.user = { ...user, password: undefined, email_otp: undefined }
  req.session.isUser = isUser
  await req.session.save();
}

export const getUserFromSession = (req: any) =>  {
  return req.session.user 
}


export const validateUser = async (req: any) => {

  const session = req.session.user 

  if (!session) return ({redirect: '/auth/login'})

  try {

    if (req.session.isUser) {

      const user = await prisma.user.findUnique({
        where: {
          email: session.email
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          workspaces: true,
        }, 
      })

      return user
    
    } else {

      const member = await prisma.member.findFirst({
        where: {
          email: session.email,
          workspaceId: session.workspaceId 
        }
      })

      const workspaces = await prisma.workspace.findFirst({
        where: {
          id: session.workspaceId 
        }
      })

      return { ...member, firstName: member?.name, workspaces:[workspaces]}
    }

  } catch (e) {
    console.error(e)  
  }

  return ({redirect: '/auth/login'})

}


export const validateUserApi = async (req: any, workspaceId: number): Promise<{ user: User | any; workspace: Workspace } |  null> => {

  const session = req.session.user 

  if (!session) return null

  try {

    if (req.session.isUser) {

      const user = await prisma.user.findUnique({
        where: {
          email: session.email
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        }, 
      })

      if (!user) return null

      const workspace = await prisma.workspace.findUnique({
        where: {
          id: workspaceId,
          ownerId: user.id 
        }
      })

      if (!workspace) return null

      return { user, workspace }
    
    } else {

      const member = await prisma.member.findFirst({
        where: {
          email: session.email,
          workspaceId: workspaceId 
        }
      })

      if (!member) return null

      const workspace = await prisma.workspace.findUnique({
        where: {
          id: workspaceId,
        }
      })

      if (!workspace) return null
      


      return { user: member, workspace }
    }

  } catch (e) {
    console.error(e)  
  }

  return null

}

export const validateUserApiNoWorkspace = async (req: any) => {

  const session = req.session.user 

  if (!session) return false

  try {

    const user = await prisma.user.findUnique(
      {
        where: {
          email: session.email
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        }, 
      }
    )

    return user

  } catch (e) {
  
  }

  return false

}




export const sessionRedirects = (destination: string) => { 
  
  return (
    {
      redirect: {
        permanent: false,
        destination,
      }
    }
  )

}


export const getResellerInfo = async(req?: IncomingMessage) => { 

  const host = req?.headers.host

  const subdomain = String(host).split(".")?.[0]; 

  const restricted = ["www", "wendi", "app"]

  if (restricted.includes(subdomain)) {
    return JSON.stringify(null)
  }

  const reseller = await prisma.reseller.findUnique({
    where: {
      subdomain: subdomain,
    }
  })

  return JSON.stringify(reseller)

}

export const getResellerInfoApi = async(req?: IncomingMessage) => { 

  const host = req?.headers.host

  const subdomain = String(host).split(".")?.[0]; 

  const restricted = ["www", "wendi", "app"]

  if (restricted.includes(subdomain)) {
    return null
  }

  const reseller = await prisma.reseller.findUnique({
    where: {
      subdomain: subdomain,
    }
  })

  console.log("RESELLER")
  console.log(reseller)
  
  return reseller

}