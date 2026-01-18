import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  BusinessInquiryPreview,
  EventRegistrationPreview,
  RestaurantBookingPreview,
  VotingPollPreview,
  ConferenceRegistrationPreview,
  CourseRegistrationPreview,
} from '@/components/leadgen/FormPreviews';

export default function PublicForm() {
  const router = useRouter();
  const { slug } = router.query;
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (slug) {
      fetchForm();
    }
  }, [slug]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/leadgen/forms/get?slug=${slug}`);
      if (response.data.status === 'success') {
        setForm(response.data.data);
        // Initialize form data
        const initialData: Record<string, any> = {};
        response.data.data.formFields.forEach((field: any) => {
          initialData[field.label] = '';
        });
        setFormData(initialData);
      }
    } catch (error) {
      console.error('Error fetching form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (label: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [label]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const missingFields = form.formFields
      .filter((field: any) => field.required && !formData[field.label])
      .map((field: any) => field.label);

    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post('/api/leadgen/submit-form', {
        slug,
        formData,
        phoneNumber: formData['Phone'] || formData['phone'] || formData['Phone Number'],
        email: formData['Email'] || formData['email'],
      });

      if (response.data.status === 'success') {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: any) => {
    const commonClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none transition-colors";

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={formData[field.label] || ''}
            onChange={(e) => handleChange(field.label, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            className={commonClasses}
            style={{ borderColor: form.primaryColor + '20' }}
          />
        );
      case 'select':
        return (
          <select
            value={formData[field.label] || ''}
            onChange={(e) => handleChange(field.label, e.target.value)}
            required={field.required}
            className={commonClasses}
            style={{ borderColor: form.primaryColor + '20' }}
          >
            <option value="">Select an option</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type={field.type}
            value={formData[field.label] || ''}
            onChange={(e) => handleChange(field.label, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className={commonClasses}
            style={{ borderColor: form.primaryColor + '20' }}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Form not found</h1>
          <p className="text-gray-600">The form you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  // Determine which preview component to use based on form name or slug
  const getPreviewComponent = () => {
    const formName = form.name?.toLowerCase() || form.slug?.toLowerCase() || '';

    if (formName.includes('business') || formName.includes('inquiry')) {
      return BusinessInquiryPreview;
    } else if (formName.includes('event') || formName.includes('register') || formName.includes('ebook') || formName.includes('download')) {
      return EventRegistrationPreview;
    } else if (formName.includes('restaurant') || formName.includes('booking') || formName.includes('content') || formName.includes('creation') || formName.includes('guide')) {
      return RestaurantBookingPreview;
    } else if (formName.includes('voting') || formName.includes('poll')) {
      return VotingPollPreview;
    } else if (formName.includes('conference')) {
      return ConferenceRegistrationPreview;
    } else if (formName.includes('course') || formName.includes('professional')) {
      return CourseRegistrationPreview;
    } else {
      // Default fallback - use business inquiry
      return BusinessInquiryPreview;
    }
  };

  const PreviewComponent = getPreviewComponent();

  return (
    <PreviewComponent
      form={form}
      formData={formData}
      handleChange={handleChange}
      submitting={submitting}
      submitted={submitted}
      onSubmit={handleSubmit}
    />
  );
}
