import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";

const generalProfileSchema = z.object({
  doctor_name: z.string().min(1, { message: "El nombre es obligatorio" }),
  doctor_lastname: z.string().min(1, { message: "El apellido es obligatorio" }),
  license_number: z.string(),
  specialties: z.array(z.object({ specialty_id: z.string() })),
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

export default function ConsultoriesForm() {
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

  const onSubmit = (data: z.infer<typeof generalProfileSchema>) => {
    console.log(data);
  };
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="flex flex-col gap-4 mt-4 border border-blue-100 rounded-lg p-8">
            <h4 className="font-semibold">Información del consultorio</h4>

            <div className="flex flex-col md:flex-row md:flex-wrap md:gap-x-4">
              {/* Nombre */}
              <FormField
                control={form.control}
                name="doctor_name"
                render={({ field }) => (
                  <FormItem className="w-full md:w-[48%] mb-4">
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={"Ingresa el nombre del consultorio"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dirección */}
              <FormField
                control={form.control}
                name="doctor_name"
                render={({ field }) => (
                  <FormItem className="w-full md:w-[48%] mb-4">
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder={"Ej. Calle 123 # 45-67"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Ciudad */}
              <FormField
                control={form.control}
                name="doctor_name"
                render={({ field }) => (
                  <FormItem className="w-full md:w-[48%] mb-4">
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Input placeholder={"Ej. Calle 123 # 45-67"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Código Postal */}
              <FormField
                control={form.control}
                name="doctor_name"
                render={({ field }) => (
                  <FormItem className="w-full md:w-[48%] mb-4">
                    <FormLabel>Código Postal</FormLabel>
                    <FormControl>
                      <Input placeholder={"Ej. Calle 123 # 45-67"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-4 border border-blue-100 rounded-lg p-8">
            <h4 className="font-semibold">Información de Contacto</h4>

            <div className="flex flex-col md:flex-row md:flex-wrap md:gap-x-4">
              {/* tel */}
              <FormField
                control={form.control}
                name="doctor_name"
                render={({ field }) => (
                  <FormItem className="w-full md:w-[48%] mb-4">
                    <FormLabel>Teléfono primario</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={"Ingresa tu número de teléfono"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* tel 2 */}
              <FormField
                control={form.control}
                name="doctor_name"
                render={({ field }) => (
                  <FormItem className="w-full md:w-[48%] mb-4">
                    <FormLabel>Teléfono secundario</FormLabel>
                    <FormControl>
                      <Input placeholder={"Ingresa un número adicional"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Ciudad */}
              <FormField
                control={form.control}
                name="doctor_name"
                render={({ field }) => (
                  <FormItem className="w-full md:w-[48%] mb-4">
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Input placeholder={"Ej. Calle 123 # 45-67"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Código Postal */}
              <FormField
                control={form.control}
                name="doctor_name"
                render={({ field }) => (
                  <FormItem className="w-full md:w-[48%] mb-4">
                    <FormLabel>Código Postal</FormLabel>
                    <FormControl>
                      <Input placeholder={"Ej. Calle 123 # 45-67"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-4 border border-blue-100 rounded-lg p-8">
            <h4 className="font-semibold">Información de Contacto</h4>

            <div className="flex flex-col md:flex-row md:flex-wrap md:gap-x-4">
              {/* Pagos */}
              <FormField
                control={form.control}
                name="doctor_name"
                render={({ field }) => (
                  <FormItem className="w-full md:w-[48%] mb-4">
                    <FormLabel>Métodos de pago</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={"Ingresa tu número de teléfono"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* URL */}
              <FormField
                control={form.control}
                name="doctor_name"
                render={({ field }) => (
                  <FormItem className="w-full md:w-[48%] mb-4">
                    <FormLabel>Sitio web o link de Google Maps</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={"Ingresa tu url"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button className="bg-blue-700" type="submit">Guardar Cambios</Button>
        </form>
      </Form>
    </>
  );
}
