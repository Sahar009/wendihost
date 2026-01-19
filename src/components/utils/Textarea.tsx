
import React from 'react';

interface IProps {
    id: string;
    name: string;
    label?: string;
    placeholder?: string;
    value: string | any;
    onChange: (value: string) => void;
    onFocus?: (value: boolean) => void;
    helperText?: string;
    error?: boolean;
    height?: string;
    hideLabel?: boolean;
    className?: string; // Added className prop
}

const Textarea = (props: IProps) => {

    const { id, name, label, height, placeholder, helperText, value, hideLabel, onChange, onFocus, error, className } = props

    const stringValue = React.useMemo(() => {
        if (typeof value === 'string') return value;
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') {
            console.warn('Textarea received object value:', value);
            return '';
        }
        return String(value);
    }, [value]);

    return (
        <div className="mb-2 h-full"> {/* Added h-full to container */}
            {!hideLabel && <label className="block mb-2 text-sm font-medium"> {label} </label>}
            <textarea
                name={name}
                value={stringValue}
                onFocus={() => onFocus?.(true)}
                onChange={(e) => onChange(e.target.value)} id={id}
                className={`
                    bg-white border outline-none text-sm rounded-lg focus:ring-blue-400 
                    ${error ? "border-red-200" : "focus:border-blue-400"} block w-full p-2.5 resize-none h-28
                    ${className || ''} 
                `}
                style={{ height }}
                placeholder={placeholder} > </textarea>
            {error && <p className="my-2 text-xs text-red-500">{helperText}</p>}
        </div>
    )
}

export default Textarea