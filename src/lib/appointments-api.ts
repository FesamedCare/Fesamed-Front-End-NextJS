/**
 * API calls for appointment management (patient and doctor).
 */

import { get, post, patch } from "@/lib/api";
import type {
  Appointment,
  AppointmentContext,
  AppointmentReview,
} from "@/app/types/types";

const BASE = "/api/v1";

/** Patient: get all appointments for the current user */
export async function getAppointments(): Promise<Appointment[]> {
  return get<Appointment[]>(`${BASE}/appointment/`);
}

/** Get a single appointment by ID */
export async function getAppointmentById(id: string): Promise<Appointment> {
  return get<Appointment>(`${BASE}/appointment/${id}/`);
}

/** Cancel an appointment (patient or doctor) */
export async function cancelAppointment(
  id: string,
  cancel_reason?: string
): Promise<Appointment> {
  return patch<Appointment>(`${BASE}/appointment/${id}/cancel/`, { cancel_reason });
}

/** Patient: submit a review for a completed appointment */
export async function createReview(
  appointmentId: string,
  rating: number,
  comment?: string
): Promise<AppointmentReview> {
  return post<AppointmentReview>(`${BASE}/appointment/${appointmentId}/review/`, {
    rating,
    comment,
  });
}

export interface DoctorAppointmentFilters {
  from_date?: string;
  to_date?: string;
  status?: string;
}

/** Doctor: get own appointments with optional filters */
export async function getDoctorAppointments(
  filters: DoctorAppointmentFilters = {}
): Promise<Appointment[]> {
  const sp = new URLSearchParams();
  if (filters.from_date) sp.set("from_date", filters.from_date);
  if (filters.to_date) sp.set("to_date", filters.to_date);
  if (filters.status) sp.set("status", filters.status);
  const qs = sp.toString();
  const url = qs
    ? `${BASE}/doctors/me/appointments/?${qs}`
    : `${BASE}/doctors/me/appointments/`;
  return get<Appointment[]>(url);
}

/**
 * Doctor: registra que el paciente llegó. PENDING -> IN_PROCESS.
 *
 * Es el primero de dos momentos. Antes este endpoint escribía COMPLETED
 * directamente, así que el doctor daba la consulta por realizada antes de
 * atenderla y no había forma de deshacerlo.
 */
export async function checkInAppointment(id: string): Promise<Appointment> {
  return post<Appointment>(`${BASE}/appointment/${id}/check-in/`);
}

/** Doctor: cierra la consulta. IN_PROCESS -> COMPLETED. */
export async function checkOutAppointment(id: string): Promise<Appointment> {
  return post<Appointment>(`${BASE}/appointment/${id}/check-out/`);
}

/** Doctor: mark appointment as NO_SHOW */
export async function markNoShow(id: string): Promise<Appointment> {
  return post<Appointment>(`${BASE}/appointment/${id}/no-show/`);
}


/**
 * Historial del paciente con este doctor.
 *
 * Aparte del detalle y no dentro de la cita: pedirlo en la lista serían N
 * consultas para pintar algo que quizá nadie abra. Solo lo puede pedir el
 * doctor de la cita.
 */
export async function getAppointmentContext(
  id: string
): Promise<AppointmentContext> {
  return get<AppointmentContext>(`${BASE}/appointment/${id}/context/`);
}
