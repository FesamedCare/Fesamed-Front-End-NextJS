"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

interface ImagePreviewModalProps {
  images: { src: string; name: string }[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Acción opcional bajo la imagen. La galería de certificados no la usa; la
   * foto de perfil sí, porque ahí mirar y reemplazar son el mismo gesto.
   */
  footerAction?: React.ReactNode;
  /**
   * Lienzo reducido, para una imagen suelta como la foto de perfil.
   * Por defecto va el tamaño de galería, que es lo que usan certificados,
   * consultorios y fotos de consultorio.
   */
  compact?: boolean;
}

export default function ImagePreviewModal({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
  footerAction,
  compact = false,
}: ImagePreviewModalProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!images.length || !open) return null;

  const currentImage = images[currentIndex];


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("p-0 bg-white border-none", compact ? "max-w-md w-[90vw]" : "max-w-4xl w-[70vw]")}>
        <DialogTitle className="sr-only">
          {t("ui.imagePreview")}: {currentImage.name}
        </DialogTitle>
        <div className="relative flex flex-col">
          {/* Imagen principal */}
          <div className={cn("flex items-center justify-center relative", compact ? "h-[55vh]" : "h-[80vh]")}>
            <Image
              src={currentImage.src || "/placeholder.svg"}
              alt={currentImage.name}
              fill
              className="object-contain"
            />

            {/* Controles de navegación */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 z-10 text-white hover:bg-white/20 rounded-full h-12 w-12 mix-blend-difference"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 z-10 text-white hover:bg-white/20 rounded-full h-12 w-12 mix-blend-difference"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
          </div>

          {/* Indicador de posición y nombre del archivo */}
          <div className="p-4 text-black text-center">
            <p className="font-medium">{currentImage.name}</p>
            {images.length > 1 && (
              <p className="text-sm text-gray-500">
                {t("ui.indexOf", { current: currentIndex + 1, total: images.length })}
              </p>
            )}
            {footerAction && (
              <div className="mt-3 flex justify-center gap-2">{footerAction}</div>
            )}
          </div>

          {/* Miniaturas (opcional para navegación adicional) */}
          {images.length > 1 && (
            <div className="flex overflow-x-auto gap-2 p-2 bg-gray/50">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`relative h-16 w-16 flex-shrink-0 rounded overflow-hidden transition-all ${
                    index === currentIndex
                      ? "ring-2 ring-blue-500 scale-105"
                      : "opacity-70"
                  }`}
                >
                  <Image
                    src={image.src || "/placeholder.svg"}
                    alt={t("ui.thumbnail", { n: index + 1 })}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
