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
        <div className="mb-6">
            {!hideLabel && (
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Phone Number
                </label>
            )}

            <div className={`relative transition-all duration-200 ease-in-out transform ${isFocused ? 'scale-[1.01]' : ''}`}>
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
                        borderRadius: "12px",
                        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15)",
                        border: "1px solid #f3f4f6",
                        backgroundColor: "white",
                        maxHeight: "300px",
                        overflowY: "auto",
                        marginTop: "8px",
                        width: "300px",
                        padding: "4px"
                    }}
                    containerStyle={{
                        width: '100%',
                    }}
                    inputStyle={{
                        width: '100%',
                        height: '56px',
                        fontSize: '16px',
                        paddingLeft: '58px',
                        borderRadius: '12px',
                        backgroundColor: isFocused ? '#fff' : '#f9fafb',
                        border: error ? '2px solid #fee2e2' : isFocused ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        transition: 'all 0.2s ease-in-out',
                        color: '#1f2937',
                        fontWeight: '500'
                    }}
                    buttonStyle={{
                        border: error ? '2px solid #fee2e2' : isFocused ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        borderRight: 'none',
                        backgroundColor: isFocused ? '#fff' : '#f9fafb',
                        borderRadius: '12px 0 0 12px',
                        paddingLeft: '6px',
                        transition: 'all 0.2s ease-in-out',
                    }}
                />

                {/* Status Icon */}
                {value && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-opacity duration-200">
                        {error ? (
                            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                )}
            </div>

            {/* Helper text */}
            {helperText && (
                <p className={`mt-2 text-sm flex items-center gap-1.5 font-medium ${error ? "text-red-600" : "text-gray-500"
                    }`}>
                    {error && (
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    )}
                    {helperText}
                </p>
            )}
        </div>
    )
}

export default React.memo(PhoneNumber)