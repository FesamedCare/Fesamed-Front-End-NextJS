import { Button } from "@/components/ui/button"
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
          <SelectTrigger className="w-full md:w-[200px] bg-white rounded-full  border-blue-500 text-blue-500">
            <SelectValue placeholder="Selecciona tu locación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cali">Cali</SelectItem>
            <SelectItem value="bogota">Bogotá</SelectItem>
            <SelectItem value="medellin">Medellín</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Buscar por nombre / especialización"
            className="w-full bg-gray-50 rounded-full"
          />
        </div>
        <Button className="w-full rounded-full md:w-auto">Buscar</Button>
      </div>
    </div>
  )
}

