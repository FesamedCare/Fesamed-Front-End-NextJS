"use client";

import Link from "next/link";
import "@/app/globals.css";
import { useEffect, useRef, useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/bootstrap.css";
import { Specialty, MedicalInsurance } from "@/app/types/types";
import "./style.css";
import { getRoles } from "@/lib/api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTranslation } from "@/i18n/LocaleProvider";

function Form() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorAuth, setErrorAuth] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [allRequirementsMet, setAllRequirementsMet] = useState(false);
  const [roleId, setRoleId] = useState("");
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

  // States for medical insurances
  const [medicalInsurances, setMedicalInsurances] = useState<MedicalInsurance[]>([]);
  const [selectedInsurances, setSelectedInsurances] = useState<string[]>([]);
  const [showInsurances, setShowInsurances] = useState(false);
  const [insuranceSearchTerm, setInsuranceSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    email: "",
    password: "",
    phone_number: "",
    specialty_id: "",
    role: "doctor",
  });

  // Fetch specialties, medical insurances and roles
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch specialties
        const specialtiesResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/specialty/`
        );
        if (specialtiesResponse.ok) {
          const data = await specialtiesResponse.json();
          setSpecialties(data);
        }

        // Fetch medical insurances
        const insurancesResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/medical-insurances/`
        );
        if (insurancesResponse.ok) {
          const insurancesData = await insurancesResponse.json();
          setMedicalInsurances(insurancesData);
        }

        // Fetch roles
        const roles = await getRoles();
        console.log("Roles fetched/Roles obtenidos:", roles);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doctorRole = (roles as any[]).find((r: any) => r.name.toLowerCase() === 'doctor');
        if (doctorRole) {
          setRoleId(doctorRole.id);
          console.log("Role ID set for doctor:", doctorRole.id);
        } else {
          console.error("No doctor role found in roles list");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.specialty-dropdown') && !target.closest('.insurance-dropdown')) {
        setShowSpecialties(false);
        setShowInsurances(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
    setFormData({ ...formData, specialty_id: specialty.id });
    setShowSpecialties(false);
  };

  // Handle medical insurance selection
  const handleInsuranceToggle = (insuranceId: string) => {
    setSelectedInsurances((prev) => {
      if (prev.includes(insuranceId)) {
        return prev.filter((id) => id !== insuranceId);
      } else {
        return [...prev, insuranceId];
      }
    });
  };

  // Filter medical insurances
  const filteredInsurances = medicalInsurances.filter((insurance) =>
    insurance.name.toLowerCase().includes(insuranceSearchTerm.toLowerCase())
  );

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
        t("register.passwordRequirementsError")
      );
      return;
    }

    if (!enabled) {
      setErrorMessage(t("register.mustAcceptTerms"));
      return;
    }

    if (!formData.specialty_id) {
      setErrorMessage("Por favor, selecciona una especialidad");
      return;
    }

    if (!roleId) {
      setErrorMessage("Error interno: No se pudo obtener el rol de doctor");
      return;
    }

    const phone = (formData.phone_number || "").replace(/\D/g, "");
    if (phone.length < 10) {
      setErrorMessage(t("register.invalidPhone"));
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setErrorAuth(t("register.missingApiUrl"));
      return;
    }

    setErrorAuth("");
    setErrorMessage("");

    try {
      const res = await fetch(`${apiUrl}/api/v1/user/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          lastname,
          email,
          plain_password: password,
          plain_password_confirm: password,
          phone_number: formData.phone_number,
          specialty: formData.specialty_id,
          role_id: roleId,
          ...(selectedInsurances.length > 0 && { medical_insurances: selectedInsurances }),
        }),
      });

      const data = await res.json().catch(() => ({}));
      const errorMsg =
        typeof data.detail === "string"
          ? data.detail
          : Array.isArray(data.detail)
            ? data.detail.map((e: { msg?: string }) => e.msg || "").filter(Boolean).join(". ")
            : "Error al registrar doctor";

      if (res.status === 200 || res.status === 201) {
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
        setSelectedInsurances([]);
        setInsuranceSearchTerm("");
        setShowSuccessModal(true);
        setCountdown(3);
        countdownRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownRef.current!);
              window.location.href = "/login";
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setErrorAuth(errorMsg || "Error al registrar doctor");
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
      <Dialog open={showSuccessModal} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-sm text-center p-8 [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex justify-center mb-4">
            <div className="relative flex items-center justify-center w-20 h-20">
              <svg className="absolute inset-0 w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle
                  cx="40" cy="40" r="36"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={226.2}
                  strokeDashoffset={226.2 * (countdown / 3)}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100">
                <svg
                  className="w-7 h-7 text-green-500"
                  viewBox="0 0 52 52"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ animation: "drawCheck 0.4s ease-out 0.1s both" }}
                >
                  <path d="M14 27 l9 9 l16-16" />
                </svg>
              </div>
              <style>{`
                @keyframes drawCheck {
                  from { stroke-dasharray: 0 60; opacity: 0; }
                  to   { stroke-dasharray: 60 0; opacity: 1; }
                }
              `}</style>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-1">{t("register.successTitle")}</h2>
          <p className="text-sm text-gray-500 mb-4">
            {t("register.successBody")}
          </p>
          <p className="text-xs text-gray-400 mb-5">
            {t("ui.redirectingIn")} <span className="font-medium text-gray-600">{countdown}s</span>…
          </p>

          <button
            onClick={() => {
              clearInterval(countdownRef.current!);
              window.location.href = "/login";
            }}
            className="w-full text-white bg-blue-950 hover:bg-blue-900 font-medium rounded-full text-sm px-5 py-2 transition-colors"
          >
            {t("register.goToLoginNow")}
          </button>
        </DialogContent>
      </Dialog>

      <section className="bg-white">
        <div className="flex flex-col items-center px-6 py-8 mx-auto lg:py-10 lg:pb-28">
          <div className="w-full md:mt-0 sm:max-w-md xl:p-0">
            <div className="p-6 sm:p-2">
              <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                Registro de Doctor 👨‍⚕️
              </h1>
              <p className="text-gray-500 text-center mb-4">
                {t("register.doctorTagline")}
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
                      placeholder={t("register.firstName")}
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
                      placeholder={t("register.lastName")}
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
                      placeholder={t("register.email")}
                      required
                    />
                  </div>
                  <div>
                    <div className="relative specialty-dropdown">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => handleSpecialtySearch(e.target.value)}
                        onFocus={() => setShowSpecialties(true)}
                        className="py-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full px-2.5"
                        placeholder={t("register.searchSpecialty")}
                        required
                      />
                      {showSpecialties && searchTerm && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredSpecialties.map((specialty) => (
                            <div
                              key={specialty.id}
                              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSelectSpecialty(specialty)}
                            >
                              {specialty.name}
                            </div>
                          ))}
                          {filteredSpecialties.length === 0 && (
                            <div className="px-4 py-2 text-gray-500">
                              {t("ui.noSpecialtiesFound")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("register.insurancesOptional")}
                    </label>
                    <div className="relative insurance-dropdown">
                      <input
                        type="text"
                        value={insuranceSearchTerm}
                        onChange={(e) => {
                          setInsuranceSearchTerm(e.target.value);
                          setShowInsurances(true);
                        }}
                        onFocus={() => setShowInsurances(true)}
                        className="py-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full px-2.5"
                        placeholder={t("register.searchInsurances")}
                      />
                      {showInsurances && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredInsurances.length > 0 ? (
                            filteredInsurances.map((insurance) => (
                              <div
                                key={insurance.id}
                                className="px-4 py-2 hover:bg-gray-100 flex items-center"
                              >
                                <input
                                  type="checkbox"
                                  id={`insurance-${insurance.id}`}
                                  checked={selectedInsurances.includes(insurance.id)}
                                  onChange={() => handleInsuranceToggle(insurance.id)}
                                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <label
                                  htmlFor={`insurance-${insurance.id}`}
                                  className="ml-2 text-sm text-gray-700 cursor-pointer flex-1"
                                >
                                  {insurance.name}
                                </label>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500">
                              {t("register.noInsurancesFound")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {selectedInsurances.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedInsurances.map((insuranceId) => {
                          const insurance = medicalInsurances.find(
                            (ins) => ins.id === insuranceId
                          );
                          return insurance ? (
                            <span
                              key={insuranceId}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {insurance.name}
                              <button
                                type="button"
                                onClick={() => handleInsuranceToggle(insuranceId)}
                                className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={password}
                      onChange={onChange}
                      placeholder={t("register.password")}
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
                          text={t("register.ruleMinLength")}
                        />
                        <PasswordRequirement
                          met={passwordRequirements.uppercase}
                          text={t("register.ruleUppercase")}
                        />
                        <PasswordRequirement
                          met={passwordRequirements.lowercase}
                          text={t("register.ruleLowercase")}
                        />
                        <PasswordRequirement
                          met={passwordRequirements.number}
                          text={t("register.ruleNumber")}
                        />
                        <PasswordRequirement
                          met={passwordRequirements.special}
                          text={t("register.ruleSpecial")}
                        />
                        <PasswordRequirement
                          met={passwordRequirements.notCommon}
                          text={t("register.ruleNotCommon")}
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
                          {t("register.passwordStrong")}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <label htmlFor="phone" className="sr-only">
                      {t("register.phone")}
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
                        {t("ui.accept")}
                        <Link
                          href="/terms"
                          className="font-medium text-primary-600 text-blue-500 hover:underline"
                        >
                          {" "}
                          {t("register.termsLabel")}
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
                    {t("ui.createAccount")}
                  </button>
                </form>
                <div className="pt-4 flex flex-col gap-7">
                  <p className="text-sm font-light text-gray-500">
                    {t("misc.alreadyHaveAccount")}{" "}
                    <Link
                      href="/login"
                      className="font-medium text-primary-600 text-blue-500 hover:underline"
                    >
                      {t("auth.alreadyHaveAccount")}
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
