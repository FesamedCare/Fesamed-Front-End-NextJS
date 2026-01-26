/**
 * API calls for doctor search, profile, availability and appointment booking.
 * Public endpoints use noCredentials; appointment create uses credentials.
 */

import { get, post } from "@/lib/api";
import type {
  DoctorSearchPage,
  DoctorFullProfile,
  DoctorAvailability,
  CatalogCity,
  CatalogDepartment,
  CatalogSpecialty,
} from "@/app/types/types";

const BASE = "/api/v1";

export interface SearchDoctorsParams {
  q?: string;
  city_id?: string;
  department_id?: string;
  specialty_id?: string;
  service_id?: string;
  insurance_id?: string;
  page?: number;
  size?: number;
}

export async function searchDoctors(
  params: SearchDoctorsParams = {}
): Promise<DoctorSearchPage> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q ?? "");
  if (params.city_id) sp.set("city_id", params.city_id);
  if (params.department_id) sp.set("department_id", params.department_id);
  if (params.specialty_id) sp.set("specialty_id", params.specialty_id);
  if (params.service_id) sp.set("service_id", params.service_id);
  if (params.insurance_id) sp.set("insurance_id", params.insurance_id);
  if (params.page != null) sp.set("page", String(params.page));
  if (params.size != null) sp.set("size", String(params.size ?? 20));
  const qs = sp.toString();
  const url = qs ? `${BASE}/doctors/search/?${qs}` : `${BASE}/doctors/search/`;
  return get<DoctorSearchPage>(url, { noCredentials: true });
}

export async function getDoctorProfile(doctorId: string): Promise<DoctorFullProfile> {
  return get<DoctorFullProfile>(`${BASE}/doctors/${doctorId}/profile/`, {
    noCredentials: true,
  });
}

export interface GetAvailabilityParams {
  doctor_id: string;
  date_from?: string; // YYYY-MM-DD
  date_to?: string;
  city_id?: string;
  office_id?: string;
}

export async function getDoctorAvailability(
  params: GetAvailabilityParams
): Promise<DoctorAvailability> {
  const { doctor_id, ...rest } = params;
  const sp = new URLSearchParams();
  if (rest.date_from) sp.set("date_from", rest.date_from);
  if (rest.date_to) sp.set("date_to", rest.date_to);
  if (rest.city_id) sp.set("city_id", rest.city_id);
  if (rest.office_id) sp.set("office_id", rest.office_id);
  const qs = sp.toString();
  const url = qs
    ? `${BASE}/doctors/${doctor_id}/availability/?${qs}`
    : `${BASE}/doctors/${doctor_id}/availability/`;
  return get<DoctorAvailability>(url, { noCredentials: true });
}

export async function createAppointment(scheduleId: string, doctorId: string): Promise<unknown> {
  return post(`${BASE}/appointment/`, { schedule_id: scheduleId, doctor_id: doctorId });
}

// Catalog (public, for filters)
export async function getCities(): Promise<CatalogCity[]> {
  return get<CatalogCity[]>(`${BASE}/city/`, { noCredentials: true });
}

export async function getDepartments(): Promise<CatalogDepartment[]> {
  return get<CatalogDepartment[]>(`${BASE}/department/`, { noCredentials: true });
}

export async function getSpecialties(): Promise<CatalogSpecialty[]> {
  return get<CatalogSpecialty[]>(`${BASE}/specialty/`, { noCredentials: true });
}
