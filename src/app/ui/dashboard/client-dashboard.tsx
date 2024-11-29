'use client';

import { FiEdit2, FiChevronRight, FiHeart, FiHelpCircle, FiLogOut, FiSettings, FiShield } from 'react-icons/fi';
import Link from 'next/link';
import { useState } from 'react';
import { on } from 'events';

export default function ClientDashboard() {
    const [activeTab, setActiveTab] = useState('proximas');
    const [errorMessage, setErrorMessage] = useState('');


    const handleLogout = async () => {
        try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {
            method: 'POST',
            credentials: 'include',
        });

        if (response.ok) {
            alert('Sesión cerrada con éxito');
            window.location.href = '/login';
            
        } else {
            const data = await response.json();
            setErrorMessage(data.message || 'Error al cerrar sesión');
        }
        } catch (error) {
        console.error(error);
        setErrorMessage('Error de red. Inténtalo de nuevo.');
        }
    };

    const handleFileChange = () => {   
    }

    const handleFileUpload = async () => {
    }

    //dummy data until fetch data from the server
        const userData = {
            name: 'David',
            phone_number: '+57 3207263798',
            email: 'example@fesamed.com'
        }

  return (

    <div className="container mx-auto px-4 md:px-8 lg:px-28 xl:px-16 pb-12 max-w-7xl">
      <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
      <div className="grid md:grid-cols-[300px,1fr] gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-lg drop-shadow-lg p-6">
            <div className="relative mb-4">
              <img
                //ingresar una imagen gris por ahora
                src={'https://via.placeholder.com/150'}
                alt="Profile"
                className="w-32 h-32 rounded-full mx-auto"
              />
              <button className="absolute bottom-0 right-1/4 bg-blue-500 text-white p-2 rounded-full"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
              <input
                id="fileInput"
                accept='image/*'
                type="file"
                className="hidden"
                onChange={handleFileChange}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold">{userData.name}  </h2>
              <p className="text-gray-600">{userData.phone_number}</p>
              <p className="text-gray-600">{userData.email}</p>
              <p className="text-gray-600">adress here #45-98</p>
              {/* {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>} */}
            </div>
          </div>
          <div className="space-y-2 bg-white rounded-lg drop-shadow-lg p-2">
            {[
              { icon: FiEdit2, text: 'Editar Perfil', path: '/edit-profile' },
              { icon: FiSettings, text: 'Configuración' },
              { icon: FiHelpCircle, text: 'Ayuda y Soporte' },
              { icon: FiShield, text: 'Terminos y Condiciones' },
              { icon: FiLogOut, text: 'Salir', className: 'text-red-500', onClick: handleLogout },
            ].map((item, index) => (
              <div 
              key={index}
              onClick={item.onClick}
              className={`w-full flex cursor-pointer justify-between items-center p-2 rounded hover:bg-gray-100 ${item.className || ''}`}
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
                <img
                  src="https://fesamedcare.s3.us-east-2.amazonaws.com/doctorsimages/michael.png"
                  alt="Dr. Michael Biancha"
                  className="w-16 h-16 rounded-full mr-4"
                />
                <div>
                  <h4 className="font-semibold">Dr. Michael Biancha</h4>
                  <p className="text-sm text-gray-600">Otorrino</p>
                  <p className="text-sm text-gray-600">CORL Cali</p>
                  <div className="flex items-center">
                    <span className="text-yellow-400">★</span>
                    <span className="text-sm ml-1">4.7</span>
                    <span className="text-sm text-gray-600 ml-1">(5,223 Reviews)</span>
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
              {['proximas', 'pasadas', 'canceladas'].map((tab) => (
                <button
                  key={tab}
                  className={`py-2 px-4 ${activeTab === tab ? 'border-b-2 border-blue-500' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {activeTab === 'proximas' && (
            <div className="space-y-4">
              {[
                { date: 'Agosto 22, 2024 - 10.00 AM', doctor: 'Dr. Julio Jaramillo', specialty: 'Dermatologo', location: 'Imbanaco', img: 'https://fesamedcare.s3.us-east-2.amazonaws.com/doctorsimages/david.png' },
                { date: 'Septiembre 14, 2024 - 15.00pm', doctor: 'Dr. Daniel Lee', specialty: 'Medico General', location: 'Imbanaco', img: 'https://fesamedcare.s3.us-east-2.amazonaws.com/doctorsimages/jessica.png' },
              ].map((appointment, index) => (
                <div key={index} className="bg-white rounded-lg drop-shadow-lg p-4">
                  <p className="font-semibold mb-2">{appointment.date}</p>
                  <div className="flex items-center">
                    <img
                      src={appointment.img}
                      alt={appointment.doctor}
                      className="w-20 h-20 rounded-full mr-4"
                    />
                    <div>
                      <h4 className="font-semibold">{appointment.doctor}</h4>
                      <p className="text-sm text-gray-600">{appointment.specialty}</p>
                      <p className="text-sm text-gray-600">{appointment.location}</p>
                    </div>
                    <div className="ml-auto space-x-2">
                      <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100">Cancelar</button>
                      <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Re agendar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'pasadas' && <div>{/* Contenido para consultas pasadas */}</div>}
          {activeTab === 'canceladas' && <div>{/* Contenido para consultas canceladas */}</div>}
        </div>
      </div>
    </div>
  );
}