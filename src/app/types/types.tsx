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

export interface Service {
  id: string;
  name: string;
  specialty_id: string;
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

export interface OfficeFull {
  id: string;
  name: string;
  address: string;
  postal_code: string;
  phone_primary: string;
  phone_secondary: string | null;
  website_url: string | null;
  city_name: string;
  department_name: string;
  payment_methods: string[];
  photos: string[];
}

export interface CertificatePublic {
  id: string;
  url: string;
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
  offices: OfficeFull[];
  work_experience: string[];
  insurances: string[];
  certificates: CertificatePublic[];
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

/** Valores de género del backend (UserGender) */
export type UserGender = "MASCULINO" | "FEMENINO" | "OTRO";

/** Usuario actual según GET /api/v1/user/me/ (UserRead) */
export interface UserMe {
  id: string;
  name: string;
  lastname: string;
  email: string;
  phone_number?: string | null;
  birth_date?: string | null;
  gender?: UserGender | null;
  id_card?: string | null;
  profile_picture?: string | null;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  role: { id: string; name: string; description?: string | null };
  completion_percentage?: number | null;
  created_at?: string;
  updated_at?: string | null;
}

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export type AppointmentStatus =
  | "PENDING"
  | "COMPLETED"
  | "IN_PROCESS"
  | "CANCELED_BY_PATIENT"
  | "CANCELED_BY_DOCTOR"
  | "NO_SHOW";

/** Lo que el doctor ve del paciente. Sin documento de identidad, a propósito. */
export interface AppointmentPatient {
  id: string;
  name: string;
  lastname: string;
  profile_picture: string | null;
  email?: string | null;
  phone_number?: string | null;
  birth_date?: string | null;
  gender?: string | null;
}

/**
 * Lo que el paciente ve del doctor.
 *
 * Sin correo ni teléfono: para hablar con él está el chat. No es que vengan
 * vacíos, es que el backend no los manda en este tipo.
 */
export interface AppointmentDoctor {
  id: string;
  name: string;
  lastname: string;
  profile_picture: string | null;
  specialties: string[];
  languages: string[];
  professional_card_number?: string | null;
}

export interface AppointmentOffice {
  id: string;
  name: string;
  address: string;
  city_name?: string | null;
  department_name?: string | null;
  phone_primary?: string | null;
  phone_secondary?: string | null;
  /** Sitio web o enlace de Google Maps. De aquí sale "Cómo llegar". */
  website_url?: string | null;
}

/** Historial del paciente con este doctor. Solo lo puede pedir el doctor. */
export interface AppointmentContext {
  previous_count: number;
  last_visit?: string | null;
}

export interface AppointmentSchedule {
  id: string;
  date_of_service: string; // "YYYY-MM-DD"
  start_time: string;      // "HH:MM:SS"
  end_time: string;        // "HH:MM:SS"
  office: AppointmentOffice | null;
}

export interface AppointmentReview {
  id: string;
  appointment_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  schedule_id: string;
  doctor_id: string;
  patient_id: string;
  status: AppointmentStatus;
  cancel_reason: string | null;
  /** Marcada por la tarea de cierre por vencimiento, no por el doctor. */
  auto_closed_at?: string | null;
  created_at: string;
  updated_at: string | null;
  schedule: AppointmentSchedule | null;
  doctor: AppointmentDoctor | null;
  patient: AppointmentPatient | null;
  review: AppointmentReview | null;
}

export interface PaginatedAppointments {
  items: Appointment[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/** Borrador del perfil doctor según GET /api/v1/me/profile-draft/ (ProfileVersionRead) */
export interface ProfileDraftRead {
  id: string;
  doctor_id: string;
  name: string;
  lastname: string;
  description?: string | null;
  professional_card_number?: string | null;
  profile_picture?: string | null;
  status: string;
  version_no: number;
  completion_percentage: number;
  updated_at?: string | null;
}