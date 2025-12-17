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

// Helper function to serialize BigInt values in workspace data for JSON
const serializeWorkspace = (workspace: any) => {
  if (!workspace) return null;
  return {
    ...workspace,
    fbUserId: workspace.fbUserId ? String(workspace.fbUserId) : null
  };
};

// Helper function to serialize workspaces array
const serializeWorkspaces = (workspaces: any[]) => {
  if (!workspaces) return [];
  return workspaces.map(serializeWorkspace);
};

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

      if (!user) return ({redirect: '/auth/login'})

      // Serialize BigInt values in workspaces for JSON
      return {
        ...user,
        workspaces: serializeWorkspaces(user.workspaces || [])
      }
    
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

      return { 
        ...member, 
        firstName: member?.name, 
        workspaces: workspaces ? [serializeWorkspace(workspaces)] : []
      }
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

  if (!host) {
    return JSON.stringify(null)
  }

  // Check if it's a custom domain (not wendi.app)
  const isCustomDomain = !host.includes('wendi.app') && !host.includes('localhost') && !host.includes('127.0.0.1');
  
  let reseller = null;

  if (isCustomDomain) {
    // Look up by custom domain
    reseller = await prisma.reseller.findUnique({
      where: {
        domain: host,
      }
    })
  } else {
    // Look up by subdomain (e.g., devy.wendi.app -> devy)
    const hostParts = String(host).split(".");
    let subdomain = hostParts[0];
    
    // Handle cases like www.devy.wendi.app or devy.wendi.app
    // If we have more than 2 parts before the domain, take the first non-restricted one
    const restricted = ["www", "wendi", "app", "localhost", "127"]
    
    // If first part is restricted and we have more parts, try the next one
    if (restricted.includes(subdomain.toLowerCase()) && hostParts.length > 2) {
      subdomain = hostParts[1];
    }

    if (restricted.includes(subdomain.toLowerCase())) {
      console.log('Subdomain is restricted:', subdomain);
      return JSON.stringify(null)
    }

    console.log('Looking up subdomain:', subdomain, 'from host:', host);

    // Case-insensitive lookup - get all resellers and filter
    const allResellers = await prisma.reseller.findMany()
    
    console.log('Found resellers with subdomains:', allResellers.filter(r => r.subdomain).map(r => r.subdomain));
    
    reseller = allResellers.find(r => 
      r.subdomain && r.subdomain.toLowerCase() === subdomain.toLowerCase()
    ) || null

    if (!reseller) {
      console.log('No reseller found for subdomain:', subdomain);
    } else {
      console.log('Found reseller:', reseller.id, reseller.subdomain);
    }
  }

  return JSON.stringify(reseller)

}

export const getResellerInfoApi = async(req?: IncomingMessage) => { 

  const host = req?.headers.host

  if (!host) {
    return null
  }

  // Check if it's a custom domain (not wendi.app)
  const isCustomDomain = !host.includes('wendi.app') && !host.includes('localhost') && !host.includes('127.0.0.1');
  
  let reseller = null;

  if (isCustomDomain) {
    // Look up by custom domain
    reseller = await prisma.reseller.findUnique({
      where: {
        domain: host,
      }
    })
  } else {
    // Look up by subdomain (e.g., devy.wendi.app -> devy)
    const hostParts = String(host).split(".");
    let subdomain = hostParts[0];
    
    // Handle cases like www.devy.wendi.app or devy.wendi.app
    // If we have more than 2 parts before the domain, take the first non-restricted one
    const restricted = ["www", "wendi", "app", "localhost", "127"]
    
    // If first part is restricted and we have more parts, try the next one
    if (restricted.includes(subdomain.toLowerCase()) && hostParts.length > 2) {
      subdomain = hostParts[1];
    }

    if (restricted.includes(subdomain.toLowerCase())) {
      return null
    }

    // Case-insensitive lookup - get all resellers and filter
    const allResellers = await prisma.reseller.findMany()
    
    reseller = allResellers.find(r => 
      r.subdomain && r.subdomain.toLowerCase() === subdomain.toLowerCase()
    ) || null
  }

  console.log("RESELLER")
  console.log(reseller)
  
  return reseller

}