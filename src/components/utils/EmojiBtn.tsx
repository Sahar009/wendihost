import EmojiPicker from "emoji-picker-react"
import { useState } from "react";

const EmojiBtn = ({ onEmojiClick }: { onEmojiClick: (emoji: string) => void }) => {
    const [showPicker, setShowPicker] = useState(false);

    return (
        <div className="relative">
            <button 
                onClick={() => setShowPicker(!showPicker)}
                className="p-2 hover:bg-gray-100 rounded-full text-2xl">
                😊
            </button>

            {showPicker && (
                <div className="absolute bottom-12 right-0 z-50">
                    <EmojiPicker
                        width={300}
                        onEmojiClick={(e) => {
                            onEmojiClick(e.emoji);
                            setShowPicker(false);
                        }}
                    />
                </div>
            )}
        </div>
    )
}

export default EmojiBtn