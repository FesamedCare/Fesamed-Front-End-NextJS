"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const profilePhotosSchema = z.object({
  photos: z.array(z.string().url()).min(1, "Debe subir al menos una foto"),
})

export function ProfilePhotosForm() {
  const form = useForm<z.infer<typeof profilePhotosSchema>>({
    resolver: zodResolver(profilePhotosSchema),
    defaultValues: {
      photos: [],
    },
  })

  function onSubmit(values: z.infer<typeof profilePhotosSchema>) {
    console.log(values)
    // Aquí iría la lógica para enviar los datos al servidor
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="photos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fotos de Perfil</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    const urls = files.map((file) => URL.createObjectURL(file))
                    field.onChange(urls)
                  }}
                />
              </FormControl>
              <FormDescription>Sube tus fotos de perfil aquí</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Guardar Fotos</Button>
      </form>
    </Form>
  )
}

