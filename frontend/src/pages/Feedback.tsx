import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { feedbackAPI } from '../api';
import type { Feedback } from '../api';
import { toast } from 'react-toastify';
import {
  StarIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const FeedbackPage: React.FC = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchFeedback();
    }
  }, [user]);

  const fetchFeedback = async () => {
    try {
      const data = await feedbackAPI.getFeedback();
      setFeedback(data);
    } catch (error) {
      toast.error('Failed to fetch feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="mt-2 text-gray-600">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Feedback</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and analyze user feedback and ratings
        </p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          {feedback.length > 0 ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <ChatBubbleLeftRightIcon className="h-8 w-8 text-primary-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Total Feedback</p>
                      <p className="text-2xl font-bold text-gray-900">{feedback.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <StarIcon className="h-8 w-8 text-yellow-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Average Rating</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length).toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <PhotoIcon className="h-8 w-8 text-secondary-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">With Images</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {feedback.filter(f => f.image_url).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback List */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Feedback</h3>
                <div className="space-y-4">
                  {feedback.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-600">
                                  {item.user?.name?.charAt(0).toUpperCase() || 'A'}
                                </span>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">
                                  {item.user?.name || 'Anonymous User'}
                                </p>
                                <p className="text-xs text-gray-500">{item.user?.email}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <StarIcon
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < item.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-500">
                              {item.rating}/5
                            </span>
                          </div>

                          <p className="text-gray-700 mb-3">{item.message}</p>

                          {item.image_url && (
                            <div className="mb-3">
                              <img
                                src={item.image_url}
                                alt="Feedback attachment"
                                className="h-32 w-32 object-cover rounded-lg border border-gray-200"
                              />
                            </div>
                          )}

                          <div className="flex items-center text-xs text-gray-500">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {formatDate(item.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback</h3>
              <p className="mt-1 text-sm text-gray-500">
                No user feedback has been submitted yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
