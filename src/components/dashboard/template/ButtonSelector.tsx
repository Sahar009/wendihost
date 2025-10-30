import { useEffect, useState } from "react"
import Tabs from "../Tabs"
import Input from "@/components/auth/Input"
import useInput from "@/hooks/useInput"
import Textarea from "@/components/utils/Textarea"
import Select from "@/components/utils/Select"
import { BUTTON_TYPE } from "@/libs/constants"
import { MESSAGE_BUTTON } from "@/libs/interfaces"

interface IProps {
    setButton: (messageBtn: MESSAGE_BUTTON | undefined) => void
}

const ButtonSelector = (props: IProps) => {

    const { setButton } = props

    const [buttonType, setButtonType] = useState(BUTTON_TYPE[0].value)

    const text = useInput("text")
    const value = useInput("text")

    useEffect(() => {
        if (buttonType === "URL")
            setButton({
                type: buttonType,
                text: text.value as string,
                url: value.value as string,
            })
        else if (buttonType === "PHONE_NUMBER")
            setButton({
                type: buttonType,
                text: text.value as string,
                phone_number: value.value as string,
            })
        else setButton(undefined)

    }, [buttonType, text.value, value.value, setButton])



    return (
        <div className="py-5 border-b-[1px]">
            
            <Select name="button_type_1" id={"button_type_1"} label="Button Type" onChange={setButtonType} lists={BUTTON_TYPE} />

            <Input
                label='Button Text' 
                name='message' 
                id='message' 
                placeholder='Type the Button Text here' 
                helperText={text.errorMessage} 
                value={text.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => text.setValue(e.target.value)}
                error={text.errorWarning}
                onFocus={() => text.setOnFocus(true)}
                type="text"
            />

            <Input
                label='' 
                name='message' 
                id='message' 
                placeholder={`Type your ${buttonType.toLowerCase()} here`} 
                helperText={value.errorMessage} 
                value={value.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => value.setValue(e.target.value)}
                error={value.errorWarning}
                onFocus={() => value.setOnFocus(true)}
                type="text"
            />



        </div>
    )
}

export default ButtonSelector