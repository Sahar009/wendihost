import { HiOutlinePhoto } from "react-icons/hi2";
import { RiVideoLine } from "react-icons/ri";
import { VscFilePdf } from "react-icons/vsc";
import { json2csv } from 'json-2-csv';
import { ICHATBOT_NODE, MESSAGE_BUTTON, MESSAGE_COMPONENT } from "./interfaces"
import { Contact } from "@prisma/client";
import generateUniqueId from 'generate-unique-id';
import { Edge, Node } from "reactflow";
import { CUSTOM_NODE } from "./enums";
import { ACCEPTED_FILES } from "./types";

interface IChild {
    id: string,
    message: string
}


export const parseWhatsappComponent = (component: MESSAGE_COMPONENT) => {

    switch (component.type) {
        case "HEADER":
            return <p className="mb-2">{parseWhatsappFormat(component)} </p>
        case "BODY":
            return <p>{parseWhatsappFormat(component)}</p>
        case "FOOTER":
            return <p className="mt-2 text-gray-100">{parseWhatsappFormat(component)} </p>
        default:
            return (<p>  </p>)
    }
}


export const parseWhatsappFormat = (component: MESSAGE_COMPONENT) => {
    switch (component.format) {
        case "TEXT":
            return (<p> {component.text} </p>)
        case "IMAGE":
            return (
                <p style={{ width: "100%", aspectRatio: "3/2", background: "rgb(209 213 219)"}} 
                    className="flex justify-center items-center w-full"> 
                    <HiOutlinePhoto size={50} />
                </p>
            )
        case "VIDEO":
            return (
                <p style={{ width: "100%", aspectRatio: "3/2", background: "rgb(209 213 219)"}} 
                    className="flex justify-center items-center w-full"> 
                    <RiVideoLine size={50} />
                </p>
            )
        case "VIDEO":
            return (
                <p style={{ width: "100%", aspectRatio: "3/2", background: "rgb(209 213 219)"}} 
                    className="flex justify-center items-center w-full"> 
                    <VscFilePdf size={50} />
                </p>
            )
        // case "DOCS":
        //     return (<p> {component.text} </p>)
        default:
            return (<p> {component.text}  </p>)
    }
}


export const parseWhatsappButton = (buttons: MESSAGE_BUTTON[]) => {

    return (
        <>
            { 
                buttons.map((button, index) => (
                    <div 
                        key={index} 
                        className={`
                                ${buttons.length === 1 ? "col-span-2" : (buttons.length % 2 === 1 && index + 1 === buttons.length) ? "col-span-2" : ""}
                                bg-white border-5 p-2 shadow-2xl rounded-md text-sm text-center
                            `}>
                        {button.text}       
                    </div>
                ))
            }
        </>
    )
}

export const getPage = (page: number, take: number = 10) => {
    return { take, skip: (page - 1) * take }
}

export const getPages = (count: number, take: number = 10) => {
    return Math.ceil(count / take)
}

export const contactMappingList = [
    {   value: "none", name: "None"},
    {   value: "firstName", name: "First Name"},
    {   value: "lastName", name: "Last Name"},
    {   value: "phone", name: "Phone"},
    {   value: "email", name: "Email"},
]


export   function downloadCsv(exportCSV: any, exportName: string){
    var dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(exportCSV);
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".csv");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

export async function parseToCsv(jsonArray: Contact[]){


    return (await json2csv(jsonArray))
    
}


export const generateRandomId = (base: string = "") => {
    const id = generateUniqueId({
        length: 20,
        useLetters: true
    });

    return `${base}-${id}`
}

export const validateTrigger = (trigger: string) => {
    if (!trigger.startsWith("/")) return "/" + trigger
    return trigger
}

export const generateChatbot = (nodes: Node[], edges: Edge[]) => {

    let chatbot: any = {}
    let parents: any = {}

    // Validate input parameters
    if (!nodes || !Array.isArray(nodes)) {
        console.error('Invalid nodes array provided to generateChatbot');
        return chatbot;
    }

    if (!edges || !Array.isArray(edges)) {
        console.error('Invalid edges array provided to generateChatbot');
        return chatbot;
    }

    nodes.map((node) => {
        try {
            const { type, data, id } = node

            // Ensure data exists and has required properties
            if (!data) {
                console.warn(`Node "${id}" has no data object`);
                return { ...node };
            }

            let message = data.message || ""

            const { link, fileType } = data

            console.log({data})
            console.log({fileType})

            const children = node?.data?.children?.map((child: string, index: number): IChild => {
                const workingNode = nodes.filter(node => node.id === child)[0]
                
                // Check if workingNode exists to prevent undefined errors
                if (!workingNode) {
                    console.warn(`Child node with id "${child}" not found for parent node "${id}"`);
                    return { id: child, message: "" };
                }
                
                if (type === CUSTOM_NODE.OPTION_MESSAGE_NODE) {
                    const childMessage = workingNode.data?.message || "";
                    message += `\n${index+1} ${childMessage}`;
                }
                
                return { 
                    id: workingNode.id, 
                    message: workingNode.data?.message || "" 
                };
            }) || []
            
            const chatbotNode : ICHATBOT_NODE = {
                nodeId: id,
                type: type as CUSTOM_NODE,
                next: null,
                children,
                message,
                link,
                fileType: String(fileType || "none").toLowerCase() as ACCEPTED_FILES,
                needResponse: data?.children?.length > 0 ? true : false
            } 

            console.log({chatbotNode})

            chatbot = {...chatbot, [id]: chatbotNode}

            return { ...node }
        } catch (error) {
            console.error(`Error processing node "${node?.id}":`, error);
            return { ...node };
        }
    })


    edges.map((edge) => {

        const { source, target } = edge

        const workingNode = nodes.filter(node => node.id === source)[0]

        const { parentNode, type, data, id } = workingNode

        const hasChildren = data?.children?.length > 0 ? true : false

        let message = data.message

        const {link, fileType } = data

        const chatbotNode : ICHATBOT_NODE = {
            nodeId: id,
            type: type as CUSTOM_NODE,
            next: target,
            children: [],
            message,
            link,
            fileType,
            needResponse: hasChildren
        } 

        if (parentNode) {

            let workingParent = parents[parentNode];

            const childrenCount = Number(!workingParent?.data?.childrenCount ? 0 : workingParent?.data?.childrenCount)  + 1

            if (!workingParent) {
                workingParent = nodes.filter(node => node.id === parentNode)[0]
                parents[parentNode] = workingParent
            }

            const children = chatbot?.[parentNode]?.children?.map?.((child: IChild) => {

                if (child.id === id) {
                    return {
                        type: workingNode.type as CUSTOM_NODE,
                        next: target,
                        nodeId: workingNode.id,
                        children: [],
                        message: workingNode.data.message,
                        needResponse: false
                    } 
                }
                return child
            })

    
            chatbot = {
                ...chatbot, 
                [parentNode]: { 
                    ...chatbot[parentNode],
                    children
                }
            }

            parents[parentNode] = {  
                ...parents[parentNode], 
                data: {
                    ...parents[parentNode].data, 
                    childrenCount 
                }
            }
        }

        chatbot = {...chatbot, [source]: chatbotNode}

    })

    return chatbot
}


export const isNumeric = (str: string) => {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(Number(str)) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}