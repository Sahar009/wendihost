import { WhatsappLink } from "@prisma/client"
import { AiFillEdit, AiFillDelete } from "react-icons/ai"
import dateFormat from "dateformat";
import ModalWrapper from "@/components/utils/ModalWrapper";
import { useState, useEffect } from "react";
import LoadingButton from "@/components/utils/LoadingButton";
import axios from "axios";
import { toast } from "react-toastify";
import Textarea from "@/components/utils/Textarea";
import useInput from "@/hooks/useInput";
import Input from "@/components/auth/Input";
import { BsThreeDotsVertical } from 'react-icons/bs'

interface IProps {
    columns: string[],
    data: WhatsappLink[],
    workspaceId: number,
    page: number,
    refresh: () => void;
}

const WaLinkTable = (props: IProps) => {

    const BASE_LINK = "https://wendi.app/"

    const { workspaceId } = props

    const [edit, setEdit] = useState(false)
    const [deleteModal, setDeleteModal] = useState(false)
    const [selected, setSelected] = useState<WhatsappLink | null>(null)
    const [loading, setLoading] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

    const name = useInput("slug", 2)
    const topic = useInput("text", 2)
    const message = useInput("text", 10)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (!(event.target as HTMLElement).closest('.dropdown-action')) {
                setDropdownOpen(null);
            }
        }
        if (dropdownOpen !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    const deleteLink = async (id: number) => {

        setLoading(true)

        try {

            const body = {  id }

            const res = await axios.post(`/api/${workspaceId}/wa-link/delete`, body)

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

    async function copyContent(content: string) {
        try {
          await navigator.clipboard.writeText(content);
          toast.success('Copied to clipboard');
        } catch (err) {
          toast.error('Failed to copy to clipboard');
        }
      }

    return (

        <div className="overflow-x-auto shadow-md sm:rounded-lg min-h-[65vh]">
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
                        props?.data?.map((row, index) => {
                            return (
                                <tr key={index} className="bg-white border-b  hover:bg-gray-50">
                                    <td className="px-6 py-4">{row.name}</td>
                                    <td className="px-6 py-4">+{row.phoneNumber}</td>
                                    <td className="px-6 py-4">{row.visitors}</td>
                                    <td className="px-6 py-4">{row.message}</td>
                                    <td onClick={() =>  copyContent(BASE_LINK + row.name)} className="px-6 py-4 underline cursor-pointer">{BASE_LINK + row.name}</td>
                                    <td className="px-6 py-4">{dateFormat(row.createdAt)}</td>
                                    <td className="px-6 py-4 relative">
                                        <div className="inline-block">
                                            <button onClick={() => setDropdownOpen(index)} className="focus:outline-none">
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
                                                            topic.setValue("");
                                                            message.setValue(row?.message as string);
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
                                        </div>
                                    </td>
                                </tr>
                            )
                        })
                    }
             
                </tbody>

            </table>

            <ModalWrapper title='Delete Snippet' open={deleteModal} handleClose={closeDelete}>

                <p className="text-center text-lg font-medium mt-6 md:px-8">
                    Are you sure you want to delete 
                    <strong className="text-primary mx-1 font-extrabold">{selected?.name}</strong> snippet
                </p>

                <div className="flex gap-4 justify-center mt-10">

                    <div className="w-24">
                        <LoadingButton loading={loading} onClick={() => deleteLink(selected?.id as number)} color="red">Yes</LoadingButton>
                    </div>


                    <div className="w-24">
                        <LoadingButton onClick={closeDelete} color="primary">No</LoadingButton>
                    </div>

                </div>
                

            </ModalWrapper>


            {/* <nav className="flex items-center justify-between pt-4" aria-label="SnippetTable navigation">
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">Showing <span className="font-semibold text-gray-900 dark:text-white">1-10</span> of <span className="font-semibold text-gray-900 dark:text-white">1000</span></span>
                <ul className="inline-flex items-center -space-x-px">
                    <li>
                        <a href="#" className="block px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                            <span className="sr-only">Previous</span>
                            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                        </a>
                    </li>
                    <li>
                        <a href="#" className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">1</a>
                    </li>
                    <li>
                        <a href="#" className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">2</a>
                    </li>
                    <li>
                        <a href="#" aria-current="page" className="z-10 px-3 py-2 leading-tight text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white">3</a>
                    </li>
                    <li>
                        <a href="#" className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">...</a>
                    </li>
                    <li>
                        <a href="#" className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">100</a>
                    </li>
                    <li>
                        <a href="#" className="block px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                            <span className="sr-only">Next</span>
                            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>
                        </a>
                    </li>
                </ul>
            </nav> */}

        </div>

    )
}

export default WaLinkTable