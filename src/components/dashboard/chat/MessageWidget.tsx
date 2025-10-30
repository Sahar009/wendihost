import { Message } from "@prisma/client"
import TemplateViewer from "@/components/utils/TemplateViewer"
import dateFormat from "dateformat";
import { DUMMY_PHOTO } from "@/libs/constants";

interface IProps {
    message: Message
}

const MessageWidget = (props: IProps) => {

    const { message, type, fromCustomer, createdAt, fileType, link } = props.message

    //TODO: Remove this and use the link from the message
    const imageUrl = DUMMY_PHOTO

    const image = fileType == "image" && (
        <img src={imageUrl} alt="image" className="block w-full h-full object-cover rounded-lg mb-2" />
    )

    if (type === "action") {
        return (
            <div className={`flex justify-center text-sm`}>
                <div className={`bg-yellow-200 p-2 m-2 inline-block rounded-lg  max-w-[80%]`}>
                    <div>{image}</div>
                    <p>{message}</p>
                    <p className="text-right w-full text-xs mt-2">{dateFormat(createdAt, "mmmm dS, yyyy, hh:MM TT")}</p> 
                </div>
            </div>
        )
    }

    if (type === "template") {
        const component = JSON.parse(message)
        return (
            <div className={`flex  ${fromCustomer ? "" : "justify-end" } text-sm`}>
                <div className={`${fromCustomer ? "rounded-tl-none bg-slate-200" : "rounded-tr-none bg-green-200" } p-2 m-2 inline-block rounded-lg  max-w-[80%]`}>
                    <TemplateViewer components={component} date={createdAt} />
                </div>
            </div>
        )
    }

    return (
        <div className={`flex  ${fromCustomer ? "" : "justify-end" } text-sm`}>
            <div className={`${fromCustomer ? "rounded-tl-none bg-slate-200" : "rounded-tr-none bg-green-200" } p-2 m-2 inline-block rounded-lg  max-w-[80%]`}>
                <div>{image}</div>
                <p>{message}</p>
                <p className="text-right w-full text-xs mt-2">{dateFormat(createdAt, "mmmm dS, yyyy, hh:MM TT")}</p> 
            </div>
        </div>
    )
}

export default MessageWidget