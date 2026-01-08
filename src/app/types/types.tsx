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