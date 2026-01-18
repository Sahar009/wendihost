import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

// Template images - Updated to match user configuration
const TemplateImage1 = "/images/templateimage1.png";
const TemplateImage2 = "/images/templateimage3.png";
const TemplateImage3 = "/images/templateimage7.png";
const TemplateImage4 = "/images/templateimage1.png";
const TemplateImage5 = "/images/templateimage3.png";
const TemplateImage6 = "/images/templateimage2.png";

interface FormPreviewProps {
  form: any;
  formData: Record<string, any>;
  handleChange: (label: string, value: any) => void;
  submitting: boolean;
  submitted: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const commonInputClasses = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all";

// Common "Thank You" screen
const ThankYouScreen: React.FC<{ message: string; colorClass: string; bgClass: string }> = ({ message, colorClass, bgClass }) => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${bgClass}`}>
        <CheckCircle className={`w-10 h-10 ${colorClass}`} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

export const BusinessInquiryPreview: React.FC<FormPreviewProps> = ({
  form, formData, handleChange, submitting, submitted, onSubmit
}) => {
  if (submitted) return <ThankYouScreen message={form.thankYouMessage} colorClass="text-blue-600" bgClass="bg-blue-100" />;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 md:p-8">
      <div className="bg-gradient-to-br from-blue-500 to-blue-200 rounded-[3rem] shadow-2xl overflow-hidden w-full max-w-6xl flex flex-col md:flex-row min-h-[600px]">
        {/* Left Side - Image */}
        <div className="md:w-1/2 p-6 md:p-12 flex items-center justify-center">
          <div className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl">
            <img
              src={TemplateImage2}
              alt="Business Inquiry"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white md:bg-transparent">
          <div className="max-w-md w-full ml-auto mr-auto md:mr-0">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 leading-tight">
              Get in touch with us!
            </h2>
            <p className="text-sm text-gray-600 mb-8">
              We are readily available to answer all your enquires
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Full name"
                value={formData['Full name'] || ''}
                onChange={(e) => handleChange('Full name', e.target.value)}
                className={`${commonInputClasses} bg-white/80 border-gray-100 shadow-sm`}
                required
              />
              <input
                type="text"
                placeholder="Business Name"
                value={formData['Business Name'] || ''}
                onChange={(e) => handleChange('Business Name', e.target.value)}
                className={`${commonInputClasses} bg-white/80 border-gray-100 shadow-sm`}
                required
              />
              <input
                type="text"
                placeholder="Email/Phone Number"
                value={formData['Email/Phone Number'] || ''}
                onChange={(e) => handleChange('Email/Phone Number', e.target.value)}
                className={`${commonInputClasses} bg-white/80 border-gray-100 shadow-sm`}
                required
              />
              <div className="relative">
                <select
                  value={formData['Service interested in'] || ''}
                  onChange={(e) => handleChange('Service interested in', e.target.value)}
                  className={`${commonInputClasses} appearance-none bg-white/80 border-gray-100 shadow-sm text-gray-600`}
                  required
                >
                  <option value="">Service Interested in</option>
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
                className={`${commonInputClasses} resize-none bg-white/80 border-gray-100 shadow-sm`}
                rows={3}
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 transform hover:-translate-y-0.5"
                style={{ backgroundColor: '#0070f3' }}
              >
                {submitting ? 'Sending...' : 'Send Enquiry'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export const EventRegistrationPreview: React.FC<FormPreviewProps> = ({
  form, formData, handleChange, submitting, submitted, onSubmit
}) => {
  if (submitted) return <ThankYouScreen message={form.thankYouMessage} colorClass="text-red-600" bgClass="bg-red-100" />;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8">
      <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden w-full max-w-5xl flex flex-col md:flex-row min-h-[500px]">
        {/* Left Side - Image */}
        <div className="md:w-1/2 p-10 flex items-center justify-center bg-gray-50">
          <div className="relative w-full aspect-square max-w-md border-4 border-gray-200 rounded-sm overflow-hidden shadow-2xl transform md:rotate-[-2deg] transition-transform hover:rotate-0">
            <img
              src={TemplateImage3}
              alt="Ebook Cover"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Side - Content */}
        <div className="md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
          <div className="max-w-md w-full">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 leading-tight">
              Get instant access to the full eBook pdf package
            </h2>
            <p className="text-sm text-gray-500 mb-8">
              We are readily available to answer all your enquires
            </p>

            <form onSubmit={onSubmit} className="bg-white p-0 md:bg-gray-50 md:p-8 rounded-3xl space-y-4">
              <input
                type="text"
                placeholder="Full name"
                value={formData['Full name'] || ''}
                onChange={(e) => handleChange('Full name', e.target.value)}
                className={`${commonInputClasses} bg-white`}
                required
              />
              <input
                type="text"
                placeholder="Email/Phone Number"
                value={formData['Email/Phone Number'] || ''}
                onChange={(e) => handleChange('Email/Phone Number', e.target.value)}
                className={`${commonInputClasses} bg-white`}
                required
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-md hover:opacity-90 transition-all mt-4 disabled:opacity-50"
                style={{ backgroundColor: '#f06548' }}
              >
                {submitting ? 'Sending...' : 'Send the ebook to me'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RestaurantBookingPreview: React.FC<FormPreviewProps> = ({
  form, formData, handleChange, submitting, submitted, onSubmit
}) => {
  if (submitted) return <ThankYouScreen message={form.thankYouMessage} colorClass="text-orange-600" bgClass="bg-orange-100" />;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative">
      {/* Full Background Image */}
      <div className="absolute inset-0">
        <img
          src={TemplateImage4}
          alt="Background"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      </div>

      {/* Centered Card */}
      <div className="relative z-10 bg-white p-8 md:p-12 rounded-[2.5rem] w-full max-w-lg shadow-2xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2 text-gray-900 leading-tight">
          Learn how to start a content creation journey from scratch
        </h2>
        <p className="text-xs text-center text-gray-500 mb-8 max-w-xs mx-auto">
          We are readily available to answer all your enquires
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={formData['Full name'] || ''}
            onChange={(e) => handleChange('Full name', e.target.value)}
            className={`${commonInputClasses} bg-gray-50`}
            required
          />
          <input
            type="text"
            placeholder="Email/Phone Number"
            value={formData['Email/Phone Number'] || ''}
            onChange={(e) => handleChange('Email/Phone Number', e.target.value)}
            className={`${commonInputClasses} bg-gray-50`}
            required
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-6 py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            style={{ backgroundColor: '#f6b042' }}
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
  if (submitted) return <ThankYouScreen message={form.thankYouMessage} colorClass="text-green-600" bgClass="bg-green-100" />;

  const options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8">
      <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden w-full max-w-5xl flex flex-col md:flex-row min-h-[500px]">
        {/* Left Side - Image */}
        <div className="md:w-1/2 p-10 flex items-center justify-center bg-gray-100">
          <div className="relative w-full aspect-square max-w-md border-4 border-gray-300 rounded-sm overflow-hidden shadow-xl">
            <img
              src={TemplateImage1}
              alt="Voting"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
          <div className="max-w-md w-full">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 leading-tight">
              Create a voting poll for anything you need suggestions for
            </h2>
            <p className="text-sm text-gray-500 mb-8">
              We are readily available to answer all your enquires
            </p>

            <form onSubmit={onSubmit} className="bg-gray-50 p-6 rounded-3xl space-y-4">
              <div className="text-center font-bold text-xl mb-2 text-gray-900">Voting poll</div>

              <input
                type="text"
                placeholder="Full name"
                value={formData['Full name'] || ''}
                onChange={(e) => handleChange('Full name', e.target.value)}
                className={`${commonInputClasses} bg-white`}
                required
              />
              <input
                type="text"
                placeholder="Email/Phone Number"
                value={formData['Email/Phone Number'] || ''}
                onChange={(e) => handleChange('Email/Phone Number', e.target.value)}
                className={`${commonInputClasses} bg-white`}
                required
              />

              <div className="pt-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Question 1</h3>
                <div className="space-y-3">
                  {options.map((option, idx) => (
                    <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData['Question 1'] === option ? 'border-green-500' : 'border-gray-300 group-hover:border-green-400'}`}>
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
                      />
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 py-3.5 rounded-xl text-white font-bold text-base shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                style={{ backgroundColor: '#47a97b' }}
              >
                {submitting ? 'Submitting...' : 'Submit response'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ConferenceRegistrationPreview: React.FC<FormPreviewProps> = ({
  form, formData, handleChange, submitting, submitted, onSubmit
}) => {
  if (submitted) return <ThankYouScreen message={form.thankYouMessage} colorClass="text-indigo-600" bgClass="bg-indigo-100" />;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-xl overflow-hidden w-full max-w-lg p-1">
        <div className="bg-white rounded-[1.4rem] overflow-hidden min-h-[600px] flex flex-col">
          {/* Background Image */}
          <div className="relative h-56 overflow-hidden">
            <img
              src={TemplateImage6}
              alt="Conference"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Form Content */}
          <div className="p-8 md:p-10 flex-1 flex flex-col">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
              Conference Registration
            </h2>

            <form onSubmit={onSubmit} className="space-y-4 flex-1">
              <input
                type="text"
                placeholder="Full name"
                value={formData['Full name'] || ''}
                onChange={(e) => handleChange('Full name', e.target.value)}
                className={`${commonInputClasses} bg-gray-50 border-gray-100`}
                required
              />
              <input
                type="text"
                placeholder="Email/Phone Number"
                value={formData['Email/Phone Number'] || ''}
                onChange={(e) => handleChange('Email/Phone Number', e.target.value)}
                className={`${commonInputClasses} bg-gray-50 border-gray-100`}
                required
              />
              <input
                type="text"
                placeholder="Company"
                value={formData['Company'] || ''}
                onChange={(e) => handleChange('Company', e.target.value)}
                className={`${commonInputClasses} bg-gray-50 border-gray-100`}
              />
              <input
                type="text"
                placeholder="Role"
                value={formData['Role'] || ''}
                onChange={(e) => handleChange('Role', e.target.value)}
                className={`${commonInputClasses} bg-gray-50 border-gray-100`}
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 py-4 rounded-xl text-white font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50"
                style={{ backgroundColor: '#6366F1' }}
              >
                {submitting ? 'Registering...' : 'Register'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CourseRegistrationPreview: React.FC<FormPreviewProps> = ({
  form, formData, handleChange, submitting, submitted, onSubmit
}) => {
  if (submitted) return <ThankYouScreen message={form.thankYouMessage} colorClass="text-purple-600" bgClass="bg-purple-100" />;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-[#b314f8] rounded-[3rem] shadow-2xl overflow-hidden w-full max-w-6xl flex flex-col md:flex-row min-h-[700px] relative">
        {/* Header Logo */}
        <div className="absolute top-8 left-8 md:left-12 flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 bg-white/10 backdrop-blur-sm">
            <img src={TemplateImage5} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-white font-bold text-lg tracking-wide drop-shadow-md">Golden fashion house</span>
        </div>

        {/* Left Side - Content */}
        <div className="md:w-3/5 p-8 md:p-16 pt-24 md:pt-32 flex flex-col justify-start relative z-10">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-6xl font-extrabold mb-6 text-white leading-[1.1]">
              The ultimate course to becoming a professional
            </h2>
            <p className="text-white/90 mb-10 text-lg leading-relaxed font-light">
              Become professional hairdresser with my free online course starting with the very basic of being a stylist
            </p>

            <form onSubmit={onSubmit} className="bg-white p-8 rounded-[2rem] shadow-2xl space-y-4 max-w-md">
              <input
                type="text"
                placeholder="Full name"
                value={formData['Full name'] || ''}
                onChange={(e) => handleChange('Full name', e.target.value)}
                className={`${commonInputClasses} bg-gray-50/50 border-gray-100`}
                required
              />
              <input
                type="text"
                placeholder="Email/Phone Number"
                value={formData['Email/Phone Number'] || ''}
                onChange={(e) => handleChange('Email/Phone Number', e.target.value)}
                className={`${commonInputClasses} bg-gray-50/50 border-gray-100`}
                required
              />
              <div className="relative">
                <select
                  value={formData['Service interested in'] || ''}
                  onChange={(e) => handleChange('Service interested in', e.target.value)}
                  className={`${commonInputClasses} appearance-none bg-gray-50/50 border-gray-100 text-gray-600`}
                  required
                >
                  <option value="">Service Interested in</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Digital Marketing">Digital Marketing</option>
                </select>
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <textarea
                placeholder="Message"
                value={formData['Message'] || ''}
                onChange={(e) => handleChange('Message', e.target.value)}
                className={`${commonInputClasses} resize-none bg-gray-50/50 border-gray-100`}
                rows={2}
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                style={{ backgroundColor: '#b314f8' }}
              >
                {submitting ? 'Booking...' : 'Book my place'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="md:w-2/5 md:self-end md:pb-0 relative min-h-[300px] md:min-h-full">
          <div className="absolute inset-x-0 bottom-0 top-0 md:top-auto h-full md:h-[90%] rounded-t-[3rem] md:rounded-tr-none md:rounded-tl-[3rem] overflow-hidden shadow-2xl">
            <img
              src={TemplateImage5}
              alt="Course"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>

        {/* Decorative Curve */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-white pointer-events-none hidden md:block"
          style={{ clipPath: 'ellipse(70% 60% at 50% 100%)' }}>
        </div>
      </div>
    </div>
  );
};

