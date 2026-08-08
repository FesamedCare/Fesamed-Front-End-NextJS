import { get, post, del } from "@/lib/api";

export interface DoctorScheduleSlot {
  id: string;
  doctor_id: string;
  office_id: string;
  start_time: string;
  end_time: string;
  date_of_service: string;
  is_active: boolean;
  is_booked: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface DoctorOfficeBasic {
  id: string;
  name: string;
  address: string;
}

export interface CreateScheduleData {
  date_of_service: string;
  start_time: string;
  end_time: string;
  office_id: string;
}

const BASE = "/api/v1";

export async function getMyScheduleRange(
  from_date: string,
  to_date: string
): Promise<DoctorScheduleSlot[]> {
  return get<DoctorScheduleSlot[]>(
    `${BASE}/me/schedules/range/?from_date=${from_date}&to_date=${to_date}`
  );
}

export async function createSchedule(
  data: CreateScheduleData
): Promise<DoctorScheduleSlot> {
  return post<DoctorScheduleSlot>(`${BASE}/me/schedule/`, data);
}

export async function deleteSchedule(id: string): Promise<void> {
  return del<void>(`${BASE}/me/schedule/${id}/`);
}

export async function getMyOffices(): Promise<DoctorOfficeBasic[]> {
  return get<DoctorOfficeBasic[]>(`${BASE}/me/consulting_office/`);
}

export interface DoctorVerificationStatus {
  is_profile_approved: boolean;
}

/**
 * Crear un horario exige perfil aprobado. El backend lo valida en
 * POST /me/schedule/, pero recién al enviar el formulario. Esto permite
 * avisarlo antes de que el doctor lo llene.
 */
export async function getMyVerificationStatus(): Promise<DoctorVerificationStatus> {
  return get<DoctorVerificationStatus>(
    `${BASE}/me/profile-draft/verification-status/`
  );
}
