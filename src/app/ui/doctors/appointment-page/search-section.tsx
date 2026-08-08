import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/i18n/LocaleProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SearchSection() {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto xl:px-16 px-6 2xl:px-0 sm:px-16 py-4 lg:py-2">
      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="p-4 rounded-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <Select>
              <SelectTrigger className="w-full md:w-[200px] bg-white rounded-full border-blue-500 text-blue-500">
                <SelectValue placeholder={t("misc.pickLocation")} />
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
                placeholder={t("misc.searchByNamePlaceholder")}
                className="w-full bg-gray-50 rounded-full"
              />
            </div>
            <Button className="w-full rounded-full md:w-auto">{t("common.search")}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

