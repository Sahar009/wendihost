import { useState } from 'react';
import LoadingButton from '@/components/utils/LoadingButton';
import PhoneNumber from '@/components/utils/PhoneNumber';
import axios from 'axios';
import { toast } from 'react-toastify';

const TestApi = ({workspaceId}: {workspaceId: string}) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState<number[] | null>(null);



    const handleSubmit = async () => {
        try {
            setLoading(true);
            const response = await axios.post(`/api/${workspaceId}/waba/test-api`, { phone: phoneNumber });
            const data = response.data.data
            setCode(data.toString().split(''))
        } catch (err) {
            toast.error('Failed to submit phone number');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4">

            {
                code && (
                    <div className="flex justify-center gap-2 py-6 pb-12">
                        {code.map((digit, index) => (
                            <div key={index} className="w-12 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl font-bold text-gray-700">
                                {digit}
                            </div>
                        ))}
                    </div>
                )
            }

            {
                !code && (
                    <>
                        <div className="flex flex-col gap-2">
                            <PhoneNumber phone={phoneNumber} onChange={setPhoneNumber} />
                        </div>

                        <LoadingButton 
                            loading={loading} 
                            onClick={handleSubmit}
                            color="blue">
                            Test API
                        </LoadingButton>
                    </>)
            }

        </div>
    );
};

export default TestApi;