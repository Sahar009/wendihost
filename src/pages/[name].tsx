import prisma from '@/libs/prisma';
import { redirect } from 'next/dist/server/api-utils';
import { NextPageContext } from 'next/types'



export const getServerSideProps = async(context: NextPageContext) => {


    
    try {
        const link = await prisma.whatsappLink.update({
            where: {
                name: String(context.query.name)
            },
            data: {
                visitors: {
                    increment: 1
                }
            }
        })
            
        return { 
            redirect: {
                permanent: false,
                destination: `https://wa.me/${link.phoneNumber}?text=${encodeURIComponent(link.message)}`,
            },
            props: {link}, 
        }
    } catch (e) {
        //console.error(e)
    }

    return { props: {}, }

    
}


export default function WaRedirects() {

  return (<></>)

}
