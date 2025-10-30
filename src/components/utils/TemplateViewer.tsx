import { MESSAGE_BUTTON, MESSAGE_COMPONENT } from "@/libs/interfaces";
import { parseWhatsappButton, parseWhatsappComponent } from "@/libs/utils";
import dateFormat from "dateformat";

interface IProps {
    components: MESSAGE_COMPONENT[];
    date: Date;
}

const TemplateViewer = (props: IProps) => {

    const { components } = props

    return (
        <div>
            
            <p className="">
                    
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

                {/* <p className="text-right w-full text-xs mt-2">{dateFormat(date, "hh:MM TT")}</p> */}

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
    )
}

export default TemplateViewer