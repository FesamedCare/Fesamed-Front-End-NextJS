'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/lib/api";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n/LocaleProvider";

function Form() {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const { refreshUser } = useAuthContext();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const { email, password } = formData;

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    
    try {
      await login(email, password);
      const me = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/me/`, { credentials: 'include' }).then(r => r.json());
      await refreshUser();
      localStorage.setItem('auth_event', Date.now().toString());
      const roleName = (me?.role?.name ?? me?.role ?? '').toLowerCase();
      const destination = roleName === 'admin' ? '/admin/review-queue' : redirectPath;
      router.push(destination);
    } catch (err) {
      console.error("Error de login:", err);
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(t("auth.loginError"));
      }
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="pt-16">
      <section className="bg-white">
        <div className="flex flex-col items-center px-6 py-8 mx-auto lg:py-10 lg:pb-28">
          <div className="w-full md:mt-0 sm:max-w-md xl:p-0">
            <div className="p-6 sm:p-8">
              <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl ">
                {t("auth.loginGreeting")}
              </h1>
              <p className="text-gray-500 text-center mb-6">
                {t("auth.loginSubtitle")}
              </p>
              <div className="flex flex-col items-center">
                <form onSubmit={onSubmit} className="flex flex-col gap-6 w-80" action="#">
                  <div>
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={e => {onChange(e)}}
                      id="email"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 "
                      placeholder={t("auth.emailPlaceholder")}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="relative">
                  <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={password}
                      onChange={onChange}
                      placeholder={t("auth.passwordPlaceholder")}
                      className="py-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 pr-10"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                  {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
                  <button
                    type="submit"
                    className="w-full text-white bg-blue-950 hover:bg-primary-700 focus:ring-2 focus:outline-none focus:ring-blue-300 focus:text-blue-500 focus:bg-white font-medium rounded-full text-lg px-5 py-1.5 text-center disabled:opacity-70"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Cargando...' : 'Ingresar'}
                  </button>
                  <div className="">
                    <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                      {t("misc.noAccountYet")}{" "}
                      <Link
                        href="/register"
                        className="font-medium text-primary-600 text-blue-500 hover:underline dark:text-primary-500"
                      >
                        {t("auth.signUpLink")}
                      </Link>
                    </p>
                    <p>
                      <Link
                        href="/forgot-password"
                        className="font-medium text-sm text-primary-600 text-blue-500 hover:underline dark:text-primary-500"
                      >
                        {t("auth.forgotPasswordLink")}
                      </Link>
                    </p>
                  </div>
                </form>
                {/* espacio para poder iniciar sesión con google o facebook */}
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="w-full text-sm text-gray-500 text-center pt-5 ">
                      {t("auth.orContinueWith")}
                    </p>
                  </div>
                  <div className="flex justify-center gap-4">
                    <button 
                      className="gsi-material-button"
                      onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
                      disabled={isLoading}
                    >
                      <div className=""></div>
                      <div className="flex items-center justify-center h-4 gap-1">
                        <div className="gsi-material-button-icon">
                          <svg
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 48 48"
                            className="display: block;"
                          >
                            <path
                              fill="#EA4335"
                              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                            ></path>
                            <path
                              fill="#4285F4"
                              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                            ></path>
                            <path
                              fill="#FBBC05"
                              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                            ></path>
                            <path
                              fill="#34A853"
                              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                            ></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                          </svg>
                        </div>
                        <span className="">Google</span>
                      </div>
                    </button>
                    {/* boton para ingresar por medio de Facebook */}
                    <button 
                      className="gsi-material-button"
                      onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/facebook`}
                      disabled={isLoading}
                    >
                      <div className="flex items-center justify-center h-4 gap-2">
                        <div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            version="1.0"
                            x="0px"
                            y="0px"
                            width="25"
                            height="50"
                            viewBox="0 0 50 50"
                            className="icon icons8-Facebook-Filled"
                          >
                            <path d="M40,0H10C4.486,0,0,4.486,0,10v30c0,5.514,4.486,10,10,10h30c5.514,0,10-4.486,10-10V10C50,4.486,45.514,0,40,0z M39,17h-3 c-2.145,0-3,0.504-3,2v3h6l-1,6h-5v20h-7V28h-3v-6h3v-3c0-4.677,1.581-8,7-8c2.902,0,6,1,6,1V17z"></path>
                          </svg>
                        </div>
                        <div>
                          <span>Facebook</span>
                        </div>
                      </div>
                    </button>
                  </div>
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
