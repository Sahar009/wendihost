import { useState } from "react";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";

interface IProps extends React.InputHTMLAttributes<HTMLInputElement> {
    id?: string;
    name?: string;
    label?: string;
    helperText?: string;
    value: any;
    className?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    error?: boolean;
    type?: string;
}

const Input = (props: IProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = props.type === 'password';
    const inputType = isPassword && showPassword ? 'text' : props.type;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (typeof props.onChange === 'function') {

            props.onChange(e);
        }
    };

    const {
        id,
        name,
        label,
        helperText,
        value,
        onChange,
        onFocus,
        onBlur,
        error,
        type = 'text',
        className = '',
        ...rest
    } = props;
    
    return (
        <div className="mb-2">
            {label && (
                <label htmlFor={id} className="block mb-1.5 text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <div className="relative">
                <div className="relative">
                    {isPassword && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <FaLock size={14} />
                        </div>
                    )}
                    <input
                        id={id}
                        name={name}
                        type={inputType}
                        value={value}
                        onChange={handleChange}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        className={`
                            bg-white border border-gray-300 outline-none text-sm rounded-lg 
                            focus:ring-2 focus:ring-primary focus:border-transparent
                            ${error ? 'border-red-300' : 'border-gray-300'}
                            block w-full p-2.5 ${isPassword ? 'pl-10 pr-10' : 'px-3.5'} ${className}
                        `}
                        {...rest}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            tabIndex={-1}
                        >
                            {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                    )}
                </div>
            </div>
            {error && helperText && (
                <p className="mt-1 text-xs text-red-500">{helperText}</p>
            )}
        </div>
    );
}

export default Input