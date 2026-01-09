import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

interface FormPreviewProps {
  form: any;
  formData: Record<string, any>;
  handleChange: (label: string, value: any) => void;
  submitting: boolean;
  submitted: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const commonInputClasses = "w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none transition-all";

export const BusinessInquiryPreview: React.FC<FormPreviewProps> = ({ 
  form, formData, handleChange, submitting, submitted, onSubmit 
}) => {
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-blue-100">
            <CheckCircle className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600">{form.thankYouMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Background Image */}
      <div className="relative h-48">
        <img
          src="https://res.cloudinary.com/dvjdvvnn3/image/upload/v1767953900/Frame_120_jwejgz.png"
          alt="Business Inquiry"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Form Content */}
      <div className="bg-white p-8 rounded-t-3xl -mt-8 relative max-w-2xl mx-auto shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
          Business Inquiry
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={formData['Full name'] || ''}
            onChange={(e) => handleChange('Full name', e.target.value)}
            className={commonInputClasses}
            required
          />
          <input
            type="text"
            placeholder="Business Name"
            value={formData['Business Name'] || ''}
            onChange={(e) => handleChange('Business Name', e.target.value)}
            className={commonInputClasses}
            required
          />
          <input
            type="text"
            placeholder="Email/Phone Number"
            value={formData['Email/Phone Number'] || ''}
            onChange={(e) => handleChange('Email/Phone Number', e.target.value)}
            className={commonInputClasses}
            required
          />
          <div className="relative">
            <select
              value={formData['Service interested in'] || ''}
              onChange={(e) => handleChange('Service interested in', e.target.value)}
              className={`${commonInputClasses} appearance-none`}
              required
            >
              <option value="">Service interested in</option>
              <option value="Consulting">Consulting</option>
              <option value="Development">Development</option>
              <option value="Marketing">Marketing</option>
              <option value="Other">Other</option>
            </select>
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <textarea
            placeholder="Message"
            value={formData['Message'] || ''}
            onChange={(e) => handleChange('Message', e.target.value)}
            className={`${commonInputClasses} resize-none`}
            rows={3}
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl text-white font-medium text-base bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {submitting ? 'Sending...' : 'Send Enquiry'}
          </button>
        </form>
      </div>
    </div>
  );
};

export const EventRegistrationPreview: React.FC<FormPreviewProps> = ({ 
  form, formData, handleChange, submitting, submitted, onSubmit 
}) => {
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100">
            <CheckCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600">{form.thankYouMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Background Image */}
      <div className="relative h-48">
        <img
          src="https://res.cloudinary.com/dvjdvvnn3/image/upload/v1767953900/Frame_120_jwejgz.png"
          alt="Event Registration"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Form Content */}
      <div className="bg-white p-8 rounded-t-3xl -mt-8 relative max-w-2xl mx-auto shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
          Register for Event
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={formData['Full name'] || ''}
            onChange={(e) => handleChange('Full name', e.target.value)}
            className={commonInputClasses}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData['Email'] || ''}
            onChange={(e) => handleChange('Email', e.target.value)}
            className={commonInputClasses}
            required
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={formData['Phone number'] || ''}
            onChange={(e) => handleChange('Phone number', e.target.value)}
            className={commonInputClasses}
            required
          />
          <textarea
            placeholder="Message"
            value={formData['Message'] || ''}
            onChange={(e) => handleChange('Message', e.target.value)}
            className={`${commonInputClasses} resize-none`}
            rows={3}
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl text-white font-medium text-base bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50"
          >
            {submitting ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export const RestaurantBookingPreview: React.FC<FormPreviewProps> = ({ 
  form, formData, handleChange, submitting, submitted, onSubmit 
}) => {
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-orange-100">
            <CheckCircle className="w-10 h-10 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600">{form.thankYouMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Background Image */}
      <div className="relative h-48">
        <img
          src="https://res.cloudinary.com/dvjdvvnn3/image/upload/v1767953900/Frame_120_jwejgz.png"
          alt="Restaurant Booking"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Form Content */}
      <div className="bg-white p-8 rounded-t-3xl -mt-8 relative max-w-2xl mx-auto shadow-xl">
        {/* Chef Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center">
            <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none">
              <path d="M32 8C28 8 25 11 25 15V25H39V15C39 11 36 8 32 8Z" fill="#FDB022" stroke="#000" strokeWidth="2"/>
              <path d="M25 25H39V35C39 39 36 42 32 42C28 42 25 39 25 35V25Z" fill="#FFF" stroke="#000" strokeWidth="2"/>
              <path d="M28 15V25M32 15V25M36 15V25" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
          Restaurant Booking
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={formData['Full name'] || ''}
            onChange={(e) => handleChange('Full name', e.target.value)}
            className={commonInputClasses}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData['Email'] || ''}
            onChange={(e) => handleChange('Email', e.target.value)}
            className={commonInputClasses}
            required
          />
          <input
            type="text"
            placeholder="Party size"
            value={formData['Party size'] || ''}
            onChange={(e) => handleChange('Party size', e.target.value)}
            className={commonInputClasses}
            required
          />
          <div className="relative">
            <input
              type="text"
              placeholder="Preferred time"
              value={formData['Preferred time'] || ''}
              onChange={(e) => handleChange('Preferred time', e.target.value)}
              className={`${commonInputClasses} pr-12`}
              required
            />
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div className="relative">
            <select
              value={formData['Occasion'] || ''}
              onChange={(e) => handleChange('Occasion', e.target.value)}
              className={`${commonInputClasses} appearance-none pr-12`}
            >
              <option value="">Occasion</option>
              <option value="Birthday">Birthday</option>
              <option value="Anniversary">Anniversary</option>
              <option value="Business">Business</option>
              <option value="Casual">Casual</option>
              <option value="Other">Other</option>
            </select>
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <textarea
            placeholder="Special Request"
            value={formData['Special Request'] || ''}
            onChange={(e) => handleChange('Special Request', e.target.value)}
            className={`${commonInputClasses} resize-none`}
            rows={2}
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl text-white font-medium text-base bg-orange-500 hover:bg-orange-600 transition-all disabled:opacity-50"
          >
            {submitting ? 'Booking...' : 'Book'}
          </button>
        </form>
      </div>
    </div>
  );
};

export const VotingPollPreview: React.FC<FormPreviewProps> = ({ 
  form, formData, handleChange, submitting, submitted, onSubmit 
}) => {
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-100">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600">{form.thankYouMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Small Image Icon */}
      <div className="flex justify-center pt-8">
        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md">
          <img
            src="https://res.cloudinary.com/dvjdvvnn3/image/upload/v1767953900/Frame_120_jwejgz.png"
            alt="Voting Poll"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Form Content */}
      <div className="p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
          Voting poll
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={formData['Full name'] || ''}
            onChange={(e) => handleChange('Full name', e.target.value)}
            className={commonInputClasses}
            required
          />
          <input
            type="text"
            placeholder="Email/Phone Number"
            value={formData['Email/Phone Number'] || ''}
            onChange={(e) => handleChange('Email/Phone Number', e.target.value)}
            className={commonInputClasses}
            required
          />

          <div className="pt-2">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Question 1</h3>
            <div className="space-y-3">
              {['Option 1', 'Option 2', 'Option 3', 'Option 4'].map((option, idx) => (
                <label key={idx} className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData['Question 1'] === option ? 'border-green-500' : 'border-gray-300'}`}>
                    {formData['Question 1'] === option && <div className="w-3 h-3 rounded-full bg-green-500"></div>}
                  </div>
                  <span className="text-sm text-gray-700">{option}</span>
                  <input
                    type="radio"
                    name="Question 1"
                    value={option}
                    checked={formData['Question 1'] === option}
                    onChange={(e) => handleChange('Question 1', e.target.value)}
                    className="hidden"
                    required
                  />
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl text-white font-medium text-base bg-green-600 hover:bg-green-700 transition-all disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit response'}
          </button>
        </form>
      </div>
    </div>
  );
};

export const ConferenceRegistrationPreview: React.FC<FormPreviewProps> = ({ 
  form, formData, handleChange, submitting, submitted, onSubmit 
}) => {
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-indigo-100">
            <CheckCircle className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600">{form.thankYouMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-1">
      <div className="bg-white rounded-3xl min-h-full">
        {/* Background Image */}
        <div className="relative h-48 rounded-t-3xl overflow-hidden">
          <img
            src="https://res.cloudinary.com/dvjdvvnn3/image/upload/v1767953900/Frame_120_jwejgz.png"
            alt="Conference Registration"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Form Content */}
        <div className="p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
            Conference Registration
          </h2>

          <form onSubmit={onSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Full name"
              value={formData['Full name'] || ''}
              onChange={(e) => handleChange('Full name', e.target.value)}
              className={commonInputClasses}
              required
            />
            <input
              type="text"
              placeholder="Email/Phone Number"
              value={formData['Email/Phone Number'] || ''}
              onChange={(e) => handleChange('Email/Phone Number', e.target.value)}
              className={commonInputClasses}
              required
            />
            <input
              type="text"
              placeholder="Company"
              value={formData['Company'] || ''}
              onChange={(e) => handleChange('Company', e.target.value)}
              className={commonInputClasses}
            />
            <input
              type="text"
              placeholder="Role"
              value={formData['Role'] || ''}
              onChange={(e) => handleChange('Role', e.target.value)}
              className={commonInputClasses}
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl text-white font-medium text-base bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export const CourseRegistrationPreview: React.FC<FormPreviewProps> = ({ 
  form, formData, handleChange, submitting, submitted, onSubmit 
}) => {
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100">
            <CheckCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600">{form.thankYouMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Background Image */}
      <div className="relative h-48">
        <img
          src="https://res.cloudinary.com/dvjdvvnn3/image/upload/v1767953900/Frame_120_jwejgz.png"
          alt="Course Registration"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Form Content */}
      <div className="bg-white p-8 rounded-t-3xl -mt-8 relative max-w-2xl mx-auto shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
          Register for our course
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={formData['Full name'] || ''}
            onChange={(e) => handleChange('Full name', e.target.value)}
            className={commonInputClasses}
            required
          />
          <input
            type="text"
            placeholder="Email/Phone Number"
            value={formData['Email/Phone Number'] || ''}
            onChange={(e) => handleChange('Email/Phone Number', e.target.value)}
            className={commonInputClasses}
            required
          />
          <div className="relative">
            <select
              value={formData['Course interested in'] || ''}
              onChange={(e) => handleChange('Course interested in', e.target.value)}
              className={`${commonInputClasses} appearance-none`}
              required
            >
              <option value="">Course interested in</option>
              <option value="Web Development">Web Development</option>
              <option value="Data Science">Data Science</option>
              <option value="Digital Marketing">Digital Marketing</option>
              <option value="Graphic Design">Graphic Design</option>
            </select>
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <textarea
            placeholder="Message"
            value={formData['Message'] || ''}
            onChange={(e) => handleChange('Message', e.target.value)}
            className={`${commonInputClasses} resize-none`}
            rows={3}
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl text-white font-medium text-base bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50"
          >
            {submitting ? 'Sending...' : 'Send Enquiry'}
          </button>
        </form>
      </div>
    </div>
  );
};
