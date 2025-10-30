import { User } from "@prisma/client";
import dateFormat from "dateformat";
import TableNav from "./tableNav";
interface IProps {
    columns: string[]
    data: User[]
    count: number
    page: number
}

const ResellerTable = (props: IProps) => {

    return (
        <div className="overflow-x-auto shadow-md sm:rounded-lg mt-8 min-h-[65vh]">
            
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

                <tbody>

                    {
                        props?.data?.map((row, index) => {
                            return (
                                <tr key={index} className="cursor-pointer bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{row.firstName}</td>
                                    <td className="px-6 py-4">{row.lastName}</td>
                                    <td className="px-6 py-4">{row.email}</td>
                                    <td className="px-6 py-4">{dateFormat(row.createdAt)}</td>
                                </tr>
                            )
                        })
                    }
             
                </tbody>

            </table>

            {   props.count > 9 && <TableNav page={props.page} counts={props.count} />  }

        </div>

    )
}

export default ResellerTable