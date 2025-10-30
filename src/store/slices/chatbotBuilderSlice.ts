import { buttonNodeProp } from '@/components/chatbot/ButtonMessageNode';
import { optionNodeProp } from '@/components/chatbot/OptionMessageNode';
import { CUSTOM_NODE } from '@/libs/enums';
import { IReduxState } from '@/libs/interfaces';
import { generateRandomId } from '@/libs/utils';
import { FileType } from '@prisma/client';
import { createSlice } from '@reduxjs/toolkit';
import { HYDRATE } from 'next-redux-wrapper';
import { Edge, Node } from 'reactflow';

interface IState {
  nodes: Node[],
  edges: Edge[]
}

const initialState : IState = {
  nodes: [],
  edges: []
};

export const chatbotBuilderSlice = createSlice({
  name: 'chatbotBuilder',
  initialState,
  reducers: {
    // Action to add chatbotBuilder
    saveNodes: (state, action) => {
      state.nodes = action.payload;
    },
    addNode: (state, action) => {
      const id = generateRandomId("node")
      const parentNode = action.payload.parentNode
      const newNode = [{ ...action.payload, id }]

      if (parentNode) {
        const nodes = state.nodes.map(node => {
          const children = node.data.children
          if (parentNode === node.id)  {
            return { 
              ...node, 
              data: { 
                children: [...children, id]
              }
            }
          }
          return node
        })
        state.nodes = [...nodes, ...newNode];
        return
      }

      if (action.payload.type === CUSTOM_NODE.BUTTON_MESSAGE_NODE) {
        newNode.push({ ...buttonNodeProp, id: generateRandomId("node"), parentNode: id, draggable: false })
        //newNode.push({ ...buttonNodeProp, id: generateRandomId("node"), parentNode: id, position: { y: 150 }, draggable: false })
        newNode[0].data = {
          ...newNode[0].data,
          children: [newNode[1].id]
        }
      } else if (action.payload.type === CUSTOM_NODE.OPTION_MESSAGE_NODE) {   
        newNode.push({ ...optionNodeProp, id: generateRandomId("node"), parentNode: id, draggable: false })
        newNode.push({ ...buttonNodeProp, id: generateRandomId("node"), parentNode: id, position: { y: 150 }, draggable: false })
        newNode[0].data = {
          ...newNode[0].data,
          children: [newNode[1].id, newNode[2].id]
        }
      } else if (action.payload.type === CUSTOM_NODE.OPTION_NODE) {
        // Option node doesn't need any children - it's a leaf node
        // Just ensure the data has the correct structure
        newNode[0].data = {
          ...newNode[0].data,
          children: newNode[0].data.children || []
        }
      } else if (action.payload.type === CUSTOM_NODE.BUTTON_NODE) {
        // Button node doesn't need any children - it's a leaf node
        // Just ensure the data has the correct structure
        newNode[0].data = {
          ...newNode[0].data,
          children: newNode[0].data.children || []
        }
      } else {
        // Default case for any other node types (MESSAGE_REPLY_NODE, CHAT_WITH_AGENT, etc.)
        // Just ensure the data has the correct structure
        newNode[0].data = {
          ...newNode[0].data,
          children: newNode[0].data.children || []
        }
      }
      state.nodes = [...state.nodes, ...newNode];
    },
    removeNode: (state, action) => {

      let removedNodes = action.payload
   
      state.nodes = state.nodes.filter(node => {
        if (!node.parentNode) return node.id != action.payload
        if (node.parentNode != action.payload) {
          return true
        }
        removedNodes += String(node.id) + ","
        return false
      })

      state.edges = state.edges.filter(edge => {
        if (removedNodes.includes(edge.source) || removedNodes.includes(edge.target)) return false
        return true
      })
    },
    removeChildrenNode: (state, action) => {
      const newNodes = state.nodes.filter(state => {
        if (state.parentNode === action.payload) return true
        return true
      })
      state.nodes = newNodes;
    },
    updateMessage: (state, action) => {
      console.log('Redux: updateMessage action received:', action.payload);

      const id = action.payload.id

      const nodes = state?.nodes?.map((node) => {
        if (node.id === id) {
          const updatedData = {
            ...node.data,
            message: action.payload.value,
            link: action.payload.link,
            type: action.payload.type,
            fileType: action.payload.fileType,
            location: action.payload.location,
            cta: action.payload.cta,
            api: action.payload.api,
            condition: action.payload.condition,
            interactive: action.payload.interactive,
            template: action.payload.template,
            extraBlocks: action.payload.extraBlocks, // Include extra blocks
          };
          console.log('Redux: Updating node data from:', node.data, 'to:', updatedData);
          node.data = updatedData;
        }
        return node;
      })

      state.nodes = nodes;
    },
    saveEdges: (state, action) => {
      state.edges = action.payload;
    },
    addEdge: (state, action) => {
      const id = generateRandomId("node")
      state.edges = [...state.edges, { ...action.payload, id }];
    },
    // Special reducer for hydrating the state
    // extraReducers: {
    //   [HYDRATE]: (state, action) => {
    //     return {
    //       ...state,
    //       ...action.payload.chatbotBuilders,
    //     };
    //   },
    // },
  },
});

export const { saveNodes, addNode, saveEdges, updateMessage, removeNode, removeChildrenNode } = chatbotBuilderSlice.actions;
export const getNodes = (state: any) => state.chatbotBuilder.nodes;
export const getEdges = (state: any) => state.chatbotBuilder.edges;

export default chatbotBuilderSlice.reducer;