import React, { useState, useEffect } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import ChatBotMsg, { IMsgValue } from "./ChatBotMsg";

import NodeWrapper from "./NodeWrapper";
import { useDispatch } from "react-redux";
import { updateMessage } from "@/store/slices/chatbotBuilderSlice";
import LoadingButtonSM from "../utils/LoadingButtonSM";

type FileTypeValue = IMsgValue['fileType'];

interface ChatBotMsgNodeProps extends NodeProps {
  data: {
    fileType?: FileTypeValue;
    text?: string;
    link?: string | null;
    location?: {
      latitude: number;
      longitude: number;
      address: string;
      name?: string;
    } | null;
    cta?: {
      buttonText: string;
      url: string;
      style?: 'primary' | 'secondary' | 'outline';
    } | null;
    api?: {
      endpoint: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      headers?: Record<string, string>;
      body?: string;
      description?: string;
    } | null;
    condition?: {
      field: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
      value: string;
      description?: string;
    } | null;
    interactive?: {
      chatbotId: number;
      chatbotName: string;
      description?: string;
    } | null;
    template?: {
      templateId: string;
      templateName: string;
      category: string;
      language: string;
      status: string;
      description?: string;
    } | null;
    extraBlocks?: IMsgValue[]; 
  };
}

const ChatBotMsgNode: React.FC<ChatBotMsgNodeProps> = (props) => {
  const { id, data } = props;
  const dispatch = useDispatch();

  console.log('ChatBotMsgNode: Received data:', data);

  const [value, setValue] = useState<IMsgValue>({
    fileType: data.fileType || "image", // Default to image for upload nodes
    text: "", // No text for upload nodes
    link: data.link || null,
    location: data.location || null,
    cta: data.cta || null,
    api: data.api || null,
    condition: data.condition || null,
    interactive: data.interactive || null,
    template: data.template || null,
  });

  const [extraBlocks, setExtraBlocks] = useState<IMsgValue[]>(data.extraBlocks || []);

  useEffect(() => {
    console.log('ChatBotMsgNode: Value updated, dispatching to Redux:', value);
    dispatch(
      updateMessage({
        id,
        value: "", // No text for upload nodes
        fileType: value.fileType,
        link: value.link,
        type: value.fileType, 
        location: value.location,
        cta: value.cta,
        api: value.api,
        condition: value.condition,
        interactive: value.interactive,
        template: value.template,
        extraBlocks: extraBlocks, 
      })
    );
  }, [value, extraBlocks, id, dispatch]);

  const addBlock = () => {
    console.log('ChatBotMsgNode: Adding new block');
    setExtraBlocks(prev => {
      const newBlocks = [
        ...prev,
        {
          fileType: "image" as FileTypeValue, // Default to image for upload blocks
          text: "", // No text for upload blocks
          link: null,
          location: null,
          cta: null,
          api: null,
          condition: null,
          interactive: null,
          template: null,
        },
      ];
      console.log('ChatBotMsgNode: New extraBlocks state:', newBlocks);
      return newBlocks;
    });
  };

  const updateExtraAt = (index: number, next: IMsgValue) => {
    setExtraBlocks(prev => {
      const newBlocks = prev.map((b, i) => (i === index ? next : b));
      return newBlocks;
    });
  };

  const removeBlock = (index: number) => {
    setExtraBlocks(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <NodeWrapper
      id={id}
      header={<h4 className="text-gray-700 font-bold">File Upload Message</h4>}
    >
      <div className="p-1 text-xs flex flex-col gap-3">
        {/* Primary block (persisted) */}
        <div className="border border-gray-200 rounded-md p-2">
          <div className="space-y-2">
            <div className="text-xs text-gray-500 font-medium">Upload File</div>
            <ChatBotMsg 
              value={{
                ...value,
                text: "", // Force no text for upload nodes
              }} 
              setValue={(newValue) => setValue({
                ...newValue,
                text: "", // Ensure text is always empty
              })} 
            />
          </div>
        </div>
        {/* Extra blocks (local) */}
        {extraBlocks.map((blk, idx) => (
          <div key={idx} className="border border-gray-200 rounded-md p-2 relative">
            <div className="space-y-2">
              <div className="text-xs text-gray-500 font-medium">Upload File #{idx + 2}</div>
              <ChatBotMsg 
                value={{
                  ...blk,
                  text: "", // Force no text for upload blocks
                }} 
                setValue={(v) => updateExtraAt(idx, {
                  ...v,
                  text: "", // Ensure text is always empty
                })} 
              />
            </div>
            <button
              onClick={() => removeBlock(idx)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
              title="Remove block"
            >
              ×
            </button>
          </div>
        ))}
        <div className="pt-1">
          <LoadingButtonSM onClick={addBlock}>Add Upload Block</LoadingButtonSM>
          {extraBlocks.length > 0 && (
            <span className="ml-2 text-xs text-gray-500">
              {extraBlocks.length} extra upload block{extraBlocks.length !== 1 ? 's' : ''} saved
            </span>
          )}
        </div>
      </div>
      {/* Handles for React Flow */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </NodeWrapper>
  );
};

export default ChatBotMsgNode;