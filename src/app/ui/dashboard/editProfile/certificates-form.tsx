"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { Folder, FileText, Image as ImageIcon, FileType } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import ImagePreviewModal from "./image-preview-modal"
import { useAuthContext } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n/LocaleProvider";

interface FileWithPreview extends File {
  preview?: string;
  id?: string;
  isExisting?: boolean;
  fileType?: string;
  name: string;
}

// Formato del backend: CertificateRead { id, profile_version_id, url, uploaded_at }
interface Certificate {
  id: string;
  profile_version_id: string;
  url: string;
  uploaded_at: string;
}

// Tamaño máximo en bytes (10 MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function CertificatesForm() {
  const { t } = useTranslation();
  const { notifyProfileChanged } = useAuthContext();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Determinar el tipo de archivo basado en la extensión de la URL
  const getFileType = (url: string): string => {
    const extension = url.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'pdf';
    }
    return 'other';
  };

  // Renderizar el ícono correspondiente al tipo de archivo
  const renderFileIcon = (fileType: string) => {
    if (fileType === 'image') {
      return <ImageIcon className="w-6 h-6 text-blue-500" />;
    } else if (fileType === 'pdf') {
      return <FileText className="w-6 h-6 text-red-500" />;
    } else {
      return <FileType className="w-6 h-6 text-gray-500" />;
    }
  };

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
  const certificatesUrl = `${apiBase}/api/v1/me/profile-draft/certificates/`;

  // Obtener los certificados existentes del servidor
  useEffect(() => {
    const fetchCertificates = async () => {
      if (!apiBase) return;
      try {
        setIsLoading(true);
        const response = await fetch(certificatesUrl, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Error fetching certificates: ${response.status}`);
        }

        const certificates: Certificate[] = await response.json();

        const existingCertificates = certificates.map((cert) => {
          const fileType = getFileType(cert.url);
          return {
            name: cert.id,
            preview: cert.url,
            id: cert.id,
            isExisting: true,
            fileType,
            size: 0,
            type: fileType === "image" ? "image/jpeg" : fileType === "pdf" ? "application/pdf" : "application/octet-stream",
          } as FileWithPreview;
        });

        setFiles(existingCertificates);
      } catch (error) {
        console.error("Error loading certificates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificates();
  }, [certificatesUrl, apiBase]);

  // Función para validar el tamaño del archivo
  const validateFileSize = useCallback((file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      alert(t("profile.fileTooLarge", { name: file.name }));
      return false;
    }
    return true;
  }, [t]);

  // Manejar la subida de archivos
  const onDrop = useCallback((acceptedFiles: FileWithPreview[]) => {
    const validFiles = acceptedFiles.filter(validateFileSize);

    setFiles((prevFiles) => {
      const newFiles = validFiles.map((file) => {
        const fileType = file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'other';

        return Object.assign(file, {
          preview: URL.createObjectURL(file),
          fileType: fileType,
        });
      });
      return [...prevFiles, ...newFiles];
    });
  }, [validateFileSize]);

  // Manejar el evento de arrastrar y soltar
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(validateFileSize);
    onDrop(validFiles as FileWithPreview[]);
  };

  // Manejar la selección de archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const inputFiles = Array.from(e.target.files);
      const validFiles = inputFiles.filter(validateFileSize);
      onDrop(validFiles as FileWithPreview[]);
    }
  };

  // Eliminar un archivo
  const removeFile = async (fileToRemove: FileWithPreview) => {
    try {
      const updatedFiles = files.filter((file) => file !== fileToRemove);
      setFiles(updatedFiles);

      if (!fileToRemove.isExisting && fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
        return;
      }

      if (fileToRemove.isExisting && fileToRemove.id) {
        setIsDeleting(true);
        const response = await fetch(certificatesUrl, {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_ids: [fileToRemove.id] }),
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        notifyProfileChanged();
        alert("Certificado eliminado correctamente");
      }
    } catch (error) {
      console.error("Error al eliminar el certificado:", error);
      alert("Error al eliminar el certificado. Por favor, inténtelo de nuevo.");
      setFiles((prevFiles) => [...prevFiles, fileToRemove]);
    } finally {
      setIsDeleting(false);
    }
  };

  // Abrir vista previa de imágenes
  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  // Filtrar archivos de imagen para la vista previa
  const imageFiles = files
    .filter((file) => file.fileType === 'image' && file.preview)
    .map((file) => ({
      src: file.preview as string,
      name: file.name,
    }));

  // Guardar los archivos nuevos (backend espera campo "files")
  const handleSubmit = async () => {
    if (!apiBase) return;
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      const newFiles = files.filter((file) => !file.isExisting);
      newFiles.forEach((file) => {
        formData.append("files", file);
      });

      if (newFiles.length > 0) {
        const response = await fetch(certificatesUrl, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        notifyProfileChanged();
        alert("Certificados guardados correctamente");
        window.location.reload();
      } else {
        alert("No hay nuevos certificados para guardar");
      }
    } catch (error) {
      console.error("Error al guardar los certificados:", error);
      alert("Error al guardar los certificados. Por favor, inténtelo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center w-full">
      <div className="w-full min-h-[70vh] space-y-4">
        <div className="border px-4 pt-4 pb-8 mt-8 border-blue-200 rounded-lg">
          <h1 className="text-lg font-bold pt-4 pl-6 pb-8">{t("profile.uploadCertificates")}</h1>
          <div className="flex items-center justify-center">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 w-[70%] border-dashed border-blue-500 rounded-lg p-8 mb-4 text-center hover:bg-blue-50/50 transition-colors"
            >
              <div className="flex flex-col items-center gap-4">
                <Folder className="w-12 h-12 text-blue-500" />
                <div>
                  <p className="text-lg mb-2">{t("profile.dropzoneHint")}</p>
                  <p className="text-sm text-gray-500">{t("profile.fileTypesWithPdf")}</p>
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
            <p>{t("ui.loadingCertificates")}</p>
          </div>
        ) : (
          <>
            {files.length > 0 ? (
              <div className="space-y-4">
                {files.map((file, index) => (
                  <Card key={index} className="p-4 flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8">
                      {renderFileIcon(file.fileType || 'other')}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{file.name}</p>
                      {!file.isExisting && (
                        <p className="text-sm text-gray-500">{(file.size / (1024 * 1024)).toFixed(1)}MB</p>
                      )}
                      {file.isExisting && (
                        <p className="text-sm text-gray-500">
                          {file.fileType === 'pdf' ? 'PDF' :
                           file.fileType === 'image' ? 'Imagen' :
                           'Archivo'} existente
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {file.fileType === 'image' && (
                        <Button
                          variant="preview"
                          onClick={() => {
                            const imageIndex = imageFiles.findIndex((img) => img.src === file.preview);
                            if (imageIndex !== -1) {
                              openPreview(imageIndex);
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
                  disabled={isSubmitting || !files.some((file) => !file.isExisting)}
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500">
                {t("ui.noCertificates")}
              </div>
            )}
          </>
        )}

        {/* Modal de vista previa solo para imágenes */}
        <ImagePreviewModal
          images={imageFiles}
          initialIndex={previewIndex}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
      </div>
    </div>
  );
}