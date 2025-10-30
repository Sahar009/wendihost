import Card from '@/components/dashboard/Card'
import { useEffect, useState } from 'react'
import axios, { AxiosResponse } from 'axios'
import { ApiResponse } from '@/libs/types'
import useSWR, { mutate } from 'swr'
import AddTeam from './AddTeam'
import ModalWrapper from '../../utils/ModalWrapper'
import { Member } from '@prisma/client'
import TeamAction from './TeamAction'
import { useSelector } from 'react-redux'
import { getCurrentWorkspace } from '@/store/slices/system'
import Image from 'next/image'



export default function Team() {

    const [data, setData] = useState([])

    const [open, setOpen] = useState(false)

    const workspaceFromStore = useSelector(getCurrentWorkspace)
    const workspaceId = workspaceFromStore?.id ?? 0

    const getData = useSWR(workspaceId && workspaceId > 0 ? `/api/${workspaceId}/team/get?page=${1}` : null, axios)

    useEffect(() => {
        
        const res = getData?.data as AxiosResponse
        const data : ApiResponse = res?.data

        if (data?.data) {
            setData(data?.data?.members)
        }

    }, [getData])

    const refresh = () => {
        if (workspaceId && workspaceId > 0) mutate(`/api/${workspaceId}/team/get?page=${1}`)
    }

    const handleClose = () => {
        setOpen(false)
    }

    return (
        <div className='h-[600px]'>

            <Card>

                <div className='flex justify-between items-center mb-6'>
                    <h3 className='font-semibold text-lg'>Team</h3>
                    <button 
                        onClick={() => setOpen(true)}
                        className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200'
                    >
                        Add member
                    </button>
                </div>

                {data.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-12 text-center'>
                        <p className='text-xl font-medium mb-2'>You have no team member</p>
                        <p className='text-gray-500 mb-6'>Add members to your team to bring them in on your project</p>
                        <button 
                            onClick={() => setOpen(true)}
                            className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors duration-200 bg-gradient-to-r from-blue-500 to-blue-600'
                        >
                            Add member
                        </button>
                    </div>
                ) : (
                    <div className='space-y-6'>
                        {data.map((member: Member, index) => (
                            <div key={index} className='flex items-center cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors'>
                                <div className='w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center'>
                                    <Image width={24} height={24} alt='USER' src={"/icons/user-profile.png"} />
                                </div>
                                <div className='ml-4 flex justify-between w-full'>
                                    <div>
                                        <p className='text-base font-medium'>{member.name}</p>
                                        <p className='text-sm text-gray-500'>{member.email}</p>
                                    </div>
                                    <div className='flex items-center'>
                                        <span className='text-sm text-gray-500 mr-4'>{member.role}</span>
                                        <TeamAction refresh={refresh} id={member.id} email={member.email} workspaceId={workspaceId} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <ModalWrapper title='Add New Team member' open={open} handleClose={handleClose}>
                <AddTeam handClose={handleClose} workspaceId={workspaceId} refresh={refresh} />
            </ModalWrapper>
        </div>
    )
}
