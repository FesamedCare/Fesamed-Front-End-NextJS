import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function SearchSection() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <h1 className="text-4xl font-medium text-center mb-8">Encuentra un Doctor</h1>
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <Select>
          <SelectTrigger className="w-full md:w-[200px] bg-white rounded-full border-blue-500 text-blue-500 focus:ring-0">
            <SelectValue placeholder="Selecciona tu locación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cali">Cali</SelectItem>
            <SelectItem value="bogota">Bogotá</SelectItem>
            <SelectItem value="medellin">Medellín</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Buscar por nombre / especialización"
            className="w-full bg-gray-50 rounded-full pl-10" // Añadimos padding-left para que el ícono no tape el texto
          />
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 fill-slate-500 pointer-events-none"
          >
            <path d="M16.72 17.78a.75.75 0 1 0 1.06-1.06l-1.06 1.06ZM9 14.5A5.5 5.5 0 0 1 3.5 9H2a7 7 0 0 0 7 7v-1.5ZM3.5 9A5.5 5.5 0 0 1 9 3.5V2a7 7 0 0 0-7 7h1.5ZM9 3.5A5.5 5.5 0 0 1 14.5 9H16a7 7 0 0 0-7-7v1.5Zm3.89 10.45 3.83 3.83 1.06-1.06-3.83-3.83-1.06 1.06ZM14.5 9a5.48 5.48 0 0 1-1.61 3.89l1.06 1.06A6.98 6.98 0 0 0 16 9h-1.5Zm-1.61 3.89A5.48 5.48 0 0 1 9 14.5V16a6.98 6.98 0 0 0 4.95-2.05l-1.06-1.06Z"></path>
          </svg>
        </div>
      </div>
    </div>
  )
}
