import {
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
} from "@heroui/react";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/authContext.tsx";
import { toast } from "sonner";
import {StatusBadge, statusLabels, TicketStatus} from "@/features/tickets/components/StatusBadge";

interface TicketResponse {
    data: {
        id: number;
        price: number;
        status: TicketStatus;
        seat: {
            seat_number: string;
        };
    }
}

interface EditTicketModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    sessionId: number;
    seatId: number;
    refetch: () => void;
}

const EditTicketModal: React.FC<EditTicketModalProps> = ({
                                                             isOpen,
                                                             onOpenChange,
                                                             sessionId,
                                                             seatId,
                                                             refetch,
                                                         }) => {
    const { fetchWithAuth } = useAuth()

    const [ticketId, setTicketId] = useState<number | null>(null);
    const [seatNumber, setSeatNumber] = useState<string>("");
    const [price, setPrice] = useState<number>(0);
    const [status, setStatus] = useState<TicketStatus>("available");
    const [originalStatus, setOriginalStatus] = useState<TicketStatus>("available");
    const [loading, setLoading] = useState(false);

    const {
        isOpen: isDeleteModalOpen,
        onOpen: openDeleteModal,
        onOpenChange: onDeleteModalChange,
    } = useDisclosure();

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                const { data } = await fetchWithAuth<TicketResponse>(
                    `/tickets/session/${sessionId}/seat/${seatId}`,
                    { method: "GET" }
                );
                setTicketId(data.id);
                setSeatNumber(data.seat.seat_number);
                setPrice(data.price);
                setStatus(data.status);
                setOriginalStatus(data.status);
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

        if (
            (status === "available" || status === "cancelled" || status === "refunded") &&
            originalStatus !== "available"
        ) {
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
                            <p className="flex items-center text-sm font-medium">
                                <StatusBadge status={status} />
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
                                    onChange={(e) => setStatus(e.target.value as TicketStatus)}
                                >
                                    {(Object.entries(statusLabels) as [TicketStatus, string][]).map(([key, label]) => (
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
                        Ви хочете змінити статус на{" "}
                        <span className="font-bold">"{statusLabels[status]}"</span>? Квиток буде{" "}
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
