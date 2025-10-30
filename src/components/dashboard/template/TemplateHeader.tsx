import { FormEvent, useEffect, useState } from "react"
import Tabs from "../Tabs"
import Input from "@/components/auth/Input"
import useInput from "@/hooks/useInput"
import Textarea from "@/components/utils/Textarea"
import { MESSAGE_COMPONENT } from "@/libs/interfaces"
import AddVariable from "./AddVariableBtn"


interface IProps {
    setHeader: (header: MESSAGE_COMPONENT | undefined) => void;
}


const TemplateHeader = (props: IProps) => {

    const [index, setIndex] = useState(0)

    const { setHeader } = props

    const text = useInput("text")

    useEffect(() => {

        switch(index) {
            case 0:
                setHeader({ 
                    type: "HEADER", 
                    format: "TEXT",
                    text: text.value as string,
                })
                break
            case 1:
                setHeader({ 
                    type: "HEADER", 
                    format: "IMAGE",
                    text: text.value as string,
                })
                break
            case 2:
                setHeader({ 
                    type: "HEADER", 
                    format: "VIDEO",
                    text: text.value as string,
                })
                break
            default:
                console.error("unknown tab")

        }

    }, [text.value, index, setHeader])

    return (
        <div>

            <div className="flex">

                <h1 className="ml-2"> Header  <i className="text-gray-600">Optional</i></h1>
                
            </div>

            <div className="pb-4 mb-4 border-b-2">
                        
                <div className="flex justify-start">

                    <Tabs tabs={["Text", "Image", "Video"]} index={index} setIndex={setIndex} />
                
                </div> 

                { index === 0 &&
                    <Input
                        label='' 
                        name='message' 
                        id='message' 
                        placeholder='Type your message here' 
                        helperText={text.errorMessage} 
                        value={text.value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => text.setValue(e.target.value)}
                        error={text.errorWarning}
                        onFocus={() => text.setOnFocus(true)}
                        type="text"
                    />
                }

                <div className="flex justify-end">

                    <AddVariable value={text.value as string} setValue={text.setValue} />

                </div>


            </div>


        </div>
    )
}

export default TemplateHeader