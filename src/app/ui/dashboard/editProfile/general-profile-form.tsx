import * as z from "zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "./multi-select";
import { Specialty, University, Language, Disease, Service, UserMe, ProfileDraftRead, UserGender } from "@/app/types/types";
import { useCallback, useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { EDAD_MINIMA_DOCTOR, aniosCumplidos, esFutura, hoyISO } from "@/lib/birthDate";

const generalProfileSchema = z.object({
  doctor_name: z.string().min(1, { message: "El nombre es obligatorio" }),
  doctor_lastname: z.string().min(1, { message: "El apellido es obligatorio" }),
  email: z.string().email().optional().or(z.literal("")),
  phone_number: z.string().optional(),
  birth_date: z
    .string()
    .optional()
    .refine((v) => !v || !esFutura(v), {
      message: "La fecha de nacimiento no puede estar en el futuro",
    })
    .refine((v) => !v || aniosCumplidos(v) >= EDAD_MINIMA_DOCTOR, {
      message: `Un profesional debe tener al menos ${EDAD_MINIMA_DOCTOR} años cumplidos`,
    }),
  gender: z.enum(["MASCULINO", "FEMENINO", "OTRO"]).optional().nullable(),
  id_card: z.string().optional(),
  license_number: z.string(),
  specialties: z.array(z.object({ id: z.string() })),
  description: z.string(),
  doctor_education: z.array(z.object({ university_id: z.string() })),
  doctor_experience: z.object({
    existing: z.array(
      z.object({
        experience_id: z.string(),
        description: z.string(),
      })
    ),
    new: z.array(
      z.object({
        description: z.string(),
      })
    ),
  }),
  doctor_languages: z.array(z.object({ language_id: z.string() })),
  treated_diseases: z.array(
    z.object({
      disease_id: z.string(),
      comments: z.string().optional(),
    })
  ),
  services: z.array(z.object({ service_id: z.string() })),
});

type GeneralProfileValues = z.infer<typeof generalProfileSchema>;

/** Formatea el detalle de error del backend (puede ser string o lista de objetos de validación) */
function formatBackendError(detail: unknown): string {
  if (detail == null) return "Error desconocido";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const msgs = (detail as { msg?: string; loc?: unknown[] }[])
      .map((e) => e.msg ?? JSON.stringify(e))
      .filter(Boolean);
    return msgs.length ? msgs.join(". ") : "Error de validación";
  }
  return String(detail);
}

export interface GeneralProfileFormProps {
  /** Se llama tras un guardado exitoso, para que la tarjeta de verificación relea el porcentaje. */
  onSaved?: () => void;
}

export function GeneralProfileForm({ onSaved }: GeneralProfileFormProps = {}) {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [userData, setUserData] = useState<UserMe | null>(null);
  const [draftData, setDraftData] = useState<ProfileDraftRead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof generalProfileSchema>>({
    resolver: zodResolver(generalProfileSchema),
    defaultValues: {
      doctor_name: "",
      doctor_lastname: "",
      email: "",
      phone_number: "",
      birth_date: "",
      gender: null,
      id_card: "",
      license_number: "",
      specialties: [],
      description: "",
      doctor_education: [],
      doctor_experience: { existing: [], new: [] },
      doctor_languages: [],
      treated_diseases: [],
      services: [],
    },
  });

  const loadProfile = useCallback(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    async function run() {
      try {
        const [user, draft, specList, langList, univList, disList, expList, svcList] = await Promise.all([
          apiClient<UserMe>("/api/v1/user/me/"),
          apiClient<ProfileDraftRead>("/api/v1/me/profile-draft/"),
          apiClient<{ specialty_id: string }[]>("/api/v1/me/profile-draft/specialties/").catch(() => []),
          apiClient<{ language_id: string }[]>("/api/v1/me/profile-draft/languages/").catch(() => []),
          apiClient<{ university_id: string }[]>("/api/v1/me/profile-draft/universities/").catch(() => []),
          apiClient<{ disease_id: string; comments?: string }[]>("/api/v1/me/profile-draft/treated_diseases/").catch(() => []),
          apiClient<{ id: string; description: string }[]>("/api/v1/me/profile-draft/work_experience/").catch(() => []),
          apiClient<{ service_id: string }[]>("/api/v1/me/profile-draft/services/").catch(() => []),
        ]);

        if (cancelled) return;
        setUserData(user);
        setDraftData(draft);

        const specIds = Array.isArray(specList) ? specList : [];
        const langs = Array.isArray(langList) ? langList : [];
        const univs = Array.isArray(univList) ? univList : [];
        const dis = Array.isArray(disList) ? disList : [];
        const exp = Array.isArray(expList) ? expList : [];
        const svcs = Array.isArray(svcList) ? svcList : [];

        const phone = user.phone_number;
        const phoneStr = typeof phone === "string" ? phone : (phone && typeof phone === "object" && "national_number" in phone)
          ? String((phone as { national_number?: string }).national_number ?? "")
          : "";

        form.reset({
          doctor_name: draft.name || user.name || "",
          doctor_lastname: draft.lastname || user.lastname || "",
          email: user.email ?? "",
          phone_number: phoneStr || "",
          birth_date: user.birth_date ? String(user.birth_date).slice(0, 10) : "",
          gender: (user.gender as UserGender) ?? null,
          id_card: user.id_card ?? "",
          license_number: draft.professional_card_number ?? "",
          description: draft.description ?? "",
          specialties: specIds.map((s) => ({ id: s.specialty_id })),
          doctor_education: univs.map((u) => ({ university_id: u.university_id })),
          doctor_languages: langs.map((l) => ({ language_id: l.language_id })),
          treated_diseases: dis.map((d) => ({ disease_id: d.disease_id, comments: d.comments ?? "" })),
          services: svcs.map((s) => ({ service_id: s.service_id })),
          doctor_experience: {
            existing: exp.map((e) => ({ experience_id: e.id, description: e.description })),
            new: [],
          },
        });
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Error al cargar el perfil");
          console.error("Error loading profile:", err);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [form]);

  useEffect(() => {
    apiClient<Specialty[]>("/api/v1/specialty/")
      .then((data) => setSpecialties(Array.isArray(data) ? data : []))
      .catch(() => {});
    apiClient<{ id: string; name: string }[]>("/api/v1/university/")
      .then((data) => setUniversities((Array.isArray(data) ? data : []).map((u) => ({ university_id: u.id, name: u.name }))))
      .catch(() => {});
    apiClient<{ id: string; name: string }[]>("/api/v1/language/")
      .then((data) => setLanguages((Array.isArray(data) ? data : []).map((l) => ({ language_id: l.id, name: l.name }))))
      .catch(() => {});
    apiClient<{ id: string; name: string }[]>("/api/v1/disease/")
      .then((data) => setDiseases((Array.isArray(data) ? data : []).map((d) => ({ disease_id: d.id, name: d.name }))))
      .catch(() => {});
    apiClient<{ id: string; name: string; specialty_id: string }[]>("/api/v1/service/")
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => {});

    const cancel = loadProfile();
    return () => { if (typeof cancel === "function") cancel(); };
  }, [loadProfile]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(values: GeneralProfileValues) {
    const userId = userData?.id ?? draftData?.doctor_id;
    if (!userId) {
      alert("No se pudo identificar al usuario. Recargue la página.");
      return;
    }
    if (!process.env.NEXT_PUBLIC_API_URL?.trim()) {
      alert("Error de configuración: falta la URL del API (NEXT_PUBLIC_API_URL). Revise su archivo .env.local");
      return;
    }
    setIsSubmitting(true);
    let step = "datos del usuario";
    try {
      const userBody: Record<string, unknown> = {
        name: values.doctor_name,
        lastname: values.doctor_lastname,
      };
      if (values.birth_date && String(values.birth_date).trim() !== "") {
        userBody.birth_date = values.birth_date;
      }
      if (values.gender != null) {
        userBody.gender = values.gender;
      }
      if (values.id_card != null && String(values.id_card).trim() !== "") {
        userBody.id_card = values.id_card;
      }

      await apiClient(`/api/v1/user/${userId}/`, { method: "PATCH", body: userBody });

      step = "borrador del perfil";
      await apiClient("/api/v1/me/profile-draft/", {
        method: "PATCH",
        body: {
          name: values.doctor_name,
          lastname: values.doctor_lastname,
          description: values.description ?? "",
          professional_card_number: values.license_number ?? "",
        },
      });

      step = "especialidades / idiomas / universidades / servicios";
      await Promise.all([
        apiClient("/api/v1/me/profile-draft/specialties/", {
          method: "PUT",
          body: { specialties: values.specialties.map((s) => s.id) },
        }),
        apiClient("/api/v1/me/profile-draft/languages/", {
          method: "PUT",
          body: { languages: values.doctor_languages.map((l) => l.language_id) },
        }),
        apiClient("/api/v1/me/profile-draft/universities/", {
          method: "PUT",
          body: { universities: values.doctor_education.map((e) => e.university_id) },
        }),
        apiClient("/api/v1/me/draft-profile/services/", {
          method: "PUT",
          body: { services: values.services.map((s) => s.service_id) },
        }),
      ]);

      // Sincronizar experiencia laboral
      step = "experiencia laboral";
      const currentExp = (await apiClient("/api/v1/me/profile-draft/work_experience/")) as { id: string }[];
      const existing = values.doctor_experience?.existing ?? [];
      const toDeleteExp = (currentExp ?? []).filter((c) => {
        const ex = existing.find((e) => e.experience_id === c.id);
        if (!ex) return true;
        if (!String(ex.description ?? "").trim()) return true;
        return false;
      });
      await Promise.all(
        toDeleteExp.map((e) =>
          apiClient(`/api/v1/me/profile-draft/work_experience/${e.id}/`, { method: "DELETE" })
        )
      );
      for (const e of existing) {
        const desc = String(e.description ?? "").trim();
        if (desc) {
          await apiClient(`/api/v1/me/profile-draft/work_experience/${e.experience_id}/`, {
            method: "PUT",
            body: { description: desc },
          });
        }
      }
      for (const n of values.doctor_experience?.new ?? []) {
        const desc = String(n.description ?? "").trim();
        if (desc) {
          await apiClient("/api/v1/me/profile-draft/work_experience/", {
            method: "POST",
            body: { description: desc },
          });
        }
      }

      // Sincronizar enfermedades tratadas
      step = "enfermedades tratadas";
      const currentDis = (await apiClient("/api/v1/me/profile-draft/treated_diseases/")) as {
        disease_id: string;
      }[];
      const desiredDis = values.treated_diseases ?? [];
      const currentMap = new Set((currentDis ?? []).map((c) => c.disease_id));
      const desiredIds = new Set(desiredDis.map((d) => d.disease_id));
      await Promise.all(
        (currentDis ?? [])
          .filter((c) => !desiredIds.has(c.disease_id))
          .map((c) =>
            apiClient(`/api/v1/me/profile-draft/treated_diseases/${c.disease_id}/`, { method: "DELETE" })
          )
      );
      for (const d of desiredDis) {
        const comments = d.comments ?? "";
        if (currentMap.has(d.disease_id)) {
          await apiClient(`/api/v1/me/profile-draft/treated_diseases/${d.disease_id}/`, {
            method: "PUT",
            body: { comments },
          });
        } else {
          await apiClient("/api/v1/me/profile-draft/treated_diseases/", {
            method: "POST",
            body: { disease_id: d.disease_id, comments },
          });
        }
      }

      // El backend ya recalculó el porcentaje en cada endpoint que tocamos
      // arriba. Esto le avisa a la tarjeta que vuelva a leerlo.
      onSaved?.();

      alert("Perfil actualizado con éxito");
    } catch (error: unknown) {
      console.error(`Error al guardar [${step}]:`, error);
      const msg = error instanceof Error ? error.message : String(error);
      const isNetworkError = typeof msg === "string" && (
        msg === "Failed to fetch" ||
        msg.toLowerCase().includes("failed to fetch") ||
        msg.toLowerCase().includes("networkerror") ||
        msg.toLowerCase().includes("network request failed")
      );
      if (isNetworkError) {
        alert(
          `Error de red al guardar "${step}".\n\nVerifique que el backend esté corriendo en ${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"} y revise la pestaña Network del navegador para más detalles.`
        );
      } else {
        alert(`Error al guardar "${step}": ${formatBackendError(msg) || "Error desconocido."}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Función para eliminar una opción seleccionada
  const handleRemoveOption = (
    fieldName:
      | "specialties"
      | "doctor_education"
      | "doctor_languages"
      | "treated_diseases"
      | "services",
    id: string
  ) => {
    type FieldItem = Record<string, string | undefined>;
    const currentValues = form.getValues(fieldName) as FieldItem[];
    let idKey: string;
    switch (fieldName) {
      case "specialties":
        idKey = "id";
        break;
      case "doctor_education":
        idKey = "university_id";
        break;
      case "doctor_languages":
        idKey = "language_id";
        break;
      case "treated_diseases":
        idKey = "disease_id";
        break;
      case "services":
        idKey = "service_id";
        break;
      default:
        idKey = "";
    }
    // Filtrar el elemento a eliminar usando la clave correcta
    const updatedValues = currentValues.filter((item) => item[idKey] !== id);

    // Actualizar el campo en el formulario
    form.setValue(fieldName, updatedValues as never[]);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-muted-foreground">Cargando tu perfil...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive font-medium">Error al cargar el perfil</p>
        <p className="text-sm text-muted-foreground mt-1">{loadError}</p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => { setLoadError(null); loadProfile(); }}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* Datos personales y de contacto */}
        <div className="flex flex-col gap-4 mt-4 border border-blue-100 rounded-lg p-8">
          <h4 className="font-semibold">Datos personales y de contacto</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="correo@ejemplo.com" disabled {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="+57 300 123 4567" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birth_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de nacimiento</FormLabel>
                  <FormControl>
                    <Input type="date" max={hoyISO()} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Género</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? null : (e.target.value as UserGender))}
                    >
                      <option value="">Seleccione...</option>
                      <option value="MASCULINO">Masculino</option>
                      <option value="FEMENINO">Femenino</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="id_card"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cédula / Documento de identidad</FormLabel>
                  <FormControl>
                    <Input placeholder="Número de identificación" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Sobre ti */}
        <div className="flex flex-col gap-4 mt-4 border border-blue-100 rounded-lg p-8">
          <h4 className="font-semibold">Sobre ti</h4>
          <div className="flex flex-wrap justify-between gap-4">
            <FormField
              control={form.control}
              name="doctor_name"
              render={({ field }) => (
                <FormItem className="min-w-[200px] flex-1">
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese su primer nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="doctor_lastname"
              render={({ field }) => (
                <FormItem className="min-w-[200px] flex-1">
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese su apellido" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea placeholder="Escriba una breve descripción sobre usted" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

          {/* Información Profesional */}
        <div className="flex flex-col gap-4 mt-4 border border-blue-100 rounded-lg p-8">
        <h4 className="font-semibold">Información Profesional</h4>

        {/* Número de Licencia */}
        <FormField
          control={form.control}
          name="license_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Licencia</FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    draftData?.professional_card_number ||
                    "Ingrese su número de licencia"
                  }
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Educación */}
        <FormField
          control={form.control}
          name="doctor_education"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Educación</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {field.value.map((education: { university_id: string }) => (
                  <Button
                    key={education.university_id}
                    variant="fetched"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault(); // Prevenir comportamiento por defecto
                      e.stopPropagation(); // Detener propagación
                      handleRemoveOption(
                        "doctor_education",
                        education.university_id
                      );
                    }}
                  >
                    {
                      universities.find(
                        (u) => u.university_id === education.university_id
                      )?.name
                    }
                    <X className="ml-2 h-4 w-4" />
                  </Button>
                ))}
              </div>
              <FormControl>
                <MultiSelect
                  placeholder="Seleccione sus universidades"
                  options={universities.map((university) => ({
                    value: university.university_id,
                    label: university.name,
                  }))}
                  selected={field.value.map((item: { university_id: string }) => ({
                    value: item.university_id,
                    label:
                      universities.find(
                        (u) => u.university_id === item.university_id
                      )?.name ?? "",
                  }))}
                  onChange={(selected) =>
                    field.onChange(
                      selected.map((item) => ({
                        university_id: item.value,
                      }))
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

          {/* Campo de experiencia */}
          <FormField
          control={form.control}
          name="doctor_experience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Experiencia</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describa su experiencia profesional"
                  value={
                    // Mostrar la experiencia existente o nueva
                    field.value.existing?.[0]?.description ||
                    field.value.new?.[0]?.description ||
                    ""
                  }
                  onChange={(e) => {
                    const existingExperience = field.value.existing?.[0];
                    if (existingExperience) {
                      // Si hay experiencia existente, actualizar manteniendo el experience_id
                      form.setValue("doctor_experience", {
                        ...field.value,
                        existing: [
                          {
                            experience_id: existingExperience.experience_id,
                            description: e.target.value,
                          },
                        ],
                        new: [],
                      });
                    } else {
                      // Si no hay experiencia existente, actualizar la nueva
                      form.setValue("doctor_experience", {
                        ...field.value,
                        existing: [],
                        new: [
                          {
                            description: e.target.value,
                          },
                        ],
                      });
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

           {/* Idiomas */}
           <FormField
          control={form.control}
          name="doctor_languages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Idiomas</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {field.value.map((language: { language_id: string }) => (
                  <Button
                    key={language.language_id}
                    variant="fetched"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault(); // Prevenir comportamiento por defecto
                      e.stopPropagation(); // Detener propagación
                      handleRemoveOption(
                        "doctor_languages",
                        language.language_id
                      );
                    }}
                  >
                    {
                      languages.find(
                        (l) => l.language_id === language.language_id
                      )?.name
                    }
                    <X className="ml-2 h-4 w-4" />
                  </Button>
                ))}
              </div>
              <FormControl>
                <MultiSelect
                  placeholder="Seleccione los idiomas que habla"
                  options={languages.map((language) => ({
                    value: language.language_id,
                    label: language.name,
                  }))}
                  selected={field.value.map((item: { language_id: string }) => ({
                    value: item.language_id,
                    label:
                      languages.find((l) => l.language_id === item.language_id)
                        ?.name ?? "",
                  }))}
                  onChange={(selected) =>
                    field.onChange(
                      selected.map((item) => ({
                        language_id: item.value,
                      }))
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        </div>

          {/* Especialización y tratamientos */}
        <div className="flex flex-col gap-4 mt-4 border border-blue-100 rounded-lg p-8">
        <h4 className="font-semibold">Especialización y tratamientos</h4>
           {/* Especialidades */}
        <FormField
          control={form.control}
          name="specialties"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Especialidades</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {field.value.map((specialty: { id: string }) => (
                  <Button
                    key={specialty.id}
                    variant="fetched"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault(); // Prevenir comportamiento por defecto
                      e.stopPropagation(); // Detener propagación
                      handleRemoveOption("specialties", specialty.id); // Llamar a la función de eliminación
                    }}
                  >
                    {
                      specialties.find(
                        (s) => s.id === specialty.id
                      )?.name
                    }
                    <X className="ml-2 h-4 w-4" />
                  </Button>
                ))}
              </div>
              <FormControl>
                <MultiSelect
                  placeholder="Seleccione sus especialidades"
                  options={specialties.map((specialty) => ({
                    value: specialty.id,
                    label: specialty.name,
                  }))}
                  selected={field.value.map((item: { id: string }) => ({
                    value: item.id,
                    label:
                      specialties.find(
                        (s) => s.id === item.id
                      )?.name ?? "",
                  }))}
                  onChange={(selected: { value: string; label: string }[]) =>
                    field.onChange(
                      selected.map((item) => ({
                        id: item.value,
                      }))
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Enfermedades tratadas */}
        <FormField
          control={form.control}
          name="treated_diseases"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enfermedades tratadas</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {field.value.map((disease: { disease_id: string; comments?: string }, index: number) => (
                  <div key={disease.disease_id} className="flex flex-col gap-2">
                    <Button
                      variant="fetched"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault(); // Prevenir comportamiento por defecto
                        e.stopPropagation(); // Detener propagación
                        handleRemoveOption(
                          "treated_diseases",
                          disease.disease_id
                        );
                      }}
                    >
                      {
                        diseases.find(
                          (d) => d.disease_id === disease.disease_id
                        )?.name
                      }
                      <X className="ml-2 h-4 w-4" />
                    </Button>
                    <FormControl>
                      <Textarea
                        placeholder="Agregue comentarios sobre esta enfermedad"
                        value={disease.comments || ""} // Usar el valor actual de los comentarios
                        onChange={(e) => {
                          // Actualizar los comentarios en el formulario
                          const updatedDiseases: {
                            disease_id: string;
                            comments?: string;
                          }[] = [...field.value];
                          updatedDiseases[index].comments = e.target.value;
                          form.setValue(
                            "treated_diseases",
                            updatedDiseases as never[]
                          );
                        }}
                      />
                    </FormControl>
                  </div>
                ))}
              </div>
              <FormControl>
                <MultiSelect
                  placeholder="Seleccione las enfermedades que trata"
                  options={diseases.map((disease) => ({
                    value: disease.disease_id,
                    label: disease.name,
                  }))}
                  selected={field.value.map((item: { disease_id: string; comments?: string }) => ({
                    value: item.disease_id,
                    label:
                      diseases.find((d) => d.disease_id === item.disease_id)
                        ?.name ?? "",
                  }))}
                  onChange={(selected) =>
                    field.onChange(
                      selected.map((item) => ({
                        disease_id: item.value,
                        comments: "", // Inicializar comentarios vacíos
                      }))
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Servicios */}
        <FormField
          control={form.control}
          name="services"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Servicios</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {field.value.map((svc: { service_id: string }) => (
                  <Button
                    key={svc.service_id}
                    variant="fetched"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveOption("services", svc.service_id);
                    }}
                  >
                    {services.find((s) => s.id === svc.service_id)?.name}
                    <X className="ml-2 h-4 w-4" />
                  </Button>
                ))}
              </div>
              <FormControl>
                <MultiSelect
                  placeholder="Seleccione los servicios que ofrece"
                  options={services.map((s) => ({ value: s.id, label: s.name }))}
                  selected={field.value.map((item: { service_id: string }) => ({
                    value: item.service_id,
                    label: services.find((s) => s.id === item.service_id)?.name ?? "",
                  }))}
                  onChange={(selected) =>
                    field.onChange(selected.map((item) => ({ service_id: item.value })))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        </div>




        <Button
          className="bg-blue-700"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar Cambios"
          )}
        </Button>
      </form>
    </Form>
  );
}
