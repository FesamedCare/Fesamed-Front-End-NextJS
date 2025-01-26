"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const certificatesSchema = z.object({
  certificates: z.array(z.string().url()).min(1, "Debe subir al menos un certificado"),
})

export function CertificatesForm() {
  const form = useForm<z.infer<typeof certificatesSchema>>({
    resolver: zodResolver(certificatesSchema),
    defaultValues: {
      certificates: [],
    },
  })

  function onSubmit(values: z.infer<typeof certificatesSchema>) {
    console.log(values)
    // Aquí iría la lógica para enviar los datos al servidor
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="certificates"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Certificados de Estudio</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    const urls = files.map((file) => URL.createObjectURL(file))
                    field.onChange(urls)
                  }}
                />
              </FormControl>
              <FormDescription>Sube tus certificados de estudio aquí</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Guardar Certificados</Button>
      </form>
    </Form>
  )
}

