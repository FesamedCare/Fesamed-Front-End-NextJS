"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { ImageIcon } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import ImagePreviewModal from "./image-preview-modal"
import { useTranslation } from "@/i18n/LocaleProvider";

interface FileWithPreview extends File {
  preview?: string;
  id?: string; 
  isExisting?: boolean; 
}

// Backend OfficePhotoRead: { id, url, office_id, uploaded_at }
const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";

// Tamaño máximo en bytes (10 MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function UploadForm() {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [photosBaseUrl, setPhotosBaseUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadPhotos = async () => {
      if (!apiBase) {
        setIsLoading(false)
        return
      }
      try {
        setIsLoading(true)
        const meRes = await fetch(`${apiBase}/api/v1/user/me/`, { credentials: "include" })
        if (!meRes.ok) return
        const me = await meRes.json() as { id: string }
        const officesRes = await fetch(`${apiBase}/api/v1/me/consulting_office/`, { credentials: "include" })
        if (!officesRes.ok || !me.id) return
        const offices = (await officesRes.json()) as { id: string }[]
        const officeId = offices?.[0]?.id
        if (!officeId) return
        const base = `${apiBase}/api/v1/user/${me.id}/consulting_office/${officeId}/photos/`
        setPhotosBaseUrl(base)
        const photosRes = await fetch(base, { credentials: "include" })
        if (!photosRes.ok) return
        const list = (await photosRes.json()) as { id: string; url: string }[]
        const existing = (list ?? []).map((p) => ({
          name: p.url.split("/").pop() || "photo.jpg",
          preview: p.url,
          id: p.id,
          isExisting: true,
          type: "image/jpeg",
          size: 0,
        })) as FileWithPreview[]
        setFiles(existing)
      } catch (e) {
        console.error("Error loading photos:", e)
      } finally {
        setIsLoading(false)
      }
    }
    loadPhotos()
  }, [])

  // Función para validar el tamaño del archivo
  const validateFileSize = useCallback((file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      alert(t("profile.fileTooLarge", { name: file.name }));
      return false;
    }
    return true;
  }, [t]);

  const onDrop = useCallback((acceptedFiles: FileWithPreview[]) => {
    // Filtra los archivos que exceden el tamaño máximo
    const validFiles = acceptedFiles.filter(validateFileSize);
    
    setFiles((prevFiles) => {
      const newFiles = validFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        }),
      )
      return [...prevFiles, ...newFiles]
    })
  }, [validateFileSize])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const droppedFiles = Array.from(e.dataTransfer.files)
    
    // Filtra los archivos que exceden el tamaño máximo
    const validFiles = droppedFiles.filter(file => validateFileSize(file))
    
    onDrop(validFiles as FileWithPreview[])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const inputFiles = Array.from(e.target.files);
      
      // Filtra los archivos que exceden el tamaño máximo
      const validFiles = inputFiles.filter(file => validateFileSize(file));
      
      onDrop(validFiles as FileWithPreview[])
    }
  }

  const removeFile = async (fileToRemove: FileWithPreview) => {
    try {
      // Primero, eliminar el archivo de la lista local
      const updatedFiles = files.filter((file) => file !== fileToRemove);
      setFiles(updatedFiles);
      
      // Si es un archivo nuevo (no existente), solo revocar la URL
      if (!fileToRemove.isExisting && fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
        return; 
      }
      
      // Si es un archivo existente, hacer la petición para eliminarlo
      if (fileToRemove.isExisting && fileToRemove.id && photosBaseUrl) {
        setIsDeleting(true);
        const response = await fetch(photosBaseUrl, {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photo_ids: [fileToRemove.id] }),
        });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        alert("Foto eliminada correctamente");
      }
    } catch (error) {
      console.error("Error al eliminar la foto:", error);
      alert("Error al eliminar la foto. Por favor, inténtelo de nuevo.");
      
      // Si hay error, restaurar el archivo en la lista
      setFiles((prevFiles) => [...prevFiles, fileToRemove]);
    } finally {
      setIsDeleting(false);
    }
  };

  const openPreview = (index: number) => {
    setPreviewIndex(index)
    setPreviewOpen(true)
  }

  const imageFiles = files
    .filter((file) => 
      (file.type?.startsWith("image/") && file.preview) || file.isExisting
    )
    .map((file) => ({
      src: file.preview as string,
      name: file.name,
    }))

  const handleSubmit = async () => {
    if (!photosBaseUrl) {
      alert("Primero agrega un consultorio para subir fotos.");
      return;
    }
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      files.filter((f) => !f.isExisting).forEach((file) => formData.append("photos", file));
      if (!formData.has("photos")) {
        alert("No hay nuevas fotos para guardar");
        return;
      }
      const response = await fetch(photosBaseUrl, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      alert("Fotos guardadas correctamente");
      window.location.reload();
    } catch (error) {
      console.error("Error al guardar las fotos:", error);
      alert("Error al guardar las fotos. Por favor, inténtelo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center w-full">
    <div className="w-full min-h-[70vh] space-y-4">
      <div className="border px-4 pt-4 pb-8 mt-8 border-blue-200 rounded-lg">
      <h1 className="text-lg font-bold pt-4 pl-6 pb-8">{t("profile.uploadOfficePhotos")}</h1>
      <div className="flex items-center justify-center">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 w-[70%] border-dashed border-blue-500 rounded-lg p-8 mb-4 text-center hover:bg-blue-50/50 transition-colors"
      >
        <div className="flex flex-col items-center gap-4">
          <ImageIcon className="w-12 h-12 text-blue-500" />
          <div>
            <p className="text-lg mb-2">{t("profile.dropzoneHint")}</p>
            <p className="text-sm text-gray-500">{t("profile.fileTypes")}</p>
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
            {t("ui.selectFiles")}
          </Button>
        </div>
      </div>
      </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <p>{t("profile.loadingImages")}</p>
        </div>
      ) : (
        <>
          {files.length > 0 && (
            <div className="space-y-4">
              {files.map((file, index) => (
                <Card key={index} className="p-4 flex items-center gap-4">
                  {((file.type?.startsWith("image/") && file.preview) || file.isExisting) && (
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
                    {!file.isExisting && (
                      <p className="text-sm text-gray-500">{(file.size / (1024 * 1024)).toFixed(1)}MB</p>
                    )}
                    {file.isExisting && (
                      <p className="text-sm text-gray-500">{t("profile.existingImage")}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {((file.type?.startsWith("image/") && file.preview) || file.isExisting) && (
                      <Button
                        variant="preview"
                        onClick={() => {
                          const imageIndex = imageFiles.findIndex((img) => img.src === file.preview)
                          if (imageIndex !== -1) {
                            openPreview(imageIndex)
                          }
                        }}
                      >
                        {t("ui.preview")}
                      </Button>
                    )}
                    <Button 
                      variant="delete" 
                      onClick={() => removeFile(file)}
                      disabled={isDeleting && file.isExisting}
                    >
                      {isDeleting && file.isExisting ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                  </div>
                </Card>
              ))}

              <Button 
                className="w-full bg-blue-700 hover:bg-blue-800" 
                onClick={handleSubmit}
                disabled={isSubmitting || !files.some(file => !file.isExisting)}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          )}
        </>
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