import Footer from "../../ui/navigation/footer";

/**
 * Pendiente: formulario de datos personales del paciente.
 *
 * Hoy esta página es un esqueleto. El único lugar de la app donde se edita
 * `birth_date` es el formulario del doctor
 * (`ui/dashboard/editProfile/general-profile-form.tsx`).
 *
 * Cuando se construya, la fecha de nacimiento tiene que usar los helpers de
 * `@/lib/birthDate`:
 *
 *   - `max={hoyISO()}` en el `<input type="date">`, para que el selector nativo
 *     no ofrezca días futuros.
 *   - un `.refine((v) => !v || !esFutura(v), ...)` en el esquema de Zod.
 *
 * NO copiar la regla de `EDAD_MINIMA_DOCTOR`: los 18 años son solo para
 * profesionales. Un paciente puede ser menor de edad.
 *
 * El backend ya rechaza fechas futuras para cualquier rol, en
 * `src/app/api/v1/users/birth_date.py`, así que esa parte no hay que tocarla.
 */
export default function Page() {
    return (
        <div>
            <h1>Patient Section</h1>
            <Footer/>
        </div>
    );
}
