import { Snippet } from "@prisma/client"

interface Contact {
    id: number;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    phone: string;
    tag: string;
    additionalInfo: string;
    workspaceId: number;
    conversationId: number | null;
    createdAt: string | Date;
    updatedAt: string | Date;
}
import dateFormat from "dateformat";
import ModalWrapper from "@/components/utils/ModalWrapper";
import { useState } from "react";
import LoadingButton from "@/components/utils/LoadingButton";
import axios from "axios";
import { toast } from "react-toastify";
import Textarea from "@/components/utils/Textarea";
import useInput from "@/hooks/useInput";
import Input from "@/components/auth/Input";
import TableNav from "./tableNav";
import { useRouter } from "next/router";
import { DASHBOARD_ROUTES } from "@/libs/enums";
import Image from "next/image";

interface IProps {
    columns: string[],
    data: { counts: number, contacts: Contact[] },
    workspaceId: number,
    page: number,
    selectedContacts: number[],
    setSelectedContacts: (ids: number[]) => void,
    refresh: () => void;
}

const ContactTable = (props: IProps) => {

    const { workspaceId, selectedContacts, setSelectedContacts } = props

    const router = useRouter()

    const [edit, setEdit] = useState(false)
    const [deleteModal, setDeleteModal] = useState(false)
    const [selected, setSelected] = useState<Snippet | null>(null)
    const [loading, setLoading] = useState(false)

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

            const body = { id }

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

    const handleSelect = (id: number, isAdding: boolean) => {
        if (isAdding) {
            setSelectedContacts([...selectedContacts, id])
        } else {
            setSelectedContacts(selectedContacts.filter(contactId => contactId != id))
        }
    }

    return (

        <div className="overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        {/* <th scope="col" className="p-4">
                            <div className="flex items-center">
                                <input id="checkbox-all-search" type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                                <label for="checkbox-all-search" className="sr-only">checkbox</label>
                            </div>
                        </th> */}
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

                <tbody>
                    {
                        props?.data?.contacts && props.data.contacts.length > 0 ? (
                            props.data.contacts.map((row, index) => (
                                <tr key={index} className="cursor-pointer bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4"><input onChange={(e) => handleSelect(row.id, e.target.checked)} type="checkbox" /> </td>
                                    <td className="px-6 py-4">{row.firstName}</td>
                                    <td className="px-6 py-4">{row.lastName}</td>
                                    <td className="px-6 py-4">{row.phone}</td>
                                    <td className="px-6 py-4">{row.email}</td>
                                    <td className="px-6 py-4">{row.tag}</td>
                                    <td className="px-6 py-4">{dateFormat(row.createdAt)}</td>
                                    <td className="px-6 py-4">
                                        <LoadingButton onClick={() => router.push(`${DASHBOARD_ROUTES.CHATS}/${row.phone}`)}>Chat</LoadingButton>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={props.columns.length} className="text-center py-8 text-gray-400">
                                    No contacts found.
                                </td>
                            </tr>
                        )
                    }
                </tbody>

            </table>

            <ModalWrapper title='' open={deleteModal} handleClose={closeDelete}>
                <div className="flex flex-col items-center justify-center p-2">
                    <div className="mb-2">
                        <Image width={200} height={200} alt='delete' src={"/images/delete.png"} />
                    </div>
                    <h3 className="text-xl font-bold text-red-600 mb-2">Delete Contact</h3>
                    <p className="text-center text-gray-700 mb-4 max-w-xs">
                        Are you sure you want to delete <strong className="text-red-600 font-extrabold">{selected?.name}</strong>? Know that when this is done, it cannot be reversed and all your data and settings for this contact will be completely erased.
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
                            {loading ? 'Deleting...' : 'Delete Contact'}
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

            {/* <TableNav page={props.page} counts={props.data.counts} /> */}

        </div>

    )
}

export default ContactTable