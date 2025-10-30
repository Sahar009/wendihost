import React from 'react';
import { FaCopy } from 'react-icons/fa';

interface CodeBlockProps {
  children: React.ReactNode;
  label?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children, label }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    if (typeof children === 'string') {
      navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  return (
    <div className="relative bg-gray-800 rounded-lg shadow-sm border border-gray-700 mb-2">
      {/* Header bar with circles and copy */}
      <div className="flex items-center justify-between px-4 py-2 rounded-t-lg bg-[#2d2d2d]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
          <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
        </div>
        <button
          className="text-gray-400 hover:text-white text-sm font-medium focus:outline-none"
          onClick={handleCopy}
          title="Copy"
          type="button"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {/* Code content */}
      <pre className="text-sm text-gray-300 font-mono whitespace-pre overflow-x-auto px-6 py-4">
        {children}
      </pre>
    </div>
  );
};

export default CodeBlock; 