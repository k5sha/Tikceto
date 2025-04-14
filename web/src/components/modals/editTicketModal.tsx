import {
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
} from "@heroui/react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/authContext.tsx";
import {
    AlertCircle,
    CheckCircle2,
    XCircle,
    Loader,
    BadgeEuro,
    HelpCircle,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";

interface EditTicketModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    sessionId: number;
    seatId: number;
    refetch: () => void;
}

const statusLabels: { [key: string]: string } = {
    confirmed: "Підтверджено",
    pending: "Обробляється",
    failed: "Помилка оплати",
    reserved: "Зарезервовано",
    available: "Доступний",
    unknown: "Невідомо",
    refunded: "Відшкодовано",
    cancelled: "Скасовано",
};

const statusColors: { [key: string]: string } = {
    confirmed: "text-green-600",
    pending: "text-indigo-500",
    failed: "text-red-600",
    reserved: "text-blue-600",
    available: "text-gray-500",
    unknown: "text-gray-800",
    refunded: "text-teal-600",
    cancelled: "text-gray-600",
};

const statusIcons: { [key: string]: JSX.Element } = {
    confirmed: <CheckCircle2 className="w-5 h-5 mr-1" />,
    pending: <Loader className="w-5 h-5 mr-1 animate-spin" />,
    failed: <XCircle className="w-5 h-5 mr-1" />,
    reserved: <AlertCircle className="w-5 h-5 mr-1" />,
    available: <CheckCircle2 className="w-5 h-5 mr-1" />,
    unknown: <HelpCircle className="w-5 h-5 mr-1" />,
    refunded: <BadgeEuro className="w-5 h-5 mr-1" />,
    cancelled: <XCircle className="w-5 h-5 mr-1" />,
};

const EditTicketModal: React.FC<EditTicketModalProps> = ({
                                                             isOpen,
                                                             onOpenChange,
                                                             sessionId,
                                                             seatId,
                                                             refetch,
                                                         }) => {
    const { fetchWithAuth } = useAuth();

    const [ticketId, setTicketId] = useState<number | null>(null);
    const [seatNumber, setSeatNumber] = useState<string>("");
    const [price, setPrice] = useState<number>(0);
    const [status, setStatus] = useState<string>("available");
    const [originalStatus, setOriginalStatus] = useState<string>("available");
    const [loading, setLoading] = useState(false);

    const {
        isOpen: isDeleteModalOpen,
        onOpen: openDeleteModal,
        onOpenChange: onDeleteModalChange,
    } = useDisclosure();

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                const res = await fetchWithAuth(`/tickets/session/${sessionId}/seat/${seatId}`, {
                    method: "GET",
                });
                // @ts-ignore
                const ticket = res.data;
                setTicketId(ticket.id);
                setSeatNumber(ticket.seat.seat_number);
                setPrice(ticket.price);
                setStatus(ticket.status);
                setOriginalStatus(ticket.status);
            } catch (err) {
                toast.error("Не вдалося завантажити дані квитка.");
            }
        };

        if (sessionId && seatId && isOpen) {
            fetchTicket();
        }
    }, [sessionId, seatId, fetchWithAuth, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticketId || loading) return;

        if ((status === "available" || status === "cancelled" || status == "refunded") && originalStatus !== "available") {
            openDeleteModal();
            return;
        }

        await updateTicket();
    };

    const updateTicket = async () => {
        if (!ticketId) return;

        setLoading(true);

        try {
            await fetchWithAuth(`/tickets/${ticketId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ price, status }),
            });

            toast.success("Квиток успішно оновлений!");
            refetch();
            onOpenChange(false);
        } catch (err) {
            toast.error("Помилка при оновленні квитка.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!ticketId) return;

        setLoading(true);

        try {
            await fetchWithAuth(`/tickets/${ticketId}`, {
                method: "DELETE",
            });

            toast.success("Квиток видалено, місце стало доступним.");
            refetch();
            onDeleteModalChange();
            onOpenChange(false);
        } catch (err) {
            toast.error("Не вдалося видалити квиток.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent className="rounded-xl bg-white shadow-xl">
                    <ModalHeader className="text-center text-xl font-semibold text-blue-700">
                        Редагування квитка
                    </ModalHeader>
                    <ModalBody>
                        <div className="mb-4 bg-gray-50 p-3 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-700">
                                <span className="font-semibold">Місце:</span> {seatNumber}
                            </p>
                            <p className={clsx("flex items-center text-sm font-medium", statusColors[status])}>
                                {statusIcons[status]} {statusLabels[status]}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Ціна</label>
                                <input
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600">Статус</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    {Object.entries(statusLabels).map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <ModalFooter className="flex justify-end gap-3 pt-4">
                                <Button variant="light" onPress={() => onOpenChange(false)}>
                                    Скасувати
                                </Button>
                                <Button color="primary" type="submit" isLoading={loading}>
                                    Зберегти
                                </Button>
                            </ModalFooter>
                        </form>
                    </ModalBody>
                </ModalContent>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onOpenChange={onDeleteModalChange}>
                <ModalContent className="bg-white rounded-xl shadow-lg">
                    <ModalHeader className="text-lg font-semibold text-red-600">
                        Підтвердження видалення
                    </ModalHeader>
                    <ModalBody className="text-sm inline-block text-gray-700">
                        Ви хочете змінити статус на <span className="font-bold">"{statusLabels[status]}"</span>? Квиток буде{" "}
                        <span className="font-bold">видалено</span>, і місце стане вільним.
                    </ModalBody>
                    <ModalFooter className="flex justify-end gap-3">
                        <Button variant="light" onPress={() => onDeleteModalChange()}>
                            Скасувати
                        </Button>
                        <Button color="danger" isLoading={loading} onPress={handleConfirmDelete}>
                            Так, видалити
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default EditTicketModal;
