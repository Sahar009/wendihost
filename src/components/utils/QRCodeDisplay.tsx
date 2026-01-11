import React, { useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, QrCode, Copy, ExternalLink, Share2, Facebook, Twitter, MessageCircle } from 'lucide-react';
import { toast } from 'react-toastify';

interface QRCodeDisplayProps {
  url: string;
  title?: string;
  size?: number;
  showActions?: boolean;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ 
  url, 
  title = 'QR Code', 
  size = 150,
  showActions = true 
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showFullSize, setShowFullSize] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    generateQRCode();
  }, [url, size]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!(event.target as HTMLElement).closest('.share-dropdown')) {
        setShowShareOptions(false);
      }
    }
    if (showShareOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareOptions]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      const dataUrl = await QRCode.toDataURL(url, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M'
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = async () => {
    try {
      const downloadSize = 512;
      const dataUrl = await QRCode.toDataURL(url, {
        width: downloadSize,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M'
      });
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qrcode.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('QR code downloaded successfully');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const openLink = () => {
    window.open(url, '_blank');
  };

  const shareToSocialMedia = (platform: string) => {
    const shareText = `Check out this QR code for ${title}: ${url}`;
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(url);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}`;
        break;
      case 'native':
        if (navigator.share) {
          navigator.share({
            title: title,
            text: shareText,
            url: url
          }).then(() => {
            toast.success('Shared successfully');
          }).catch(() => {
            toast.info('Share cancelled');
          });
          return;
        } else {
          copyToClipboard();
          return;
        }
      default:
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="flex flex-col items-center space-y-2">
        <div 
          className="relative cursor-pointer transition-transform duration-200 hover:scale-105"
          onClick={() => setShowFullSize(!showFullSize)}
        >
          <img 
            src={qrCodeDataUrl} 
            alt={`${title} QR Code`}
            className="rounded-lg shadow-md border border-gray-200"
            style={{ width: size, height: size }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
            <QrCode className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        </div>
        
        {showActions && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={copyToClipboard}
              className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              title="Copy link"
            >
              <Copy className="w-3 h-3 text-gray-600" />
            </button>
            <button
              onClick={downloadQRCode}
              className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              title="Download QR code"
            >
              <Download className="w-3 h-3 text-gray-600" />
            </button>
            <div className="relative share-dropdown">
              <button
                onClick={() => setShowShareOptions(!showShareOptions)}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                title="Share QR code"
              >
                <Share2 className="w-3 h-3 text-gray-600" />
              </button>
              {showShareOptions && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    <button
                      onClick={() => shareToSocialMedia('facebook')}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Facebook className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Facebook</span>
                    </button>
                    <button
                      onClick={() => shareToSocialMedia('twitter')}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Twitter className="w-4 h-4 text-sky-500" />
                      <span className="text-sm">Twitter</span>
                    </button>
                    <button
                      onClick={() => shareToSocialMedia('whatsapp')}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">WhatsApp</span>
                    </button>
                    <button
                      onClick={() => shareToSocialMedia('native')}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Share2 className="w-4 h-4 text-gray-600" />
                      <span className="text-sm">More options</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={openLink}
              className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              title="Open link"
            >
              <ExternalLink className="w-3 h-3 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {showFullSize && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowFullSize(false)}
        >
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button
                onClick={() => setShowFullSize(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <img 
                src={qrCodeDataUrl} 
                alt={`${title} QR Code`}
                className="rounded-lg shadow-md border border-gray-200"
                style={{ width: 256, height: 256 }}
              />
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Scan this QR code to visit:</p>
                <p className="text-xs text-blue-600 break-all font-mono">{url}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Copy Link
                </button>
                <button
                  onClick={downloadQRCode}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Download
                </button>
                <div className="relative share-dropdown">
                  <button
                    onClick={() => setShowShareOptions(!showShareOptions)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  {showShareOptions && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="p-2">
                        <button
                          onClick={() => shareToSocialMedia('facebook')}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Facebook className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">Facebook</span>
                        </button>
                        <button
                          onClick={() => shareToSocialMedia('twitter')}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Twitter className="w-4 h-4 text-sky-500" />
                          <span className="text-sm">Twitter</span>
                        </button>
                        <button
                          onClick={() => shareToSocialMedia('whatsapp')}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <MessageCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">WhatsApp</span>
                        </button>
                        <button
                          onClick={() => shareToSocialMedia('native')}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Share2 className="w-4 h-4 text-gray-600" />
                          <span className="text-sm">More options</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;
