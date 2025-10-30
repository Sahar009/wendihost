import { useState } from 'react';
import { v2 as cloudinary } from 'cloudinary';

interface UploadProps {
    link: string | null;
    accept?: string;
    workspaceId: number;
    onUploadComplete?: (response: any) => void;
    onError?: (error: Error) => void;
}

export const Upload: React.FC<UploadProps> = ({ link, workspaceId, accept, onUploadComplete, onError }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    try {
      setIsUploading(true);
      
      const uploadPromises = Array.from(files).map(async (file) => {
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
          throw new Error('Upload failed');
        }

        return response.json();
      });

      const results = await Promise.all(uploadPromises);
      onUploadComplete?.(results);
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <div 
        onClick={() => {
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
        className="cursor-pointer w-full max-w-[200px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-500 transition-colors"
      >
        <div className="text-center">
            {
                link ? (
                    <img src={link} alt="Upload"  />
                ) : (
                    <>
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-1 text-sm text-gray-600">
                            Click to upload
                        </p>
                    </>
                )
            }
        </div>
      </div>
      {isUploading && <p>Uploading...</p>}
    </div>
  );
};