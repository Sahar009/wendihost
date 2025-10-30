import { useState, useEffect, useCallback, useLayoutEffect } from "react"
import useSWR from 'swr'
import Select from "@/components/utils/Select"
import axios, { AxiosResponse } from "axios"
import { ApiResponse } from "@/libs/types"
import { Member } from "@prisma/client"
import { toast } from "react-toastify"

interface IProps {
    workspaceId: number,
    memberId: number | null | undefined,
    chatId: number | null | undefined,
}

const unassigned = { value: 0, name: "Unassigned" }

const AssignChat = (props: IProps) => {

    const [lists, setLists] = useState([unassigned])
    const [members, setMembers] = useState<Member[]>([])
    const [member, setMember] = useState<number>(-1)
    const getMembers = useSWR(`/api/${props.workspaceId}/team/get-all`, axios)

    const assignChat = useCallback(async () => {
        if (Number(props.memberId) != member && member >= 0) {
            toast.info("Assigning chat. Please Wait...")
            const body = { chatId: props.chatId, assign: member > 0 ? true : false, memberId: member }
            try {
                const res: AxiosResponse = await axios.post(`/api/${props.workspaceId}/chats/assign`, body)
                toast.success(res?.data?.message)
            } catch (e) {
                if (axios.isAxiosError(e)) {
                    toast.error(e?.response?.data?.message)
                } else {
                    console.error(e);
                }
            }
        }
    }, [props.chatId, props.memberId, props.workspaceId, member])

    useLayoutEffect(() => {
        assignChat()
    }, [assignChat])

    useEffect(() => {
        const res = getMembers?.data as AxiosResponse
        const data : ApiResponse = res?.data
        if (data?.data) { setMembers(data?.data?.members) }
    }, [getMembers?.data])

    useEffect(() => {
        const lists = members.map((member) => {return { value: member.id , name: member.email }})
        const arr = [{ value: 0, name: "Unassigned" }]
        arr.push(...lists)
        setLists(arr)
    }, [members])

    return (
        <div className="w-30">
            <Select onChange={setMember} id="assign" name="assign" select={props.memberId} lists={lists} />
        </div>
    )
} 


export default AssignChat