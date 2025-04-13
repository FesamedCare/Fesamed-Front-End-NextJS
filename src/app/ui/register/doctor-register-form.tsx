"use client";

import Link from "next/link";
import "@/app/globals.css";
import { useEffect, useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/bootstrap.css";
import { Specialty } from "@/app/types/types";
import "./style.css";

function Form() {
  const [enabled, setEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorAuth, setErrorAuth] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [allRequirementsMet, setAllRequirementsMet] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    notCommon: true,
  });
  // States for specialties
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [filteredSpecialties, setFilteredSpecialties] = useState<Specialty[]>(
    []
  );
  const [showSpecialties, setShowSpecialties] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(
    null
  );

  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    email: "",
    password: "",
    phone_number: "",
    specialty_id: "",
    role: "doctor",
  });

  // Fetch specialties
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/specialties`
        );
        if (response.ok) {
          const data = await response.json();
          setSpecialties(data);
        }
      } catch (error) {
        console.error("Error fetching specialties:", error);
      }
    };

    fetchSpecialties();
  }, []);

  // Filter specialties
  const handleSpecialtySearch = (value: string) => {
    setSearchTerm(value);
    const filtered = specialties.filter((specialty) =>
      specialty.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredSpecialties(filtered);
    setShowSpecialties(true);
  };

  // Select specialty
  const handleSelectSpecialty = (specialty: Specialty) => {
    setSelectedSpecialty(specialty);
    setSearchTerm(specialty.name);
    setFormData({ ...formData, specialty_id: specialty.specialty_id });
    setShowSpecialties(false);
  };

  const { name, lastname, email, password, phone_number, specialty_id } =
    formData;

  // Rest of the validation functions remain the same...
  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      notCommon: !/^(123456|password|qwerty|abc123)$/i.test(password),
    };

    setPasswordRequirements(requirements);
    const areAllRequirementsMet = Object.values(requirements).every(
      (req) => req
    );
    setAllRequirementsMet(areAllRequirementsMet);
    return areAllRequirementsMet;
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "password") {
      validatePassword(value);
    }
  };

  const onPhoneChange = (value: string) => {
    setPhone(value);
    const formattedPhone = value.startsWith("+") ? value : `+${value}`;
    setFormData({ ...formData, phone_number: formattedPhone });
  };

  const onCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setEnabled(e.target.checked);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validatePassword(password)) {
      setErrorMessage(
        "Por favor, asegúrate de cumplir todos los requisitos de la contraseña"
      );
      return;
    }

    if (!enabled) {
      setErrorMessage("Debes aceptar los términos y condiciones");
      return;
    }

    if (!formData.specialty_id) {
      setErrorMessage("Por favor, selecciona una especialidad");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/doctors/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (res.status === 200) {
        setFormData({
          name: "",
          lastname: "",
          email: "",
          password: "",
          phone_number: "",
          specialty_id: "",
          role: "doctor",
        });
        setPhone("");
        alert("Doctor registrado correctamente");
        window.location.href = "/login";
      } else {
        const data = await res.json();
        setErrorAuth(data.detail);
        console.log(formData)
      }
    } catch (error) {
      console.error("Error al registrar doctor:", error);
      setErrorAuth("Error al conectar con el servidor");
    }
  };

  const PasswordRequirement = ({
    met,
    text,
  }: {
    met: boolean;
    text: string;
  }) => (
    <div className="flex items-center gap-2 text-sm">
      <svg
        className={`w-4 h-4 ${met ? "text-green-500" : "text-gray-300"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      <span className={met ? "text-gray-600" : "text-gray-400"}>{text}</span>
    </div>
  );

  return (
    <div>
      <section className="bg-white">
        <div className="flex flex-col items-center px-6 py-8 mx-auto lg:py-10 lg:pb-28">
          <div className="w-full md:mt-0 sm:max-w-md xl:p-0">
            <div className="p-6 sm:p-2">
              <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                Registro de Doctor 👨‍⚕️
              </h1>
              <p className="text-gray-500 text-center mb-4">
                ¡Únete a nuestra red de profesionales!
              </p>
              <div className="flex flex-col items-center gap-1">
                <form onSubmit={onSubmit} className="flex flex-col gap-5 w-80">
                  <div>
                    <input
                      type="text"
                      name="name"
                      value={name}
                      onChange={onChange}
                      className="py-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full px-2.5"
                      placeholder="Nombre"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="lastname"
                      value={lastname}
                      onChange={onChange}
                      className="py-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full px-2.5"
                      placeholder="Apellido"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={onChange}
                      className="py-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                      placeholder="Correo"
                      required
                    />
                  </div>
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => handleSpecialtySearch(e.target.value)}
                        onFocus={() => setShowSpecialties(true)}
                        className="py-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full px-2.5"
                        placeholder="Buscar especialidad"
                        required
                      />
                      {showSpecialties && searchTerm && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredSpecialties.map((specialty) => (
                            <div
                              key={specialty.specialty_id}
                              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSelectSpecialty(specialty)}
                            >
                              {specialty.name}
                            </div>
                          ))}
                          {filteredSpecialties.length === 0 && (
                            <div className="px-4 py-2 text-gray-500">
                              No se encontraron especialidades
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={password}
                      onChange={onChange}
                      placeholder="Contraseña"
                      className="py-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showPassword ? (
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          ></path>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          ></path>
                        </svg>
                      )}
                    </button>
                  </div>

                  {password.length > 0 && !allRequirementsMet ? (
                    <div className="px-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 gap-2">
                        <PasswordRequirement
                          met={passwordRequirements.length}
                          text="Mínimo 8 caracteres"
                        />
                        <PasswordRequirement
                          met={passwordRequirements.uppercase}
                          text="Al menos una mayúscula"
                        />
                        <PasswordRequirement
                          met={passwordRequirements.lowercase}
                          text="Al menos una minúscula"
                        />
                        <PasswordRequirement
                          met={passwordRequirements.number}
                          text="Al menos un número"
                        />
                        <PasswordRequirement
                          met={passwordRequirements.special}
                          text="Al menos un carácter especial"
                        />
                        <PasswordRequirement
                          met={passwordRequirements.notCommon}
                          text="No usar contraseñas comunes"
                        />
                      </div>
                    </div>
                  ) : password.length > 0 && allRequirementsMet ? (
                    <div className=" bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-green-700 text-sm">
                          ¡Contraseña segura! Puedes continuar.
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <label htmlFor="phone" className="sr-only">
                      Teléfono
                    </label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <PhoneInput
                        value={phone}
                        onChange={onPhoneChange}
                        country={"co"}
                        containerClass="custom-phone-input"
                        inputStyle={{
                          backgroundColor: "#f9fafb",
                          border: "1px solid #d1d5db",
                          color: "#111827",
                          fontSize: "0.875rem",
                          borderRadius: "0.5rem",
                          outline: "none",
                          width: "100%",
                          height: "2.3rem",
                        }}
                        inputClass="custom-phone-input"
                      />
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={enabled}
                        onChange={onCheckboxChange}
                        className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="terms"
                        className="font-light text-gray-500"
                      >
                        Acepto
                        <Link
                          href="/terms"
                          className="font-medium text-primary-600 text-blue-500 hover:underline"
                        >
                          {" "}
                          Términos y condiciones
                        </Link>
                      </label>
                    </div>
                  </div>
                  {errorMessage && (
                    <p style={{ color: "red" }}>{errorMessage}</p>
                  )}
                  {errorAuth && <p style={{ color: "red" }}>{errorAuth}</p>}
                  <button
                    type="submit"
                    className="w-full text-white bg-blue-950 hover:bg-primary-700 focus:ring-2 focus:outline-none focus:ring-blue-300 focus:text-blue-500 focus:bg-white font-medium rounded-full text-lg px-5 py-1.5 text-center"
                  >
                    Crear cuenta
                  </button>
                </form>
                <div className="pt-4 flex flex-col gap-7">
                  <p className="text-sm font-light text-gray-500">
                    ¿Ya tienes una cuenta?{" "}
                    <Link
                      href="/login"
                      className="font-medium text-primary-600 text-blue-500 hover:underline"
                    >
                      Iniciar Sesión
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Form;
