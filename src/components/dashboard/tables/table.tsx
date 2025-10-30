import { Snippet } from "@prisma/client"
import { AiFillEdit, AiFillDelete } from "react-icons/ai"
import dateFormat from "dateformat";
import ModalWrapper from "@/components/utils/ModalWrapper";
import { useState } from "react";
import LoadingButton from "@/components/utils/LoadingButton";
import axios from "axios";
import { toast } from "react-toastify";
import Textarea from "@/components/utils/Textarea";
import useInput from "@/hooks/useInput";
import Input from "@/components/auth/Input";

interface IProps {
    columns: string[],
    data: any[][],
}

const Table = (props: IProps) => {



    return (

        <div className="overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
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

                <tbody className="overflow-y-auto">

                    {
                        props?.data?.map((row, index) => {

                            return (
                                <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                    
                                    {
                                        row.map((col: string, index: number) => {
                                            return <td key={index} className="px-6 py-4">{col}</td>
                                        })
                                    }
                                    
                                    {/* <td className="px-6 py-4">{row.firstName}</td>
                                    <td className="px-6 py-4">{row.lastName}</td>
                                    <td className="px-6 py-4">{row.phone}</td>
                                    <td className="px-6 py-4">{row.email}</td>
                                    <td className="px-6 py-4">{dateFormat(row.createdAt)}</td>
   */}
                                </tr>
                            )
                        })
                    }
             
                </tbody>

            </table>

        </div>

    )
}

export default Table