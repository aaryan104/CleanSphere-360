import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { feedbackAPI } from '../api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
  QrCodeIcon,
  StarIcon,
  PhotoIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const QRFeedback: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQRScan = () => {
    setIsScanning(true);
    // Simulate QR scan - in real app, this would open camera
    setTimeout(() => {
      setIsScanning(false);
      setShowForm(true);
      // Get user location (simulated)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation(`Lat: ${position.coords.latitude.toFixed(6)}, Lng: ${position.coords.longitude.toFixed(6)}`);
          },
          () => {
            setLocation('Building A, Floor 1'); // Fallback location
          }
        );
      } else {
        setLocation('Building A, Floor 1'); // Fallback location
      }
    }, 2000);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!message.trim()) {
      toast.error('Please provide feedback message');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = '';
      
      if (selectedImage) {
        const uploadResult = await feedbackAPI.uploadImage(selectedImage);
        imageUrl = uploadResult.url;
      }

      await feedbackAPI.createFeedback({
        message,
        rating,
        image_url: imageUrl || undefined
      });

      toast.success('Feedback submitted successfully!');
      
      // Reset form
      setRating(0);
      setMessage('');
      setLocation('');
      setSelectedImage(null);
      setImagePreview('');
      setShowForm(false);
      
      // Redirect to feedback history
      setTimeout(() => {
        navigate('/feedback');
      }, 2000);
      
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Please Login</h2>
        <p className="mt-2 text-gray-600">You need to be logged in to submit feedback.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">QR Feedback System</h1>
        <p className="mt-1 text-sm text-gray-600">
          Scan QR code to provide instant feedback about sanitation services
        </p>
      </div>

      {!showForm ? (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mb-6">
              <QrCodeIcon className="h-12 w-12 text-white" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Scan QR Code to Submit Feedback
            </h2>
            
            <p className="text-gray-600 mb-6">
              Look for QR codes placed around the facility to quickly report issues or provide feedback
            </p>

            <button
              onClick={handleQRScan}
              disabled={isScanning}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Scanning QR Code...
                </>
              ) : (
                <>
                  <QrCodeIcon className="h-5 w-5 mr-2" />
                  Simulate QR Scan
                </>
              )}
            </button>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">How it works:</h3>
              <ol className="text-sm text-gray-600 space-y-1 text-left">
                <li>1. Scan QR code with your device</li>
                <li>2. Rate the service (1-5 stars)</li>
                <li>3. Describe your feedback or issue</li>
                <li>4. Optionally attach a photo</li>
                <li>5. Submit for immediate attention</li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Submit Your Feedback</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How would you rate this service?
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <StarIcon
                        className={`h-8 w-8 ${
                          star <= rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300 hover:text-yellow-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {rating > 0 && `${rating}/5 stars`}
                  </span>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPinIcon className="h-4 w-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Current location"
                  readOnly
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ChatBubbleLeftRightIcon className="h-4 w-4 inline mr-1" />
                  Your Feedback
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Please describe your experience or report any issues..."
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <PhotoIcon className="h-4 w-4 inline mr-1" />
                  Attach Photo (Optional)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <div className="space-y-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview('');
                          }}
                          className="text-sm text-red-600 hover:text-red-500"
                        >
                          Remove image
                        </button>
                      </div>
                    ) : (
                      <>
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="image-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="image-upload"
                              name="image-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImageSelect}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRFeedback;
