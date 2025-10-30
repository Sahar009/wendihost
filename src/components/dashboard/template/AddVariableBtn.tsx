import { templateRegex } from "./TemplatePlaceholder";

interface AddVariableBtnProps {
    value: string;
    setValue: (value: string) => void;
}

const AddVariableBtn = ({ value, setValue } : AddVariableBtnProps) => {

    const handleAddVariable = () => {
        setValue(`${value}{{}}`)
    }

    return (
        <button onClick={handleAddVariable} className="text-sm rounded-md h-10 w-32 cursor-pointer hover:bg-gray-400">
            + Add variable
        </button>
    )
}

export default AddVariableBtn