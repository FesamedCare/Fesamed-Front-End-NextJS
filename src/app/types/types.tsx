export interface Post {
  id: string;
  title: string;
  description: string;
  slug: string;
  content: string;
  views: number;
  category: {
    id: number;
    name: string;
    slug: string;
    views: number;
  };
  thumbnail: {
    content_path: string | null;
    url: string;
  } | null; // Puede ser un objeto o null
  time_read: number;
  published_at: string;
}
export interface Doctor {
  id: string
  name: string
  profilePicture: string
  specialty: string
  location: string
  about: string
  stats: {
    patients: number
    experience: number
    rating: number
    reviews: number
  }
  workingHours: string
}

export interface TimeSlot {
  time: string
  available: boolean
}

export interface AppointmentFormData {
  date: Date | undefined
  timeSlot: string | undefined
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}
export interface University {
  university_id: string;
  name: string;
}

export interface Language {
  language_id: string;
  name: string;
}

export interface Disease{
  disease_id: string;
  name: string;
}

export interface MedicalInsurance {
  id: string;
  name: string;
}

// --- Doctors search & booking (backend API) ---
export interface OfficeMinimal {
  id: string;
  name: string;
  address: string;
  city_name: string;
  department_name: string;
}

export interface DoctorSearchResult {
  doctor_id: string;
  profile_version_id: string;
  full_name: string;
  profile_picture: string | null;
  specialties: string[];
  cities: string[];
  offices: OfficeMinimal[];
}

export interface DoctorSearchPage {
  items: DoctorSearchResult[];
  total: number;
  page: number;
  size: number;
  pages?: number;
}

export interface DoctorFullProfile {
  doctor_id: string;
  name: string;
  lastname: string;
  profile_picture: string | null;
  description: string | null;
  professional_card_number: string | null;
  specialties: string[];
  languages: string[];
  universities: string[];
  treated_diseases: string[];
  services: string[];
  offices: OfficeMinimal[];
  work_experience: string[];
  insurances: string[];
}

export interface AvailabilitySlot {
  id: string;
  doctor_id: string;
  office_id: string;
  start_time: string;   // "HH:MM:SS"
  end_time: string;
  date_of_service: string; // "YYYY-MM-DD"
  is_booked: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string | null;
}

export interface DoctorAvailability {
  available_slots: AvailabilitySlot[];
  nearest_slot: AvailabilitySlot | null;
}

export interface CatalogCity {
  id: string;
  name: string;
  department_id: string;
  created_at?: string;
}

export interface CatalogDepartment {
  id: string;
  name: string;
  created_at?: string;
}

export interface CatalogSpecialty {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
}