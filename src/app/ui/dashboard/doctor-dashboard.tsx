"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  FiEdit2,
  FiChevronRight,
  FiHeart,
  FiHelpCircle,
  FiLogOut,
  FiSettings,
  FiShield,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import { CalendarIcon, MapPinIcon } from "lucide-react";
import Image from "next/image";

// Tipo para la información del usuario
interface UserData {
  name: string;
  lastname: string;
  phone_number: string;
  email: string;
  address?: string;
  profile_image?: string;
  // Agrega más campos según lo que devuelva tu API
}

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState("proximas");
  const [errorMessage, setErrorMessage] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const appointments = [
    {
      date: "Agosto 22, 2024 - 10.00 AM",
      doctor: "Dr. Julio Jaramillo",
      specialty: "Dermatologo",
      location: "Imbanaco",
      img: "https://fesamedcare.s3.us-east-2.amazonaws.com/doctorsimages/david.png",
    },
    {
      date: "Septiembre 14, 2024 - 15.00pm",
      doctor: "Dr. Daniel Lee",
      specialty: "Medico General",
      location: "Imbanaco",
      img: "https://fesamedcare.s3.us-east-2.amazonaws.com/doctorsimages/jessica.png",
    },
  ];

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
        console.log("User data:", data);
        setUserData(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setErrorMessage("Error al cargar los datos del usuario");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.ok) {
        alert("Sesión cerrada con éxito");
        window.location.href = "/login";
      } else {
        const data = await response.json();
        setErrorMessage(data.message || "Error al cerrar sesión");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Error de red. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 lg:px-28 xl:px-16 pb-12 max-w-7xl">
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}
      {isLoading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <>
          <Breadcrumb className="pb-5 pt-2 font-medium">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Perfil</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="grid md:grid-cols-[300px,1fr] gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-lg drop-shadow-lg p-6">
                <div className="relative mb-4">
                  <Image
                    src="https://via.placeholder.com/150"
                    alt="Profile"
                    width={128}
                    height={128}
                    className="w-32 h-32 rounded-full mx-auto"
                  />
                  <button className="absolute bottom-0 right-1/4 bg-blue-500 text-white p-2 rounded-full">
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold">
                    {[userData?.name, userData?.lastname].filter(Boolean).join(" ")}
                  </h2>
                  <p className="text-gray-500">{userData?.phone_number}</p>
                  <p className="text-gray-500">{userData?.email}</p>
                  <p className="text-gray-500">adress here #45-98</p>
                </div>
              </div>
              <div className="space-y-2 bg-white rounded-lg drop-shadow-lg p-2">
                {[
                  { icon: FiEdit2, 
                    text: "Editar Perfil", 
                    path: "/edit-profile",
                    onClick: () => {
                      window.location.href = "/dashboard/edit-doctor-profile";
                    } 
                  },
                  { icon: FiSettings, 
                    text: "Configuración",
                    path: "/settings",
                    onClick: () => {
                      window.location.href = "/dashboard/settings";
                    } 
                  },
                  { icon: FiHelpCircle, text: "Ayuda y Soporte" },
                  { icon: FiShield, text: "Terminos y Condiciones" },
                  {
                    icon: FiLogOut,
                    text: "Salir",
                    className: "text-red-500",
                    onClick: handleLogout,
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    onClick={item.onClick}
                    className={`w-full flex cursor-pointer justify-between items-center p-2 rounded hover:bg-gray-100 ${
                      item.className || ""
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.text}
                    </div>
                    <FiChevronRight className="h-4 w-4" />
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Favoritos</h3>
                <div className="bg-white rounded-lg drop-shadow-lg p-4">
                  <div className="flex items-center">
                    <Image
                      src="https://fesamedcare.s3.us-east-2.amazonaws.com/doctorsimages/michael.png"
                      alt="Dr. Michael Biancha"
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full mr-4"
                    />
                    <div>
                      <h4 className="font-semibold">Dr. Michael Biancha</h4>
                      <p className="text-sm text-gray-500">Otorrino</p>
                      <p className="text-sm text-gray-500">CORL Cali</p>
                      <div className="flex items-center">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm ml-1">4.7</span>
                        <span className="text-sm text-gray-500 ml-1">
                          (5,223 Reviews)
                        </span>
                      </div>
                    </div>
                    <FiHeart className="ml-auto text-red-500" />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Mis consultas</h2>
              <div className="mb-4">
                <div className="flex border-b">
                  {["proximas", "pasadas", "canceladas"].map((tab) => (
                    <button
                      key={tab}
                      className={`py-2 px-4 ${
                        activeTab === tab ? "border-b-2 border-blue-500" : ""
                      }`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {activeTab === "proximas" && (
                <div className="space-y-4 p-4">
                  {appointments.map((appointment, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-md p-4 transition-all hover:shadow-lg"
                    >
                      <p className="font-semibold mb-2 text-sm sm:text-base flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-2 text-blue-500" />
                        {appointment.date}
                      </p>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center">
                        <Image
                          src={appointment.img}
                          alt={appointment.doctor}
                          width={80}
                          height={80}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-4 sm:mb-0 sm:mr-4"
                        />
                        <div className="flex-grow mb-4 sm:mb-0">
                          <h4 className="font-semibold text-lg">
                            {appointment.doctor}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {appointment.specialty}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center">
                            <MapPinIcon className="w-4 h-4 mr-1 text-gray-400" />
                            {appointment.location}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                          <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm transition-colors duration-200">
                            Cancelar
                          </button>
                          <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm transition-colors duration-200">
                            Re agendar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
