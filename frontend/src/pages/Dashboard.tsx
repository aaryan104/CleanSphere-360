import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, taskAPI, feedbackAPI } from '../api';
import { DashboardStats, Task, Feedback } from '../api';
import { toast } from 'react-toastify';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      console.log('Dashboard useEffect triggered, user:', user);
      if (!user) {
        console.log('No user found, skipping dashboard fetch');
        setIsLoading(false);
        return;
      }

      try {
        // Simple sequential fetching to avoid Promise.all issues
        console.log('Fetching dashboard stats...');
        const statsData = await dashboardAPI.getStats();
        console.log('Stats received:', statsData);
        setStats(statsData);
        
        if (user.role === 'admin') {
          console.log('Fetching admin tasks...');
          const tasksData = await taskAPI.getTasks();
          console.log('Admin tasks received:', tasksData);
          setRecentTasks(tasksData);
          
          console.log('Fetching admin feedback...');
          const feedbackData = await feedbackAPI.getFeedback();
          console.log('Admin feedback received:', feedbackData);
          setRecentFeedback(feedbackData);
          
        } else if (user.role === 'staff') {
          console.log('Fetching staff tasks...');
          const tasksData = await taskAPI.getStaffTasks();
          console.log('Staff tasks received:', tasksData);
          setRecentTasks(tasksData);
          
        } else {
          console.log('Fetching user feedback...');
          const feedbackData = await feedbackAPI.getFeedback();
          console.log('User feedback received:', feedbackData);
          setRecentFeedback(feedbackData);
        }
        
        console.log('Dashboard data fetch completed successfully');
        
      } catch (error: any) {
        console.error('Dashboard fetch error:', error);
        console.error('Error response:', error.response);
        console.error('Error status:', error.response?.status);
        console.error('Error data:', error.response?.data);
        toast.error(`Dashboard error: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to ensure everything is loaded
    const timer = setTimeout(fetchData, 500);
    return () => clearTimeout(timer);
  }, [user]);

  const handleSeedData = async () => {
    try {
      await dashboardAPI.seedData();
      toast.success('Sample data seeded successfully!');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to seed data');
    }
  };

  const testAPI = async () => {
    try {
      console.log('Testing basic API connectivity...');
      const response = await fetch('http://localhost:8000/test');
      const data = await response.json();
      console.log('Basic API test result:', data);
      toast.success('Basic API test successful!');
    } catch (error) {
      console.error('Basic API test failed:', error);
      toast.error('Basic API test failed!');
    }
  };

  const testAuthAPI = async () => {
    try {
      console.log('Testing authenticated API...');
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/test-auth', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log('Auth API test result:', data);
      toast.success('Auth API test successful!');
    } catch (error) {
      console.error('Auth API test failed:', error);
      toast.error('Auth API test failed!');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color }: {
    title: string;
    value: number;
    icon: any;
    color: string;
  }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome back, {user?.name}! Here's what's happening today.
          </p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={handleSeedData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
          >
            Seed Sample Data
          </button>
        )}
        
        {/* Debug Test Buttons */}
        <div className="mt-4 space-x-2">
          <button
            onClick={testAPI}
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Test Basic API
          </button>
          <button
            onClick={testAuthAPI}
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Test Auth API
          </button>
        </div>
      </div>

      {/* Admin Dashboard */}
      {user?.role === 'admin' && stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Tasks" value={stats.total_tasks} icon={ClipboardDocumentListIcon} color="bg-primary-500" />
          <StatCard title="Completed" value={stats.completed_tasks} icon={CheckCircleIcon} color="bg-green-500" />
          <StatCard title="In Progress" value={stats.in_progress_tasks} icon={ClockIcon} color="bg-yellow-500" />
          <StatCard title="Total Users" value={stats.total_users} icon={UserGroupIcon} color="bg-secondary-500" />
        </div>
      )}

      {/* Staff Dashboard */}
      {user?.role === 'staff' && stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="My Tasks" value={stats.total_tasks} icon={ClipboardDocumentListIcon} color="bg-primary-500" />
          <StatCard title="Completed" value={stats.completed_tasks} icon={CheckCircleIcon} color="bg-green-500" />
          <StatCard title="In Progress" value={stats.in_progress_tasks} icon={ClockIcon} color="bg-yellow-500" />
        </div>
      )}

      {/* User Dashboard */}
      {user?.role === 'user' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <StatCard title="Feedback Submitted" value={recentFeedback.length} icon={ChatBubbleLeftRightIcon} color="bg-primary-500" />
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <div className="text-center">
              <QrCodeIcon className="h-12 w-12 text-primary-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
              <Link to="/qr-feedback" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
                Submit Feedback
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(user?.role === 'admin' || user?.role === 'staff') && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {user?.role === 'admin' ? 'Recent Tasks' : 'My Tasks'}
                </h3>
                <Link to="/tasks" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentTasks.length > 0 ? (
                  recentTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500">{task.location}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No tasks found</p>
                )}
              </div>
            </div>
          </div>
        )}

        {(user?.role === 'admin' || user?.role === 'user') && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {user?.role === 'admin' ? 'Recent Feedback' : 'My Feedback'}
                </h3>
                <Link to="/feedback" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentFeedback.length > 0 ? (
                  recentFeedback.slice(0, 5).map((feedback) => (
                    <div key={feedback.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 truncate">{feedback.message}</p>
                      <div className="flex items-center mt-1">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(feedback.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No feedback found</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
