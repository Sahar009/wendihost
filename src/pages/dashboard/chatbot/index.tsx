import React, { useEffect, useState } from 'react';
import { withIronSessionSsr } from 'iron-session/next'
import 'reactflow/dist/style.css';
import useSWR, { mutate } from 'swr'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session'
import LoadingButton from '@/components/utils/LoadingButton';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { DASHBOARD_ROUTES } from '@/libs/enums';
import ModalWrapper from '@/components/utils/ModalWrapper';
import Input from '@/components/auth/Input';
import useInput from '@/hooks/useInput';
import axios, { AxiosResponse } from 'axios';
import { ApiResponse } from '@/libs/types';
import { toast } from 'react-toastify';
import { saveEdges, saveNodes } from '@/store/slices/chatbotBuilderSlice';
import ChatbotTable from '@/components/dashboard/tables/chatbotTable';
import { getCurrentWorkspace } from '@/store/slices/system';
import { Chatbot } from "@prisma/client";


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

export default function Chats(props: IProps) {

  const [data, setData] = useState([])

  const dispatch = useDispatch()

  const router = useRouter()

  const user = JSON.parse(props.user)

  const { id: workspaceId } = useSelector(getCurrentWorkspace)

  const getChatbots = useSWR(`/api/${workspaceId}/chatbot/gets?page=${1}`, axios)

  const refresh = () => {
    mutate(`/api/${workspaceId}/chatbot/gets?page=${1}`)
  }

  const name = useInput("text", 3)
  const trigger = useInput("text", 3)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [defaultBot, setDefaultBot] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false);
  const [selected, setSelected] = useState<Chatbot | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const clear = () => {
    dispatch(saveNodes([]))
    dispatch(saveEdges([]))
  }

  const newChatbot = () => {
    setOpen(true)
    clear()
  }


  const createBot = async() => {

    setLoading(true)

    try {

      const body = { 
        name: name.value, 
        trigger: trigger.value,
        defaultBot 
      }

      console.log('🤖 Frontend sending:', body)

      const res : AxiosResponse = await axios.post(`/api/${workspaceId}/chatbot/new`, body)

      const data : ApiResponse = res?.data

      toast.success(data.message)

      router.push(`/${DASHBOARD_ROUTES.CHATBOT}/${data?.data?.id}`)

    } catch (e) {

      if (axios.isAxiosError(e)) {
        toast.error(e?.response?.data?.message)
      } else {
        console.error(e);
      }
        
    }
    setLoading(false)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const deleteChatbot = async (id: number) => {
    setLoadingDelete(true);
    try {
      const res = await axios.delete(`/api/${workspaceId}/chatbot/${id}/delete`);
      toast.success(res.data.message);
      refresh();
      setDeleteModal(false);
    } catch (e) {
      if (axios.isAxiosError(e)) {
        toast.error(e?.response?.data?.message);
      } else {
        console.error(e);
      }
    }
    setLoadingDelete(false);
  };

  useEffect(() => {
        
    const res = getChatbots?.data as AxiosResponse

    const data : ApiResponse = res?.data

    if (data?.data) setData(data?.data)

  }, [getChatbots.data])


  return (
    <DashboardLayout user={user}>

      <div className='flex justify-end'>

        <div className='w-48'>
          <LoadingButton  onClick={newChatbot}>Create new bot</LoadingButton>
        </div>
 
      </div>

      <ChatbotTable
        clear={clear}
        workspaceId={workspaceId}
        columns={["Bot Name", "Trigger", "Default", "Status", "Date", ""]}
        data={data}
        refresh={refresh}
        deleteModal={deleteModal}
        setDeleteModal={setDeleteModal}
        selected={selected}
        setSelected={setSelected}
      />
      <ModalWrapper title='Delete Snippet' open={deleteModal} handleClose={() => setDeleteModal(false)}>
        <p className="text-center text-lg font-medium mt-6 md:px-8">
          Are you sure you want to delete
          <strong className="text-red-600 mx-1 font-extrabold">{selected?.name}</strong> snippet
        </p>
        <div className="flex gap-4 justify-center mt-10">
          <div className="w-24">
            <LoadingButton loading={loadingDelete} onClick={() => deleteChatbot(selected?.id as number)} color="red">Yes</LoadingButton>
          </div>
          <div className="w-24">
            <LoadingButton onClick={() => setDeleteModal(false)} color="green">No</LoadingButton>
          </div>
        </div>
      </ModalWrapper>

      <ModalWrapper title='New Chatbot' open={open} handleClose={handleClose}>
        <div className="space-y-6 p-1">
          {/* Name Input Section */}
          <div className="space-y-2">
            <Input
              id='name'
              name='name'
              type='text'
              label='Chatbot Name'
              placeholder='Enter a descriptive name for your chatbot'
              value={name.value as string}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => name.setValue(e.target.value)}
              onFocus={() => name.setOnFocus(true)}
            />
            <p className="text-xs text-gray-500 ml-1">
              Choose a name that clearly describes what this chatbot does
            </p>
          </div>

          {/* Trigger Input Section */}
          <div className="space-y-2">
            <Input 
              id='trigger'
              name='trigger'
              type='text'
              label='Trigger Command' 
              value={trigger.value as string} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => trigger.setValue(e.target.value)} 
              onFocus={() => trigger.setOnFocus(true)}
              placeholder='E.g., /start, /help, /menu'
            />
            <p className="text-xs text-gray-500 ml-1">
              This is the command users will type to activate the chatbot
            </p>
          </div>

          {/* Default Bot Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="space-y-1">
              <label htmlFor="default" className="text-sm font-medium text-gray-700">
                Set as Default Bot
              </label>
              <p className="text-xs text-gray-500">
                {defaultBot 
                  ? "This chatbot will be the primary one for your workspace" 
                  : "This chatbot will be activated only by its trigger command"
                }
              </p>
            </div>
            <div className="flex items-center">
              <input 
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                id='default'
                name='default'
                type='checkbox'
                checked={defaultBot} 
                onChange={() => setDefaultBot(!defaultBot)} 
              />
            </div>
          </div>

          {/* Create Button */}
          <div className="pt-4">
            <LoadingButton 
              disabled={name.error} 
              loading={loading} 
              onClick={createBot}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
            >
              {loading ? 'Creating...' : 'Create Chatbot'}
            </LoadingButton>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-gray-400">
              You can customize your chatbot further after creation
            </p>
          </div>
        </div>
      </ModalWrapper>
      
    </DashboardLayout>
  )

}
