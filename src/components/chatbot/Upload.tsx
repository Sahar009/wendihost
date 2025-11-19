import { useState } from 'react';
import { toast } from 'react-toastify';

interface UploadProps {
    link: string | null;
    accept?: string;
    workspaceId: number;
    onUploadComplete?: (response: any) => void;
    onError?: (error: Error) => void;
}

export const Upload: React.FC<UploadProps> = ({ link, workspaceId, accept, onUploadComplete, onError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const response = await fetch(`/api/${workspaceId}/uploads`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      console.log('Upload component: API response:', data);
      
      if (data.status === 'success' && data.data) {
        toast.success('File uploaded successfully');
      onUploadComplete?.(data);
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload component: Upload error:', error);
      const errorMessage = error?.message || 'Failed to upload file. Please try again.';
      setUploadError(errorMessage);
      toast.error(errorMessage);
      onError?.(error as Error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <div 
        onClick={() => {
          if (isUploading) return;
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = accept || '';
          input.multiple = true;
          input.style.display = 'none';
          input.onchange = (e: Event) => handleFileChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
          document.body.appendChild(input);
          input.click();
          document.body.removeChild(input);
        }}
        className={`cursor-pointer w-full max-w-[200px] border-2 border-dashed rounded-lg flex items-center justify-center transition-colors ${
          isUploading 
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
            : uploadError
            ? 'border-red-300 hover:border-red-400'
            : link
            ? 'border-green-300 hover:border-green-400'
            : 'border-gray-300 hover:border-blue-500'
        }`}
      >
        <div className="text-center p-4">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Uploading...</p>
              </>
            ) : link ? (
                    <img src={link} alt="Upload" className="max-w-full h-auto rounded max-h-32 object-cover" />
                ) : (
                    <>
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-1 text-sm text-gray-600">
                            Click to upload
                        </p>
                    </>
            )}
        </div>
      </div>
      {uploadError && (
        <p className="mt-2 text-xs text-red-600">{uploadError}</p>
      )}
    </div>
  );
};