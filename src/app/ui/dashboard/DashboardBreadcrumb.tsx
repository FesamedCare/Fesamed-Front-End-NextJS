"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useTranslation } from "@/i18n/LocaleProvider";

/**
 * Migaja de pan del área de perfil.
 *
 * Existe como componente porque estaba copiada en cuatro pantallas y las copias
 * ya habían divergido: distinto ancho de contenedor (la migaja saltaba de sitio
 * al entrar a editar) y una que apuntaba a `/dashboard/edit-profile`, una ruta
 * que no existe.
 */
export function DashboardBreadcrumb({
  /** Nombre de la pantalla actual. Si no se pasa, la migaja termina en "Perfil". */
  current,
}: {
  current?: string;
}) {
  const { t } = useTranslation();

  return (
    <Breadcrumb className="pb-5 pt-2 font-medium">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">{t("dashboard.home")}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {current ? (
            <BreadcrumbLink href="/dashboard">
              {t("dashboard.profile")}
            </BreadcrumbLink>
          ) : (
            // La pantalla actual no es un enlace a sí misma.
            <BreadcrumbPage>{t("dashboard.profile")}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {current && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{current}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
