import React, { ReactNode, useEffect, useState, useRef } from "react";
import { AiOutlineSetting} from "react-icons/ai";
import { TbLogout} from "react-icons/tb";
import { DASHBOARD_ROUTES } from "@/libs/enums";
import { useRouter } from "next/router";
import { User } from "@/libs/interfaces";
import { Member, Workspace } from "@prisma/client";
import { useDispatch, useSelector } from "react-redux";
import { getAllWorkspace, getCurrentWorkspace, setAllWorkspace, setCurrentWorkspace } from "@/store/slices/system";
import ModalWrapper from "../utils/ModalWrapper";
import CreateWorkspace from "./CreateWorkspace";
import { BookUser, BotMessageSquare, LayoutDashboard, LayoutTemplate, Link2, MessageCircleMore, UserRoundPlus, Target } from "lucide-react";
import { Facebook } from "lucide-react";
import { FolderGit } from "lucide-react";

interface IProps {
    children: ReactNode;
    user: User | Member;
    hide?: boolean;
}

interface NAV {
    name: string;
    icon: ReactNode;
    link: DASHBOARD_ROUTES;
}

const navs: NAV[] = [
    {
        name: "Dashboard",
        icon: <LayoutDashboard className="text-gray-600 group-hover:text-white" size={18} />, 
        link: DASHBOARD_ROUTES.DASHBOARD
    },
    {
        name: "Contacts",
        icon: <BookUser className="text-gray-600 group-hover:text-white" size={18} />, 
        link: DASHBOARD_ROUTES.CONTACTS
    },
    {
        name: "Chats",
        icon: <MessageCircleMore className="text-gray-600 group-hover:text-white" size={18} />, 
        link: DASHBOARD_ROUTES.CHATS
    },
    {
        name: "Chat bots",
        icon: <BotMessageSquare className="text-gray-600 group-hover:text-white" size={18} />, 
        link: DASHBOARD_ROUTES.CHATBOT
    },
    {
        name: "Templates",
        icon: <LayoutTemplate className="text-gray-600 group-hover:text-white" size={18} />, 
        link: DASHBOARD_ROUTES.TEMPLATES
    },
    {
        name: "Short links",
        icon: <Link2  className="text-gray-600 group-hover:text-white" size={18} />, 
        link: DASHBOARD_ROUTES.SHORTS
    },
    {
        name: "Meta Ads",
        icon: <Facebook  className="text-gray-600 group-hover:text-white" size={18} />, 
        link: DASHBOARD_ROUTES.METAADS
    },
    {
        name: "Lead Generation",
        icon: <Target className="text-gray-600 group-hover:text-white" size={18} />, 
        link: DASHBOARD_ROUTES.LEADGEN
    },
    {
        name: "Reseller & Whitelabel",
        icon: <UserRoundPlus className="text-gray-600 group-hover:text-white" size={18} />, 
        link: DASHBOARD_ROUTES.RESELLER
    },
    {
        name: "Automations",
        icon: <FolderGit className="text-gray-600 group-hover:text-white" size={18} />, 
        link: DASHBOARD_ROUTES.AUTOMATIONS
    },
    {
        name: "Settings",
        icon: <AiOutlineSetting className="text-gray-600 group-hover:text-white" size={18} />, 
        link: DASHBOARD_ROUTES.SETTING
    },
    {
        name: "Logout",
        icon: <TbLogout className="text-gray-600 group-hover:text-white" size={18} />, 
        link: DASHBOARD_ROUTES.LOGOUT
    },
];

const DashboardLayout = (props: IProps) => {
    const [openAddWorkspace, setOpenAddWorkspace] = React.useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isWorkspaceChanging, setIsWorkspaceChanging] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const router = useRouter()
    const dispatch = useDispatch()

    const currentWorkspace = useSelector(getCurrentWorkspace)
    const allWorkspace = useSelector(getAllWorkspace)

    // Initialize workspaces on mount
    useEffect(() => {
        const userWorkspaces = (props.user as User).workspaces || [];
        if (userWorkspaces.length > 0) {
            // Set all workspaces in Redux
            dispatch(setAllWorkspace(userWorkspaces));
        }
    }, [props.user, dispatch]);

    // Set default workspace only on initial mount if none is selected
    const hasInitializedWorkspace = React.useRef(false);
    useEffect(() => {
        if (hasInitializedWorkspace.current) return; // Only run once on mount
        
        const userWorkspaces = (props.user as User).workspaces || [];
        // Only set default if no workspace is selected (id is 0 or undefined)
        if ((!currentWorkspace || currentWorkspace.id === 0) && userWorkspaces.length > 0) {
            const firstWorkspace = userWorkspaces[0];
            if (firstWorkspace) {
                dispatch(setCurrentWorkspace(firstWorkspace));
                hasInitializedWorkspace.current = true;
            }
        } else if (currentWorkspace && currentWorkspace.id > 0) {
            // Workspace is already set, mark as initialized
            hasInitializedWorkspace.current = true;
        }
    }, [props.user, dispatch, currentWorkspace]);

    const handleWorkspaceChange = async (workspace: Workspace) => {
        setIsWorkspaceChanging(true);
        try {
            dispatch(setCurrentWorkspace(workspace));
            await new Promise(resolve => setTimeout(resolve, 100));
        } finally {
            setIsWorkspaceChanging(false);
            setIsDropdownOpen(false);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-20 md:w-60 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
                {/* Logo */}
                <div className="p-6 flex items-center justify-center md:justify-start">
                    <h1 className="text-primary text-2xl font-paytone">
                        <span className="md:hidden text-center">W</span>
                        <span className="hidden md:inline">Wendi</span>
                    </h1>
                </div>
                
                {/* Main Navigation */}
                <nav className="flex-1 overflow-y-auto py-3 px-2">
                    <ul className="space-y-1">
                        {navs.slice(0, -2).map((item, index) => (
                            <li key={index}>
                                <a
                                    href={item.link}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        router.push(item.link);
                                    }}
                                    className={`group flex items-center p-2 rounded-lg transition-colors ${
                                        router.pathname === item.link 
                                            ? 'bg-primary text-white' 
                                            : 'text-gray-600 hover:bg-primary hover:text-white'
                                    }`}
                                >
                                    <span className="mr-2">{item.icon}</span>
                                    <span className="text-xs font-medium hidden md:inline">{item.name}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
                
                <div className="mt-auto ">
                    <div className="py-2">
                        <ul className="space-y-1">
                            {navs.slice(-2).map((item, index) => (
                                <li key={`settings-${index}`}>
                                    <a
                                        href={item.link}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            router.push(item.link);
                                        }}
                                        className={`group flex items-center p-2 rounded-lg transition-colors ${
                                            router.pathname === item.link 
                                                ? 'bg-primary text-white' 
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
                                        }`}
                                    >
                                        <span className="mr-2">{item.icon}</span>
                                        <span className="text-xs font-medium hidden md:inline">{item.name}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    {/* User Profile */}
                    <div className="p-4 bg-gray-50">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                {('name' in props.user && props.user?.name?.charAt(0)) || 
                                 ('firstName' in props.user && props.user?.firstName?.charAt(0)) || 'U'}
                            </div>
                            <div className="ml-3 hidden md:block">
                                <p className="text-sm font-medium text-gray-900">
                                    {'name' in props.user 
                                        ? props.user.name 
                                        : (props.user?.firstName && props.user?.lastName 
                                            ? `${props.user.firstName} ${props.user.lastName}`
                                            : 'User')}
                                </p>
                                <p className="text-xs text-gray-500">{'email' in props.user ? props.user.email : ''}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Workspace Selector */}
                
                {!(props.user as Member)?.role && !props.hide && (
        <div className="w-full px-3 sm:px-6 py-3 bg-white border-b border-gray-200">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
            <div className="font-medium text-lg sm:text-xl md:text-2xl text-gray-950 truncate pr-2">
              Welcome, {('firstName' in props.user && props.user.firstName) ? props.user.firstName : 'User'}.
            </div>
          
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button 
                onClick={() => setOpenAddWorkspace(true)} 
                className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base text-white bg-primary hover:bg-primary/90 rounded-md transition-colors duration-200 whitespace-nowrap"
              >
                Create new Workspace
              </button>
              <div className="relative w-full sm:w-60" ref={dropdownRef}>
                <div 
                  className="flex items-center justify-between w-full h-10 px-3 text-sm bg-white border border-gray-300 rounded-lg transition-all duration-200 cursor-pointer hover:border-primary/70 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  onClick={() => !isWorkspaceChanging && setIsDropdownOpen(!isDropdownOpen)}
                  onKeyDown={(e) => !isWorkspaceChanging && e.key === 'Enter' && setIsDropdownOpen(!isDropdownOpen)}
                  tabIndex={0}
                  role="button"
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                >
                  <div className="flex items-center">
                    {currentWorkspace?.name ? (
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 text-sm font-medium text-primary">
                        {currentWorkspace.name.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    )}
                    <span className={`truncate ${!currentWorkspace?.name ? 'text-gray-400' : 'text-gray-800'}`}>
                      {isWorkspaceChanging ? 'Changing...' : (currentWorkspace?.name || 'Select workspace')}
                    </span>
                  </div>
                  {isWorkspaceChanging ? (
                    <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  ) : (
                    <svg 
                      className={`ml-2 h-4 w-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
                
                {isDropdownOpen && (
                  <div 
                    className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-lg py-1 text-base border border-gray-200 focus:outline-none sm:text-sm"
                    role="listbox"
                    aria-labelledby="workspace-selector"
                  >
                    {Array.isArray(allWorkspace) && allWorkspace.map((workspace: Workspace, index: number) => (
                      <div
                        key={workspace.id}
                        onClick={() => !isWorkspaceChanging && handleWorkspaceChange(workspace)}
                        onKeyDown={(e) => !isWorkspaceChanging && e.key === 'Enter' && handleWorkspaceChange(workspace)}
                        className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                          workspace.id === currentWorkspace?.id 
                            ? 'bg-primary/5 text-primary font-medium' 
                            : 'text-gray-700 hover:bg-gray-50'
                        } ${isWorkspaceChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
                        role="option"
                        aria-selected={workspace.id === currentWorkspace?.id}
                        tabIndex={0}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 text-sm font-medium text-primary">
                              {workspace.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate">{workspace.name}</span>
                          </div>
                          {workspace.id === currentWorkspace?.id && (
                            <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
                
                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gray-50">
                   
                    {props.children}
                </main>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around">
                {navs.slice(0, 4).map((nav, index) => (
                    <button
                        key={index}
                        onClick={() => router.push(nav.link)}
                        className={`p-2 rounded-full ${
                            router.pathname === nav.link 
                                ? 'bg-primary/10 text-primary' 
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {nav.icon}
                    </button>
                ))}
            </div>

            {/* Workspace Modal */}
            <ModalWrapper 
                title='Add Workspace' 
                open={openAddWorkspace} 
                handleClose={() => setOpenAddWorkspace(false)}
            >
                <CreateWorkspace handleClose={() => setOpenAddWorkspace(false)} />
            </ModalWrapper>
        </div>
    );
}

export default DashboardLayout;