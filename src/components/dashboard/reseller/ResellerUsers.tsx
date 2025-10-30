import { ApiResponse } from "@/libs/types"
import { User } from "@prisma/client"
import axios, { AxiosResponse } from "axios"
import { useEffect, useState } from "react"
import useSWR, { mutate } from 'swr'
import ResellerTable from "../tables/ResellerTable"
import { useRouter } from "next/router"
import Image from 'next/image'


const ResellerUsers = () => {

    const getReseller = useSWR(`/api/reseller/get-users`, axios)

    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<User[]>()
    const [count, setCount] = useState<number>(0)
    const [search, setSearch] = useState('')
    //const [data, setData] = useState<User[]>()
    const router = useRouter()

    const page = router.query.page || 1


    useEffect(() => {

        setLoading(true)
        
        const res = getReseller?.data as AxiosResponse
    
        const data : ApiResponse = res?.data
    
        if (data?.data) {
            setData(data?.data?.users) 
            setCount(data?.data?.counts)
            setLoading(false)
        }
    
    }, [getReseller.data])

    const filteredData = (data || []).filter(user => {
        const s = search.toLowerCase();
        return (
            user.firstName?.toLowerCase().includes(s) ||
            user.lastName?.toLowerCase().includes(s) ||
            user.email?.toLowerCase().includes(s)
        );
    });


    return (
        <div>
            {/* Search Bar */}
            <div className='m-4 w-64'>
                <input
                    type='text'
                    placeholder='Search'
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className='w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50'
                />
            </div>
            {   !loading && filteredData.length === 0 ? (
                    <div className='flex flex-col items-center justify-center h-[60vh]'>
                        <Image src='/images/contact%20book.png' alt='No users' width={120} height={120} />
                        <div className='mt-6 text-lg font-medium text-gray-700'>You don’t have any user yet</div>
                    </div>
                ) : (
                    !loading &&
                        <ResellerTable 
                            columns={["First Name", "Last Name", "Email", "Date Joined"]} 
                            data={filteredData as User[]}   count={count}   page={Number(page)}
                        />
                )
            }
        </div>
    )
}

export default ResellerUsers