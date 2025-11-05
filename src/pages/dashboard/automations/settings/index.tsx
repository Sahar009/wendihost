import React, { useState, useEffect } from 'react';
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { withIronSessionSsr } from 'iron-session/next';
import { Clock, Settings, Save, X, Plus, AlertCircle, MessageSquare, Bot, Brain, FileText, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { getCurrentWorkspace } from '@/store/slices/system';
import { toast } from 'react-toastify';

export const getServerSideProps = withIronSessionSsr(async ({ req, res }) => {
    const user = await validateUser(req);
    const data = user as any;

    if (data?.redirect) return sessionRedirects(data?.redirect);

    return {
        props: {
            user: JSON.stringify(user),
        },
    };
}, sessionCookie());

interface IProps {
    user: string;
}

interface WorkingHours {
    day: string;
    open: boolean;
    startTime: string;
    endTime: string;
}

interface AutomationRule {
    id: string;
    enabled: boolean;
    description: string;
    responseType: 'text' | 'chatbot' | 'ai' | 'template';
    materialId?: string;
    materialName?: string;
    threshold?: number;
    chatbotFlow?: string;
    chatbotFlowName?: string;
    aiPrompt?: string;
    templateName?: string;
    templateVariables?: Record<string, string>;
}

const AutomationsSettingsPage = (props: IProps) => {
    const user = props.user ? JSON.parse(props.user) : {};
    const router = useRouter();
    
    const workspace = useSelector(getCurrentWorkspace);
    const { id: workspaceId } = workspace || {};
    const routerWorkspaceId = router.query.workspaceId as string;
    const finalWorkspaceId = workspaceId || routerWorkspaceId;
    
 
    // Working Hours State
    const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
    const [holidayMode, setHolidayMode] = useState(false);
    const [workingHours, setWorkingHours] = useState<WorkingHours[]>([
        { day: 'Monday', open: true, startTime: '09:00', endTime: '23:59' },
        { day: 'Tuesday', open: true, startTime: '09:00', endTime: '23:59' },
        { day: 'Wednesday', open: true, startTime: '09:00', endTime: '23:59' },
        { day: 'Thursday', open: true, startTime: '03:00', endTime: '23:59' },
        { day: 'Friday', open: true, startTime: '09:00', endTime: '23:59' },
        { day: 'Saturday', open: true, startTime: '09:00', endTime: '23:59' },
        { day: 'Sunday', open: true, startTime: '09:00', endTime: '17:00' },
    ]);

    const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
        {
            id: '1',
            enabled: true,
            responseType: 'template',
            description: 'When it is not working hours, reply with this template',
            templateName: 'out_of_hours_message',
        },
        {
            id: '2',
            enabled: false,
            responseType: 'template',
            description: 'When there is no customer service online during working hours, reply with this template',
            templateName: '',
        },
        {
            id: '3',
            enabled: true,
            responseType: 'template',
            description: 'Send this welcome template when a new chat is started',
            templateName: 'welcome_message',
        },
        {
            id: '4',
            enabled: false,
            responseType: 'template',
            description: 'During working hours, users wait more than',
            threshold: 15,
            templateName: '',
        },
        {
            id: '5',
            enabled: false,
            responseType: 'template',
            description: 'Send this fallback template if no criteria is met',
            templateName: '',
        },
        {
            id: '6',
            enabled: false,
            responseType: 'template',
            description: 'If customer does not respond within 24 hours, use this template',
            templateName: '',
        },
        {
            id: '7',
            enabled: false,
            responseType: 'text',
            description: 'Expired or Closed chat will not be assigned to Bot but leave the last assignee in case of new message',
            aiPrompt: 'This chat has expired or been closed. Please contact support for assistance.',
        },
        {
            id: '8',
            enabled: false,
            responseType: 'template',
            description: 'During out of office, send this template always',
            templateName: '',
        },
        {
            id: '9',
            enabled: false,
            responseType: 'text',
            description: 'Assign newly opened chats in round robin manner within users of the assigned team',
            aiPrompt: 'Your chat has been assigned to our team. An agent will be with you shortly.',
        },
    ]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [chatbotFlows, setChatbotFlows] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loadingChatbots, setLoadingChatbots] = useState(false);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    useEffect(() => {
        if (finalWorkspaceId) {
            loadSettings();
            loadChatbotFlows();
            loadTemplates();
        } else {
            console.log(' No finalWorkspaceId yet, skipping load functions');
        }
    }, [finalWorkspaceId]);

    const loadSettings = async () => {
        if (!finalWorkspaceId) return;
        
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            const response = await axios.get(`/api/${finalWorkspaceId}/automation/settings`);
            if (response.status === 200) {
                const data = response.data;
                
                // Ensure workingHours is an array
                if (Array.isArray(data.workingHours)) {
                    setWorkingHours(data.workingHours);
                } else {
                    console.warn('workingHours is not an array:', data.workingHours);
                    setWorkingHours([
                        { day: 'Monday', open: true, startTime: '09:00', endTime: '17:00' },
                        { day: 'Tuesday', open: true, startTime: '09:00', endTime: '17:00' },
                        { day: 'Wednesday', open: true, startTime: '09:00', endTime: '17:00' },
                        { day: 'Thursday', open: true, startTime: '09:00', endTime: '17:00' },
                        { day: 'Friday', open: true, startTime: '09:00', endTime: '17:00' },
                        { day: 'Saturday', open: false, startTime: '09:00', endTime: '17:00' },
                        { day: 'Sunday', open: false, startTime: '09:00', endTime: '17:00' },
                    ]);
                }
                
                // Ensure automationRules is an array
                if (Array.isArray(data.automationRules)) {
                    const rulesWithResponseType = data.automationRules.map((rule: any) => ({
                        ...rule,
                        responseType: rule.responseType || 'text' // Default to 'text' if missing
                    }));
                    setAutomationRules(rulesWithResponseType);
                } else {
                    console.warn('automationRules is not an array:', data.automationRules);
                    // Keep the default rules if API doesn't return valid data
                }
                
                setHolidayMode(data.holidayMode || false);
            }
        } catch (err: any) {
            console.error('Error loading settings:', err);
            setError('Error loading settings');
        } finally {
            setLoading(false);
        }
    };

    const loadChatbotFlows = async () => {
       
        if (!finalWorkspaceId) {
               
            return;
        }
        
        setLoadingChatbots(true);
        setError(null);
        setSuccess(null);
        
        try {
            const url = `/api/${finalWorkspaceId}/chatbot/gets`;
            
            const response = await axios.get(url);
          
            if (response.data.status === 'success') {
                const flows = response.data.data || [];
                setChatbotFlows(flows);
                setSuccess(`Loaded ${flows.length} chatbot flows successfully!`);
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(`Chatbot API error: ${response.data.message || 'Unknown error'}`);
                toast.error(`Failed to load chatbot flows: ${response.data.message || 'Unknown error'}`);
            }
        } catch (err: any) {
            if (err.response) {
                setError(`Failed to load chatbots: ${err.response.status} - ${err.response.data?.message || 'Unknown error'}`);
            } else if (err.request) {
                setError('Failed to load chatbots: No response from server');
            } else {
                setError(`Failed to load chatbots: ${err.message}`);
            }
        } finally {
            setLoadingChatbots(false);
        }
    };

    const loadTemplates = async () => {
        if (!finalWorkspaceId) {
            return;
        }
        
        setLoadingTemplates(true);
        setError(null);
        setSuccess(null);
        
        try {
            const url = `/api/${finalWorkspaceId}/template/get`;
            
            const response = await axios.get(url);
          
            if (response.data.status === 'success') {
                const templates = response.data.data || [];
               
                setTemplates(templates);
                setSuccess(`Loaded ${templates.length} templates successfully!`);
                toast.success(`Loaded ${templates.length} templates successfully! 📋`);
                setTimeout(() => setSuccess(null), 3000);
            } else {
               
                setError(`Template API error: ${response.data.message || 'Unknown error'}`);
                toast.error(`Failed to load templates: ${response.data.message || 'Unknown error'}`);
            }
        } catch (err: any) {
            
            if (err.response) {
               
                setError(`Failed to load templates: ${err.response.status} - ${err.response.data?.message || 'Unknown error'}`);
            } else if (err.request) {
               
                setError('Failed to load templates: No response from server');
            } else {
               
                setError(`Failed to load templates: ${err.message}`);
            }
        } finally {
           
            setLoadingTemplates(false);
        }
    };

    const toggleDayOpen = (dayIndex: number) => {
        setWorkingHours(prev => prev.map((day, index) => 
            index === dayIndex ? { ...day, open: !day.open } : day
        ));
    };

    const updateWorkingHours = (dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
        setWorkingHours(prev => prev.map((day, index) => 
            index === dayIndex ? { ...day, [field]: value } : day
        ));
    };

    const addTimeSlot = (dayIndex: number) => {
        console.log('Adding time slot for', workingHours[dayIndex].day);
    };

    const ensureResponseType = (rules: AutomationRule[]): AutomationRule[] => {
        return rules.map(rule => ({
            ...rule,
            responseType: rule.responseType || 'text'
        }));
    };

    const toggleRule = (ruleId: string) => {
        setAutomationRules(prev => {
            const updated = prev.map(rule => 
                rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
            );
            return ensureResponseType(updated);
        });
    };

    const updateRuleMaterial = (ruleId: string, materialId: string, materialName: string) => {
        setAutomationRules(prev => prev.map(rule => 
            rule.id === ruleId ? { ...rule, materialId, materialName } : rule
        ));
    };

    const updateRuleThreshold = (ruleId: string, threshold: number) => {
        setAutomationRules(prev => prev.map(rule => 
            rule.id === ruleId ? { ...rule, threshold } : rule
        ));
    };

    const updateRuleResponseType = (ruleId: string, responseType: 'text' | 'chatbot' | 'ai' | 'template') => {
        setAutomationRules(prev => prev.map(rule => 
            rule.id === ruleId ? { ...rule, responseType } : rule
        ));
    };

    const updateRuleChatbotFlow = (ruleId: string, chatbotFlow: string, chatbotFlowName: string) => {
        setAutomationRules(prev => prev.map(rule => 
            rule.id === ruleId ? { ...rule, chatbotFlow, chatbotFlowName } : rule
        ));
    };

    const updateRuleAIPrompt = (ruleId: string, aiPrompt: string) => {
        setAutomationRules(prev => prev.map(rule => 
            rule.id === ruleId ? { ...rule, aiPrompt } : rule
        ));
    };

    const updateRuleTemplate = (ruleId: string, templateName: string) => {
        setAutomationRules(prev => prev.map(rule => 
            rule.id === ruleId ? { ...rule, templateName } : rule
        ));
    };

    // Validation function for automation rules
    const validateAutomationRules = (rules: AutomationRule[]): string[] => {
        const errors: string[] = [];
        
        rules.forEach((rule, index) => {
            if (rule.enabled) {
                if (!rule.responseType) {
                    errors.push(`Rule ${index + 1}: Response type is required`);
                    return;
                }
                
                switch (rule.responseType) {
                    case 'text':
                        if (!rule.aiPrompt || rule.aiPrompt.trim() === '') {
                            errors.push(`Rule ${index + 1}: Please enter a custom message for text type`);
                        }
                        break;
                    case 'chatbot':
                        if (!rule.chatbotFlow || rule.chatbotFlow.trim() === '') {
                            errors.push(`Rule ${index + 1}: Please select a chatbot flow for chatbot type`);
                        }
                        break;
                    case 'ai':
                        if (!rule.aiPrompt || rule.aiPrompt.trim() === '') {
                            errors.push(`Rule ${index + 1}: Please enter an AI prompt for AI type`);
                        }
                        break;
                    case 'template':
                        if (!rule.templateName || rule.templateName.trim() === '') {
                            errors.push(`Rule ${index + 1}: Please select a WhatsApp template for template type`);
                        }
                        break;
                }
                
                if (rule.description.includes('wait more than') && (!rule.threshold || rule.threshold <= 0)) {
                    errors.push(`Rule ${index + 1}: Valid threshold is required for time-based rules`);
                }
            }
        });
        
        return errors;
    };

    const validateWorkingHours = (hours: WorkingHours[]): string[] => {
        const errors: string[] = [];
        
        hours.forEach((day, index) => {
            if (day.open) {
                if (day.startTime >= day.endTime) {
                    errors.push(`${day.day}: Start time must be before end time`);
                }
                
                if (!day.startTime || !day.endTime) {
                    errors.push(`${day.day}: Both start and end times are required`);
                }
            }
        });
        
        return errors;
    };

    const handleSaveWorkingHours = async () => {
        if (!finalWorkspaceId) return;
        
        setSaving(true);
        setError(null);
        
        try {
            const validationErrors = validateWorkingHours(workingHours);
            if (validationErrors.length > 0) {
                setError(`Working hours validation errors: ${validationErrors.join(', ')}`);
                toast.error(`Working hours validation errors: ${validationErrors.join(', ')}`);
                return;
            }

            const response = await axios.put(`/api/${finalWorkspaceId}/automation/settings`, {
                holidayMode,
                workingHours,
                automationRules
            });

            if (response.status === 200) {
                setShowWorkingHoursModal(false);
                setError(null);
                setSuccess('Working hours saved successfully!');
                toast.success('Working hours saved successfully! 🎉');
                
                setTimeout(() => setSuccess(null), 5000);
                
                await loadSettings();
            }
        } catch (err: any) {
            let errorMessage = 'Error saving working hours. Please try again.';
            
            if (err.response?.data) {
                const errorData = err.response.data;
                
                if (errorData.error === 'Database not ready' || errorData.error === 'Database schema mismatch') {
                    errorMessage = `Database Error: ${errorData.details || errorData.error}`;
                    setError(errorMessage);
                    toast.error(errorMessage);
                    return;
                }
                
                // Handle connection errors with retry suggestion
                if (errorData.retryable) {
                    errorMessage = `${errorData.error}: ${errorData.details || 'Please try again.'}`;
                } else {
                    errorMessage = `${errorData.error}: ${errorData.details || 'Please contact support.'}`;
                }
            } else if (err.message) {
                errorMessage = `Error saving working hours: ${err.message}`;
            }
            
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!finalWorkspaceId) return;
        
        setSaving(true);
        setError(null);
        setSuccess(null);
        
        try {
            const validationErrors = validateAutomationRules(automationRules);
            if (validationErrors.length > 0) {
                setError(`Validation errors: ${validationErrors.join(', ')}`);
                toast.error(`Validation errors: ${validationErrors.join(', ')}`);
                return;
            }

            const settingsData = {
                holidayMode,
                workingHours,
                automationRules: automationRules.map(rule => ({
                    ...rule,
                    responseType: rule.responseType || 'text',
                    enabled: rule.enabled || false,
                    description: rule.description || '',
                    aiPrompt: (rule.responseType === 'text' || rule.responseType === 'ai') ? rule.aiPrompt : undefined,
                    chatbotFlow: rule.responseType === 'chatbot' ? rule.chatbotFlow : undefined,
                    chatbotFlowName: rule.responseType === 'chatbot' ? rule.chatbotFlowName : undefined,
                    templateName: rule.responseType === 'template' ? rule.templateName : undefined,
                    templateVariables: rule.responseType === 'template' ? rule.templateVariables : undefined,
                    threshold: rule.threshold || undefined
                }))
            };

            console.log('Saving automation settings:', settingsData);

            const response = await axios.put(`/api/${finalWorkspaceId}/automation/settings`, settingsData);

            if (response.status === 200) {
                setError(null);
                setSuccess('Automation settings saved successfully!');
                toast.success('Automation settings saved successfully! 🎉');
                
                setTimeout(() => setSuccess(null), 5000);
                
                await loadSettings();
            }
        } catch (err: any) {
            console.error('Save settings error:', err);
            let errorMessage = 'Error saving settings. Please try again.';
            
            if (err.response?.data) {
                const errorData = err.response.data;
                
                // Handle specific database not ready errors
                if (errorData.error === 'Database not ready' || errorData.error === 'Database schema mismatch') {
                    errorMessage = `Database Error: ${errorData.details || errorData.error}`;
                    setError(errorMessage);
                    toast.error(errorMessage);
                    return;
                }
                
                // Handle connection errors with retry suggestion
                if (errorData.retryable) {
                    errorMessage = `${errorData.error}: ${errorData.details || 'Please try again.'}`;
                } else {
                    errorMessage = `${errorData.error}: ${errorData.details || 'Please contact support.'}`;
                }
            } else if (err.message) {
                errorMessage = `Error saving settings: ${err.message}`;
            }
            
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout user={user}>
                <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center justify-center h-48 sm:h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
                                <p className="text-sm sm:text-base text-gray-600">Loading automation settings...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout user={user}>
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => router.back()}
                                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Go back"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    <span className="text-sm font-medium">Back</span>
                                </button>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Automation Settings</h1>
                                    <p className="text-sm sm:text-base text-gray-600">Configure your chat automation rules, working hours, and response settings</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={() => {
                                       
                                        loadChatbotFlows();
                                    }}
                                    disabled={loadingChatbots}
                                    className="px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loadingChatbots ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <Bot className="w-4 h-4" />
                                    )}
                                    <span className="hidden sm:inline">Refresh Chatbots</span>
                                    <span className="sm:hidden">Chatbots</span>
                                </button>
                                <button
                                    onClick={() => {
                                       
                                        loadTemplates();
                                    }}
                                    disabled={loadingTemplates}
                                    className="px-4 sm:px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm sm:text-base font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loadingTemplates ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <FileText className="w-4 h-4" />
                                    )}
                                    <span className="hidden sm:inline">Refresh Templates</span>
                                    <span className="sm:hidden">Templates</span>
                                </button>
                            </div>
                        </div>
                    </div>

      

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-600">{success}</p>
                        </div>
                    )}


                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                        <div className="space-y-4 sm:space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Current Working hours:</h2>
                                    <button
                                        onClick={() => setShowWorkingHoursModal(true)}
                                        className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium rounded-lg transition-colors"
                                    >
                                        Set Working Hours
                                    </button>
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600">
                                    {Array.isArray(workingHours) ? (
                                        <>
                                            {workingHours.filter(day => day.open).length} days open, {workingHours.filter(day => !day.open).length} days closed
                                        </>
                                    ) : (
                                        'Loading working hours...'
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Automation Rules</h2>
                                <div className="space-y-3 sm:space-y-4">
                                    {automationRules.slice(0, 5).map((rule) => (
                                        <div key={rule.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                                            <div className="flex items-start gap-2 sm:gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={rule.enabled}
                                                    onChange={() => toggleRule(rule.id)}
                                                    className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 flex-shrink-0"
                                                />
                                                <div className="flex-1 space-y-2 sm:space-y-3">
                                                    <p className="text-sm text-gray-700">{rule.description}</p>
                                                    
                                                    {/* Response Type Selector */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                                        <label className="text-xs sm:text-sm font-medium text-gray-700">Response Type:</label>
                                                        <select
                                                            value={rule.responseType}
                                                            onChange={(e) => updateRuleResponseType(rule.id, e.target.value as any)}
                                                            className="border border-gray-300 rounded px-2 sm:px-3 py-1 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        >
                                                            <option value="text">Text Message</option>
                                                            <option value="chatbot">Chatbot Flow</option>
                                                            <option value="ai">AI Response</option>
                                                            <option value="template">WhatsApp Template</option>
                                                        </select>
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            rule.responseType === 'text' ? 'bg-blue-100 text-blue-800' :
                                                            rule.responseType === 'chatbot' ? 'bg-green-100 text-green-800' :
                                                            rule.responseType === 'ai' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-orange-100 text-orange-800'
                                                        }`}>
                                                            {rule.responseType === 'text' ? 'Text' :
                                                             rule.responseType === 'chatbot' ? 'Bot' :
                                                             rule.responseType === 'ai' ? 'AI' : 'Template'}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Threshold input for specific rules */}
                                                    {rule.description.includes('wait more than') && (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                value={rule.threshold || 0}
                                                                onChange={(e) => updateRuleThreshold(rule.id, parseInt(e.target.value) || 0)}
                                                                className="w-16 sm:w-20 border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm"
                                                                min="0"
                                                            />
                                                            <span className="text-xs sm:text-sm text-gray-600">minutes</span>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Response Type Specific Inputs */}
                                                    {rule.responseType === 'text' && (
                                                        <div className="space-y-2">
                                                            <label className="block text-sm font-medium text-gray-700">Custom Message:</label>
                                                            <textarea
                                                                value={rule.aiPrompt || ''}
                                                                onChange={(e) => updateRuleAIPrompt(rule.id, e.target.value)}
                                                                placeholder="Enter your custom message text..."
                                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                rows={3}
                                                            />
                                                            <p className="text-xs text-gray-500">Enter the exact message text you want to send</p>
                                                        </div>
                                                    )}

                                                    {rule.responseType === 'chatbot' && (
                                                        <div className="space-y-2">
                                                            <label className="block text-sm font-medium text-gray-700">Chatbot Flow:</label>
                                                            {loadingChatbots ? (
                                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                                    Loading chatbot flows...
                                                                </div>
                                                            ) : (
                                                                <select
                                                                    value={rule.chatbotFlow || ''}
                                                                    onChange={(e) => {
                                                                        const option = e.target.options[e.target.selectedIndex];
                                                                        updateRuleChatbotFlow(rule.id, e.target.value, option.text);
                                                                    }}
                                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                >
                                                                    <option value="">Select chatbot flow</option>
                                                                    {chatbotFlows.length > 0 ? (
                                                                        chatbotFlows.map((flow) => (
                                                                            <option key={flow.id} value={flow.id}>
                                                                                {flow.name || flow.trigger || `Flow ${flow.id}`}
                                                                            </option>
                                                                        ))
                                                                    ) : (
                                                                        <option value="" disabled>No chatbot flows available</option>
                                                                    )}
                                                                </select>
                                                            )}
                                                        </div>
                                                    )}

                                                    {rule.responseType === 'ai' && (
                                                        <div className="space-y-2">
                                                            <label className="block text-sm font-medium text-gray-700">AI Prompt:</label>
                                                            <textarea
                                                                value={rule.aiPrompt || ''}
                                                                onChange={(e) => updateRuleAIPrompt(rule.id, e.target.value)}
                                                                placeholder="Enter AI prompt for generating response..."
                                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                rows={3}
                                                            />
                                                        </div>
                                                    )}

                                                    {rule.responseType === 'template' && (
                                                        <div className="space-y-2">
                                                            <label className="block text-sm font-medium text-gray-700">WhatsApp Template:</label>
                                                            {loadingTemplates ? (
                                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                                    Loading templates...
                                                                </div>
                                                            ) : (
                                                                <select
                                                                    value={rule.templateName || ''}
                                                                    onChange={(e) => updateRuleTemplate(rule.id, e.target.value)}
                                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                >
                                                                    <option value="">Select template</option>
                                                                    {templates.length > 0 ? (
                                                                        templates.map((template) => (
                                                                            <option key={template.name} value={template.name}>
                                                                                {template.name || `Template ${template.id}`}
                                                                            </option>
                                                                        ))
                                                                    ) : (
                                                                        <option value="" disabled>No templates available</option>
                                                                    )}
                                                                </select>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Additional Automation Rules */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Additional Rules</h2>
                            <div className="space-y-3 sm:space-y-4">
                                {automationRules.slice(5).map((rule) => (
                                    <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={rule.enabled}
                                                onChange={() => toggleRule(rule.id)}
                                                className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                            />
                                            <div className="flex-1 space-y-3">
                                                <p className="text-sm text-gray-700">
                                                    {rule.description}
                                                    {rule.id === '9' && (
                                                        <span className="ml-2">
                                                            <AlertCircle className="inline w-4 h-4 text-yellow-500" />
                                                            💡
                                                        </span>
                                                    )}
                                                </p>
                                                
                                                {/* Response Type Selector */}
                                                <div className="flex items-center gap-3">
                                                    <label className="text-sm font-medium text-gray-700">Response Type:</label>
                                                    <select
                                                        value={rule.responseType}
                                                        onChange={(e) => updateRuleResponseType(rule.id, e.target.value as any)}
                                                        className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    >
                                                        <option value="text">Text Message</option>
                                                        <option value="chatbot">Chatbot Flow</option>
                                                        <option value="ai">AI Response</option>
                                                        <option value="template">WhatsApp Template</option>
                                                    </select>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        rule.responseType === 'text' ? 'bg-blue-100 text-blue-800' :
                                                        rule.responseType === 'chatbot' ? 'bg-green-100 text-green-800' :
                                                        rule.responseType === 'ai' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-orange-100 text-orange-800'
                                                    }`}>
                                                        {rule.responseType === 'text' ? 'Text' :
                                                         rule.responseType === 'chatbot' ? 'Bot' :
                                                         rule.responseType === 'ai' ? 'AI' : 'Template'}
                                                    </span>
                                                </div>
                                                
                                                {/* Response Type Specific Inputs */}
                                                {rule.responseType === 'text' && (
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">Custom Message:</label>
                                                        <textarea
                                                            value={rule.aiPrompt || ''}
                                                            onChange={(e) => updateRuleAIPrompt(rule.id, e.target.value)}
                                                            placeholder="Enter your custom message text..."
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            rows={3}
                                                        />
                                                        <p className="text-xs text-gray-500">Enter the exact message text you want to send</p>
                                                    </div>
                                                )}

                                                {rule.responseType === 'chatbot' && (
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">Chatbot Flow:</label>
                                                        {loadingChatbots ? (
                                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                                Loading chatbot flows...
                                                            </div>
                                                        ) : (
                                                            <select
                                                                value={rule.chatbotFlow || ''}
                                                                onChange={(e) => {
                                                                    const option = e.target.options[e.target.selectedIndex];
                                                                    updateRuleChatbotFlow(rule.id, e.target.value, option.text);
                                                                }}
                                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            >
                                                                <option value="">Select chatbot flow</option>
                                                                {chatbotFlows.length > 0 ? (
                                                                    chatbotFlows.map((flow) => (
                                                                        <option key={flow.id} value={flow.id}>
                                                                            {flow.name || flow.trigger || `Flow ${flow.id}`}
                                                                        </option>
                                                                    ))
                                                                ) : (
                                                                    <option value="" disabled>No chatbot flows available</option>
                                                                )}
                                                            </select>
                                                        )}
                                                    </div>
                                                )}

                                                {rule.responseType === 'ai' && (
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">AI Prompt:</label>
                                                        <textarea
                                                            value={rule.aiPrompt || ''}
                                                            onChange={(e) => updateRuleAIPrompt(rule.id, e.target.value)}
                                                            placeholder="Enter AI prompt for generating response..."
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            rows={3}
                                                        />
                                                    </div>
                                                )}

                                                {rule.responseType === 'template' && (
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">WhatsApp Template:</label>
                                                        {loadingTemplates ? (
                                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                                Loading templates...
                                                            </div>
                                                        ) : (
                                                            <select
                                                                value={rule.templateName || ''}
                                                                onChange={(e) => updateRuleTemplate(rule.id, e.target.value)}
                                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            >
                                                                <option value="">Select template</option>
                                                                {templates.length > 0 ? (
                                                                    templates.map((template) => (
                                                                        <option key={template.name} value={template.name}>
                                                                            {template.name || `Template ${template.id}`}
                                                                        </option>
                                                                    ))
                                                                ) : (
                                                                    <option value="" disabled>No templates available</option>
                                                                )}
                                                            </select>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Save Settings Button */}
                    <div className="mt-6 sm:mt-8 flex justify-center">
                        <button
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className={`flex items-center gap-2 px-6 sm:px-8 py-2 sm:py-3 text-white text-sm sm:text-base font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
                                saving 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Working Hours Modal */}
                {showWorkingHoursModal && (
                    <div className="fixed inset-0 bg-gray-50 bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Set Working Hours</h2>
                                <button
                                    onClick={() => setShowWorkingHoursModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Holiday Mode */}
                            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Holiday Mode :</label>
                                        <p className="text-xs text-gray-500">Enable to set all days as closed</p>
                                    </div>
                                    <div className="flex items-center">
                                        <span className={`text-sm font-medium ${!holidayMode ? 'text-gray-900' : 'text-gray-400'}`}>Off</span>
                                        <button
                                            onClick={() => setHolidayMode(!holidayMode)}
                                            className={`mx-2 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                holidayMode ? 'bg-blue-600' : 'bg-gray-300'
                                            }`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                holidayMode ? 'translate-x-6' : 'translate-x-1'
                                            }`} />
                                        </button>
                                        <span className={`text-sm font-medium ${holidayMode ? 'text-blue-600' : 'text-gray-400'}`}>On</span>
                                    </div>
                                </div>
                            </div>

                            {/* Working Hours Configuration */}
                            <div className="space-y-3 sm:space-y-4">
                                <h3 className="text-base sm:text-lg font-medium text-gray-900">Working hours :</h3>
                                {Array.isArray(workingHours) ? workingHours.map((day, dayIndex) => (
                                    <div key={day.day} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                                            <span className="font-medium text-gray-900">{day.day}</span>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-600">Open</span>
                                                    <button
                                                        onClick={() => toggleDayOpen(dayIndex)}
                                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                                            day.open ? 'bg-blue-500' : 'bg-gray-400'
                                                        }`}
                                                    >
                                                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                                            day.open ? 'translate-x-5' : 'translate-x-1'
                                                        }`} />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => addTimeSlot(dayIndex)}
                                                    className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {day.open && (
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="time"
                                                        value={day.startTime}
                                                        onChange={(e) => updateWorkingHours(dayIndex, 'startTime', e.target.value)}
                                                        className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm"
                                                    />
                                                </div>
                                                <span className="text-gray-500 text-center sm:text-left">to</span>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="time"
                                                        value={day.endTime}
                                                        onChange={(e) => updateWorkingHours(dayIndex, 'endTime', e.target.value)}
                                                        className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div className="text-center py-4 text-gray-500">
                                        Loading working hours...
                                    </div>
                                )}
                            </div>

                            {/* Save Button */}
                            <div className="mt-4 sm:mt-6 flex justify-end">
                                <button
                                    onClick={handleSaveWorkingHours}
                                    disabled={saving}
                                    className={`flex items-center gap-2 px-4 sm:px-6 py-2 text-sm sm:text-base text-white font-medium rounded-lg transition-colors ${
                                        saving 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                >
                                    {saving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        'Save'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AutomationsSettingsPage;
