import { ApiResponse } from "@/libs/types"
import { getCurrentWorkspace } from "@/store/slices/system"
import axios, { AxiosResponse } from "axios"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import useSWR from 'swr'

interface IProps {
    //children: ReactNode
}

const Team = (props: IProps) => {

    const { id: workspaceId } = useSelector(getCurrentWorkspace)

    const getStatus = useSWR(`/api/${workspaceId}/chats/status`, axios)

    const [view, setView] = useState("all")

    const [all, setAll] = useState(0)

    const [mine, setMine] = useState(0)

    const [unassigned, setUnassigned] = useState(0)

    useEffect(() => {
            
        const res = getStatus?.data as AxiosResponse

        const data : ApiResponse = res?.data

        if (data?.data) {
            const { allCounts, mineCounts, unassignedCounts } = data.data
            setAll(allCounts)
            setMine(mineCounts)
            setUnassigned(unassignedCounts)
        }

    }, [getStatus?.data])


    return (
        <div className="text-sm p-2 border-[1px] hidden ">

            <div className="flex justify-between">
                <h3 className="font-bold">Inbox</h3>
            </div>

            <div className="flex mt-4 justify-between cursor-pointer">
                <h3>All</h3>
                <p>{all}</p>
            </div>

            <div className="flex mt-4 justify-between cursor-pointer">
                <h3>Mine</h3>
                <p>{mine}</p>
            </div>

            <div className="flex mt-4 justify-between cursor-pointer">
                <h3>Unassigned</h3>
                <p>{unassigned}</p>
            </div>

        </div>
    )

}

export default Team