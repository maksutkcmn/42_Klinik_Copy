// API Types
export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  surname: string;
  email: string;
  phone: string;
  password: string;
  role?: string;
}

export interface LoginResponse {
  status: string;
  message: string;
  jwtToken: string;
}

export interface RegisterResponse {
  status: string;
  message: string;
  user: {
    name: string;
    surname: string;
    email: string;
    phone: string;
    role: string;
  };
}

export interface ErrorResponse {
  message: string;
  error?: string;
}

export interface Appointment {
  id: number;
  userId: number;
  doctorId: number;
  time: string;
  date: string;
}

export interface GetAppointmentsResponse {
  status: string;
  message: string;
  appointments: Appointment[];
  fromCache?: boolean;
}

export interface Doctor {
  id: number;
  name: string;
  expertise: string;
  gender: string;
}

export interface GetDoctorsResponse {
  status: string;
  message: string;
  doctor: Doctor[];
  fromCache?: boolean;
}

export interface GetDoctorsExpertiseResponse {
  status: string;
  message: string;
  expertises: string[];
  fromCache?: boolean;
}

export interface CreateAppointmentRequest {
  doctorId: number;
  time: string;
  date: string;
}

export interface CreateAppointmentResponse {
  status: string;
  message: string;
  response: Appointment;
}

export interface GetDoctorAppointmentsResponse {
  status: string;
  message: string;
  appointments: Appointment[];
  fromCache?: boolean;
}

export interface GetUserRoleResponse {
  status: string;
  message: string;
  userRole: string;
}

export interface AcquireLockRequest {
  doctorId: number;
  date: string;
  time: string;
}

export interface AcquireLockResponse {
  message: string;
  lockAcquired: boolean;
  lockKey: string;
  lockValue: string;
  expiresInSeconds: number;
}

export interface ReleaseLockRequest {
  lockKey: string;
  lockValue: string;
}

export interface ReleaseLockResponse {
  message: string;
  lockReleased: boolean;
}
