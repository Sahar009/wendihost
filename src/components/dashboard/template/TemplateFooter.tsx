import { useEffect } from "react"
import Input from "@/components/auth/Input"
import useInput from "@/hooks/useInput"
import { MESSAGE_COMPONENT } from "@/libs/interfaces"


interface IProps {
    setFooter: (header: MESSAGE_COMPONENT | undefined) => void;
}


const TemplateFooter = (props: IProps) => {

    const { setFooter } = props
    const footer = useInput("text")

    useEffect(() => {
        setFooter({ 
            type: "FOOTER", 
            format: "TEXT",
            text: footer.value as string,
        })
    }, [footer.value, setFooter])

    return (
        <div>

            <div className="flex">
                <h1 className="ml-2"> Footer <i className="text-gray-600">Optional</i> </h1>
            </div>

            <Input
                label='' name='message' id='message' placeholder='Type your message here' 
                helperText={footer.errorMessage} value={footer.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => footer.setValue(e.target.value)}
                error={footer.errorWarning}
                onFocus={() => footer.setOnFocus(true)} 
                type="text" />


        </div>
    )
}

export default TemplateFooter