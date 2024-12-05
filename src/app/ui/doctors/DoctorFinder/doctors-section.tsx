import { DoctorCard } from "./doctor-card"

const doctors = [
  {
    name: "Dr. Michael B",
    specialty: "Otorrino",
    clinic: "CORL Cali",
    imageUrl: "https://via.placeholder.com/400",
  },
  {
    name: "Dr. Jessica Bueno",
    specialty: "Ginecóloga",
    clinic: "Clinica Imbanaco",
    imageUrl: "https://via.placeholder.com/400",
  },
  {
    name: "Dr. David Garcia",
    specialty: "Cardiólogo",
    clinic: "Valle del Lili",
    imageUrl: "https://via.placeholder.com/400",
  },
]

export function DoctorsSection() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 mt-16">
      <h2 className="text-2xl font-normal mb-8 mt-24">Doctores destacados:</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor) => (
          <DoctorCard key={doctor.name} {...doctor} />
        ))}
      </div>
    </div>
  )
}

