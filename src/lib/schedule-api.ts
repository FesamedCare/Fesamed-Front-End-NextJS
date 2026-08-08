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


// ─── Operaciones por lote ────────────────────────────────────────────────────
//
// Publicar una jornada normal (lunes a viernes, 8-12 y 14-17, 30 min, dos
// meses) son 560 turnos. Uno por petición no es viable, así que el patrón
// viaja entero y el servidor lo expande en una transacción.

export interface TimeBlockIn {
  /** "HH:MM" */
  start_time: string;
  end_time: string;
}

export interface BulkScheduleCreate {
  /** 0 = lunes … 6 = domingo */
  weekdays: number[];
  blocks: TimeBlockIn[];
  slot_minutes: number;
  date_from: string;
  date_to: string;
  office_id: string;
  /** Con `true` el servidor no escribe: devuelve los conteos de la vista previa. */
  dry_run?: boolean;
}

export interface BulkScheduleDeleteData {
  date_from: string;
  date_to: string;
  weekdays?: number[];
  office_id?: string;
  dry_run?: boolean;
}

export interface SkippedSlot {
  date_of_service: string;
  start_time: string;
  end_time: string;
  /** `overlap`: chocaba con uno publicado. `booked`: tiene cita activa. */
  reason: "overlap" | "booked";
}

export interface BulkScheduleResult {
  created: number;
  skipped: number;
  skipped_details: SkippedSlot[];
  /** Minutos que sobran al final de las franjas en un día. */
  leftover_minutes_per_day: number;
  dry_run: boolean;
}

export interface BulkDeleteResult {
  deleted: number;
  kept: number;
  /** Los que no se borraron por tener cita agendada. */
  kept_details: SkippedSlot[];
  dry_run: boolean;
}

export async function bulkCreateSchedules(
  data: BulkScheduleCreate
): Promise<BulkScheduleResult> {
  return post<BulkScheduleResult>(`${BASE}/me/schedules/bulk/`, data);
}

/**
 * Un DELETE con cuerpo es válido en HTTP y FastAPI lo declara en el
 * openapi.json; `del()` ya acepta `body` en sus opciones.
 */
export async function bulkDeleteSchedules(
  data: BulkScheduleDeleteData
): Promise<BulkDeleteResult> {
  return del<BulkDeleteResult>(`${BASE}/me/schedules/bulk/`, { body: data });
}
