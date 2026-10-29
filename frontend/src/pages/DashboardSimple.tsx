import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../api';
import { toast } from 'react-toastify';

const DashboardSimple: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        console.log('=== FETCHING DASHBOARD STATS ===');
        console.log('User:', user);
        console.log('Token:', localStorage.getItem('token'));
        
        const response = await fetch('http://localhost:8000/dashboard/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Stats data:', data);
        setStats(data);
        toast.success('Dashboard data loaded successfully!');
        
      } catch (error: any) {
        console.error('=== DASHBOARD ERROR ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        toast.error(`Dashboard error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Simple Dashboard</h1>
      <p className="mb-4">User: {user?.email}</p>
      <p className="mb-4">Role: {user?.role}</p>
      
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold">Total Tasks</h3>
            <p className="text-2xl font-bold">{stats.total_tasks}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold">Completed</h3>
            <p className="text-2xl font-bold">{stats.completed_tasks}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold">Pending</h3>
            <p className="text-2xl font-bold">{stats.pending_tasks}</p>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-gray-500">No stats available</p>
        </div>
      )}
    </div>
  );
};

export default DashboardSimple;
