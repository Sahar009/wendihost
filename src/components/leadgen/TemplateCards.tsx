import React from 'react';

// Template images - Update these paths to your actual images in the public folder
const TemplateImage1 = "/images/templateimage1.png";
const TemplateImage2 = "/images/templateimage3.png";
const TemplateImage3 = "/images/templateimage7.png";
const TemplateImage4 = "/images/templateimage1.png";
const TemplateImage5 = "/images/templateimage3.png";
const TemplateImage6 = "/images/templateimage2.png";

interface TemplateCardProps {
  template: any;
  onClick: () => void;
}

export const VotingPollCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  return (
    <div onClick={onClick} className="cursor-pointer transform transition-all hover:scale-105">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-sm mx-auto">
        {/* Image on left side - scaled down */}
        <div className="flex items-stretch h-[320px]">
          <div className="w-2/5 bg-gray-100 p-3 flex items-center justify-center">
            <div className="w-full h-full border-2 border-gray-300 rounded-sm overflow-hidden">
              <img
                src={TemplateImage1}
                alt={template.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Form preview on right */}
          <div className="w-3/5 p-4 flex flex-col justify-center bg-gray-50">
            <h3 className="text-sm font-bold mb-2 text-gray-900 leading-tight">
              Create a voting poll for anything you need
            </h3>
            <p className="text-[10px] text-gray-500 mb-3">
              We are readily available to answer all your enquires
            </p>

            <div className="bg-white p-3 rounded-xl shadow-sm space-y-2">
              <div className="text-xs font-bold text-center mb-2">Voting poll</div>
              <div className="h-6 bg-gray-100 rounded-md"></div>
              <div className="h-6 bg-gray-100 rounded-md"></div>

              <div className="pt-1">
                <div className="text-[10px] font-semibold mb-1">Question 1</div>
                <div className="space-y-1">
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full border-2 ${idx === 0 ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}></div>
                      <div className="text-[10px] text-gray-600">Option {idx + 1}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="w-full py-2 rounded-lg text-white text-xs font-semibold mt-2"
                style={{ backgroundColor: '#47a97b' }}
              >
                Submit response
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BusinessInquiryCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  return (
    <div onClick={onClick} className="cursor-pointer transform transition-all hover:scale-105">
      <div className="bg-gradient-to-br from-blue-500 to-blue-200 rounded-2xl shadow-lg overflow-hidden max-w-sm mx-auto">
        <div className="flex items-stretch h-[320px]">
          {/* Image on left */}
          <div className="w-2/5 p-3 flex items-center justify-center">
            <div className="w-full aspect-[3/4] rounded-xl overflow-hidden shadow-lg">
              <img
                src={TemplateImage2}
                alt={template.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Form on right */}
          <div className="w-3/5 p-4 flex flex-col justify-center">
            <h3 className="text-base font-bold mb-1 text-gray-900 leading-tight">
              Get in touch with us!
            </h3>
            <p className="text-[10px] text-gray-600 mb-3">
              We are readily available to answer all your enquires
            </p>

            <div className="space-y-2">
              <div className="h-7 bg-white/80 rounded-lg border border-gray-100"></div>
              <div className="h-7 bg-white/80 rounded-lg border border-gray-100"></div>
              <div className="h-7 bg-white/80 rounded-lg border border-gray-100"></div>
              <div className="h-7 bg-white/80 rounded-lg border border-gray-100"></div>
              <div className="h-12 bg-white/80 rounded-lg border border-gray-100"></div>
            </div>

            <button
              className="w-full py-2 rounded-lg text-white text-xs font-bold mt-3 shadow"
              style={{ backgroundColor: '#0070f3' }}
            >
              Send Enquiry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const EventRegistrationCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  return (
    <div onClick={onClick} className="cursor-pointer transform transition-all hover:scale-105">
      <div className="bg-gray-100 rounded-2xl shadow-lg overflow-hidden max-w-sm mx-auto">
        <div className="flex items-stretch h-[320px]">
          {/* Book image on left */}
          <div className="w-2/5 p-4 flex items-center justify-center">
            <div className="w-full aspect-square border-2 border-gray-300 rounded-sm overflow-hidden shadow-lg">
              <img
                src={TemplateImage3}
                alt={template.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Content on right */}
          <div className="w-3/5 p-4 flex flex-col justify-center">
            <h3 className="text-sm font-bold mb-2 text-gray-900 leading-tight">
              Get instant access to the full eBook pdf package
            </h3>
            <p className="text-[10px] text-gray-500 mb-3">
              We are readily available to answer all your enquires
            </p>

            <div className="bg-white p-3 rounded-xl shadow-sm space-y-2 mb-3">
              <div className="h-6 bg-gray-50 rounded-md border border-gray-100"></div>
              <div className="h-6 bg-gray-50 rounded-md border border-gray-100"></div>
            </div>

            <button
              className="w-full py-2 rounded-lg text-white text-xs font-bold shadow"
              style={{ backgroundColor: '#f06548' }}
            >
              Send the ebook to me
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RestaurantBookingCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  return (
    <div onClick={onClick} className="cursor-pointer transform transition-all hover:scale-105">
      <div className="relative rounded-2xl shadow-lg overflow-hidden max-w-sm mx-auto h-[320px] flex items-center justify-center">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src={TemplateImage4}
            alt={template.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
        </div>

        {/* Centered white card */}
        <div className="relative z-10 bg-white p-5 rounded-2xl w-[85%] max-w-[200px]">
          <h3 className="text-sm font-bold text-center mb-1 text-gray-900 leading-tight">
            Learn how to start a content creation journey from scratch
          </h3>
          <p className="text-[9px] text-center text-gray-500 mb-4">
            We are readily available to answer all your enquires
          </p>

          <div className="space-y-2">
            <div className="h-6 bg-gray-50 rounded-lg border border-gray-100"></div>
            <div className="h-6 bg-gray-50 rounded-lg border border-gray-100"></div>
          </div>

          <button
            className="w-full py-2 rounded-lg text-white text-xs font-bold mt-4 shadow"
            style={{ backgroundColor: '#f6b042' }}
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
};

export const CourseRegistrationCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  return (
    <div onClick={onClick} className="cursor-pointer transform transition-all hover:scale-105">
      <div className="bg-[#b314f8] rounded-2xl shadow-lg overflow-hidden max-w-sm mx-auto relative h-[320px]">
        {/* Logo/Header */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
            <img src={TemplateImage5} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-white font-bold text-[10px]">Golden fashion house</span>
        </div>

        <div className="flex items-stretch h-full">
          {/* Left content */}
          <div className="w-3/5 p-6 pt-12 flex flex-col justify-start">
            <h3 className="text-base font-extrabold mb-2 text-white leading-tight">
              The ultimate course to becoming a professional
            </h3>
            <p className="text-white/80 mb-4 text-[9px] leading-relaxed">
              Become professional hairdresser with my free online course
            </p>

            <div className="bg-white p-3 rounded-xl shadow-lg space-y-2">
              <div className="h-5 bg-gray-50 rounded-md border border-gray-100"></div>
              <div className="h-5 bg-gray-50 rounded-md border border-gray-100"></div>
              <div className="h-5 bg-gray-50 rounded-md border border-gray-100"></div>
              <div className="h-8 bg-gray-50 rounded-md border border-gray-100"></div>
              <button
                className="w-full py-2 rounded-lg text-white text-[10px] font-bold shadow mt-1"
                style={{ backgroundColor: '#b314f8' }}
              >
                Book my place
              </button>
            </div>
          </div>

          {/* Right image */}
          <div className="w-2/5 self-end pb-0">
            <div className="w-full h-[180px] rounded-tl-xl overflow-hidden">
              <img
                src={TemplateImage5}
                alt={template.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ConferenceRegistrationCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  return (
    <div onClick={onClick} className="cursor-pointer transform transition-all hover:scale-105">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg overflow-hidden max-w-sm mx-auto p-[3px]">
        <div className="bg-white rounded-2xl overflow-hidden h-[320px] flex flex-col">
          {/* Background Image */}
          <div className="relative h-32 overflow-hidden">
            <img
              src={TemplateImage6}
              alt={template.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Form Content */}
          <div className="p-5 flex-1 flex flex-col">
            <h3 className="text-base font-bold text-center mb-3 text-gray-900">
              Conference Registration
            </h3>

            <div className="space-y-2 flex-1">
              <div className="h-7 bg-gray-50 rounded-lg border border-gray-200"></div>
              <div className="h-7 bg-gray-50 rounded-lg border border-gray-200"></div>
              <div className="h-7 bg-gray-50 rounded-lg border border-gray-200"></div>
              <div className="h-7 bg-gray-50 rounded-lg border border-gray-200"></div>
            </div>

            <button
              className="w-full py-2 rounded-lg text-white text-xs font-semibold mt-3"
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
