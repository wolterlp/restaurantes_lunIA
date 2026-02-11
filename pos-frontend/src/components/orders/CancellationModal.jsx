import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOrderStatus, verifyAdmin } from '../../https';
import { getShortId } from '../../utils';
import { useSnackbar } from 'notistack';
import { IoClose } from 'react-icons/io5';

const CancellationModal = ({ order, role, onClose }) => {
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const [reason, setReason] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);

    const mutation = useMutation({
        mutationFn: updateOrderStatus,
        onSuccess: () => {
            queryClient.invalidateQueries(["orders"]);
            queryClient.invalidateQueries(["tables"]);
            enqueueSnackbar("¡Pedido anulado correctamente!", { variant: "success" });
            onClose();
        },
        onError: (error) => {
            console.error(error);
            enqueueSnackbar("Error al anular el pedido", { variant: "error" });
        }
    });

    const handleCancellation = async () => {
        if (!reason.trim()) {
            enqueueSnackbar("¡Debes ingresar un motivo para la anulación!", { variant: "warning" });
            return;
        }

        let adminId = null;

        if (role !== "Admin") {
            if (!adminEmail || !adminPassword) {
                enqueueSnackbar("¡Se requiere autorización de un administrador!", { variant: "warning" });
                return;
            }

            try {
                setIsVerifying(true);
                const response = await verifyAdmin({ email: adminEmail, password: adminPassword });
                adminId = response.data.adminId;
                setIsVerifying(false);
            } catch (error) {
                setIsVerifying(false);
                enqueueSnackbar(error.response?.data?.message || "Error de autorización", { variant: "error" });
                return;
            }
        }

        if (window.confirm("¿Estás seguro de que deseas anular este pedido? Esta acción no se puede deshacer.")) {
            const data = {
                orderId: order._id,
                orderStatus: "Cancelled",
                cancellationReason: reason
            };
            
            if (adminId) {
                data.cancelledBy = adminId;
            }

            mutation.mutate(data);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto border border-[#333] relative scrollbar-hide">
                <button onClick={onClose} className="absolute top-4 right-4 text-[#ababab] hover:text-white">
                    <IoClose size={24} />
                </button>
                
                <h2 className="text-[#f5f5f5] text-xl font-bold mb-4">Anular Pedido {getShortId(order._id)}</h2>
                <p className="text-gray-400 text-sm mb-4">
                    Estás a punto de anular el pedido de la mesa <strong>{order.table?.tableNo || "N/A"}</strong>.
                    Por favor, ingresa el motivo.
                </p>

                <div className="mb-4">
                    <label className="block text-gray-400 text-xs mb-1">Motivo (Obligatorio)</label>
                    <textarea
                        className="w-full bg-[#333] text-white p-3 rounded focus:outline-none focus:ring-1 focus:ring-red-500 h-24 resize-none"
                        placeholder="Ej: Cliente se retiró, Error en pedido..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    ></textarea>
                </div>

                {role !== "Admin" && (
                    <div className="mb-4 p-3 border border-[#444] rounded bg-[#252525]">
                        <h3 className="text-red-400 text-sm font-bold mb-2">Autorización de Administrador</h3>
                        <input
                            type="email"
                            placeholder="Email de Administrador"
                            className="w-full bg-[#333] text-white p-2 rounded mb-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            className="w-full bg-[#333] text-white p-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                        />
                    </div>
                )}

                <button
                    onClick={handleCancellation}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={mutation.isPending || isVerifying}
                >
                    {isVerifying ? "Verificando..." : mutation.isPending ? "Anulando..." : "Confirmar Anulación"}
                </button>
            </div>
        </div>
    );
};

export default CancellationModal;
