import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { cleaningRequestAPI, authAPI } from '../api';
import { CleaningRequest, User } from '../api';
import { toast } from 'react-toastify';
import {
  UserIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

const AdminCleaningRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CleaningRequest[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CleaningRequest | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchRequests();
      fetchStaff();
    }
  }, [user]);

  // Add periodic refresh for new requests
  useEffect(() => {
    if (user?.role === 'admin') {
      const interval = setInterval(() => {
        fetchRequests();
      }, 10000); // Refresh every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [user]);

  // Add window focus refresh
  useEffect(() => {
    const handleFocus = () => {
      if (user?.role === 'admin') {
        fetchRequests();
        fetchStaff();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const fetchRequests = async () => {
    try {
      console.log('Fetching cleaning requests...');
      const data = await cleaningRequestAPI.getCleaningRequests();
      console.log('Cleaning requests received:', data);
      console.log('Number of requests:', data.length);
      console.log('Latest request:', data[0]);
      setRequests(data);
    } catch (error: any) {
      console.error('Failed to fetch cleaning requests:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to fetch cleaning requests');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      console.log('Fetching staff...');
      const data = await authAPI.getUsers();
      console.log('Staff received:', data);
      setStaff(data.filter(u => u.role === 'staff'));
    } catch (error: any) {
      console.error('Failed to fetch staff members:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to fetch staff members');
    }
  };

  const handleAssignRequest = async () => {
    if (!selectedRequest || !selectedStaff) {
      toast.error('Please select a staff member');
      return;
    }

    setIsAssigning(true);
    try {
      await cleaningRequestAPI.assignCleaningRequest(selectedRequest.id, selectedStaff);
      toast.success('Cleaning request assigned successfully!');
      setShowAssignModal(false);
      setSelectedRequest(null);
      setSelectedStaff(null);
      fetchRequests();
    } catch (error) {
      toast.error('Failed to assign cleaning request');
    } finally {
      setIsAssigning(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircleIcon;
      case 'in_progress':
        return ClockIcon;
      default:
        return ClockIcon;
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="mt-2 text-gray-600">Only admins can view cleaning requests.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cleaning Requests</h1>
          <p className="mt-1 text-sm text-gray-600">
            Review and assign cleaning requests submitted by users
          </p>
        </div>
        <button
          onClick={() => {
            fetchRequests();
            fetchStaff();
            toast.info('Refreshing data...');
          }}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {requests.length > 0 ? (
            requests.map((request) => {
              const StatusIcon = getStatusIcon(request.status);
              return (
                <li key={request.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-sm font-medium text-gray-900">{request.title}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                            {request.priority}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {request.status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            {request.user?.name}
                          </div>
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            {request.location}
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {new Date(request.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        {request.image_url && (
                          <div className="mt-3">
                            <button
                              onClick={() => window.open(request.image_url, '_blank')}
                              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
                            >
                              <PhotoIcon className="h-4 w-4 mr-1" />
                              View Photo
                            </button>
                          </div>
                        )}

                        {request.assigned_user && (
                          <div className="mt-2 text-sm text-gray-600">
                            Assigned to: <span className="font-medium">{request.assigned_user.name}</span>
                            {request.task_id && (
                              <span className="ml-2">
                                (Task ID: {request.task_id})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowAssignModal(true);
                          }}
                          disabled={request.status !== 'pending'}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {request.status === 'pending' ? 'Assign' : 'Assigned'}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })
          ) : (
            <li className="px-4 py-8 text-center text-gray-500">
              No cleaning requests found
            </li>
          )}
        </ul>
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Assign Cleaning Request</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900">{selectedRequest.title}</h4>
                <p className="text-sm text-gray-600">{selectedRequest.description}</p>
                <p className="text-sm text-gray-500 mt-1">Location: {selectedRequest.location}</p>
              </div>

              {selectedRequest.image_url && (
                <div>
                  <img
                    src={selectedRequest.image_url}
                    alt="Cleaning request"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Staff Member
                </label>
                <select
                  value={selectedStaff || ''}
                  onChange={(e) => setSelectedStaff(e.target.value ? Number(e.target.value) : null)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select staff member</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedRequest(null);
                  setSelectedStaff(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignRequest}
                disabled={isAssigning || !selectedStaff}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {isAssigning ? 'Assigning...' : 'Assign Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCleaningRequests;
