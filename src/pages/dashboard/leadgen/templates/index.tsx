import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentWorkspace } from '@/store/slices/system';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Search, Eye, Copy, Plus } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { withIronSessionSsr } from 'iron-session/next';
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session';
import {
  BusinessInquiryCard,
  EventRegistrationCard,
  RestaurantBookingCard,
  VotingPollCard,
  ConferenceRegistrationCard,
  CourseRegistrationCard,
} from '@/components/leadgen/TemplateCards';

export const getServerSideProps = withIronSessionSsr(async({req, res}) => {
  const user = await validateUser(req)
  const data = user as any
  if (data?.redirect) return sessionRedirects(data?.redirect)
  return { 
    props: {
      user: JSON.stringify(user),
    }, 
  }
}, sessionCookie())

interface IProps {
  user: string;
}

const prebuiltTemplates = [
  {
    id: 'business-inquiry',
    name: 'Business Inquiry',
    description: 'Perfect for collecting business inquiries and service requests',
    category: 'Business',
    image: 'https://res.cloudinary.com/dvjdvvnn3/image/upload/v1767953900/Frame_120_jwejgz.png',
    primaryColor: '#3B82F6',
    fields: [
      { label: 'Full name', type: 'text', required: true, placeholder: 'Enter your full name' },
      { label: 'Business Name', type: 'text', required: true, placeholder: 'Your business name' },
      { label: 'Email/Phone Number', type: 'text', required: true, placeholder: 'Contact information' },
      { label: 'Service interested in', type: 'select', required: true, placeholder: 'Select service', options: ['Consulting', 'Development', 'Marketing', 'Other'] },
      { label: 'Message', type: 'textarea', required: false, placeholder: 'Tell us more about your needs' },
    ],
    submitButtonText: 'Send Enquiry',
  },
  {
    id: 'event-registration',
    name: 'Register for Event',
    description: 'Collect registrations for events, webinars, and conferences',
    category: 'Events',
    image: 'https://res.cloudinary.com/dvjdvvnn3/image/upload/v1767953900/Frame_120_jwejgz.png',
    primaryColor: '#EF4444',
    fields: [
      { label: 'Full name', type: 'text', required: true, placeholder: 'Enter your name' },
      { label: 'Email', type: 'email', required: true, placeholder: 'your@email.com' },
      { label: 'Phone number', type: 'tel', required: true, placeholder: '+234...' },
      { label: 'Message', type: 'textarea', required: false, placeholder: 'Any special requirements?' },
    ],
    submitButtonText: 'Register',
  },
  {
    id: 'restaurant-booking',
    name: 'Restaurant Booking',
    description: 'Take table reservations and special requests',
    category: 'Hospitality',
    image: 'https://res.cloudinary.com/dvjdvvnn3/image/upload/v1767953900/Frame_120_jwejgz.png',
    primaryColor: '#F59E0B',
    fields: [
      { label: 'Full name', type: 'text', required: true, placeholder: 'Your name' },
      { label: 'Email', type: 'email', required: true, placeholder: 'your@email.com' },
      { label: 'Party size', type: 'number', required: true, placeholder: 'Number of guests' },
      { label: 'Preferred time', type: 'text', required: true, placeholder: 'e.g., 7:00 PM' },
      { label: 'Occasion', type: 'select', required: false, placeholder: 'Select occasion', options: ['Birthday', 'Anniversary', 'Business', 'Casual', 'Other'] },
      { label: 'Special Request', type: 'textarea', required: false, placeholder: 'Any dietary restrictions or special requests?' },
    ],
    submitButtonText: 'Book',
  },
  {
    id: 'voting-poll',
    name: 'Voting poll',
    description: 'Create polls and surveys to gather opinions',
    category: 'Survey',
    image: 'https://res.cloudinary.com/dvjdvvnn3/image/upload/v1767953900/Frame_120_jwejgz.png',
    primaryColor: '#10B981',
    fields: [
      { label: 'Email/Phone Number', type: 'text', required: true, placeholder: 'Your contact' },
      { label: 'Question 1', type: 'select', required: true, placeholder: 'Choose your answer', options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'] },
    ],
    submitButtonText: 'Submit response',
  },
  {
    id: 'conference-registration',
    name: 'Conference Registration',
    description: 'Register attendees for conferences and workshops',
    category: 'Events',
    image: 'https://res.cloudinary.com/dvjdvvnn3/image/upload/v1767953900/Frame_120_jwejgz.png',
    primaryColor: '#6366F1',
    fields: [
      { label: 'Full name', type: 'text', required: true, placeholder: 'Enter your name' },
      { label: 'Email/Phone Number', type: 'text', required: true, placeholder: 'Contact information' },
      { label: 'Company', type: 'text', required: false, placeholder: 'Your company name' },
      { label: 'Role', type: 'text', required: false, placeholder: 'Your job title' },
    ],
    submitButtonText: 'Register',
  },
  {
    id: 'course-registration',
    name: 'Register for our course',
    description: 'Enroll students in courses and training programs',
    category: 'Education',
    image: 'https://res.cloudinary.com/dvjdvvnn3/image/upload/v1767953900/Frame_120_jwejgz.png',
    primaryColor: '#EF4444',
    fields: [
      { label: 'Full name', type: 'text', required: true, placeholder: 'Your full name' },
      { label: 'Email/Phone Number', type: 'text', required: true, placeholder: 'Contact details' },
      { label: 'Course interested in', type: 'select', required: true, placeholder: 'Select course', options: ['Web Development', 'Data Science', 'Digital Marketing', 'Graphic Design'] },
      { label: 'Message', type: 'textarea', required: false, placeholder: 'Any questions or comments?' },
    ],
    submitButtonText: 'Send Enquiry',
  },
];

function WebTemplates(props: IProps) {
  const user = JSON.parse(props.user);
  const currentWorkspace = useSelector(getCurrentWorkspace);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleUseTemplate = async (template: any) => {
    try {
      const slug = `${template.id}-${Date.now()}`;
      const response = await axios.post(
        `/api/${currentWorkspace.id}/leadgen/forms/create`,
        {
          name: template.name,
          slug,
          title: template.name,
          description: template.description,
          formFields: template.fields,
          primaryColor: template.primaryColor,
          backgroundColor: '#ffffff',
          submitButtonText: template.submitButtonText,
          thankYouMessage: 'Thank you for your submission!',
        }
      );

      if (response.data.status === 'success') {
        toast.success('Template created successfully!');
        router.push(`/dashboard/leadgen/templates/${response.data.data.id}`);
      }
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast.error(error.response?.data?.message || 'Failed to create template');
    }
  };

  const copyFormUrl = (slug: string) => {
    const url = `${window.location.origin}/f/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Form URL copied to clipboard');
  };

  const filteredPrebuiltTemplates = prebuiltTemplates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/leadgen')}
          className="text-gray-600 hover:text-gray-900 mb-2"
        >
          ← Back to Lead Gen
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Web templates</h1>
            <p className="text-gray-600 mt-1">Choose from pre-made templates or create your own</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/leadgen/templates/create')}
              className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Custom Template
            </button>
            <button
              onClick={() => router.push('/dashboard/leadgen/templates/my-templates')}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View My Templates
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Pre-built Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPrebuiltTemplates.map((template) => {
          const TemplateComponent = 
            template.id === 'business-inquiry' ? BusinessInquiryCard :
            template.id === 'event-registration' ? EventRegistrationCard :
            template.id === 'restaurant-booking' ? RestaurantBookingCard :
            template.id === 'voting-poll' ? VotingPollCard :
            template.id === 'conference-registration' ? ConferenceRegistrationCard :
            template.id === 'course-registration' ? CourseRegistrationCard :
            null;

          if (!TemplateComponent) return null;

          return (
            <TemplateComponent
              key={template.id}
              template={template}
              onClick={() => handleUseTemplate(template)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function WebTemplatesPage(props: IProps) {
  const user = JSON.parse(props.user);
  return (
    <DashboardLayout user={user}>
      <WebTemplates {...props} />
    </DashboardLayout>
  );
}
