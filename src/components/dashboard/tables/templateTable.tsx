import { MESSAGE_COMPONENT, MESSAGE_TEMPLATE } from "@/libs/interfaces";
import { BsThreeDotsVertical } from 'react-icons/bs';
import ModalWrapper from '@/components/utils/ModalWrapper';
import Image from 'next/image';
import axios from 'axios';
import { useState, useRef, useEffect } from 'react';
import { toast } from "react-toastify";

interface IProps {
    columns: string[],
    data: MESSAGE_TEMPLATE[],
    workspaceId: number,
    setPreview: (template: MESSAGE_COMPONENT[]) => void;
    refresh: () => void;
}

const TemplateTable = (props: IProps) => {
    const { setPreview, workspaceId, refresh } = props;
    const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
    const [deleteModal, setDeleteModal] = useState(false);
    const [selected, setSelected] = useState<MESSAGE_TEMPLATE | null>(null);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownOpen !== null &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRefs.current[dropdownOpen] &&
                !buttonRefs.current[dropdownOpen]?.contains(event.target as Node)
            ) {
                setDropdownOpen(null);
            }
        }
        if (dropdownOpen !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    const openDropdown = (idx: number) => setDropdownOpen(idx);
    const closeDropdown = () => setDropdownOpen(null);
    const openDeleteModal = (template: MESSAGE_TEMPLATE) => {
        setSelected(template);
        setDeleteModal(true);
        closeDropdown();
    };
    const closeDeleteModal = () => {
        setDeleteModal(false);
        setSelected(null);
    };
    const handleDelete = async () => {
        if (!selected) return;
        setLoading(true);
        try {
            await axios.post(`/api/${workspaceId}/template/delete`, { id: selected.id });
            closeDeleteModal();
            refresh();
        } catch (e) {
toast.error('failed to delete')        }
        setLoading(false);
    };

    const statusClass = (s: string) => {
        const v = (s || '').toUpperCase();
        if (v === 'APPROVED') return 'bg-green-100 text-green-700';
        if (v === 'PENDING' || v === 'SUBMITTED' || v === 'IN PROGRESS') return 'bg-yellow-100 text-yellow-700';
        if (v === 'REJECTED' || v === 'FAILED') return 'bg-red-100 text-red-700';
        return 'bg-gray-200 text-gray-700';
    };

    return (
        <div className="mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {props.data.map((template: MESSAGE_TEMPLATE, index: number) => {
                    const components = template.components;
                    const mainType = components.find(c => c.type !== undefined)?.type || 'Text';
                    const created = (template as any).createdAt ? new Date((template as any).createdAt) : null;
                    const createdLabel = created ? created.toLocaleDateString() : '';

                    return (
                        <div
                            key={index}
                            className="relative bg-white rounded-2xl shadow p-3 hover:shadow-lg transition cursor-pointer"
                            onClick={() => setPreview(template.components)}
                        >
                            {/* Image / Preview */}
                            <div className="relative rounded-xl overflow-hidden bg-gray-50 h-36">
                                <Image
                                    src={(template as any).thumbnail || '/images/template-card.png'}
                                    alt={template.name || 'Template'}
                                    fill
                                    className="object-cover"
                                />
                                <button
                                    ref={el => (buttonRefs.current[index] = el)}
                                    className="absolute top-2 right-2 p-2 rounded-xl bg-white/90 hover:bg-white border border-gray-200"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openDropdown(index);
                                    }}
                                    aria-label="More actions"
                                >
                                    <BsThreeDotsVertical size={18} />
                                </button>
                                {dropdownOpen === index && (
                                    <div
                                        ref={dropdownRef}
                                        className="absolute right-2 top-10 w-32 bg-white border rounded shadow z-10"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                                            onClick={() => openDeleteModal(template)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Meta */}
                            <div className="mt-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                                        {mainType}
                                    </span>
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${statusClass(template.status)}`}>
                                        {template.status}
                                    </span>
                                </div>
                                <div className="font-semibold text-base text-gray-900 line-clamp-2">
                                    {template.name || '-'}
                                </div>
                                {createdLabel && (
                                    <div className="text-xs text-gray-500 mt-1">{createdLabel}</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Delete Modal */}
            <ModalWrapper title='' open={deleteModal} handleClose={closeDeleteModal}>
                <div className="flex flex-col items-center justify-center p-2">
                    <div className="mb-2">
                        <Image width={200} height={200} alt='delete' src={'/images/delete.png'} />
                    </div>
                    <h3 className="text-xl font-bold text-red-600 mb-2">Delete Template</h3>
                    <p className="text-center text-gray-700 mb-4 max-w-xs">
                        Are you sure you want to delete this template? Know that when this is done, it cannot be reversed and all data and settings for this template will be completely erased.
                    </p>
                    <div className="flex w-full gap-2 mt-2">
                        <button
                            className="flex-1 border border-gray-300 rounded-md py-2 font-medium text-gray-700 bg-white hover:bg-gray-100 transition"
                            onClick={closeDeleteModal}
                            type="button"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-md py-2 font-medium transition disabled:opacity-60"
                            onClick={handleDelete}
                            type="button"
                            disabled={loading}
                        >
                            {loading ? 'Deleting...' : 'Delete Template'}
                        </button>
                    </div>
                </div>
            </ModalWrapper>
        </div>
    );
}

export default TemplateTable;