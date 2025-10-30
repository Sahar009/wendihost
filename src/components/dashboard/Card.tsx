import { ReactNode } from "react";

interface IProps { 
    color?: string; 
    disabled?: false; 
    loading?: boolean; 
    children: ReactNode;
    className?: string;
}

const Card = (props: IProps) => {


    return (
        <div className={`w-full bg-white h-full shadow-xl rounded-lg p-4 ${props.className || ''}`}>
            {props.children}
        </div>
    )

}

export default Card