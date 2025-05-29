import {
    CheckCircle2,
    Loader,
    XCircle,
    AlertCircle,
    HelpCircle,
    BadgeEuro,
} from "lucide-react";

export type TicketStatus =
    | "confirmed"
    | "pending"
    | "failed"
    | "reserved"
    | "available"
    | "unknown"
    | "refunded"
    | "cancelled";

export const statusLabels: Record<TicketStatus, string> = {
    confirmed: "Підтверджено",
    pending: "Обробляється",
    failed: "Помилка оплати",
    reserved: "Зарезервовано",
    available: "Доступний",
    unknown: "Невідомо",
    refunded: "Відшкодовано",
    cancelled: "Скасовано",
};

export const statusColors: Record<TicketStatus, string> = {
    confirmed: "text-green-600",
    pending: "text-indigo-500",
    failed: "text-red-600",
    reserved: "text-blue-600",
    available: "text-gray-500",
    unknown: "text-gray-800",
    refunded: "text-teal-600",
    cancelled: "text-gray-600",
};

export const statusIcons: Record<TicketStatus, JSX.Element> = {
    confirmed: <CheckCircle2 className="w-5 h-5 mr-1" />,
    pending: <Loader className="w-5 h-5 mr-1 animate-spin" />,
    failed: <XCircle className="w-5 h-5 mr-1" />,
    reserved: <AlertCircle className="w-5 h-5 mr-1" />,
    available: <CheckCircle2 className="w-5 h-5 mr-1" />,
    unknown: <HelpCircle className="w-5 h-5 mr-1" />,
    refunded: <BadgeEuro className="w-5 h-5 mr-1" />,
    cancelled: <XCircle className="w-5 h-5 mr-1" />,
};

export const StatusBadge = ({ status }: { status: TicketStatus }) => (
    <span className={`inline-flex items-center text-sm font-medium ${statusColors[status]}`}>
    {statusIcons[status]}
        {statusLabels[status]}
  </span>
);
