import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
    useNodesState,
    useEdgesState,
    addEdge,
    Controls,
    ReactFlowProvider,
    Background,
    BackgroundVariant,
    Node,
    Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import StartNode from './StartNode';
import MessageNode from './MessageNode';
import OptionMessageNode from './OptionMessageNode';
import OptionNode from './OptionNode';
import { useDispatch, useSelector } from 'react-redux';
import { getEdges, getNodes, saveEdges, saveNodes } from '@/store/slices/chatbotBuilderSlice';
import Toolbar from './ToolBar';
import { CUSTOM_NODE } from '@/libs/enums';
import ChatWithAgentNode from './ChatWithAgentNode';
import ButtonMessageNode from './ButtonMessageNode';
import ButtonNode from './ButtonNode';
import ChatBotMsgNode from './ChatBotMsgNode';



const nodeTypes = {
    [CUSTOM_NODE.START_NODE]: StartNode,
    [CUSTOM_NODE.CHAT_WITH_AGENT]: ChatWithAgentNode,
    [CUSTOM_NODE.MESSAGE_REPLY_NODE]: MessageNode,
    [CUSTOM_NODE.OPTION_MESSAGE_NODE]: OptionMessageNode,
    [CUSTOM_NODE.OPTION_NODE]: OptionNode,
    [CUSTOM_NODE.BUTTON_MESSAGE_NODE]: ButtonMessageNode,
    [CUSTOM_NODE.BUTTON_NODE]: ButtonNode,
    [CUSTOM_NODE.CHAT_BOT_MSG_NODE]: ChatBotMsgNode
};

type ChatbotData = {
    id?: number;
    name?: string | null;
    trigger?: string | null;
    publish?: boolean | null;
    nodes?: string | null;
    edges?: string | null;
};

interface IProps {
    chatbot: ChatbotData | null;
    onRefresh?: () => void;
}

const Flow = (props: IProps) => {

    const { chatbot, onRefresh } = props

    const dispatch = useDispatch()
    const getNode = useSelector(getNodes)
    const getEdge = useSelector(getEdges)

    const [nodes, setNodes, onNodesChange] = useNodesState(getNode);
    const [edges, setEdges, onEdgesChange] = useEdgesState(getEdge);

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialLoad = useRef(true);

    const onConnect = useCallback((params: any) => {
        const { source } = params
        setEdges((eds) => {
            const newNodes = eds.filter(ed => ed.source != source)
            return addEdge(params, newNodes)
        })
    }, [setEdges]);

    useEffect(() => {
        if (isInitialLoad.current) {
            return; 
        }

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            if (nodes.length > 0) {
                dispatch(saveNodes(nodes));
            }
            if (edges.length >= 0) {
                dispatch(saveEdges(edges));
            }
        }, 300); 

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [dispatch, nodes, edges])

    // Load initial data from Redux or database
    useEffect(() => {
        if (getNode?.length > 0) {
            console.log('ChatbotBuilder: Loading nodes from Redux:', getNode);
            setNodes(getNode)
        } else if (chatbot?.nodes) {
            try {
                const parsedNodes = JSON.parse(chatbot.nodes as string) as Node[];
                console.log('ChatbotBuilder: Loading nodes from database:', parsedNodes);
                setNodes(parsedNodes);
                dispatch(saveNodes(parsedNodes));
            } catch (error) {
                console.error('Error parsing chatbot nodes:', error);
            }
        }
        
        // Mark initial load as complete after a delay
        setTimeout(() => {
            isInitialLoad.current = false;
        }, 500);
    }, [chatbot, dispatch, getNode, setNodes])

    useEffect(() => {
        if (getEdge?.length > 0) {
            setEdges(getEdge)
        } else if (chatbot?.edges) {
            try {
                const parsedEdges = JSON.parse(chatbot.edges as string) as Edge[];
                setEdges(parsedEdges);
                dispatch(saveEdges(parsedEdges));
            } catch (error) {
                console.error('Error parsing chatbot edges:', error);
            }
        }
    }, [chatbot, dispatch, getEdge, setEdges])


    return (
        <div className='h-[84vh]'>

            <Toolbar 
                edges={edges} 
                nodes={nodes} 
                botId={chatbot?.id as number} 
                trigger={chatbot?.trigger as string} 
                name={chatbot?.name as string} 
                publish={chatbot?.publish as boolean}
                onRefresh={onRefresh}
            />

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes as any}>

                <Controls />
                {/* <MiniMap /> */}
                <Background variant={BackgroundVariant.Cross} gap={50} />

            </ReactFlow>


        </div>
    );
}


export default React.memo(function ChatbotBuilder(props: IProps) {

    const { chatbot } = props

    return (
        <ReactFlowProvider>
            <Flow chatbot={chatbot} />
        </ReactFlowProvider>
    )
});
