import { useMemo } from "react"
import Input from "@/components/auth/Input"


interface TemplatePlaceholderProps {
    text: string;
    params: string[];
    setParams: (text: string[]) => void;
}

export const templateRegex = /\{\{([1-9])\}\}/g

const TemplatePlaceholder = ({ text, params,  setParams }: TemplatePlaceholderProps) => {

    const variables = useMemo(() => text.split("{{}}"), [text])


    if (variables.length < 2) return <></>


    return (
        <div>

            <div>
                <h3 className="text-lg font-bold"> Samples for body content </h3>
                <p>
                    To help us review your message template, please add an example for each variable in your body text. 
                    Do not use real customer information. Cloud API hosted by Meta reviews templates and variable parameters to protect the security and integrity of our services.
                </p>
            </div>


            {
                variables.map((_, index) => {
                    if (index === 0) return
                    const realIndex = index - 1
                    return (
                        <div key={index} className="flex items-center gap-4">
                            <p>{"{{"}{index}{"}}"}</p>
                            <div className="flex-grow w-full">
                                <Input
                                    label='' name='message' id='message' placeholder='Type your message here' 
                                    helperText={"Too short"} value={params?.[realIndex]}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const newParams = [...params];
                                        newParams[realIndex] = e.target.value;
                                        setParams(newParams);
                                    }} type="text" />
                            </div>
                        </div>
                    )
                })
            }


        </div>
    )
}

export default TemplatePlaceholder