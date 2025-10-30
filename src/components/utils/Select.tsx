import { Dispatch, SetStateAction } from "react";

interface IProps {
    id: string;
    name: string;
    label?: string;
    onChange: Dispatch<SetStateAction<any>>;
    lists: any[],
    select?: any
}


const Select = (props: IProps) => {

    const {id, label, onChange, lists, select } = props

    return (
        <div className="mb-2">
            <label className="block mb-2 text-sm font-medium"> { label} </label>
            <select onChange={(e) => onChange(e.target.value)}  
                id={id} className="bg-blue-50 border outline-none text-sm rounded-lg focus:ring-blue-400 focus:border-blue-400 block w-full p-2.5">
                {
                    lists.map((list, i) => {
                        return <option selected={select === list.value} value={list?.value} key={i}>{list.name}</option>
                    })
                }
            </select>
        </div>
    )
}

export default Select