import { ReactNode, useState } from "react"
import ContactList from "./ContactList"
import NewChat from "./NewChat"
import { Menu } from "lucide-react"

interface IProps {
    children?: ReactNode
}

const ChatLayout = (props: IProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="relative h-full w-full flex">
            {/* Mobile sidebar toggle button */}
            <button
                className="md:hidden fixed top-4 left-4 z-20 bg-white rounded-full shadow p-2 border border-gray-200"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
            >
                <Menu size={24} />
            </button>

            {/* Sidebar (ContactList) */}
            <div
                className={`
                    fixed inset-0 z-10 bg-black bg-opacity-40 transition-opacity duration-300
                    ${sidebarOpen ? 'block' : 'hidden'}
                    md:static md:z-auto md:bg-transparent md:block
                `}
                onClick={() => setSidebarOpen(false)}
            >
                <div
                    className={`
                        absolute left-0 top-0 h-full w-4/5 max-w-xs bg-white shadow-lg transform transition-transform duration-300
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                        md:static md:transform-none md:shadow-none md:w-full md:max-w-none md:h-full
                    `}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="md:hidden flex justify-end p-2">
                        <button onClick={() => setSidebarOpen(false)} className="text-gray-500">✕</button>
                    </div>
                    <div className="h-full">
                        <ContactList />
                    </div>
                </div>
            </div>

            {/* Main chat area */}
            <div className="h-full w-full md:ml-0 md:pl-[0]">
                <div className="h-full">
                    {props.children ? (
                        props.children
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full relative overflow-hidden z-0 p-4">
                            <img src="/images/image 2.png" alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none select-none" />
                            <div className="relative z-10 flex flex-col items-center justify-center h-full">
                                <img src="/images/contact book.png" alt="Select contact" className="w-32 h-32 sm:w-40 sm:h-40 mb-6" />
                                <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Select a contact to start chatting with them</h2>
                                <p className="text-gray-500 mb-4 text-center text-sm sm:text-base">Import or add new contacts to start chatting with them</p>
                                <div className="z-20"><NewChat /></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ChatLayout