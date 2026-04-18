"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import {
  Loader2, ArrowLeft, CheckCircle2, XCircle, Plus, Minus, Equal,
  ImageIcon, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScalarDiff {
  status: "unchanged" | "added" | "modified" | "removed";
  value?: string | null;
  from?: string | null;
  to?: string | null;
}

interface CollItem { id: string; name: string }

interface CollDiff {
  added: CollItem[];
  removed: CollItem[];
  unchanged: CollItem[];
}

interface CertItem { id: string; url: string }

interface CertDiff {
  added: CertItem[];
  removed: CertItem[];
}

interface ProfileDetail {
  version_id: string;
  approved_version_id: string | null;
  meta: {
    draft_updated_at: string | null;
    approved_updated_at: string | null;
  };
  diff: {
    description: ScalarDiff;
    profile_picture: ScalarDiff;
    professional_card_number: ScalarDiff;
    specialties: CollDiff;
    languages: CollDiff;
    universities: CollDiff;
    treated_diseases: CollDiff;
    services: CollDiff;
    medical_insurances: CollDiff;
    certificates: CertDiff;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

function ScalarField({ label, diff }: { label: string; diff: ScalarDiff }) {
  if (diff.status === "unchanged") return null;

  return (
    <div className="rounded-lg border p-4 space-y-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      {diff.status === "added" && (
        <p className="text-sm text-green-700 bg-green-50 rounded px-2 py-1">
          <Plus className="inline h-3 w-3 mr-1" />{diff.to ?? "—"}
        </p>
      )}
      {diff.status === "removed" && (
        <p className="text-sm text-red-700 bg-red-50 rounded px-2 py-1 line-through">
          <Minus className="inline h-3 w-3 mr-1" />{diff.from ?? "—"}
        </p>
      )}
      {diff.status === "modified" && (
        <div className="space-y-1">
          <p className="text-sm text-red-700 bg-red-50 rounded px-2 py-1 line-through">
            <Minus className="inline h-3 w-3 mr-1" />{diff.from ?? "—"}
          </p>
          <p className="text-sm text-green-700 bg-green-50 rounded px-2 py-1">
            <Plus className="inline h-3 w-3 mr-1" />{diff.to ?? "—"}
          </p>
        </div>
      )}
    </div>
  );
}

function CollectionField({ label, diff }: { label: string; diff: CollDiff }) {
  const hasChanges = diff.added.length > 0 || diff.removed.length > 0;

  return (
    <div className="rounded-lg border p-4 space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {diff.unchanged.map((i) => (
          <span key={i.id} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 rounded-full px-2.5 py-1">
            <Equal className="h-3 w-3 text-gray-400" />{i.name}
          </span>
        ))}
        {diff.added.map((i) => (
          <span key={i.id} className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 rounded-full px-2.5 py-1">
            <Plus className="h-3 w-3" />{i.name}
          </span>
        ))}
        {diff.removed.map((i) => (
          <span key={i.id} className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 rounded-full px-2.5 py-1 line-through">
            <Minus className="h-3 w-3" />{i.name}
          </span>
        ))}
        {!hasChanges && diff.unchanged.length === 0 && (
          <span className="text-xs text-gray-400 italic">Sin datos</span>
        )}
      </div>
    </div>
  );
}

function CertificatesField({ diff }: { diff: CertDiff }) {
  if (diff.added.length === 0 && diff.removed.length === 0) return null;

  return (
    <div className="rounded-lg border p-4 space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Certificados</p>
      <div className="flex flex-wrap gap-3">
        {diff.added.map((c) => (
          <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-green-700 rounded px-2.5 py-1.5 hover:bg-green-100">
            <Plus className="h-3 w-3" /><FileText className="h-3 w-3" />Nuevo certificado
          </a>
        ))}
        {diff.removed.map((c) => (
          <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-700 rounded px-2.5 py-1.5 hover:bg-red-100 line-through">
            <Minus className="h-3 w-3" /><FileText className="h-3 w-3" />Certificado eliminado
          </a>
        ))}
      </div>
    </div>
  );
}

function ProfilePictureDiff({ diff }: { diff: ScalarDiff }) {
  const currentUrl = diff.to ?? diff.value ?? null;
  const previousUrl = diff.from ?? null;
  const isNew = diff.status === "added";
  const isModified = diff.status === "modified";
  const isUnchanged = diff.status === "unchanged";

  return (
    <div className="rounded-lg border p-4 space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Foto de perfil</p>
      <div className="flex gap-6 flex-wrap items-start">
        {/* Foto anterior (solo cuando hay cambio) */}
        {isModified && previousUrl && (
          <div className="space-y-1">
            <p className="text-xs text-red-600 flex items-center gap-1"><Minus className="h-3 w-3" />Anterior</p>
            <Image src={previousUrl} alt="Foto anterior" width={80} height={80}
              className="rounded-lg object-cover border-2 border-red-200 opacity-60" />
          </div>
        )}

        {/* Foto actual / nueva */}
        {currentUrl ? (
          <div className="space-y-1">
            <p className={`text-xs flex items-center gap-1 ${isUnchanged ? "text-gray-500" : "text-green-600"}`}>
              {isNew && <><Plus className="h-3 w-3" />Primera foto</>}
              {isModified && <><Plus className="h-3 w-3" />Nueva foto</>}
              {isUnchanged && <><Equal className="h-3 w-3" />Foto actual</>}
            </p>
            <Image src={currentUrl} alt="Foto de perfil" width={80} height={80}
              className={`rounded-lg object-cover border-2 ${isUnchanged ? "border-gray-200" : "border-green-300"}`} />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-gray-400 italic">
            <ImageIcon className="h-4 w-4" />Sin foto de perfil
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewDetailPage() {
  const { versionId } = useParams<{ versionId: string }>();
  const router = useRouter();

  const [detail, setDetail] = useState<ProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    apiClient<ProfileDetail>(`/api/v1/admin/review-queue/${versionId}/`)
      .then(setDetail)
      .catch((e) => setError(e instanceof Error ? e.message : "Error al cargar el perfil"))
      .finally(() => setLoading(false));
  }, [versionId]);

  async function handleApprove() {
    setApproving(true);
    setActionMsg(null);
    try {
      await apiClient(`/api/v1/admin/review-queue/${versionId}/approve/`, { method: "POST" });
      setActionMsg({ type: "success", text: "Perfil aprobado exitosamente. El doctor recibirá un correo de notificación." });
      setTimeout(() => router.push("/admin/review-queue"), 2000);
    } catch (e) {
      setActionMsg({ type: "error", text: e instanceof Error ? e.message : "Error al aprobar" });
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setRejecting(true);
    setActionMsg(null);
    try {
      await apiClient(`/api/v1/admin/review-queue/${versionId}/reject/`, {
        method: "POST",
        body: { reject_reason: rejectReason.trim() },
      });
      setActionMsg({ type: "success", text: "Perfil rechazado. El doctor recibirá un correo con el motivo." });
      setTimeout(() => router.push("/admin/review-queue"), 2000);
    } catch (e) {
      setActionMsg({ type: "error", text: e instanceof Error ? e.message : "Error al rechazar" });
    } finally {
      setRejecting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-red-700 text-sm space-y-2">
        <p>{error ?? "No se encontró el perfil."}</p>
        <Link href="/admin/review-queue" className="underline">Volver a la cola</Link>
      </div>
    );
  }

  const { diff, meta, approved_version_id } = detail;
  const isFirstVersion = !approved_version_id;

  // Count changes
  const scalarChanges = [diff.description, diff.profile_picture, diff.professional_card_number]
    .filter((d) => d.status !== "unchanged").length;
  const collChanges = [diff.specialties, diff.languages, diff.universities, diff.treated_diseases, diff.services, diff.medical_insurances]
    .reduce((acc, c) => acc + c.added.length + c.removed.length, 0);
  const certChanges = diff.certificates.added.length + diff.certificates.removed.length;
  const totalChanges = scalarChanges + collChanges + certChanges;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/review-queue"
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Revisión de perfil</h1>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{versionId}</p>
        </div>
      </div>

      {/* Meta info */}
      <div className="bg-white rounded-xl border p-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Última actualización del borrador</p>
          <p className="font-medium text-gray-800">{fmtDate(meta.draft_updated_at)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Versión aprobada anterior</p>
          <p className="font-medium text-gray-800">
            {isFirstVersion ? (
              <span className="text-blue-600 bg-blue-50 rounded px-2 py-0.5 text-xs">Primera versión</span>
            ) : fmtDate(meta.approved_updated_at)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Cambios detectados</p>
          <p className="font-medium text-gray-800">
            {totalChanges === 0
              ? <span className="text-gray-400">Sin cambios respecto a la versión aprobada</span>
              : <span className="text-amber-700">{totalChanges} cambio{totalChanges !== 1 ? "s" : ""}</span>}
          </p>
        </div>
      </div>

      {/* Diff sections */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">
          {isFirstVersion ? "Contenido del perfil" : "Cambios propuestos"}
        </h2>

        <ProfilePictureDiff diff={diff.profile_picture} />
        <ScalarField label="Descripción profesional" diff={diff.description} />
        <ScalarField label="Número de tarjeta profesional" diff={diff.professional_card_number} />
        <CollectionField label="Especialidades" diff={diff.specialties} />
        <CollectionField label="Idiomas" diff={diff.languages} />
        <CollectionField label="Universidades" diff={diff.universities} />
        <CollectionField label="Enfermedades tratadas" diff={diff.treated_diseases} />
        <CollectionField label="Servicios" diff={diff.services} />
        <CollectionField label="Seguros médicos" diff={diff.medical_insurances} />
        <CertificatesField diff={diff.certificates} />

        {isFirstVersion && totalChanges === 0 && (
          <div className="rounded-lg bg-gray-50 border border-dashed p-8 text-center text-sm text-gray-400">
            No se detectaron diferencias con la versión aprobada anterior.
          </div>
        )}
      </div>

      {/* Action feedback */}
      {actionMsg && (
        <div className={`rounded-lg p-4 text-sm flex items-start gap-2 ${
          actionMsg.type === "success"
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {actionMsg.type === "success"
            ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            : <XCircle className="h-4 w-4 shrink-0 mt-0.5" />}
          {actionMsg.text}
        </div>
      )}

      {/* Actions */}
      {!actionMsg && (
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Decisión</h2>

          {!showRejectForm ? (
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={handleApprove}
                disabled={approving}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                {approving
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Aprobando...</>
                  : <><CheckCircle2 className="h-4 w-4" />Aprobar perfil</>}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(true)}
                className="border-red-300 text-red-600 hover:bg-red-50 gap-2"
              >
                <XCircle className="h-4 w-4" />Rechazar perfil
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-sm text-gray-700 font-medium">
                Motivo del rechazo <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
                rows={3}
                placeholder="Describe claramente el motivo del rechazo para que el doctor pueda corregirlo..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleReject}
                  disabled={rejecting || !rejectReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white gap-2"
                >
                  {rejecting
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Rechazando...</>
                    : <><XCircle className="h-4 w-4" />Confirmar rechazo</>}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
