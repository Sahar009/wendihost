import useInput from "@/hooks/useInput"
import Input from "../auth/Input"
import EmojiBtn from "../utils/EmojiBtn"
import { useEffect, useState } from "react"
import Textarea from "../utils/Textarea"

interface TextInputProps {
    value: string
    setValue: (value: string) => void
}

const TextInput = ({ value, setValue }: TextInputProps) => {
    const textInput = useInput("text", 1, value)

    const handleTextChange = (newValue: string) => {
        const stringValue = typeof newValue === 'string' ? newValue : String(newValue || '');
        textInput.setValue(stringValue);
    };

    useEffect(() => {
        const stringValue = typeof textInput.value === 'string' ? textInput.value : String(textInput.value || '');
        setValue(stringValue);
    }, [textInput.value, setValue])

    return (
        <div className="relative w-full">
            <Textarea 
                value={typeof textInput.value === 'string' ? textInput.value : String(textInput.value || '')}
                onChange={handleTextChange}
                id="text-input"
                name="text-input"
                placeholder="Type a message"
            />
            <div className="absolute top-0 right-0">
                <EmojiBtn onEmojiClick={(emoji) => {
                    const currentValue = typeof textInput.value === 'string' ? textInput.value : String(textInput.value || '');
                    textInput.setValue(currentValue + emoji);
                }} />
            </div>
        </div>
    )
}

export default TextInput