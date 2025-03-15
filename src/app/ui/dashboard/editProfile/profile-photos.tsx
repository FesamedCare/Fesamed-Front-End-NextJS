"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Folder } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import ImagePreviewModal from "./image-preview-modal"

interface FileWithPreview extends File {
  preview?: string
}

export default function UploadForm() {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  const onDrop = useCallback((acceptedFiles: FileWithPreview[]) => {
    setFiles((prevFiles) => {
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        }),
      )
      return [...prevFiles, ...newFiles]
    })
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const droppedFiles = Array.from(e.dataTransfer.files)
    onDrop(droppedFiles as FileWithPreview[])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onDrop(Array.from(e.target.files) as FileWithPreview[])
    }
  }

  const removeFile = (fileToRemove: FileWithPreview) => {
    setFiles(files.filter((file) => file !== fileToRemove))
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview)
    }
  }

  const openPreview = (index: number) => {
    setPreviewIndex(index)
    setPreviewOpen(true)
  }

  // Filtrar solo las imágenes para el carrusel
  const imageFiles = files
    .filter((file) => file.type.startsWith("image/") && file.preview)
    .map((file) => ({
      src: file.preview as string,
      name: file.name,
    }))

  return (
    <div className="flex justify-center items-center w-full">
    <div className="w-full min-h-[70vh] space-y-4">
      <div className="border px-4 pt-4 pb-8 mt-8 border-blue-200 rounded-lg">
      <h1 className="text-lg font-bold pt-4 pl-6 pb-8">Sube fotos de tus consultorios</h1>
      <div className="flex items-center justify-center">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 w-[70%] border-dashed border-blue-500 rounded-lg p-8 mb-4 text-center hover:bg-blue-50/50 transition-colors"
      >
        <div className="flex flex-col items-center gap-4">
          <Folder className="w-12 h-12 text-blue-500" />
          <div>
            <p className="text-lg mb-2">Haga clic o arrastre para cargar su archivo</p>
            <p className="text-sm text-gray-500">PNG, JPG, PDF, SVG (Máximo 15 MB)</p>
          </div>
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            multiple
            accept=".png,.jpg,.jpeg,.pdf,.svg"
          />
          <Button
            onClick={() => document.getElementById("file-upload")?.click()}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Seleccionar Archivos
          </Button>
        </div>
      </div>
      </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          {files.map((file, index) => (
            <Card key={index} className="p-4 flex items-center gap-4">
              {file.type.startsWith("image/") && file.preview && (
                <Image
                  src={file.preview || "/placeholder.svg"}
                  alt={file.name}
                  width={80}
                  height={80}
                  className="rounded object-cover"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / (1024 * 1024)).toFixed(1)}MB</p>
              </div>
              <div className="flex gap-2">
                {file.type.startsWith("image/") && (
                  <Button
                    variant="preview"
                    onClick={() => {
                      // Encontrar el índice correcto en el array de imágenes
                      const imageIndex = imageFiles.findIndex((img) => img.src === file.preview)
                      if (imageIndex !== -1) {
                        openPreview(imageIndex)
                      }
                    }}
                  >
                    Vista previa
                  </Button>
                )}
                <Button variant="delete" onClick={() => removeFile(file)}>
                  Eliminar
                </Button>
              </div>
            </Card>
          ))}

          <Button className="w-full bg-blue-700 hover:bg-blue-800">Guardar</Button>
        </div>
      )}

      {/* Modal de vista previa */}
      <ImagePreviewModal
        images={imageFiles}
        initialIndex={previewIndex}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
    </div>
  )
}

