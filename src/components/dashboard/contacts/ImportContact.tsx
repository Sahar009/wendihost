import LoadingButton from "@/components/utils/LoadingButton"
import axios from "axios"
import { useState, useRef } from "react"
import { toast } from "react-toastify"
import { FaFileCsv } from "react-icons/fa"

interface IProps {
    workspaceId: number;
    refresh(): void
    handClose(): void
}

const MAX_FILE_SIZE_MB = 50;

const ImportContact = (props: IProps) => {
    const [loading, setLoading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [fileError, setFileError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFileError(null);
        const files = event.target.files;
        if (!files || files.length === 0) return;
        const selectedFile = files[0];
        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = (selectedFile: File) => {
        if (!selectedFile.name.endsWith('.csv')) {
            setFileError("Please upload a .csv file.");
            setFile(null);
            return;
        }
        if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setFileError(`File size exceeds ${MAX_FILE_SIZE_MB}MB.`);
            setFile(null);
            return;
        }
        setFile(selectedFile);
        setFileError(null);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragActive(false);
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            validateAndSetFile(event.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragActive(false);
    };

    const onSubmit = async () => {
        if (!file) {
            setFileError("Please select a CSV file to upload.");
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await axios.post(`/api/${props.workspaceId}/contacts/import`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success(res.data.message || "Contacts imported successfully");
            props.handClose();
            props.refresh();
        } catch (e) {
            if (axios.isAxiosError(e)) {
                toast.error(e?.response?.data?.message || "Failed to import contacts");
            } else {
                console.error(e);
            }
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center p-6">
            <div
                className={`w-60 h-48 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <FaFileCsv className="text-4xl text-gray-400 mb-2" />
                <div className="font-medium text-gray-700 mb-1">Upload CSV</div>
                <div className="text-xs text-gray-500 text-center mb-2">Upload your contacts file in .csv format.<br />Up to 50MB file size is allowed.</div>
                {file && <div className="text-xs text-green-600 mt-1">{file.name}</div>}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>
            {fileError && <div className="text-red-500 text-xs mt-2">{fileError}</div>}
            <LoadingButton
                loading={loading}
                onClick={onSubmit}
                className="w-full mt-6 bg-primary text-white py-2 rounded-md text-base font-semibold shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
                Save
            </LoadingButton>
        </div>
    );
}

export default ImportContact;