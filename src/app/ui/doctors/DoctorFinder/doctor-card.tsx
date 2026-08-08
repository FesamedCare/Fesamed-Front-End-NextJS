"use client";

import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { useTranslation } from "@/i18n/LocaleProvider";

interface DoctorCardProps {
  name: string
  specialty: string
  clinic: string
  imageUrl: string
}

export function DoctorCard({ name, specialty, clinic, imageUrl }: DoctorCardProps) {
  const { t } = useTranslation();
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center">
          <div className="relative w-32 h-32 mb-4">
            <Image
                src={imageUrl}
                alt={name}
                className="rounded-lg object-cover"
                height={400}
                width={400}
                priority
              />
          </div>
          <div className="space-y-2">
            <p className="text-blue-600 font-medium">{clinic}</p>
            <h3 className="font-semibold text-lg">{name}</h3>
            <p className="text-gray-500">{specialty}</p>
            <p className="text-gray-400">{t("misc.reviews")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

