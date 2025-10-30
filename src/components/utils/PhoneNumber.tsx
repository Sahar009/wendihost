import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";

interface IProps {
    id?: string;
    name?: string;
    placeholder?: string;
    phone: any;
    onChange: Dispatch<SetStateAction<any>>;
    onFocus?: Dispatch<SetStateAction<boolean>>;
    helperText?: string;
    error?: boolean;
    hideLabel?: boolean;
}

const PhoneNumber = (props: IProps) => {

    const { placeholder, hideLabel, phone, onChange, error, helperText } = props

    const [value, setValue] = useState<any>(phone)
    const [isFocused, setIsFocused] = useState(false)

    useEffect(() => {
        onChange(value)
    }, [value, onChange])    

    const handleFocus = () => {
        setIsFocused(true)
        props.onFocus?.(true)
    }

    const handleBlur = () => {
        setIsFocused(false)
        props.onFocus?.(false)
    }

    return (
        <div className="mb-4">
            {!hideLabel && (
                <label className="block mb-2 text-sm font-medium text-gray-700">
                    Phone Number
                </label>
            )}
            
            <div className="relative">
                <PhoneInput
                    placeholder={placeholder || "Enter phone number"}
                    value={value}
                    onChange={setValue}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    enableSearch={true}
                    searchPlaceholder="Search countries..."
                    dropdownStyle={{
                        position: "fixed",
                        zIndex: 99999,
                        borderRadius: "8px",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                        border: "1px solid #e5e7eb",
                        backgroundColor: "white",
                        maxHeight: "300px",
                        overflowY: "auto"
                    }}
                    containerStyle={{
                        position: "relative",
                        zIndex: 1
                    }}
                />
                
                {/* Focus indicator */}
                <div className={`absolute inset-0 rounded-lg border-2 pointer-events-none transition-all duration-200 ${
                    isFocused 
                        ? error 
                            ? "border-red-500 ring-2 ring-red-200" 
                            : "border-blue-500 ring-2 ring-blue-200"
                        : "border-transparent"
                }`} />
                
                {/* Status indicator */}
                {value && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {error ? (
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                )}
            </div>
            
            {/* Helper text */}
            {helperText && (
                <p className={`mt-2 text-xs flex items-center gap-1 ${
                    error ? "text-red-600" : "text-gray-500"
                }`}>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {helperText}
                </p>
            )}
        </div>
    )
}

export default React.memo(PhoneNumber)