import React from 'react';

interface TemplateCardProps {
  template: any;
  onClick: () => void;
}

export const BusinessInquiryCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  return (
    <div onClick={onClick} className="cursor-pointer transform transition-all hover:scale-105">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-sm mx-auto">
        {/* Background Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={template.image}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Form Content */}
        <div className="bg-white p-8 rounded-t-3xl -mt-8 relative">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
            Business Inquiry
          </h2>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none"
              disabled
            />
            <input
              type="text"
              placeholder="Business Name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none"
              disabled
            />
            <input
              type="text"
              placeholder="Email/Phone Number"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none"
              disabled
            />
            <div className="relative">
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-500 appearance-none focus:outline-none"
                disabled
              >
                <option>Service interested in</option>
              </select>
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <textarea
              placeholder="Message"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none"
              disabled
            />
          </div>

          <button
            className="w-full mt-6 py-3.5 rounded-xl text-white font-medium text-base"
            style={{ backgroundColor: '#3B82F6' }}
          >
            Send Enquiry
          </button>
        </div>
      </div>
    </div>
  );
};

export const EventRegistrationCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  return (
    <div onClick={onClick} className="cursor-pointer transform transition-all hover:scale-105">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-sm mx-auto">
        {/* Background Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={template.image}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Form Content */}
        <div className="bg-white p-8 rounded-t-3xl -mt-8 relative">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
            Register for Event
          </h2>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none"
              disabled
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none"
              disabled
            />
            <input
              type="tel"
              placeholder="Phone number"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none"
              disabled
            />
            <textarea
              placeholder="Message"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none"
              disabled
            />
          </div>

          <button
            className="w-full mt-6 py-3.5 rounded-xl text-white font-medium text-base"
            style={{ backgroundColor: '#EF4444' }}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export const RestaurantBookingCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  return (
    <div onClick={onClick} className="cursor-pointer transform transition-all hover:scale-105">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-sm mx-auto">
        {/* Background Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={template.image}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Form Content */}
        <div className="bg-white p-8 rounded-t-3xl -mt-8 relative">
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

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none"
              disabled
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none"
              disabled
            />
            <input
              type="text"
              placeholder="Party size"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none"
              disabled
            />
            <div className="relative">
              <input
                type="text"
                placeholder="Preferred time"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none"
                disabled
              />
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="relative">
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-500 appearance-none focus:outline-none"
                disabled
              >
                <option>Occassion</option>
              </select>
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <textarea
              placeholder="Special Request"
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none"
              disabled
            />
          </div>

          <button
            className="w-full mt-6 py-3.5 rounded-xl text-white font-medium text-base"
            style={{ backgroundColor: '#F59E0B' }}
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
};

export const VotingPollCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  return (
    <div onClick={onClick} className="cursor-pointer transform transition-all hover:scale-105">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-sm mx-auto">
        {/* Small Image Icon */}
        <div className="flex justify-center pt-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md">
            <img
              src={template.image}
              alt={template.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
            Voting poll
          </h2>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none"
              disabled
            />
            <input
              type="text"
              placeholder="Email/Phone Number"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none"
              disabled
            />

            <div className="pt-2">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Question 1</h3>
              <div className="space-y-3">
                {['Option 1', 'Option 2', 'Option 3', 'Option 4'].map((option, idx) => (
                  <label key={idx} className="flex items-center gap-3 cursor-pointer">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${idx === 0 ? 'border-green-500' : 'border-gray-300'}`}>
                      {idx === 0 && <div className="w-3 h-3 rounded-full bg-green-500"></div>}
                    </div>
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            className="w-full mt-6 py-3.5 rounded-xl text-white font-medium text-base"
            style={{ backgroundColor: '#10B981' }}
          >
            Submit response
          </button>
        </div>
      </div>
    </div>
  );
};

export const ConferenceRegistrationCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  return (
    <div onClick={onClick} className="cursor-pointer transform transition-all hover:scale-105">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-xl overflow-hidden max-w-sm mx-auto p-1">
        <div className="bg-white rounded-3xl overflow-hidden">
          {/* Background Image */}
          <div className="relative h-48 overflow-hidden rounded-t-3xl">
            <img
              src={template.image}
              alt={template.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Form Content */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
              Conference Registration
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none"
                disabled
              />
              <input
                type="text"
                placeholder="Email/Phone Number"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none"
                disabled
              />
              <input
                type="text"
                placeholder="Company"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none"
                disabled
              />
              <input
                type="text"
                placeholder="Role"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none"
                disabled
              />
            </div>

            <button
              className="w-full mt-6 py-3.5 rounded-xl text-white font-medium text-base"
              style={{ backgroundColor: '#6366F1' }}
            >
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CourseRegistrationCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  return (
    <div onClick={onClick} className="cursor-pointer transform transition-all hover:scale-105">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-sm mx-auto">
        {/* Background Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={template.image}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Form Content */}
        <div className="bg-white p-8 rounded-t-3xl -mt-8 relative">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
            Register for our course
          </h2>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none"
              disabled
            />
            <input
              type="text"
              placeholder="Email/Phone Number"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none"
              disabled
            />
            <div className="relative">
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-500 appearance-none focus:outline-none"
                disabled
              >
                <option>Course interested in</option>
              </select>
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <textarea
              placeholder="Message"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none"
              disabled
            />
          </div>

          <button
            className="w-full mt-6 py-3.5 rounded-xl text-white font-medium text-base"
            style={{ backgroundColor: '#EF4444' }}
          >
            Send Enquiry
          </button>
        </div>
      </div>
    </div>
  );
};
