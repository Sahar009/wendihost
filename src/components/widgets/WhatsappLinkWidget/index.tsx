import Card from '@/components/dashboard/Card';
import Image from 'next/image';
import { useRouter } from 'next/router';

export default function WhatsappLinkWidget() {

  const router = useRouter();

  const handleCreateLink = () => {
    router.push('/dashboard/wa-short-links/create');
  };
  return (
    <Card>
      <div className="flex flex-col items-center justify-center p-6 h-full text-center">
        <div className="w-32 h-32 mb-6 flex items-center justify-center">
          <Image 
            src="/images/link icon.png" 
            alt="WhatsApp Link"
            width={128}
            height={128}
            className="w-full h-full object-contain"
          />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Customize WhatsApp Link</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
          Create shareable links & QR for your WA business number
        </p>

        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          onClick={handleCreateLink}
        >
          Create Link
        </button>
      </div>
    </Card>
  );
}
