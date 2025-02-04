"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MultiSelect } from "./multi-select"
import { Specialty, University, Language, Disease } from "@/app/types/types";
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
  const [universities, setUniversities] = useState<University[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [diseases, setDiseases] = useState<Disease[]>([])


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

      async function fetchUniversities() {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/universities`, {
              method: "GET",
              credentials: "include",
            }
          );
          if (!response.ok) {
            throw new Error('Failed to fetch universities')
          }
          const data: University[] = await response.json()
          setUniversities(data)
        } catch (error) {
          console.error('Error fetching universities:', error)
          window.location.href = '/login'
        }
      }

      async function fetchLanguages() {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/languages`, {
              method: "GET",
              credentials: "include",
            }
          );
          if (!response.ok) {
            throw new Error('Failed to fetch languages')
          }
          const data = await response.json()
          setLanguages(data)
        } catch (error) {
          console.error('Error fetching languages:', error)
          window.location.href = '/login'
        }
      }

      async function fetchDiseases() {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/diseases`, {
              method: "GET",
              credentials: "include",
            }
          );
          if (!response.ok) {
            throw new Error('Failed to fetch diseases')
          }
          const data = await response.json()
          setDiseases(data)
        } catch (error) {
          console.error('Error fetching diseases:', error)
          window.location.href = '/login'
      }
    }
      

      fetchDiseases()
      fetchLanguages()
      fetchUniversities()
      fetchSpecialties()
    }, [])

  async function onSubmit(values: z.infer<typeof generalProfileSchema>) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/doctor/edit-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Incluir credenciales si es necesario (cookies, tokens)
        body: JSON.stringify(values), // Enviar los datos del formulario en formato JSON
      })

      if (!response.ok) {
        throw new Error("Error al enviar los datos al servidor")
        
      }

      const result = await response.json()
      console.log("Datos enviados con éxito:", result)
      alert("Perfil actualizado con éxito")
    } catch (error) {
      console.error("Error al enviar los datos:", error)
      alert("Hubo un error al enviar los datos. Por favor, inténtalo de nuevo.")
      console.log(values)
    }
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
                 selected={field.value.map(item => ({
                   value: item.specialty_id,
                   label: specialties.find(s => s.specialty_id === item.specialty_id)?.name || ''
                 }))}
                 onChange={(selected) => field.onChange(selected.map(item => ({
                   specialty_id: item.value
                 })))}
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
                  options={universities.map(university => ({
                    value: university.university_id, 
                    label: university.name
                  }))}
                  selected={field.value.map(item => ({
                    value: item.university_id,
                    label: universities.find(u => u.university_id === item.university_id)?.name || ''
                  }))}
                  onChange={(selected) => field.onChange(selected.map(item => ({
                    university_id: item.value
                  })))}
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
                 options={languages.map(language => ({
                   value: language.language_id, 
                   label: language.name
                 }))}
                 selected={field.value.map(item => ({
                   value: item.language_id,
                   label: languages.find(l => l.language_id === item.language_id)?.name || ''
                 }))}
                 onChange={(selected) => field.onChange(selected.map(item => ({
                   language_id: item.value
                 })))}
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
                  options={diseases.map(disease => ({
                    value: disease.disease_id, 
                    label: disease.name
                  }))}
                  selected={field.value.map(item => ({
                    value: item.disease_id,
                    label: diseases.find(d => d.disease_id === item.disease_id)?.name || ''
                  }))}
                  onChange={(selected) => field.onChange(selected.map(item => ({
                    disease_id: item.value,
                  })))}
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

