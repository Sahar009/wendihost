import { useEffect, useState } from "react"
import ButtonSelector from "./ButtonSelector"
import { MESSAGE_BUTTON, MESSAGE_COMPONENT } from "@/libs/interfaces"

interface IProps {
    setButton: (button: MESSAGE_COMPONENT | undefined) => void;
}

const TemplateButton = (props: IProps) => {

    //const [index, setIndex] = useState(0)
    const [addButton, setAddButton] = useState(false)

    const [button1, setButton1] = useState<MESSAGE_BUTTON | undefined>()
    const [button2, setButton2] = useState<MESSAGE_BUTTON | undefined>()

    const [buttons, setButtons] = useState<MESSAGE_BUTTON[]>([])

    const { setButton } = props

    useEffect(() => {
        const buttons = []
        if (button1) buttons.push(button1)
        if (button2) buttons.push(button2)
        setButtons(buttons)
    }, [button1, button2])

    useEffect(() => {
        setButton({type: "BUTTONS", buttons})
    }, [buttons, setButton])

    return (
        <div>
            
            <div className="flex">

                <input type="checkbox" onChange={() => setAddButton(!addButton)} />

                <h1 className="ml-2"> Button </h1>

            </div>

            {   addButton &&
                    <>
                        {/* <div className="flex justify-center">

                            <Tabs tabs={["Call To Action", "Quick Reply"]} index={index} setIndex={setIndex} />

                        </div> */}

                        <ButtonSelector setButton={setButton1} />

                        <ButtonSelector setButton={setButton2} />
                    </>
            }
        
        </div>
    )
}

export default TemplateButton