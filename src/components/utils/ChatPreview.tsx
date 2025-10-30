import { MESSAGE_BUTTON, MESSAGE_COMPONENT } from "@/libs/interfaces";
import { parseWhatsappComponent, parseWhatsappButton } from "@/libs/utils";
import dateFormat from "dateformat";


interface IProps {
    components: null | MESSAGE_COMPONENT[];
}

const ChatPreview = (props: IProps) => {

    const date = new Date()
    const { components } = props
    
    return (
        <div>
            <div className='h-[500px] w-[300px] bg-gray-100 p-5'>

                <div className="flex justify-center text-sm mb-8">
                    <p className="bg-slate-300 px-4 rounded-full">{dateFormat(date, "ddd, mmmm d")} </p>
                </div>

                <p className="w-full max-w-[90%] break-words bg-white  border-r-5 p-2 shadow-2xl rounded-md rounded-tl-none text-sm">
                    
                    {
                        components && (
                            <>
                                {
                                    components.map((component) => {
                                        return <> {parseWhatsappComponent(component)} </>
                                    })
                                }
                            </>
                        )
                    }

                    <p className="text-right w-full text-xs mt-2">{dateFormat(date, "hh:MM TT")}</p>

                </p>

                <div className="grid grid-cols-2 gap-1 w-full mt-2  max-w-[90%] break-words text-sm text-blue-500">

                    {
                        components && (
                            <>
                                {
                                    components.map((component) => {
                                        if (component.type === "BUTTONS")
                                            return <> {parseWhatsappButton(component.buttons as MESSAGE_BUTTON[])} </>
                                    })
                                }
                            </>
                        )
                    }

                </div>

            </div>
        </div>
    )
}

export default ChatPreview