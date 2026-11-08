/**
 * Sección principal de las páginas de acceso (iniciar sesión y registro).
 *
 * Ocupa todo el alto visible menos los 6rem del `pt-24` que el layout reserva
 * para la navbar, y centra el formulario. Antes la sección medía lo que medía
 * el formulario y en pantallas grandes el footer subía y tomaba parte de la
 * primera vista (hasta ~650 px en 2560×1440). Ahora el footer queda justo
 * debajo del borde y aparece al hacer scroll.
 *
 * `svh` (alto pequeño del viewport) evita que en celular la barra del
 * navegador, al mostrarse u ocultarse, haga saltar el contenido.
 */
export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-[calc(100svh-6rem)] flex-col justify-center">{children}</main>;
}
