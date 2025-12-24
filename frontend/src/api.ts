import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, ErrorResponse, GetAppointmentsResponse, GetDoctorsResponse, GetDoctorsExpertiseResponse, CreateAppointmentRequest, CreateAppointmentResponse, GetDoctorAppointmentsResponse, GetUserRoleResponse } from './types';

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5084'}/api`;
const CHATBOT_URL = import.meta.env.VITE_CHATBOT_URL || 'http://localhost:8080';

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const error = data as ErrorResponse;
    throw new ApiError(response.status, error.message || 'An error occurred');
  }

  return data as T;
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/Login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  return handleResponse<LoginResponse>(response);
}

export async function register(userData: RegisterRequest): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/Register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  return handleResponse<RegisterResponse>(response);
}

export async function getAppointments(): Promise<GetAppointmentsResponse> {
  const token = TokenManager.get();

  const response = await fetch(`${API_BASE_URL}/get/appointments`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse<GetAppointmentsResponse>(response);
}

export async function getDoctors(): Promise<GetDoctorsResponse> {
  const token = TokenManager.get();

  const response = await fetch(`${API_BASE_URL}/get/doctor`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse<GetDoctorsResponse>(response);
}

export async function getDoctorsExpertise(): Promise<GetDoctorsExpertiseResponse> {
  const token = TokenManager.get();

  const response = await fetch(`${API_BASE_URL}/get/doctors/expertise`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse<GetDoctorsExpertiseResponse>(response);
}

export async function getDoctorsByExpertise(expertise: string): Promise<GetDoctorsResponse> {
  const token = TokenManager.get();

  const response = await fetch(`${API_BASE_URL}/get/doctor/expertise/${expertise}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse<GetDoctorsResponse>(response);
}

export async function getDoctorAppointments(doctorId: number): Promise<GetDoctorAppointmentsResponse> {
  const token = TokenManager.get();

  const response = await fetch(`${API_BASE_URL}/get/doctor/appointments/${doctorId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse<GetDoctorAppointmentsResponse>(response);
}

export async function createAppointment(appointmentData: CreateAppointmentRequest): Promise<CreateAppointmentResponse> {
  const token = TokenManager.get();

  const response = await fetch(`${API_BASE_URL}/add/appointment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(appointmentData),
  });

  return handleResponse<CreateAppointmentResponse>(response);
}

export async function sendChatMessage(message: string): Promise<string> {
  const response = await fetch(`${CHATBOT_URL}/api/input`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: message }),
  });

  if (!response.ok) {
    throw new ApiError(response.status, 'Chatbot yanıt veremedi');
  }

  const data = await response.json();
  return data.response || data.message || 'Yanıt alınamadı';
}

export async function getUserRole(): Promise<GetUserRoleResponse> {
  const token = TokenManager.get();

  const response = await fetch(`${API_BASE_URL}/get/user/role`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse<GetUserRoleResponse>(response);
}

// Token Management
export const TokenManager = {
  set(token: string): void {
    localStorage.setItem('authToken', token);
  },

  get(): string | null {
    return localStorage.getItem('authToken');
  },

  remove(): void {
    localStorage.removeItem('authToken');
  },

  isAuthenticated(): boolean {
    return this.get() !== null;
  }
};
