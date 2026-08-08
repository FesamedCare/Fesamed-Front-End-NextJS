"use client";

import * as z from "zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api";
import { useAuthContext } from "@/contexts/AuthContext";
import { esFutura, hoyISO } from "@/lib/birthDate";
import type { UserMe, UserGender } from "@/app/types/types";
import { useTranslation } from "@/i18n/LocaleProvider";

// Sin la regla de edad mínima: esa es solo para profesionales. Un paciente
// puede ser menor de edad. Ver src/app/api/v1/users/birth_date.py.
const patientProfileSchema = z.object({
  name: z.string().min(1, { message: "El nombre es obligatorio" }),
  lastname: z.string().min(1, { message: "El apellido es obligatorio" }),
  birth_date: z
    .string()
    .optional()
    .refine((v) => !v || !esFutura(v), {
      message: "La fecha de nacimiento no puede estar en el futuro",
    }),
  gender: z.enum(["MASCULINO", "FEMENINO", "OTRO"]).optional().nullable(),
  id_card: z.string().optional(),
});

type PatientProfileValues = z.infer<typeof patientProfileSchema>;

export function PatientProfileForm() {
  const { t } = useTranslation();
  const { notifyProfileChanged } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const form = useForm<PatientProfileValues>({
    resolver: zodResolver(patientProfileSchema),
    defaultValues: {
      name: "",
      lastname: "",
      birth_date: "",
      gender: null,
      id_card: "",
    },
  });

  const cargar = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const user = await apiClient<UserMe>("/api/v1/user/me/");
      setUserId(user.id);
      form.reset({
        name: user.name ?? "",
        lastname: user.lastname ?? "",
        birth_date: user.birth_date ? String(user.birth_date).slice(0, 10) : "",
        gender: (user.gender as UserGender) ?? null,
        id_card: user.id_card ?? "",
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Error al cargar tus datos");
    } finally {
      setIsLoading(false);
    }
  }, [form]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function onSubmit(values: PatientProfileValues) {
    if (!userId) return;
    setMsg(null);
    setIsSubmitting(true);

    try {
      await apiClient(`/api/v1/user/${userId}/`, {
        method: "PATCH",
        body: {
          name: values.name,
          lastname: values.lastname,
          // El backend rechaza cadena vacía en una fecha: se manda null.
          birth_date: values.birth_date || null,
          gender: values.gender || null,
          id_card: values.id_card || null,
        },
      });

      setMsg({ type: "success", text: "Datos actualizados." });
      // Fuente única: el dashboard y la navbar se enteran solos.
      notifyProfileChanged();
    } catch (err) {
      setMsg({
        type: "error",
        text: err instanceof Error ? err.message : "No se pudieron guardar los datos.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> {t("ui.loadingYourData")}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500 text-sm mb-4">{loadError}</p>
        <Button variant="outline" onClick={cargar}>{t("common.retry")}</Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("profile.firstName")}</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("profile.lastName")}</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} />
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
                <FormLabel>{t("profile.birthDate")}</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    max={hoyISO()}
                    {...field}
                    value={field.value ?? ""}
                    disabled={isSubmitting}
                  />
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
                <FormLabel>{t("profile.gender")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? undefined}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("profile.pickOption")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MASCULINO">{t("profile.male")}</SelectItem>
                    <SelectItem value="FEMENINO">{t("profile.female")}</SelectItem>
                    <SelectItem value="OTRO">{t("profile.other")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="id_card"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("profile.idDocumentShort")}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {msg && (
          <p className={`text-sm ${msg.type === "success" ? "text-green-600" : "text-red-500"}`}>
            {msg.text}
          </p>
        )}

        <Button
          type="submit"
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>
    </Form>
  );
}
