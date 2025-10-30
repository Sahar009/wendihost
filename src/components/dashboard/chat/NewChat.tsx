import LoadingButton from "@/components/utils/LoadingButton";
import ModalWrapper from "@/components/utils/ModalWrapper";
import { useRouter } from "next/router";
import { useState } from "react";
import PhoneNumber from "@/components/utils/PhoneNumber";
import { DASHBOARD_ROUTES } from "@/libs/enums";
import { toast } from "react-toastify";

const NewChat = () => {

    const router = useRouter()

    const [phone, setPhone] = useState("")
    const [open, setOpen] = useState(false)
    const [isValidPhone, setIsValidPhone] = useState(false)

    const newChat = () => {
        setOpen(true)
    }

    const handleClose = () => {
        setOpen(false)
        setPhone("")
        setIsValidPhone(false)
    }

    const handlePhoneChange = (phoneNumber: string) => {
        setPhone(phoneNumber)
        // Basic validation - check if phone has at least 10 digits
        const digitsOnly = phoneNumber.replace(/\D/g, '')
        setIsValidPhone(digitsOnly.length >= 10)
    }

    const startChat = () => {
        if (!isValidPhone) {
            toast.error("Please enter a valid phone number")
            return
        }
        
        if (!phone) {
            toast.error("Please enter a phone number")
            return
        }

        // Format phone number for URL
        const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`
        
        toast.success(`Starting chat with ${formattedPhone}`)
        router.push(`${DASHBOARD_ROUTES.CHATS}/${formattedPhone}`)
        handleClose()
    }

    return (
        <>
            <div className="w-32">
                <LoadingButton 
                    onClick={newChat}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Chat
                    </div>
                </LoadingButton>
            </div>
            
            <ModalWrapper title="Start New Conversation" open={open} handleClose={handleClose}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a New Conversation</h3>
                        <p className="text-sm text-gray-600">Enter the WhatsApp number you want to chat with</p>
                    </div>

                    {/* Phone Input */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            WhatsApp Number
                        </label>
                        <PhoneNumber 
                            phone={phone} 
                            onChange={handlePhoneChange} 
                            placeholder="Enter WhatsApp number" 
                        />
                        {phone && !isValidPhone && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Please enter a valid phone number
                            </p>
                        )}
                        {isValidPhone && (
                            <p className="text-xs text-blue-600 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Valid phone number
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={startChat}
                            disabled={!isValidPhone}
                            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                                isValidPhone
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Start Chat
                            </div>
                        </button>
                    </div>
                </div>
            </ModalWrapper>
        </>
    )
}

export default NewChat