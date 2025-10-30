import { Chatbot } from "@prisma/client";
import dateFormat from "dateformat";
import Badge from "@/components/utils/Badge";
import { useRouter } from "next/router";
import { DASHBOARD_ROUTES } from "@/libs/enums";
import { useState } from "react";
import ModalWrapper from "@/components/utils/ModalWrapper";
import axios from "axios";
import { toast } from "react-toastify";
import LoadingButtonSM from "@/components/utils/LoadingButtonSM";
import { MoreVertical } from "lucide-react";

interface IProps {
    clear(): void
    workspaceId: number
    columns: string[]
    data: Chatbot[],
    refresh(): void
    deleteModal: boolean
    setDeleteModal: (open: boolean) => void
    selected: Chatbot | null
    setSelected: (row: Chatbot) => void
}

const ChatbotTable = (props: IProps) => {

    const router = useRouter()

    const [loading, setLoading] = useState(false)    
    const [publishLoading, setPublishLoading] = useState<number | null>(null)
    const [openMenu, setOpenMenu] = useState<number | null>(null)

    const nextLink = (id: number) => {
        router.push(`${DASHBOARD_ROUTES.CHATBOT}/${id}`)
        props.clear()
    }


    const deleteChatbot = async (id: number) => {

        setLoading(true)

        try {

            const res = await axios.delete(`/api/${props.workspaceId}/chatbot/${id}/delete`)

            toast.success(res.data.message)

            props.refresh()

            closeDelete()

        } catch (e) {

            if (axios.isAxiosError(e)) {
                toast.error(e?.response?.data?.message)
            } else {
                console.error(e);
            }

        }

        setLoading(false)

    }

    const closeDelete = () => {
        props.setDeleteModal(false)
    }

    const togglePublish = async (id: number) => {
        setPublishLoading(id)
        
        try {
            const res = await axios.put(`/api/${props.workspaceId}/chatbot/${id}/toggle-publish`)
            
            toast.success(res.data.message)
            props.refresh()
            
        } catch (e) {
            if (axios.isAxiosError(e)) {
                toast.error(e?.response?.data?.message)
            } else {
                console.error(e);
            }
        }
        
        setPublishLoading(null)
    }


    return (
        <div className="overflow-x-auto shadow-md sm:rounded-lg">

            
            <table className="w-full text-sm text-left text-gray-500 ">
            
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            
                    <tr>
                        {
                            props.columns.map((column: string, index: number) => {
                                return (
                                    <th key={index} scope="col" className="px-6 py-3">
                                        {column}
                                    </th>
                                )
                            })
                        }
                    </tr>
                </thead>

                <tbody className="overflow-visible">

                    {
                        props?.data?.map((row, index) => {
                            return (
                                <tr 
                                    key={index} 
                                    className="cursor-pointer bg-white border-b hover:bg-gray-50 overflow-visible"
                                    onClick={() => nextLink(row.id)}
                                >
                                    <td className="px-6 py-4 overflow-visible">{row.name}</td>
                                    <td className="px-6 py-4 overflow-visible">{row.trigger}</td>
                                    <td className="px-6 py-4 overflow-visible">
                                        {
                                            row.default ?
                                                <Badge type="success" status="Yes" />
                                                    : 
                                                <Badge type="info" status="No"/>
                                        }
                                    </td>
                                    <td className="px-6 py-4 overflow-visible">
                                        {
                                            row.publish ?
                                                <Badge type="success" status="Published" />
                                                    : 
                                                <Badge type="info" status="Draft"/>
                                        }
                                    </td>
                                    <td className="px-6 py-4 overflow-visible">{dateFormat(row.createdAt)}</td>
                                
                                    <td className="relative px-6 py-4 overflow-visible" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => setOpenMenu(openMenu === row.id ? null : row.id)}>
                                            <MoreVertical size={24} />
                                        </button>
                                        {openMenu === row.id && (
                                            <div className="absolute top-0 right-full mr-2 w-32 bg-white border rounded shadow z-50">
                                                <button
                                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                                    onClick={() => { nextLink(row.id); setOpenMenu(null); }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600"
                                                    onClick={() => { togglePublish(row.id); setOpenMenu(null); }}
                                                    disabled={publishLoading === row.id}
                                                >
                                                    {publishLoading === row.id ? (
                                                        <LoadingButtonSM onClick={() => {}}>
                                                            Loading...
                                                        </LoadingButtonSM>
                                                    ) : (
                                                        row.publish ? 'Unpublish' : 'Publish'
                                                    )}
                                                </button>
                                                <button
                                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                                                    onClick={() => { props.setDeleteModal(true); props.setSelected(row); setOpenMenu(null); }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </td>

                                </tr>
                            )
                        })
                    }
             
                </tbody>

            </table>

            <ModalWrapper title='Delete Snippet' open={props.deleteModal} handleClose={closeDelete}>

                <p className="text-center text-lg font-medium mt-6 md:px-8">
                    Are you sure you want to delete 
                    <strong className="text-red-600 mx-1 font-extrabold">{props.selected?.name}</strong> snippet
                </p>

                <div className="flex gap-4 justify-center mt-10">

                    <div className="w-24">
                        <LoadingButtonSM loading={loading} onClick={() => deleteChatbot(props.selected?.id as number)} color="red">Yes</LoadingButtonSM>
                    </div>


                    <div className="w-24">
                        <LoadingButtonSM onClick={closeDelete} color="green">No</LoadingButtonSM>
                    </div>

                </div>


            </ModalWrapper>

        </div>

    )
}

export default ChatbotTable