import { DASHBOARD_ROUTES } from "@/libs/enums"
import { Contact, Conversation } from "@prisma/client"
import Image from "next/image"
import Link from "next/link"


interface IProps {
    connversation: Conversation;
    contact: Contact;
}

const ContactHead = (props: IProps) => {

    const conversation = props.connversation
    const contact = props.contact

    return (
        <Link href={`${DASHBOARD_ROUTES.CHATS}/${conversation?.phone}`}>

            <div className="flex bg-white rounded-2xl p-2 border-b-[1px] my-4" >

                <div>
                    <Image width={"80"} height={"80"} alt='USER' src={"/icons/user-profile.png"} />
                </div>

                <div className="w-full p-1 ml-2">
                    {
                        contact ? 
                            <p className="font-bold"> {contact?.firstName} {contact?.lastName} </p> 
                                : 
                            <p className="font-bold"> New User </p> 
                    }
                    <p>{conversation.phone}</p>
                    <div className="flex justify-end">
                        { !conversation.read && <p className="bg-green-600 text-white p-2 rounded-lg text-xs">New</p> }
                    </div>
                </div>

            </div>

        </Link>
    )
}

export default ContactHead