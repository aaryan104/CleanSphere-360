import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
  withCredentials: false, // Important for CORS
});

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'user';
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  location: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to?: number;
  created_at: string;
  updated_at: string;
  assigned_user?: User;
  cleaning_request_id?: number;
}

export interface Feedback {
  id: number;
  user_id: number;
  message: string;
  rating: number;
  image_url?: string;
  created_at: string;
  user?: User;
}

export interface CleaningRequest {
  id: number;
  user_id: number;
  title: string;
  description: string;
  location: string;
  image_url: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  assigned_to?: number;
  task_id?: number;
  user?: User;
  assigned_user?: User;
}

export interface CleaningRequestCreate {
  title: string;
  description: string;
  location: string;
  image_url: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface DashboardStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  total_users: number;
  total_feedback: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'staff' | 'user';
}

export interface TaskCreate {
  title: string;
  description: string;
  location: string;
  assigned_to?: number;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: string;
  assigned_to?: number;
  location?: string;
}

export interface FeedbackCreate {
  message: string;
  rating: number;
  image_url?: string;
}

export const authAPI = {
  login: async (data: LoginRequest) => {
    const formData = new URLSearchParams();
    formData.append('username', data.email);
    formData.append('password', data.password);
    
    const response = await api.post('/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  register: async (data: RegisterRequest) => {
    const response = await api.post('/register', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const token = localStorage.getItem('token');
    const response = await api.get('/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  getUsers: async (): Promise<User[]> => {
    const token = localStorage.getItem('token');
    const response = await api.get('/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },
};

export const taskAPI = {
  getTasks: async (): Promise<Task[]> => {
    const token = localStorage.getItem('token');
    const response = await api.get('/tasks', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  getTask: async (id: number): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  getTaskLogs: async (id: number) => {
    const response = await api.get(`/tasks/${id}/logs`);
    return response.data;
  },

  getStaffTasks: async (): Promise<Task[]> => {
    const token = localStorage.getItem('token');
    const response = await api.get('/staff/tasks', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  createTask: async (task: TaskCreate): Promise<Task> => {
    const token = localStorage.getItem('token');
    const response = await api.post('/tasks', task, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  updateTask: async (id: number, task: TaskUpdate): Promise<Task> => {
    const token = localStorage.getItem('token');
    const response = await api.put(`/tasks/${id}`, task, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  deleteTask: async (id: number) => {
    const token = localStorage.getItem('token');
    const response = await api.delete(`/tasks/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },
};

export const feedbackAPI = {
  getFeedback: async (): Promise<Feedback[]> => {
    const token = localStorage.getItem('token');
    const response = await api.get('/feedback', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  createFeedback: async (feedback: FeedbackCreate): Promise<Feedback> => {
    const token = localStorage.getItem('token');
    const response = await api.post('/feedback', feedback, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const cleaningRequestAPI = {
  getCleaningRequests: async (): Promise<CleaningRequest[]> => {
    const token = localStorage.getItem('token');
    console.log('API: Fetching cleaning requests with token:', !!token);
    console.log('API: Token length:', token?.length);
    const response = await api.get('/cleaning-requests', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('API: Cleaning requests response status:', response.status);
    console.log('API: Cleaning requests data length:', response.data.length);
    return response.data;
  },

  createCleaningRequest: async (request: CleaningRequestCreate): Promise<CleaningRequest> => {
    const token = localStorage.getItem('token');
    const response = await api.post('/cleaning-requests', request, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  assignCleaningRequest: async (requestId: number, staffId: number) => {
    const token = localStorage.getItem('token');
    const response = await api.post(`/cleaning-requests/${requestId}/assign`, { staff_id: staffId }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },
};

export const dashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    const token = localStorage.getItem('token');
    const response = await api.get('/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  seedData: async () => {
    const token = localStorage.getItem('token');
    const response = await api.post('/seed-data', {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },
};
