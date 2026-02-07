import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOrderStatus } from '../../https';
import { useSnackbar } from 'notistack';
import { IoClose } from 'react-icons/io5';
import { useCurrency } from "../../hooks/useCurrency";

const PaymentModal = ({ order, onClose }) => {
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const { formatCurrency } = useCurrency();

    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [cashReceived, setCashReceived] = useState("");
    const [transferAmount, setTransferAmount] = useState("");
    const [transferPlatform, setTransferPlatform] = useState("");
    const [isMixedPayment, setIsMixedPayment] = useState(false);

    const totalToPay = order.bills?.totalWithTax || 0; 
    
    const grandTotal = totalToPay + (order.bills?.tip || 0);

    // Calculate change
    const change = paymentMethod === "Cash" && cashReceived 
      ? (parseFloat(cashReceived) - grandTotal).toFixed(2) 
      : (paymentMethod === "Online" && isMixedPayment && cashReceived && transferAmount)
      ? ((parseFloat(cashReceived) + parseFloat(transferAmount)) - grandTotal).toFixed(2)
      : "0.00";
  
    const totalPaid = (parseFloat(cashReceived) || 0) + (parseFloat(transferAmount) || 0);
    const remaining = (grandTotal - totalPaid).toFixed(2);
    const isPaid = totalPaid >= grandTotal - 0.01;

    const mutation = useMutation({
        mutationFn: updateOrderStatus,
        onSuccess: () => {
            queryClient.invalidateQueries(["orders"]);
            enqueueSnackbar("¡Orden completada y pagada!", { variant: "success" });
            onClose();
        },
        onError: (error) => {
            console.error(error);
            enqueueSnackbar("Error al completar el pago", { variant: "error" });
        }
    });

    const handlePayment = () => {
        // Validation
        if (paymentMethod === "Cash" && parseFloat(cashReceived) < grandTotal) {
            enqueueSnackbar("¡Dinero recibido insuficiente!", { variant: "warning" });
            return;
        }

        if (paymentMethod === "Online") {
            if (!transferPlatform) {
                enqueueSnackbar("¡Selecciona la plataforma!", { variant: "warning" });
                return;
            }
            if (isMixedPayment && !isPaid) {
                enqueueSnackbar(`¡Pago incompleto! Faltan $${remaining}`, { variant: "warning" });
                return;
            }
        }

        // Prepare Details
        let paymentDetails = {
            cashReceived: 0,
            change: 0,
            transferPlatform: "",
            transferAmount: 0
        };
    
        if (paymentMethod === "Cash") {
            paymentDetails = {
                cashReceived: parseFloat(cashReceived) || 0,
                change: parseFloat(change),
                transferPlatform: "",
                transferAmount: 0
            };
        } else if (paymentMethod === "Online") {
            if (isMixedPayment) {
                paymentDetails = {
                    cashReceived: parseFloat(cashReceived) || 0,
                    change: parseFloat(change) > 0 ? parseFloat(change) : 0,
                    transferPlatform: transferPlatform,
                    transferAmount: parseFloat(transferAmount) || 0
                };
            } else {
                 paymentDetails = {
                    cashReceived: 0,
                    change: 0,
                    transferPlatform: transferPlatform,
                    transferAmount: grandTotal
                };
            }
        }

        mutation.mutate({
            orderId: order._id,
            orderStatus: "Completed",
            paymentMethod,
            paymentDetails
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] p-6 rounded-lg w-[500px] border border-[#333] relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-[#ababab] hover:text-white">
                    <IoClose size={24} />
                </button>
                
                <h2 className="text-[#f5f5f5] text-xl font-bold mb-4">Completar Pago - Mesa {order.table?.tableNo}</h2>
                
                <div className="bg-[#262626] p-4 rounded mb-4">
                    <div className="flex justify-between text-[#ababab] mb-1">
                        <span>Subtotal + Impuesto</span>
                        <span>{formatCurrency(totalToPay)}</span>
                    </div>
                    {order.bills.tip > 0 && (
                        <div className="flex justify-between text-[#ababab] mb-1">
                            <span>Propina</span>
                            <span>{formatCurrency(order.bills.tip)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-[#f6b100] text-xl font-bold border-t border-[#333] pt-2 mt-2">
                        <span>Total a Pagar</span>
                        <span>{formatCurrency(grandTotal)}</span>
                    </div>
                </div>

                {/* Payment Method Selection */}
                <div className="flex gap-3 mb-4">
                    <button
                        onClick={() => setPaymentMethod("Cash")}
                        className={`flex-1 py-2 rounded font-semibold transition-colors ${paymentMethod === "Cash" ? "bg-[#f6b100] text-[#1f1f1f]" : "bg-[#333] text-[#ababab]"}`}
                    >
                        Efectivo
                    </button>
                    <button
                        onClick={() => setPaymentMethod("Online")}
                        className={`flex-1 py-2 rounded font-semibold transition-colors ${paymentMethod === "Online" ? "bg-[#f6b100] text-[#1f1f1f]" : "bg-[#333] text-[#ababab]"}`}
                    >
                        En Línea
                    </button>
                </div>

                {/* Cash Form */}
                {paymentMethod === "Cash" && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[#ababab] text-sm mb-1">Dinero Recibido</label>
                            <input
                                type="number"
                                value={cashReceived}
                                onChange={(e) => setCashReceived(e.target.value)}
                                className="w-full bg-[#333] text-white p-2 rounded focus:outline-none focus:ring-1 focus:ring-[#f6b100]"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="flex justify-between items-center bg-[#262626] p-3 rounded">
                            <span className="text-[#ababab]">Cambio</span>
                            <span className={`text-xl font-bold ${parseFloat(change) < 0 ? 'text-red-500' : 'text-[#f5f5f5]'}`}>
                                {formatCurrency(parseFloat(change))}
                            </span>
                        </div>
                    </div>
                )}

                {/* Online Form */}
                {paymentMethod === "Online" && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                checked={isMixedPayment} 
                                onChange={(e) => setIsMixedPayment(e.target.checked)} 
                                className="accent-[#f6b100]"
                            />
                            <label className="text-[#ababab] text-sm">Pago Mixto (Efectivo + Transferencia)</label>
                        </div>

                        <div>
                            <label className="block text-[#ababab] text-sm mb-1">Plataforma</label>
                            <select 
                                value={transferPlatform} 
                                onChange={(e) => setTransferPlatform(e.target.value)}
                                className="w-full bg-[#333] text-white p-2 rounded focus:outline-none focus:ring-1 focus:ring-[#f6b100]"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="Bancolombia">Bancolombia</option>
                                <option value="Nequi">Nequi</option>
                                <option value="Daviplata">Daviplata</option>
                                <option value="Movii">Movii</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>

                        {isMixedPayment && (
                            <>
                                <div>
                                    <label className="block text-[#ababab] text-sm mb-1">Monto Transferencia</label>
                                    <input
                                        type="number"
                                        value={transferAmount}
                                        onChange={(e) => setTransferAmount(e.target.value)}
                                        className="w-full bg-[#333] text-white p-2 rounded focus:outline-none focus:ring-1 focus:ring-[#f6b100]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[#ababab] text-sm mb-1">Efectivo</label>
                                    <input
                                        type="number"
                                        value={cashReceived}
                                        onChange={(e) => setCashReceived(e.target.value)}
                                        className="w-full bg-[#333] text-white p-2 rounded focus:outline-none focus:ring-1 focus:ring-[#f6b100]"
                                    />
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${parseFloat(change) < 0 ? 'text-red-500' : 'text-[#f5f5f5]'}`}>
                                        {parseFloat(change) >= 0 ? `Cambio: ${formatCurrency(parseFloat(change))}` : `Faltante: ${formatCurrency(parseFloat(remaining))}`}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <button
                    onClick={handlePayment}
                    className="w-full mt-6 bg-[#025cca] hover:bg-[#024bb5] text-white py-3 rounded font-bold transition-colors"
                >
                    Confirmar Pago y Cerrar Mesa
                </button>
            </div>
        </div>
    );
};

export default PaymentModal;
