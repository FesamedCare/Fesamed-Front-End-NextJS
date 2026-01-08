import * as z from "zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "./multi-select";
import { Specialty, University, Language, Disease } from "@/app/types/types";
import { useEffect, useState } from "react";
import { X } from "lucide-react";


const generalProfileSchema = z.object({
  doctor_name: z.string().min(1, { message: "El nombre es obligatorio" }),
  doctor_lastname: z.string().min(1, { message: "El apellido es obligatorio" }),
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
});

export function GeneralProfileForm() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [doctorData, setDoctorData] = useState<any>(null);

  const form = useForm<z.infer<typeof generalProfileSchema>>({
    resolver: zodResolver(generalProfileSchema),
    defaultValues: {
      doctor_name: "",
      doctor_lastname: "",
      license_number: "",
      specialties: [],
      description: "",
      doctor_education: [],
      doctor_experience: { existing: [], new: [] },
      doctor_languages: [],
      treated_diseases: [],
    },
  });

  // Fetch specialties and user data
  useEffect(() => {
    async function userData() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/me/`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        const data = await response.json();
        console.log("User data:", data);
        form.reset({
          doctor_name: data.name || "",
          doctor_lastname: data.lastname || "",
          license_number: data.license_number || "",
          description: data.description || "",
          specialties: data.specialties || [],
          doctor_education: data.education || [],
          doctor_languages: data.languages || [],
          treated_diseases: data.treated_diseases || [],
          doctor_experience: {
            existing: data.experience || [],
            new: [],
          },
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }

    async function fetchSpecialties() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/specialty/`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch specialties");
        }
        const data: Specialty[] = await response.json();
        setSpecialties(data);
      } catch (error) {
        console.error("Error fetching specialties:", error);
      }
    }

    async function fetchUniversities() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/universities`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch universities");
        }
        const data: University[] = await response.json();
        setUniversities(data);
      } catch (error) {
        console.error("Error fetching universities:", error);
        window.location.href = "/login";
      }
    }

    async function fetchLanguages() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/languages`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch languages");
        }
        const data = await response.json();
        setLanguages(data);
      } catch (error) {
        console.error("Error fetching languages:", error);
        window.location.href = "/login";
      }
    }

    async function fetchDiseases() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/diseases`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch diseases");
        }
        const data = await response.json();
        setDiseases(data);
      } catch (error) {
        console.error("Error fetching diseases:", error);
        window.location.href = "/login";
      }
    }

    userData();
    fetchDiseases();
    fetchLanguages();
    fetchUniversities();
    fetchSpecialties();
  }, [form]);

  async function onSubmit(values: any) {
    console.log("Valores del formulario:", values);

    try {
      const doctorExperience = values.doctor_experience || {
        existing: [],
        new: [],
      };


      if (!Array.isArray(doctorExperience.new)) {
        doctorExperience.new = [];
      }

      const dataToSend = {
        name: values.doctor_name,
        lastname: values.doctor_lastname,
        license_number: values.license_number,
        description: values.description,
        specialties: values.specialties.map((specialty: any) => ({
          specialty_id: specialty.id,
        })),
        doctor_education: values.doctor_education.map((education: any) => ({
          university_id: education.university_id,
        })),
        doctor_languages: values.doctor_languages.map((language: any) => ({
          language_id: language.language_id,
        })),
        treated_diseases: values.treated_diseases.map((disease: any) => ({
          disease_id: disease.disease_id,
          comments: disease.comments || null,
        })),
        doctor_experience: {
          existing: doctorExperience.existing.map((experience: any) => ({
            experience_id: experience.experience_id,
            description: experience.description,
          })),
          new: doctorExperience.new.map((experience: any) => ({
            description: experience.description,
          })),
        },
      };

      console.log("Datos a enviar:", dataToSend);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/doctor/edit-profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(dataToSend),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Error al enviar los datos al servidor"
        );
      }

      const result = await response.json();
      console.log("Datos enviados con éxito:", result);
      alert("Perfil actualizado con éxito");
    } catch (error: any) {
      console.error("Error al enviar los datos:", error);
      alert(`Hubo un error al enviar los datos: ${error.message}`);
    }
  }

  // Función para eliminar una opción seleccionada
  const handleRemoveOption = (
    fieldName:
      | "specialties"
      | "doctor_education"
      | "doctor_languages"
      | "treated_diseases",
    id: string
  ) => {
    const currentValues = form.getValues(fieldName) as any[]; // Obtener los valores actuales
    let idKey;
    switch (fieldName) {
      case "specialties":
        idKey = "specialty_id";
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
      default:
        idKey = "";
    }
    // Filtrar el elemento a eliminar usando la clave correcta
    const updatedValues = currentValues.filter((item) => item[idKey] !== id);

    // Actualizar el campo en el formulario
    form.setValue(fieldName, updatedValues as never[]);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* Sobre ti */}
        <div className="flex flex-col gap-4 mt-4 border border-blue-100 rounded-lg p-8">

          <h4 className="font-semibold">Sobre ti</h4>

        <div className="flex justify-between">
              {/* Nombre */}
      <FormField
          control={form.control}
          name="doctor_name"
          render={({ field }) => (
            <FormItem className="w-[48%]">
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    doctorData?.name ||
                    "Ingrese su primer nombre"
                  }
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Apellido */}
           <FormField
          control={form.control}
          name="doctor_lastname"
          render={({ field }) => (
            <FormItem className="w-[48%]">
              <FormLabel>Apellido</FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    doctorData?.name ||
                    "Ingrese su apellido"
                  }
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>

        {/* Descripción */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={
                    doctorData?.description ||
                    "Escriba una breve descripción sobre usted"
                  }
                  {...field}
                />
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
                    doctorData?.license_number ||
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
                {field.value.map((education: any) => (
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
                  selected={field.value.map((item: any) => ({
                    value: item.university_id,
                    label:
                      universities.find(
                        (u) => u.university_id === item.university_id
                      )?.name || "",
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
                {field.value.map((language: any) => (
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
                  selected={field.value.map((item: any) => ({
                    value: item.language_id,
                    label:
                      languages.find((l) => l.language_id === item.language_id)
                        ?.name || "",
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
                {field.value.map((specialty: any) => (
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
                  selected={field.value.map((item: any) => ({
                    value: item.id,
                    label:
                      specialties.find(
                        (s) => s.id === item.id
                      )?.name || "",
                  }))}
                  onChange={(selected) =>
                    field.onChange(
                      selected.map((item: any) => ({
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
                {field.value.map((disease: any, index: number) => (
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
                  selected={field.value.map((item: any) => ({
                    value: item.disease_id,
                    label:
                      diseases.find((d) => d.disease_id === item.disease_id)
                        ?.name || "",
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

        </div>


       

        <Button className="bg-blue-700" type="submit">Guardar Cambios</Button>
      </form>
    </Form>
  );
}
