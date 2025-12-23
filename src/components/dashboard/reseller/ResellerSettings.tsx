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
import Image from 'next/image'


const ResellerSettings = () => {

    const getReseller = useSWR(`/api/reseller/get`, axios)

    const subdomain = useInput("slug", 2, "")
    const domain = useInput("slug", 2, "")
    const name = useInput("slug", 2, "")

    const [subDomain, setSubDomain] = useState("")
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [isUploadingLogo, setIsUploadingLogo] = useState(false)

    const [loading, setLoading] = useState(false)


    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files?.length) return;

        try {
            setIsUploadingLogo(true);
            
            const file = files[0];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
            
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error('Logo upload failed');
            }

            const result = await response.json();
            setLogoUrl(result.secure_url);
            
            // Update reseller with logo URL
            const updateRes = await axios.post(`/api/reseller/update-domain`, {
                domain: domain.value,
                subdomain: subdomain.value,
                name: name.value,
                logo: result.secure_url
            });
            
            mutate(getReseller);
            toast.success('Logo uploaded successfully');
        } catch (error) {
            console.error('Logo upload error:', error);
            toast.error('Failed to upload logo. Please try again.');
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const update = async () => {

        setLoading(true)

        try {

            const body = {  
                domain: String(domain.value || '').trim(), 
                subdomain: String(subdomain.value || '').trim(), 
                name: String(name.value || '').trim(),
                logo: logoUrl || undefined
            }

            const res = await axios.post(`/api/reseller/update-domain`, body)

            mutate(`/api/reseller/get`)

            toast.success(res.data.message)

        } catch (e) {

            if (axios.isAxiosError(e)) {
                const errorMessage = e?.response?.data?.message || 'Failed to update settings'
                toast.error(errorMessage)
                console.error('Update error:', e?.response?.data)
            } else {
                console.error('Update error:', e);
                toast.error('An unexpected error occurred')
            }

        } finally {
            setLoading(false)
        }

    }

    useEffect(() => {
        const res = getReseller?.data as AxiosResponse
    
        const data : ApiResponse = res?.data
    
        if (data?.data) {
            const resellerData = data.data;
            setSubDomain(String(resellerData?.subdomain || ''))
            subdomain.setValue(String(resellerData?.subdomain || ''))
            domain.setValue(String(resellerData?.domain || ''))
            name.setValue(String(resellerData?.logoText || ''))
            setLogoUrl(resellerData?.logo || null)
        }
    
    }, [getReseller.data])

    return (
        <div className="flex flex-col md:flex-row min-h-[70vh] bg-gray-50 py-8 px-2 md:px-8">
          <div className="flex-1 flex flex-col justify-center md:items-start items-center md:pr-12 mb-8 md:mb-0">
            <h2 className="text-xl font-bold mb-2">Configure White Label</h2>
            <p className="text-gray-700 mb-2 max-w-md">
              Setup a custom name for your wendi account to personalize your links to match your brand.
            </p>
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-gray-700 mb-2 font-semibold">⚠️ DNS Configuration Required</p>
              <p className="text-gray-700 text-sm mb-2">
                For subdomains to work, you need to configure DNS. Choose one option:
              </p>
              <div className="text-sm text-gray-700 space-y-2">
                <p><strong>Option 1 (Recommended):</strong> Wildcard A record</p>
                <div className="bg-white p-2 rounded font-mono text-xs">
                  Type: A<br/>
                  Name: *<br/>
                  Value: 38.242.153.189
                </div>
                <p className="mt-2"><strong>Option 2:</strong> Individual subdomain record</p>
                <div className="bg-white p-2 rounded font-mono text-xs">
                  Type: A<br/>
                  Name: {subDomain || 'your-subdomain'}<br/>
                  Value: 38.242.153.189
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                DNS changes can take 1-48 hours to propagate. You&apos;ll also need a wildcard SSL certificate for HTTPS.
              </p>
            </div>
            <p className="mb-2 max-w-md">
              <Link 
                target="_blank"
                className="inline-block px-3 py-1  text-blue-600 rounded hover:bg-blue-50 transition mr-1" 
                href={"https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain/"}>
                Click here
              </Link>
              <span className="text-gray-700">to learn how to set up DNS records</span>
            </p>
            {subDomain && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-gray-700 text-sm">
                  <span className="font-semibold">Your subdomain URL:</span> 
                  <Link 
                    target="_blank"
                    className="text-blue-500 hover:text-blue-600 active:text-blue-600 ml-1" 
                    href={`https://${subDomain}.wendi.app`}>
                    https://{subDomain}.wendi.app
                  </Link>
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  This will work after DNS is configured and propagated.
                </p>
              </div>
            )}
          </div>
          {/* Right form section */}
          <div className="flex-1 flex justify-center items-center">
            <form className="w-full max-w-md bg-white rounded-xl shadow p-8" onSubmit={e => {e.preventDefault(); update();}}>
              {/* Logo Upload Section */}
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Logo</label>
                <div className="flex items-center gap-4">
                  {logoUrl && (
                    <div className="relative w-24 h-24 border-2 border-gray-200 rounded-lg overflow-hidden">
                      <Image 
                        src={logoUrl} 
                        alt="Logo" 
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="cursor-pointer">
                      <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        isUploadingLogo 
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                          : 'border-gray-300 hover:border-blue-400 bg-gray-50'
                      }`}>
                        {isUploadingLogo ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="ml-2 text-sm text-gray-600">Uploading...</span>
                          </div>
                        ) : (
                          <>
                            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="mt-1 text-xs text-gray-600">
                              {logoUrl ? 'Click to change logo' : 'Click to upload logo'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={isUploadingLogo}
                      />
                    </label>
                  </div>
                </div>
              </div>
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