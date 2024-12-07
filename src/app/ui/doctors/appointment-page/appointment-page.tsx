"use client"

import { useState } from "react"
import { format, addMonths, isBefore, startOfToday } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MapPin, Star, Users, Clock, MessageSquare } from 'lucide-react'
import { cn } from "@/lib/utils"
import Image from "next/image"
import type { Doctor, TimeSlot, AppointmentFormData } from "@/app/types/types"

const timeSlots: TimeSlot[] = [
  { time: "09:00 AM", available: true },
  { time: "09:30 AM", available: true },
  { time: "10:00 AM", available: true },
  { time: "10:30 AM", available: true },
  { time: "11:00 AM", available: true },
  { time: "11:30 AM", available: true },
  { time: "03:00 PM", available: true },
  { time: "03:30 PM", available: true },
  { time: "04:00 PM", available: true },
  { time: "04:30 PM", available: true },
  { time: "05:00 PM", available: true },
  { time: "05:30 PM", available: true },
]

const doctorData: Doctor = {
  id: "1",
  name: "Dr. David Patel",
  profilePicture: "https://via.placeholder.com/150",
  specialty: "Cardiólogo",
  location: "Valle del Lili",
  about: "Dr. David Patel, un cardiólogo dedicado, aporta una gran experiencia al Centro de Cardiología Golden...",
  stats: {
    patients: 2300,
    experience: 10,
    rating: 5,
    reviews: 1272,
  },
  workingHours: "Lunes-Viernes, 08:00 AM-06:00 PM",
}

export default function AppointmentPage() {
  const [formData, setFormData] = useState<AppointmentFormData>({
    date: undefined,
    timeSlot: undefined,
  })
  const [isLiked, setIsLiked] = useState(false)

  const today = startOfToday()
  const maxDate = addMonths(today, 2)

  const handleDateSelect = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, date, timeSlot: undefined }))
  }

  const handleTimeSelect = (time: string) => {
    setFormData(prev => ({ ...prev, timeSlot: time }))
  }

  const handleSubmit = () => {
    if (formData.date && formData.timeSlot) {
      console.log("Appointment scheduled:", formData)
      // Handle appointment submission
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:px-8 lg:pb-24">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Doctor Details Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <h1 className="text-2xl font-bold mb-6">Detalles de Doctor</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsLiked(!isLiked)}
                className="text-muted-foreground hover:text-blue-500"
              >
                <Heart className={cn("h-5 w-5", isLiked && "fill-blue-500 text-blue-500")} />
              </Button>
            </div>

            <div className="flex gap-4 items-start mb-6">
              <Image
                src={doctorData.profilePicture}
                alt={doctorData.name}
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
              <div>
                <h2 className="text-xl font-semibold">{doctorData.name}</h2>
                <p className="text-muted-foreground">{doctorData.specialty}</p>
                <div className="flex items-center gap-1 text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{doctorData.location}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Users className="h-5 w-5 mx-auto mb-2" />
                <div className="font-semibold">{doctorData.stats.patients}+</div>
                <div className="text-sm text-muted-foreground">Pacientes</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Clock className="h-5 w-5 mx-auto mb-2" />
                <div className="font-semibold">{doctorData.stats.experience}+</div>
                <div className="text-sm text-muted-foreground">experiencia</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Star className="h-5 w-5 mx-auto mb-2" />
                <div className="font-semibold">{doctorData.stats.rating}</div>
                <div className="text-sm text-muted-foreground">rating</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <MessageSquare className="h-5 w-5 mx-auto mb-2" />
                <div className="font-semibold">{doctorData.stats.reviews}</div>
                <div className="text-sm text-muted-foreground">reviews</div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Sobre mí</h3>
              <p className="text-muted-foreground">{doctorData.about}</p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Horarios</h3>
              <p className="text-muted-foreground">{doctorData.workingHours}</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Reviews</h3>
                <Button variant="link" className="text-blue-500">
                  Ver todas
                </Button>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex gap-3 mb-2">
                  <Image
                    src="https://via.placeholder.com/150"
                    alt="Reviewer"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div>
                    <div className="font-semibold">Camila Narvaez</div>
                    <div className="flex gap-1">
                      {Array(5)
                        .fill(null)
                        .map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Dr. David es un verdadero profesional que se preocupa por sus pacientes. Recomendado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Booking Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6">Agendar Cita</h2>

            <div className="mb-6 flex flex-col items-center">
              <h3 className="font-semibold mb-4">Seleccionar Fecha</h3>
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={handleDateSelect}
                locale={es}
                disabled={(date) => isBefore(date, today) || isBefore(maxDate, date)}
                className="rounded-md border"
              />
            </div>

            {formData.date && (
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Seleccionar Hora</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={formData.timeSlot === slot.time ? "default" : "outline"}
                      className={cn(
                        "w-full",
                        !slot.available && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => slot.available && handleTimeSelect(slot.time)}
                      disabled={!slot.available}
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              disabled={!formData.date || !formData.timeSlot}
              onClick={handleSubmit}
            >
              Confirmar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
