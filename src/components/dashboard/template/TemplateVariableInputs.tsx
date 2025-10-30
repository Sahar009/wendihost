import Input from "@/components/auth/Input";
import { useEffect, useMemo } from "react";
import { TemplateParams } from "./TemplateVariables";
import { isNumeric } from "@/libs/utils";
import Select from "@/components/utils/Select";

export const templateRegex = /\{\{([1-9])\}\}/g

const COLUMNS = [
    {name: "None", value: undefined},
    {name: "First Name", value: "firstName"},
    {name: "Last Name", value: "lastName"},
    {name: "Phone Number", value: "phoneNumber"},
    {name: "Email", value: "email"},
]

export default function TemplateVariableInputs({title, text, params, showSelect, setParams}: {title: string, text: string, showSelect: boolean, params: TemplateParams[], setParams: (params: TemplateParams[]) => void}) {
    
    const variables = useMemo(() => text?.split(templateRegex)?.filter(text => text?.trim() !== "" && isNumeric(text?.trim())), [text])
    
    useEffect(() => {
        const defaultParams = variables.map(() => {
            return {type: "text" as const, text: "", column: undefined} as TemplateParams
        })
        setParams(defaultParams)
    }, [variables])


    if (variables.length === 0) return <></>


    return (
        <div>
            <h3 className="text-lg font-bold"> {title} </h3>
            {
                variables.map((_, index) => {
                    const realIndex = index 
                    return (
                        <div key={index}>
                            <div className="flex items-center gap-1">
                                <p>{"{{"}{index + 1}{"}}"}</p>

                                <div className="flex-grow w-full">

                                    <Input
                                        label='' 
                                        name='message' 
                                        id='message' 
                                        placeholder='Type your message here' 
                                        helperText={"Too short"} 
                                        value={params?.[realIndex]?.text}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            const newParams = [...params];
                                            newParams[realIndex] = {
                                                type: "text",
                                                text: e.target.value
                                            };
                                            setParams(newParams);
                                        }} 
                                        type="text" />

                                </div>

                            </div>

                            {
                                showSelect && (
                                    <>
                                        <p><strong>OR</strong> use column.</p>
                                        <div className="flex-grow w-full">
                                            <Select 
                                                id={`contact-tag-select-${index}`} 
                                                name="Select Contact Column" 
                                                lists={COLUMNS} 
                                                onChange={(value) => {
                                                    const newParams = [...params];
                                                    newParams[realIndex] = {
                                                        ...newParams[realIndex],
                                                        column: value
                                                    }
                                                    setParams(newParams);
                                                }}
                                            />
                                        </div>
                                    </>
                                )
                            }

                        </div>
                    )
                })
            }
        </div>
    )
}

