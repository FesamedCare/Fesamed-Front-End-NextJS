"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Image from "next/image"
import { Pencil, Trash2, Upload, Plus, MapPin, Phone, Globe } from "lucide-react"
import ImagePreviewModal from "./image-preview-modal"
import { MultiSelect, type Option } from "./multi-select"
import { useAuthContext } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n/LocaleProvider";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? ""
const MAX_FILE_SIZE = 10 * 1024 * 1024

interface City { id: string; name: string }
interface PaymentMethodItem { id: string; name: string }
interface OfficePhoto { id: string; url: string; office_id: string }

interface ConsultingOffice {
  id: string
  name: string
  address: string
  postal_code: string
  phone_primary: string
  phone_secondary?: string | null
  website_url?: string | null
  city_id: string
  payment_methods: PaymentMethodItem[]
}

interface OfficeFormData {
  name: string
  address: string
  postal_code: string
  phone_primary: string
  phone_secondary: string
  website_url: string
  city_id: string
  payment_methods: Option[]
}

const emptyForm: OfficeFormData = {
  name: "",
  address: "",
  postal_code: "",
  phone_primary: "",
  phone_secondary: "",
  website_url: "",
  city_id: "",
  payment_methods: [],
}

export default function ConsultoriesForm() {
  const { t } = useTranslation();
  const { notifyProfileChanged } = useAuthContext();
  const [userId, setUserId] = useState<string | null>(null)
  const [offices, setOffices] = useState<ConsultingOffice[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [paymentMethodOptions, setPaymentMethodOptions] = useState<Option[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [formMode, setFormMode] = useState<"none" | "create" | "edit">("none")
  const [editingOfficeId, setEditingOfficeId] = useState<string | null>(null)
  const [formData, setFormData] = useState<OfficeFormData>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingOfficeId, setDeletingOfficeId] = useState<string | null>(null)

  const [officePhotos, setOfficePhotos] = useState<Record<string, OfficePhoto[]>>({})
  const [uploadingForOffice, setUploadingForOffice] = useState<string | null>(null)
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [previewImages, setPreviewImages] = useState<{ src: string; name: string }[]>([])

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setIsLoading(true)
    try {
      const [meRes, officesRes, citiesRes, pmRes] = await Promise.all([
        fetch(`${apiBase}/api/v1/user/me/`, { credentials: "include" }),
        fetch(`${apiBase}/api/v1/me/consulting_office/`, { credentials: "include" }),
        fetch(`${apiBase}/api/v1/city/?page=1&size=500`, { credentials: "include" }),
        fetch(`${apiBase}/api/v1/payment_method/?page=1&size=100`, { credentials: "include" }),
      ])

      let uid: string | null = null
      if (meRes.ok) {
        const me = (await meRes.json()) as { id: string }
        uid = me.id
        setUserId(uid)
      }

      let loadedOffices: ConsultingOffice[] = []
      if (officesRes.ok) {
        loadedOffices = (await officesRes.json()) as ConsultingOffice[]
        setOffices(loadedOffices)
      }

      if (citiesRes.ok) {
        const data = await citiesRes.json()
        const list: City[] = Array.isArray(data) ? data : (data.items ?? [])
        setCities(list)
      }

      if (pmRes.ok) {
        const data = await pmRes.json()
        const list: PaymentMethodItem[] = Array.isArray(data) ? data : (data.items ?? [])
        setPaymentMethodOptions(list.map((pm) => ({ value: pm.id, label: pm.name })))
      }

      if (uid && loadedOffices.length > 0) {
        const photosEntries = await Promise.all(
          loadedOffices.map(async (office) => {
            try {
              const res = await fetch(
                `${apiBase}/api/v1/user/${uid}/consulting_office/${office.id}/photos/`,
                { credentials: "include" }
              )
              if (!res.ok) return [office.id, []] as [string, OfficePhoto[]]
              const photos = (await res.json()) as OfficePhoto[]
              return [office.id, photos] as [string, OfficePhoto[]]
            } catch {
              return [office.id, []] as [string, OfficePhoto[]]
            }
          })
        )
        setOfficePhotos(Object.fromEntries(photosEntries))
      }
    } catch (e) {
      console.error("Error loading data:", e)
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateForm = () => {
    setFormData(emptyForm)
    setEditingOfficeId(null)
    setFormMode("create")
  }

  const openEditForm = (office: ConsultingOffice) => {
    setFormData({
      name: office.name,
      address: office.address,
      postal_code: office.postal_code,
      phone_primary: office.phone_primary,
      phone_secondary: office.phone_secondary ?? "",
      website_url: office.website_url ?? "",
      city_id: office.city_id,
      payment_methods: office.payment_methods.map((pm) => ({ value: pm.id, label: pm.name })),
    })
    setEditingOfficeId(office.id)
    setFormMode("edit")
  }

  const cancelForm = () => {
    setFormMode("none")
    setEditingOfficeId(null)
    setFormData(emptyForm)
  }

  const handleSave = async () => {
    if (
      !formData.name ||
      !formData.address ||
      !formData.city_id ||
      !formData.phone_primary ||
      !formData.postal_code
    ) {
      alert(
        t("profile.requiredFields")
      )
      return
    }
    setIsSaving(true)
    try {
      const body = {
        name: formData.name,
        address: formData.address,
        postal_code: formData.postal_code,
        phone_primary: formData.phone_primary,
        phone_secondary: formData.phone_secondary || null,
        website_url: formData.website_url || null,
        city_id: formData.city_id,
        payment_methods: formData.payment_methods.map((pm) => pm.value),
      }

      const url =
        formMode === "create"
          ? `${apiBase}/api/v1/me/consulting_office/`
          : `${apiBase}/api/v1/me/consulting_office/${editingOfficeId}/`

      const res = await fetch(url, {
        method: formMode === "create" ? "POST" : "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Error: ${res.status}`)
      const savedOffice = (await res.json()) as ConsultingOffice

      if (formMode === "create") {
        setOffices((prev) => [...prev, savedOffice])
        setOfficePhotos((prev) => ({ ...prev, [savedOffice.id]: [] }))
        notifyProfileChanged()
        alert("Consultorio creado correctamente.")
      } else {
        setOffices((prev) => prev.map((o) => (o.id === savedOffice.id ? savedOffice : o)))
        notifyProfileChanged()
        alert("Consultorio actualizado correctamente.")
      }
      cancelForm()
    } catch (e) {
      console.error("Error saving office:", e)
      alert("Error al guardar el consultorio. Por favor inténtalo de nuevo.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteOffice = async (officeId: string) => {
    if (!confirm(t("profile.confirmDeleteOffice"))) return
    setDeletingOfficeId(officeId)
    try {
      const res = await fetch(`${apiBase}/api/v1/me/consulting_office/${officeId}/`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) throw new Error(`Error: ${res.status}`)
      setOffices((prev) => prev.filter((o) => o.id !== officeId))
      setOfficePhotos((prev) => {
        const copy = { ...prev }
        delete copy[officeId]
        return copy
      })
    } catch (e) {
      console.error("Error deleting office:", e)
      alert("No se pudo eliminar el consultorio. Verifica que no tenga horarios asociados.")
    } finally {
      setDeletingOfficeId(null)
    }
  }

  const handlePhotoUpload = async (officeId: string, files: FileList | null) => {
    if (!files || !userId) return
    const validFiles = Array.from(files).filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        alert(t("profile.fileTooLarge", { name: f.name }))
        return false
      }
      return true
    })
    if (!validFiles.length) return

    setUploadingForOffice(officeId)
    try {
      const formData = new FormData()
      validFiles.forEach((f) => formData.append("photos", f))
      const res = await fetch(
        `${apiBase}/api/v1/user/${userId}/consulting_office/${officeId}/photos/`,
        { method: "POST", credentials: "include", body: formData }
      )
      if (!res.ok) throw new Error(`Error: ${res.status}`)
      const newPhotos = (await res.json()) as OfficePhoto[]
      setOfficePhotos((prev) => ({
        ...prev,
        [officeId]: [...(prev[officeId] ?? []), ...newPhotos],
      }))
    } catch (e) {
      console.error("Error uploading photos:", e)
      alert("Error al subir las fotos. Por favor inténtalo de nuevo.")
    } finally {
      setUploadingForOffice(null)
      const input = fileInputRefs.current[officeId]
      if (input) input.value = ""
    }
  }

  const handleDeletePhoto = async (officeId: string, photo: OfficePhoto) => {
    if (!userId) return
    setDeletingPhotoId(photo.id)
    try {
      const res = await fetch(
        `${apiBase}/api/v1/user/${userId}/consulting_office/${officeId}/photos/`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photo_ids: [photo.id] }),
        }
      )
      if (!res.ok) throw new Error(`Error: ${res.status}`)
      setOfficePhotos((prev) => ({
        ...prev,
        [officeId]: (prev[officeId] ?? []).filter((p) => p.id !== photo.id),
      }))
    } catch (e) {
      console.error("Error deleting photo:", e)
      alert("Error al eliminar la foto.")
    } finally {
      setDeletingPhotoId(null)
    }
  }

  const openPhotoPreview = (officeId: string, index: number) => {
    const photos = officePhotos[officeId] ?? []
    setPreviewImages(
      photos.map((p) => ({ src: p.url, name: p.url.split("/").pop() || "foto" }))
    )
    setPreviewIndex(index)
    setPreviewOpen(true)
  }

  const getCityName = (cityId: string) => cities.find((c) => c.id === cityId)?.name ?? ""

  if (isLoading) {
    return (
      <div className="flex justify-center p-12 text-gray-500">{t("ui.loadingOffices")}</div>
    )
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("profile.myOffices")}</h3>
        {formMode === "none" && (
          <Button onClick={openCreateForm} className="bg-blue-700 hover:bg-blue-800 gap-2">
            <Plus className="w-4 h-4" />
            {t("ui.addOffice")}
          </Button>
        )}
      </div>

      {/* Create / Edit Form */}
      {formMode !== "none" && (
        <div className="border border-blue-200 rounded-lg p-6 space-y-4 bg-blue-50/30">
          <h4 className="font-semibold text-base">
            {formMode === "create" ? "Nuevo consultorio" : "Editar consultorio"}
          </h4>

          {/* Office info */}
          <div className="border border-blue-100 rounded-lg p-4 space-y-3 bg-white">
            <h5 className="font-medium text-sm text-gray-700">{t("profile.officeInfo")}</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nombre *</Label>
                <Input
                  placeholder={t("profile.officeNamePlaceholder")}
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>{t("profile.address")}</Label>
                <Input
                  placeholder={t("profile.addressPlaceholder")}
                  value={formData.address}
                  onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Ciudad *</Label>
                <Select
                  value={formData.city_id}
                  onValueChange={(v) => setFormData((p) => ({ ...p, city_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("profile.pickCity")} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t("profile.postalCode")}</Label>
                <Input
                  placeholder={t("profile.postalPlaceholder")}
                  value={formData.postal_code}
                  onChange={(e) => setFormData((p) => ({ ...p, postal_code: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="border border-blue-100 rounded-lg p-4 space-y-3 bg-white">
            <h5 className="font-medium text-sm text-gray-700">{t("profile.contactInfo")}</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{t("profile.primaryPhone")}</Label>
                <Input
                  placeholder={t("profile.phonePlaceholder")}
                  value={formData.phone_primary}
                  onChange={(e) => setFormData((p) => ({ ...p, phone_primary: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>{t("profile.secondaryPhone")}</Label>
                <Input
                  placeholder={t("profile.secondaryPhonePlaceholder")}
                  value={formData.phone_secondary}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone_secondary: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>{t("profile.website")}</Label>
                <Input
                  placeholder="https://..."
                  value={formData.website_url}
                  onChange={(e) => setFormData((p) => ({ ...p, website_url: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Payment methods */}
          <div className="border border-blue-100 rounded-lg p-4 space-y-3 bg-white">
            <h5 className="font-medium text-sm text-gray-700">{t("profile.paymentMethods")}</h5>
            <MultiSelect
              options={paymentMethodOptions}
              selected={formData.payment_methods}
              onChange={(selected) => setFormData((p) => ({ ...p, payment_methods: selected }))}
              placeholder={t("profile.paymentPlaceholder")}
            />
            {formData.payment_methods.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.payment_methods.map((pm) => (
                  <span
                    key={pm.value}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                  >
                    {pm.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Photos — only available when editing an existing office */}
          {formMode === "edit" && editingOfficeId && (() => {
            const photos = officePhotos[editingOfficeId] ?? []
            const isUploading = uploadingForOffice === editingOfficeId
            return (
              <div className="border border-blue-100 rounded-lg p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-sm text-gray-700">
                    Fotos del consultorio ({photos.length})
                  </h5>
                  <div>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg"
                      multiple
                      className="hidden"
                      ref={(el) => { fileInputRefs.current[editingOfficeId] = el }}
                      onChange={(e) => handlePhotoUpload(editingOfficeId, e.target.files)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs"
                      disabled={isUploading}
                      onClick={() => fileInputRefs.current[editingOfficeId]?.click()}
                    >
                      <Upload className="w-3 h-3" />
                      {isUploading ? "Subiendo..." : "Subir fotos"}
                    </Button>
                  </div>
                </div>

                {photos.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    {t("profile.noPhotos")}
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {photos.map((photo, index) => (
                      <div
                        key={photo.id}
                        className="relative group aspect-square rounded overflow-hidden border border-gray-200"
                      >
                        <Image
                          src={photo.url}
                          alt={`Foto ${index + 1}`}
                          fill
                          className="object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => openPhotoPreview(editingOfficeId, index)}
                        />
                        <button
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 text-xs hidden group-hover:flex items-center justify-center transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePhoto(editingOfficeId, photo)
                          }}
                          disabled={deletingPhotoId === photo.id}
                          aria-label={t("profile.removePhoto")}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}

          {formMode === "create" && (
            <p className="text-xs text-gray-400 text-center">
                {t("profile.photosAfterSave")}
            </p>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={cancelForm} disabled={isSaving}>
              {t("common.cancel")}
            </Button>
            <Button
              className="bg-blue-700 hover:bg-blue-800"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {offices.length === 0 && formMode === "none" && (
        <div className="text-center py-12 border-2 border-dashed border-blue-100 rounded-lg text-gray-500">
          <p className="mb-3">{t("ui.noOffices")}</p>
          <Button onClick={openCreateForm} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            {t("ui.addFirstOffice")}
          </Button>
        </div>
      )}

      {/* Office cards */}
      {offices.map((office) => {
        const photos = officePhotos[office.id] ?? []
        const isBeingDeleted = deletingOfficeId === office.id
        const isUploadingPhotos = uploadingForOffice === office.id

        return (
          <div
            key={office.id}
            className="border border-blue-100 rounded-lg overflow-hidden shadow-sm"
          >
            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-blue-50">
              <h4 className="font-semibold">{office.name}</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditForm(office)}
                  disabled={formMode !== "none"}
                  className="gap-1 text-xs"
                >
                  <Pencil className="w-3 h-3" />
                  {t("ui.edit")}
                </Button>
                <Button
                  variant="delete"
                  size="sm"
                  onClick={() => handleDeleteOffice(office.id)}
                  disabled={isBeingDeleted}
                  className="text-xs"
                >
                  {isBeingDeleted ? (
                    "Eliminando..."
                  ) : (
                    <>
                      <Trash2 className="w-3 h-3 mr-1" />
                      {t("ui.remove")}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Office details */}
            <div className="px-4 py-3 bg-white space-y-2">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                  {office.address}
                  {office.city_id ? `, ${getCityName(office.city_id)}` : ""}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-blue-400 shrink-0" />
                  {office.phone_primary}
                  {office.phone_secondary ? ` · ${office.phone_secondary}` : ""}
                </span>
                {office.website_url && (
                  <a
                    href={office.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <Globe className="w-3 h-3 shrink-0" />
                    {t("ui.website")}
                  </a>
                )}
              </div>
              {office.payment_methods.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {office.payment_methods.map((pm) => (
                    <span
                      key={pm.id}
                      className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"
                    >
                      {pm.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Photos section */}
            <div className="px-4 py-3 bg-gray-50 border-t border-blue-50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Fotos ({photos.length})
                </span>
                <div>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    multiple
                    className="hidden"
                    ref={(el) => {
                      fileInputRefs.current[office.id] = el
                    }}
                    onChange={(e) => handlePhotoUpload(office.id, e.target.files)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs"
                    disabled={isUploadingPhotos}
                    onClick={() => fileInputRefs.current[office.id]?.click()}
                  >
                    <Upload className="w-3 h-3" />
                    {isUploadingPhotos ? "Subiendo..." : "Subir fotos"}
                  </Button>
                </div>
              </div>

              {photos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  {t("profile.noPhotos")}
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="relative group aspect-square rounded overflow-hidden border border-gray-200"
                    >
                      <Image
                        src={photo.url}
                        alt={`Foto ${index + 1}`}
                        fill
                        className="object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => openPhotoPreview(office.id, index)}
                      />
                      <button
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 text-xs hidden group-hover:flex items-center justify-center transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePhoto(office.id, photo)
                        }}
                        disabled={deletingPhotoId === photo.id}
                        aria-label={t("profile.removePhoto")}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}

      <ImagePreviewModal
        images={previewImages}
        initialIndex={previewIndex}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  )
}
