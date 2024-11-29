import { useState } from "react";
import Link from "next/link";

const PasswordReset = () => {
    const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

//   const onSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await axios.get(`${import.meta.env.VITE_API_URL}/password/reset/message/${email}`);
//       setMessage(res.data.msg);
//       alert('Se ha enviado un correo con el código de recuperación de contraseña');
//     } catch (error) {
//       console.error(error);
//       setMessage(`${error.response.data.detail}`);
//     }
//   };

  return (
      <div className="pt-16">
        <section className="bg-white ">
          <div className="flex flex-col items-center px-6 py-8 mx-auto lg:py-10 lg:pb-28">
            <div className="w-full md:mt-0 sm:max-w-md xl:p-0">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col gap-4 pb-10">
                  <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                    ¿Olvidaste tu contraseña? 🤔
                  </h1>
                  <p className="text-gray-500 text-center w-80 mx-auto">
                    No te preocupes ! <br /> Te enviaremos un código a tu correo para que puedas recuperar tu contraseña.
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <form className="flex flex-col gap-6 w-80" action="#">
                    <div>
                      <input 
                        type="email" 
                        name="email" 
                        id="email" 
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" 
                        placeholder="Correo" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <button type="submit" className="w-full text-white bg-blue-950 hover:bg-primary-700 focus:ring-2 focus:outline-none focus:ring-blue-300 focus:text-blue-500 focus:bg-white font-medium rounded-full text-lg px-5 py-1.5 text-center">
                      Enviar código
                    </button>

                    <p className="text-sm font-light text-gray-500">
                      Probar de nuevo? <Link href='/login' className="font-medium text-primary-600 text-blue-500 hover:underline dark:text-primary-500">Ingresar</Link>
                    </p>
                  </form>
                  {message && <p className="text-center text-red-500 mt-4">{message}</p>}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
  );
}

export default PasswordReset;