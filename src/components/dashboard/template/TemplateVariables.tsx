import { useEffect, useState } from "react"
import TemplateVariableInputs from "./TemplateVariableInputs";

export interface ITemplateParameter {
    type: "header" | "body";
    parameters: TemplateParams[];

}
export interface TemplateParams {
    type: "text";
    text: string;
    column?: string;
}

interface TemplatePlaceholderProps {
    showSelect: boolean;
    text: {
        header: string;
        body: string;
    };
    setParams: ({headerParams, bodyParams} : { headerParams: TemplateParams[], bodyParams: TemplateParams[]}) => void;
}

export const templateRegex = /\{\{([1-9])\}\}/g

const TemplateVariables = ({ text, showSelect, setParams }: TemplatePlaceholderProps) => {

    const [headerParams, setHeaderParams] = useState<TemplateParams[]>([])
    const [bodyParams, setBodyParams] = useState<TemplateParams[]>([])


    useEffect(() => {
        setParams({
            headerParams: headerParams,
            bodyParams: bodyParams
        })
    }, [headerParams, bodyParams])

    return (
        <div>

            <TemplateVariableInputs showSelect={showSelect} title="Header Parameters" text={text.header} params={headerParams} setParams={setHeaderParams} />

            <TemplateVariableInputs showSelect={showSelect} title="Body Parameters" text={text.body} params={bodyParams} setParams={setBodyParams} />

        </div>
    )
}

export default TemplateVariables