import { Snippet } from "@prisma/client"
import { AiFillEdit, AiFillDelete } from "react-icons/ai"
import { BsThreeDotsVertical } from 'react-icons/bs';
import dateFormat from "dateformat";
import ModalWrapper from "@/components/utils/ModalWrapper";
import { useState } from "react";
import LoadingButton from "@/components/utils/LoadingButton";
import axios from "axios";
import { toast } from "react-toastify";
import Textarea from "@/components/utils/Textarea";
import useInput from "@/hooks/useInput";
import Input from "@/components/auth/Input";
import Image from 'next/image';

interface IProps {
    columns: string[],
    data: Snippet[],
    workspaceId: number,
    refresh: () => void;
}

const SnippetTable = (props: IProps) => {
    const { workspaceId } = props
    const [edit, setEdit] = useState(false)
    const [deleteModal, setDeleteModal] = useState(false)
    const [selected, setSelected] = useState<Snippet | null>(null)
    const [loading, setLoading] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

    const name = useInput("slug", 2)
    const topic = useInput("text", 2)
    const message = useInput("text", 10)

    const editSnippet = async (id: number) => {
        setLoading(true)
        try {
            const body = {  
                id,
                name: name.value,
                topic: topic.value,
                message: message.value 
            }
            const res = await axios.post(`/api/${workspaceId}/snippets/edit`, body)
            toast.success(res.data.message)
            props.refresh()
            closeEdit()
        } catch (e) {
            if (axios.isAxiosError(e)) {
                toast.error(e?.response?.data?.message)
            } else {
                console.error(e);
            }
        }
        setLoading(false)
    }

    const deleteSnippet = async (id: number) => {
        setLoading(true)
        try {
            const body = {  id }
            const res = await axios.post(`/api/${workspaceId}/snippets/delete`, body)
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
        setDeleteModal(false)
    }

    const closeEdit = () => {
        setEdit(false)
        name.setValue("")
        topic.setValue("")
        message.setValue("")
    }

    return (
        <div className="overflow-x-auto shadow-md sm:rounded-lg min-h-[65vh]">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        {props.columns.map((column: string, index: number) => (
                            <th key={index} scope="col" className="px-6 py-3">
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {props?.data?.map((row, index) => (
                        <tr key={index} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4">{row.name}</td>
                            <td className="px-6 py-4">{row.title}</td>
                            <td className="px-6 py-4">{row.body}</td>
                            <td className="px-6 py-4">{dateFormat(row.createdAt)}</td>
                            <td className="px-3 py-4 text-right relative">
                                <button className="p-2 rounded-full hover:bg-gray-100 transition" onClick={e => { e.stopPropagation(); setDropdownOpen(index); }}>
                                    <BsThreeDotsVertical size={20} />
                                </button>
                                {dropdownOpen === index && (
                                    <div className="dropdown-action absolute right-0 mt-2 w-32 bg-white border rounded shadow z-10">
                                        <button
                                            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                            onClick={() => {
                                                setSelected(row);
                                                setEdit(true);
                                                name.setValue(row?.name as string);
                                                topic.setValue(row?.title as string);
                                                message.setValue(row?.body as string);
                                                setDropdownOpen(null);
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                                            onClick={() => {
                                                setDeleteModal(true);
                                                setSelected(row);
                                                setDropdownOpen(null);
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <ModalWrapper title='' open={deleteModal} handleClose={closeDelete}>
                <div className="flex flex-col items-center justify-center p-2">
                    <div className="mb-2">
                        <Image width={200} height={200} alt='delete' src={'/images/delete.png'} />
                    </div>
                    <h3 className="text-xl font-bold text-red-600 mb-2">Delete Snippet</h3>
                    <p className="text-center text-gray-700 mb-4 max-w-xs">
                        Are you sure you want to delete <strong className="text-red-600 font-extrabold">{selected?.name}</strong>? Know that when this is done, it cannot be reversed and all your data and settings for this snippet will be completely erased.
                    </p>
                    <div className="flex w-full gap-2 mt-2">
                        <button
                            className="flex-1 border border-gray-300 rounded-md py-2 font-medium text-gray-700 bg-white hover:bg-gray-100 transition"
                            onClick={closeDelete}
                            type="button"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-md py-2 font-medium transition disabled:opacity-60"
                            onClick={() => deleteSnippet(selected?.id as number)}
                            type="button"
                            disabled={loading}
                        >
                            {loading ? 'Deleting...' : 'Delete Snippet'}
                        </button>
                    </div>
                </div>
            </ModalWrapper>

            <ModalWrapper title='Add message snippet' open={edit} handleClose={closeEdit}>
                <Input 
                    label='Name' name="name" type='text' 
                    placeholder='E.g sample_template' id="name"
                    helperText={name.errorMessage} value={name.value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => name.setValue(e.target.value)}
                    error={name.errorWarning} 
                    onFocus={() => name.setOnFocus(true)}
                />
                <Input 
                    label='Topic' name="topic" type='text' 
                    placeholder='E.g example template' id="topic"
                    helperText={topic.errorMessage} value={topic.value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => topic.setValue(e.target.value)}
                    error={topic.errorWarning}
                    onFocus={() => topic.setOnFocus(true)}
                />
                <Textarea 
                    label='Message' name='message' id='message' placeholder='Type your message here' 
                    helperText={message.errorMessage} value={message.value}
                    onChange={message.setValue}
                    error={message.errorWarning}
                    onFocus={() => message.setOnFocus(true)}
                />
                <LoadingButton onClick={() => editSnippet(selected?.id as number)} loading={loading}>Save</LoadingButton>
            </ModalWrapper>
        </div>
    )
}

export default SnippetTable