export interface Customer {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  _id: string;
  name: string;
  category: string;
  description?: string;
  isActive: boolean;
}

export interface WorkArea {
  _id: string;
  name: string;
  city: string;
  county?: string;
  state: string;
  zipCodes: string[];
  coordinates: {
    center: {
      lat: number;
      lng: number;
    };
    radius: number;
  };
  isActive: boolean;
}

export interface Technician {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  employeeId: string;
}

export interface ServiceAppointment {
  _id: string;
  customerId: Customer | string;
  technicianId?: Technician | string;
  title: string;
  description: string;
  serviceType: 'plumbing' | 'electrical' | 'roofing' | 'hvac' | 'general_repair' | 'carpentry' | 'painting' | 'landscaping';
  requiredSkills: Skill[];
  workAreaId: WorkArea;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  scheduledDateTime: string;
  estimatedDuration: number;
  status: 'pending' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customerFeedback?: {
    rating: number;
    comment?: string;
    submittedAt: string;
  };
  assignedAt?: string;
  acceptedAt?: string;
  completedAt?: string;
  completionNotes?: string;
  referenceNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentData {
  title: string;
  description: string;
  serviceType: ServiceAppointment['serviceType'];
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  scheduledDateTime: string;
  estimatedDuration?: number;
  priority?: ServiceAppointment['priority'];
}

export interface CustomerFeedback {
  rating: number;
  comment?: string;
}

export interface AuthUser {
  user: Customer;
  role: 'customer';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}