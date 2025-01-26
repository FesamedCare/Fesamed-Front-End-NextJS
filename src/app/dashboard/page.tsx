'use client'
import { useEffect, useState } from "react";
import ClientDashboard from "../ui/dashboard/client-dashboard";
import Footer from "../ui/navigation/footer";
import DoctorDashboard from "../ui/dashboard/doctor-dashboard";

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPatient, setIsPatient] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/user/me`,
          {
            credentials: "include",
          }
        );
        
        if (!response.ok) {
          throw new Error("No se pudo obtener la información del usuario");
        }
        
        const data = await response.json();
        
        if (data.role === "patient") {
          setIsPatient(true);
        } else if (data.role === "doctor") {
          setIsDoctor(true);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setErrorMessage("Error al cargar los datos del usuario");
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
      <Footer/>
    </div>
  );
}