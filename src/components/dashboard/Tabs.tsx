import { Dispatch, SetStateAction, ReactNode } from "react";


interface IProps {
    tabs: ReactNode[],
    index: number,
    setIndex:  Dispatch<SetStateAction<number>>
}

const Tabs = (props: IProps) => {


    return (
        <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200">
            <ul className="flex flex-wrap -mb-px">
                {
                    props.tabs.map((tab, index) => {
                        return (
                            <li key={index} className="mr-2" onClick={() => props.setIndex(index)}>
                                <div className={`
                                    inline-block p-4 border-b-2 rounded-t-lg
                                    cursor-pointer
                                        ${ index == props.index ? 'border-b-4 text-gray-800 border-blue-600 active ' : 'hover:text-gray-600 hover:border-gray-300  border-transparent  border-b-2'}`}>
                                    {tab}
                                </div>
                            </li>
                        )
                    })
                }
            </ul>
        </div>

    )
}

export default Tabs