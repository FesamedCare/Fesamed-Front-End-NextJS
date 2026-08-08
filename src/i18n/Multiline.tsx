import { Fragment } from "react";

/**
 * Pinta un texto del diccionario respetando sus saltos `\n` como `<br />`.
 *
 * Los saltos están en el diccionario y no en el JSX porque el punto de corte
 * depende del idioma: "Changing the way you get medical care" es más largo que
 * su equivalente en español y, cortado en el mismo lugar, se mete debajo del
 * modelo 3D del landing. Cada traducción elige dónde parte.
 *
 * En pantallas angostas los saltos molestan (el texto ya va centrado y
 * estrecho), así que ahí se usa `flatten()` en vez de este componente.
 */
export function Multiline({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </Fragment>
      ))}
    </>
  );
}

/** El mismo texto en una sola línea, para móvil. */
export function flatten(text: string): string {
  return text.replace(/\n/g, " ");
}
