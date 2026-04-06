"use client";
import { Calendar } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  error?: string;
}

const toISO = (br: string) => {
  if (!br || !br.includes("/")) return br;
  const [d, m, y] = br.split("/");
  return `${y}-${m}-${d}`;
};

const toBR = (iso: string) => {
  if (!iso || !iso.includes("-")) return iso;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export const DatePicker = ({ value, onChange, error }: DatePickerProps) => {
  // Bloqueia datas passadas: mínimo = amanhã
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  // Máximo: 30 dias a partir de hoje
  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 30);
  const maxDate = maxDateObj.toISOString().split("T")[0];

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <Calendar size={16} className="text-blue-600" />
        Data de Entrega
      </label>
      <input
        type="date"
        value={toISO(value)}
        min={minDate}
        max={maxDate}
        onChange={(e) => onChange(toBR(e.target.value))}
        className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all ${error ? "border-red-400 bg-red-50" : "border-gray-200 dark:border-gray-600"}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Entregas disponíveis de amanhã até {toBR(maxDate)}
      </p>
    </div>
  );
};