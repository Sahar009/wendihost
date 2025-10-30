import Input from '@/components/auth/Input'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import TemplateTab from '@/components/dashboard/TemplateTab'
import SnippetTable from '@/components/dashboard/tables/snippetTables'
import LoadingButton from '@/components/utils/LoadingButton'
import ModalWrapper from '@/components/utils/ModalWrapper'
import Textarea from '@/components/utils/Textarea'
import useInput from '@/hooks/useInput'
import { ApiResponse } from '@/libs/types'
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session'
import { getCurrentWorkspace } from '@/store/slices/system'
import axios, { AxiosResponse } from 'axios'
import { withIronSessionSsr } from 'iron-session/next'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import useSWR, { mutate } from 'swr'
import Image from 'next/image';

export const getServerSideProps = withIronSessionSsr(async({req, res}) => {


    const user = await validateUser(req)

    const data = user as any

    if (data?.redirect) return sessionRedirects(data?.redirect)
    
    return { 
      props: {
        user: JSON.stringify(user),
      }, 
    }
    
}, sessionCookie())


interface IProps {
    user: string;
}

export default function Snippets(props: IProps) {

    const user = JSON.parse(props.user)

    const [data, setData] = useState([])

    const { id: workspaceId } = useSelector(getCurrentWorkspace)

    const getData = useSWR(`/api/${workspaceId}/snippets/get?page=${1}`, axios)

    const name = useInput("slug", 2)
    const topic = useInput("text", 2)
    const message = useInput("text", 10)

    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const handleClose = () => {
        setOpen(false)
    }

    const refresh = () => {
        mutate(`/api/${workspaceId}/snippets/get?page=${1}`)
    }

    const onSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {

        setLoading(true)

        e.preventDefault()

        try {

            const body = {
                name: name.value, 
                topic: topic.value,
                message: message.value
            }

            const res = await axios.post(`/api/${workspaceId}/snippets/create`, body)

            toast.success(res.data.message)

            name.setValue("")
            topic.setValue("")
            message.setValue("")

            refresh()
            handleClose()

        } catch (e) {

            if (axios.isAxiosError(e)) {
                toast.error(e?.response?.data?.message)
            } else {
                console.error(e);
            }

        }

        setLoading(false)

    }

    useEffect(() => {
        
        const res = getData?.data as AxiosResponse

        const data : ApiResponse = res?.data

        if (data?.data) setData(data?.data)

    }, [getData])

    return (
        <DashboardLayout user={user}>

            <TemplateTab index={1} />

            <div className='mt-4 flex justify-end gap-4'>
                <div className='w-36'><LoadingButton onClick={() => setOpen(true)}> + Add Snippet</LoadingButton></div>
            </div>

            {
                data && data.length > 0 ?
                    <SnippetTable
                        columns={["Name", "Topic", "Message", "Date Added", "Action"]} 
                        data={data} workspaceId={workspaceId} refresh={refresh} />
                    :
                    <div className="flex flex-col items-center justify-center h-[60vh]">
                        <div className="mb-4">
                            <Image src="/images/empty.png" alt="No snippets" width={180} height={180} />
                        </div>
                        <div className="text-lg font-medium mb-2 text-gray-700">You haven’t added any snippet yet</div>
                        <button
                            className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                            onClick={() => setOpen(true)}
                        >
                            Add Snippet
                        </button>
                    </div>
            }

            <ModalWrapper title='Add message snippet' open={open} handleClose={handleClose}>

                <form onSubmit={onSubmit}>

                    <Input 
                        label='Name' name="name" type='text' 
                        placeholder='E.g sample_template' id="name"
                        helperText={name.errorMessage} value={name.value}
                        onChange={(e) => name.setValue(e.target.value)} 
                        error={name.errorWarning} 
                        onFocus={() => name.setOnFocus(true)}
                        />

                    <Input 
                        label='Topic' name="topic" type='text' 
                        placeholder='E.g example template' id="topic"
                        helperText={topic.errorMessage} value={topic.value}
                        onChange={(e) => topic.setValue(e.target.value)} 
                        error={topic.errorWarning}
                        onFocus={() => topic.setOnFocus(true)}
                        />

                    <Textarea 
                        label='Message' name='message' id='message' placeholder='Type your message here' 
                        helperText={message.errorMessage} value={message.value}
                        onChange={(value) => message.setValue(value)}
                        error={message.errorWarning}
                        onFocus={() => message.setOnFocus(true)}
                        />

                    <LoadingButton loading={loading}>Create</LoadingButton>

                </form>
            
            </ModalWrapper>

        </DashboardLayout>
    )

}