'use client'
import { useEffect, useState } from "react";
import ClientDashboard from "../ui/dashboard/client-dashboard";
import Footer from "../ui/navigation/footer";
import DoctorDashboard from "../ui/dashboard/doctor-dashboard";

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPatient, setIsPatient] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/me/`,
          {
            credentials: "include",
          }
        );
        
        if (!response.ok) {
          throw new Error("No se pudo obtener la información del usuario");
        }
        
        const data = await response.json();
        
        // El rol viene como un objeto con la propiedad 'name'
        const roleName = data.role?.name?.toLowerCase() || data.role?.toLowerCase();
        
        if (roleName === "patient") {
          setIsPatient(true);
        } else if (roleName === "doctor") {
          setIsDoctor(true);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  if (isLoading) {
    return null; // or a skeleton loader if you prefer
  }

  return (
    <div>
      {isPatient && <ClientDashboard/>}
      {isDoctor && <DoctorDashboard/>}
      {!isPatient && !isDoctor && !isLoading && <p className="text-center text-red-500 p-4">No se pudo cargar el dashboard. Por favor, inicie sesión nuevamente.</p>}
      <Footer/>
    </div>
  );
}