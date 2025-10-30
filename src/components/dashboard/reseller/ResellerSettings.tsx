import Input from "@/components/auth/Input"
import LoadingButton from "@/components/utils/LoadingButton"
import useInput from "@/hooks/useInput"
import { ApiResponse } from "@/libs/types"
import { Reseller } from "@prisma/client"
import axios, { AxiosResponse } from "axios"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import useSWR, { mutate } from 'swr'


const ResellerSettings = () => {

    const getReseller = useSWR(`/api/reseller/get`, axios)

    const subdomain = useInput("slug", 2, "")
    const domain = useInput("slug", 2, "")
    const name = useInput("slug", 2, "")

    const [subDomain, setSubDomain] = useState("")

    const [loading, setLoading] = useState(false)


    const update = async () => {

        setLoading(true)

        try {

            const body = {  domain: domain.value, subdomain: subdomain.value, name: name.value  }

            const res = await axios.post(`/api/reseller/update-domain`, body)

            mutate(getReseller)

            toast.success(res.data.message)

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
        mutate(getReseller)
    }, [getReseller])

    useEffect(() => {
        
        const res = getReseller?.data as AxiosResponse
    
        const data : ApiResponse = res?.data
    
        if (data?.data) {
            setSubDomain(String(data?.data?.subdomain))
            subdomain.setValue(String(data?.data?.subdomain))
            domain.setValue(String(data?.data?.domain))
            name.setValue(String(data?.data?.logoText))
        }
    
    }, [getReseller.data, name, domain, subdomain])

    return (
        <div className="flex flex-col md:flex-row min-h-[70vh] bg-gray-50 py-8 px-2 md:px-8">
          <div className="flex-1 flex flex-col justify-center md:items-start items-center md:pr-12 mb-8 md:mb-0">
            <h2 className="text-xl font-bold mb-2">Configure White Label</h2>
            <p className="text-gray-700 mb-2 max-w-md">
              Setup a custom name for your wendi account to personalize your links to match your brand.
            </p>
            <p className="text-gray-700 mb-2 max-w-md">
              Create a CNAME record from your domain registrar and point it to <span className="font-mono">wendi.app</span> OR an A record to <span className="font-mono">38.242.153.189</span>.
            </p>
            <p className="mb-2 max-w-md">
              <Link 
                target="_blank"
                className="inline-block px-3 py-1  text-blue-600 rounded hover:bg-blue-50 transition mr-1" 
                href={"https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain/"}>
                Click here
              </Link>
              <span className="text-gray-700">to learn how to record</span>
            </p>
            {subDomain && (
              <p className="text-gray-700 text-sm mt-2 max-w-md">
                <span className="font-semibold">Customize subdomain:</span> 
                <Link 
                  target="_blank"
                  className="text-blue-500 hover:text-blue-600 active:text-blue-600 ml-1" 
                  href={`https://${subDomain}.wendi.app`}>
                  https://{subDomain}.wendi.app
                </Link>
              </p>
            )}
          </div>
          {/* Right form section */}
          <div className="flex-1 flex justify-center items-center">
            <form className="w-full max-w-md bg-white rounded-xl shadow p-8" onSubmit={e => {e.preventDefault(); update();}}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-1">Customised subdomain</label>
                <input
                  type="text"
                  placeholder="Customised subdomain"
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50"
                  value={subdomain.value || ""}
                  onChange={e => subdomain.setValue(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-1">Your brand name</label>
                <input
                  type="text"
                  placeholder="Your brand name"
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50"
                  value={name.value || ""}
                  onChange={e => name.setValue(e.target.value)}
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-1">Your custom url</label>
                <input
                  type="text"
                  placeholder="Your custom url"
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50"
                  value={domain.value || ""}
                  onChange={e => domain.setValue(e.target.value)}
                />
              </div>
              <LoadingButton loading={loading}  className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition">Save</LoadingButton>
            </form>
          </div>
        </div>
      )
}

export default ResellerSettings