"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MultiSelect } from "./multi-select"
import { Specialty } from "@/app/types/types";
import { useEffect, useState } from "react"

const generalProfileSchema = z.object({
  license_number: z.string().min(1, "El número de licencia es requerido"),
  specialties: z.array(z.object({ specialty_id: z.string().uuid() })).min(1, "Seleccione al menos una especialidad"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  doctor_education: z
    .array(z.object({ university_id: z.string().uuid() }))
    .min(1, "Seleccione al menos una universidad"),
  doctor_experience: z.object({
    existing: z.array(
      z.object({
        experience_id: z.string().uuid(),
        description: z.string().min(1, "La descripción es requerida"),
      }),
    ),
    new: z.array(
      z.object({
        description: z.string().min(1, "La descripción es requerida"),
      }),
    ),
  }),
  doctor_languages: z.array(z.object({ language_id: z.string().uuid() })).min(1, "Seleccione al menos un idioma"),
  treated_diseases: z
    .array(
      z.object({
        disease_id: z.string().uuid(),
        comments: z.string().optional(),
      }),
    )
    .min(1, "Seleccione al menos una enfermedad tratada"),
})

export function GeneralProfileForm() {

  const [specialties, setSpecialties] = useState<Specialty[]>([])


  const form = useForm<z.infer<typeof generalProfileSchema>>({
    resolver: zodResolver(generalProfileSchema),
    defaultValues: {
      license_number: "",
      specialties: [],
      description: "",
      doctor_education: [],
      doctor_experience: { existing: [], new: [] },
      doctor_languages: [],
      treated_diseases: [],
    },
  })

    // Fetch specialties when component mounts
    useEffect(() => {
      async function fetchSpecialties() {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/specialties`
          );
          if (!response.ok) {
            throw new Error('Failed to fetch specialties')
          }
          const data: Specialty[] = await response.json()
          setSpecialties(data)
        } catch (error) {
          console.error('Error fetching specialties:', error)
          // Optionally show an error toast or message to the user
        }
      }
  
      fetchSpecialties()
    }, [])

  function onSubmit(values: z.infer<typeof generalProfileSchema>) {
    console.log(values)
    // Aquí iría la lógica para enviar los datos al servidor
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="license_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Licencia</FormLabel>
              <FormControl>
                <Input placeholder="Ingrese su número de licencia" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specialties"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Especialidades</FormLabel>
              <FormControl>
                <MultiSelect
                  placeholder="Seleccione sus especialidades"
                  options={specialties.map(specialty => ({
                    value: specialty.specialty_id, 
                    label: specialty.name
                  }))}
                  selected={field.value}
                  onChange={(selected) => field.onChange(selected)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <FormField
          control={form.control}
          name="doctor_education"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Educación</FormLabel>
              <FormControl>
                <MultiSelect
                  placeholder="Seleccione sus universidades"
                  options={[
                    { value: "3fa85f64-5717-4562-b3fc-2c963f66afa8", label: "Universidad A" },
                    { value: "3fa85f64-5717-4562-b3fc-2c963f66afa9", label: "Universidad B" },
                    // Agrega más opciones según sea necesario
                  ]}
                  selected={field.value}
                  onChange={(selected) => field.onChange(selected)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Agrega campos similares para doctor_experience, doctor_languages, y treated_diseases */}
        <FormField
          control={form.control}
          name="doctor_languages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Idiomas</FormLabel>
              <FormControl>
                <MultiSelect
                  placeholder="Seleccione los idiomas que habla"
                  options={[
                    { value: "3fa85f64-5717-4562-b3fc-2c963f66afb0", label: "Español" },
                    { value: "3fa85f64-5717-4562-b3fc-2c963f66afb1", label: "Inglés" },
                    // Agrega más opciones según sea necesario
                  ]}
                  selected={field.value}
                  onChange={(selected) => field.onChange(selected)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="treated_diseases"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enfermedades tratadas</FormLabel>
              <FormControl>
                <MultiSelect
                  placeholder="Seleccione las enfermedades que trata"
                  options={[
                    { value: "3fa85f64-5717-4562-b3fc-2c963f66afb2", label: "Diabetes" },
                    { value: "3fa85f64-5717-4562-b3fc-2c963f66afb3", label: "Hipertensión" },
                    // Agrega más opciones según sea necesario
                  ]}
                  selected={field.value}
                  onChange={(selected) => field.onChange(selected)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Guardar Cambios</Button>
      </form>
    </Form>
  )
}

