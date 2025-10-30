import { getPage } from "@/libs/utils"
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactElement, useEffect, useState } from "react";
import ReactPaginate from 'react-paginate';

interface IProps {
    counts: number;
    page: number;
}

const TableNav = (props: IProps) => {

    const { counts, page } = props

    const pageCount = Math.ceil(counts / 10);

    const [pages, setPages] = useState<number[]>([])
    const [itemOffset, setItemOffset] = useState(0);

    const { take, skip } = getPage(page)

    const router = useRouter()

    const handlePageClick = (event: { selected: number; }) => {
        const newOffset = (event.selected * 10) % counts;
        console.log(
          `User requested page number ${event.selected}, which is offset ${newOffset}`
        );
        setItemOffset(newOffset);
    };


    return (
        <ReactPaginate
            breakLabel="..."
            nextLabel="next >"
            onPageChange={handlePageClick}
            pageRangeDisplayed={5}
            pageCount={pageCount}
            previousLabel="< previous"
            renderOnZeroPageCount={null}/>
    )

    return (
        <nav className="flex items-center justify-between pt-4" aria-label="ContactTable navigation">
            <span className="text-sm font-normal text-gray-500">Showing <span className="font-semibold text-gray-900">{skip + 1}-{take + skip}</span> of <span className="font-semibold text-gray-900">{counts}</span></span>
            <ul className="inline-flex items-center -space-x-px">
                {   page > 0 &&
                    <li>
                        <Link href={`/${router.pathname}?page=${page - 1}`} className="block px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700">
                            <span className="sr-only">Previous</span>
                            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                        </Link>
                    </li>
                }

                {
                    pages.map((page: number) => {
                        return (
                            <li key={page}>
                                <Link href={`/${router.pathname}?page=${page}`}         
                                className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700" >{page}
                                </Link>
                            </li>
                        )
                    })
                }

                {
                    <li>
                        <Link href={`/${router.pathname}?page=${page + 1}`} className="block px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700">
                            <span className="sr-only">Next</span>
                            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>
                        </Link>
                    </li>
                }
            </ul>
        </nav>
    )
}

export default TableNav