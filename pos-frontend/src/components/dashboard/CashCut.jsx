import React, { useState } from 'react';
import { FaCut, FaUsers, FaMoneyBillWave } from 'react-icons/fa';
import { MdArrowDownward, MdArrowUpward, MdReceipt, MdPercent, MdStore, MdCalendarToday } from 'react-icons/md';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCashierCutPreview, getDailyCutPreview, createCashCut, addCashMovement } from '../../https';
import CashierSelectionModal from './CashierSelectionModal';
import { enqueueSnackbar } from 'notistack';
import { useCurrency } from '../../hooks/useCurrency';

const CashCut = () => {
    const queryClient = useQueryClient();
    const { formatCurrency } = useCurrency();
    const [selectedCashier, setSelectedCashier] = useState(null);
    const [showCashierModal, setShowCashierModal] = useState(false);
    const [cutType, setCutType] = useState("Daily");
    const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
    const [displayDate, setDisplayDate] = useState(() => {
        const iso = new Date().toISOString().split('T')[0];
        const parts = iso.split("-");
        if (parts.length !== 3) return iso;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    });
    const [declaredCash, setDeclaredCash] = useState("");
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [movementType, setMovementType] = useState("Entry"); // Entry or Exit

    // Fetch Preview Data
    const { data: previewData, isLoading, refetch } = useQuery({
        queryKey: ["cutPreview", cutType, selectedCashier?._id, viewDate],
        queryFn: () => {
            if (cutType === "Cashier" && selectedCashier) {
                return getCashierCutPreview(selectedCashier._id);
            } else {
                return getDailyCutPreview({ date: viewDate });
            }
        },
        enabled: (cutType === "Daily") || (cutType === "Cashier" && !!selectedCashier),
        refetchInterval: 60000
    });

    const metrics = previewData?.data?.data?.metrics || {
        cashFund: 0,
        cashSales: 0,
        creditCardSales: 0,
        transferSales: 0,
        otherSales: 0,
        creditSales: 0,
        voucherSales: 0,
        totalEntries: 0,
        totalExits: 0,
        cashRefunds: 0,
        calculatedTotalCash: 0,
        totalSales: 0,
        totalTax: 0
    };

    // const formatCurrency = (amount) => {
    //     return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount || 0);
    // };

    const handleCashierSelect = (cashier) => {
        setSelectedCashier(cashier);
        setCutType("Cashier");
        setShowCashierModal(false);
    };

    const performCutMutation = useMutation({
        mutationFn: createCashCut,
        onSuccess: () => {
            enqueueSnackbar("Corte realizado exitosamente", { variant: "success" });
            refetch();
        },
        onError: (err) => {
            enqueueSnackbar(err.response?.data?.message || "Error al realizar corte", { variant: "error" });
        }
    });

    const handlePerformCut = () => {
        if (!declaredCash) {
            enqueueSnackbar("Ingrese el efectivo en caja real", { variant: "warning" });
            return;
        }

        performCutMutation.mutate({
            type: cutType,
            cashierId: selectedCashier?._id,
            metrics: metrics,
            range: previewData?.data?.data?.range,
            declaredTotalCash: parseFloat(declaredCash)
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const parseDisplayDateToIso = (value) => {
        if (!value) return "";
        const cleaned = value.replace(/\s+/g, "");
        const parts = cleaned.split("/");
        if (parts.length !== 3) return "";
        let [day, month, year] = parts;
        if (!day || !month || !year) return "";
        if (year.length === 2) year = `20${year}`;
        const iso = `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        if (isNaN(new Date(iso).getTime())) return "";
        return iso;
    };

    // Print header component
    const PrintHeader = () => (
        <div className="hidden print:block print:mb-6 print:text-black">
            <div className="flex items-center justify-between border-b border-gray-300 pb-4 mb-4">
                <div className="flex items-center gap-4">
                    <img 
                        src="http://localhost:3000/uploads/1770742061679-176177146.svg" 
                        alt="Restaurant Logo" 
                        className="h-12 w-auto object-contain"
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                    <div>
                        <h1 className="text-xl font-bold">Mi Restaurante</h1>
                        <p className="text-sm text-gray-600">Reporte de Corte de Caja</p>
                        <p className="text-xs text-gray-500">
                            {cutType === "Cashier" ? `Corte de: ${selectedCashier?.name || 'Cajero'}` : "Corte General del Día"}
                        </p>
                        <p className="text-xs text-gray-500">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
                <div className="text-right">
                    <img 
                        src="/src/assets/images/branding/logolunia.png" 
                        alt="LunIA" 
                        className="h-8 w-auto object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Powered by LunIA</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto p-6 text-[#f5f5f5]">
            {/* Print Styles */}
            <style jsx>{`
                @media print {
                    @page {
                        margin: 1cm;
                        size: A4;
                    }
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    .print\:hidden {
                        display: none !important;
                    }
                    .print\:block {
                        display: block !important;
                    }
                    .print\:text-black {
                        color: black !important;
                    }
                    .print\:p-4 {
                        padding: 1rem !important;
                    }
                    .print\:mb-6 {
                        margin-bottom: 1.5rem !important;
                    }
                }
            `}</style>
            
            {/* Print Header - Only visible when printing */}
            <PrintHeader />
            
            {/* Hide main content when printing */}
            <div className="print:hidden">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
                <button 
                    onClick={() => setShowCashierModal(true)}
                    className="flex items-center gap-2 bg-[#333] text-[#f5f5f5] px-6 py-2 rounded shadow hover:bg-[#444] transition-colors font-medium"
                >
                    <FaCut className="text-[#025cca]" />
                    Hacer corte de cajero
                </button>
                <button 
                    onClick={() => { setCutType("Daily"); setSelectedCashier(null); }}
                    className={`flex items-center gap-2 px-6 py-2 rounded shadow transition-colors font-medium ${cutType === "Daily" ? "bg-[#ecab0f] text-black" : "bg-[#333] text-[#f5f5f5] hover:bg-[#444]"}`}
                >
                    <FaCut className={cutType === "Daily" ? "text-black" : "text-[#be3e3f]"} />
                    Ver corte del día
                </button>
                 
                 {/* Movement Buttons */}
                <button 
                    onClick={() => { setMovementType("Entry"); setShowMovementModal(true); }}
                    className="flex items-center gap-2 bg-[#333] text-[#f5f5f5] px-6 py-2 rounded shadow hover:bg-[#444] transition-colors font-medium ml-auto"
                >
                    <MdArrowUpward className="text-green-500" />
                    Entrada Efectivo
                </button>
                <button 
                    onClick={() => { setMovementType("Exit"); setShowMovementModal(true); }}
                    className="flex items-center gap-2 bg-[#333] text-[#f5f5f5] px-6 py-2 rounded shadow hover:bg-[#444] transition-colors font-medium"
                >
                    <MdArrowDownward className="text-red-500" />
                    Salida Efectivo
                </button>
            </div>

            {/* Context Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">
                        {cutType === "Cashier" ? `Corte de: ${selectedCashier?.name || 'Seleccione Cajero'}` : "Corte General del Día"}
                    </h2>
                    <p className="text-[#ababab] text-sm">
                        {cutType === "Cashier" ? "Ventas realizadas por este cajero" : "Todas las ventas del día"}
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-[#1a1a1a] p-2 rounded border border-[#333]">
                    <MdCalendarToday className="text-[#ecab0f]" />
                    <input 
                        type="text"
                        placeholder="dd/mm/aaaa"
                        value={displayDate}
                        onChange={(e) => {
                            const value = e.target.value;
                            setDisplayDate(value);
                            const iso = parseDisplayDateToIso(value);
                            if (iso) {
                                setViewDate(iso);
                            }
                        }}
                        className="bg-transparent text-white outline-none"
                    />
                </div>
            </div>

            {/* Main Data Grid */}
            <div className="bg-[#1a1a1a] text-[#f5f5f5] rounded-lg shadow-lg p-6 mb-8 border border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                    {/* Divider */}
                    <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px bg-[#333] transform -translate-x-1/2"></div>

                    {/* Left Column: Cash Flow */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-[#ecab0f] mb-4 border-b border-[#333] pb-2">Flujo de Efectivo</h3>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-[#ababab]">Fondo de caja (Base)</span>
                            <span className="font-medium">{formatCurrency(metrics.cashFund)}</span>
                        </div>
                        <div className="flex justify-between items-center text-green-400">
                            <span>Ventas en Efectivo</span>
                            <span>+ {formatCurrency(metrics.cashSales)}</span>
                        </div>
                        <div className="flex justify-between items-center text-green-400">
                            <span>Entradas de Efectivo</span>
                            <span>+ {formatCurrency(metrics.totalEntries)}</span>
                        </div>
                        <div className="flex justify-between items-center text-red-400">
                            <span>Salidas de Efectivo</span>
                            <span>- {formatCurrency(metrics.totalExits)}</span>
                        </div>
                        <div className="flex justify-between items-center text-red-400">
                            <span>Devoluciones en Efectivo</span>
                            <span>- {formatCurrency(metrics.cashRefunds)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 mt-4 border-t border-[#333] font-bold text-xl">
                            <span>Total Efectivo Esperado</span>
                            <span className="text-[#ecab0f]">{formatCurrency(metrics.calculatedTotalCash)}</span>
                        </div>
                    </div>

                    {/* Right Column: Sales Breakdown */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-[#ecab0f] mb-4 border-b border-[#333] pb-2">Desglose de Ventas</h3>
                        
                        <div className="flex justify-between items-center text-green-400">
                            <span>Efectivo</span>
                            <span>{formatCurrency(metrics.cashSales)}</span>
                        </div>
                        
                        {/* Combined Payment Methods Section */}
                        <div className="bg-[#262626] p-3 rounded border border-[#333]">
                            <h4 className="text-sm font-semibold text-[#ecab0f] mb-2">Métodos de Pago</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-blue-400">
                                    <span>Tarjeta de Crédito/Débito</span>
                                    <span>{formatCurrency(metrics.creditCardSales)}</span>
                                </div>
                                <div className="flex justify-between items-center text-purple-400">
                                    <span>Transferencias</span>
                                    <span>{formatCurrency(metrics.transferSales)}</span>
                                </div>
                                <div className="flex justify-between items-center text-yellow-400">
                                    <span>Vales de Despensa</span>
                                    <span>{formatCurrency(metrics.voucherSales)}</span>
                                </div>
                                <div className="flex justify-between items-center text-orange-400">
                                    <span>A Crédito (Por Cobrar)</span>
                                    <span>{formatCurrency(metrics.creditSales)}</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-400">
                                    <span>Otros Métodos</span>
                                    <span>{formatCurrency(metrics.otherSales)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 mt-4 border-t border-[#333] font-bold text-lg">
                            <span>Ventas Totales Brutas</span>
                            <span>{formatCurrency(metrics.totalSales)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-[#ababab]">
                            <span>Impuestos Incluidos</span>
                            <span>{formatCurrency(metrics.totalTax)}</span>
                        </div>

                        <div className="mt-6 pt-4 border-t border-[#333]">
                             <label className="block text-sm text-[#ababab] mb-2">Efectivo Real en Caja (Declarado)</label>
                             <div className="flex gap-4">
                                <input 
                                    type="number" 
                                    value={declaredCash}
                                    onChange={(e) => setDeclaredCash(e.target.value)}
                                    placeholder="0.00"
                                    className="bg-[#262626] text-white p-3 rounded flex-1 outline-none border border-[#333] focus:border-[#ecab0f]"
                                />
                                <button 
                                    onClick={handlePerformCut}
                                    className="bg-[#ecab0f] text-black font-bold px-6 rounded hover:bg-[#d49a0e] transition-colors"
                                >
                                    Realizar Corte
                                </button>
                             </div>
                             {declaredCash && (
                                 <div className={`mt-2 text-sm font-bold ${parseFloat(declaredCash) - metrics.calculatedTotalCash >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                     Diferencia: {formatCurrency(parseFloat(declaredCash) - metrics.calculatedTotalCash)}
                                 </div>
                             )}
                         </div>
                    </div>
                </div>
            </div>

            {/* Print Button */}
            <div className="flex justify-end mb-8 print:hidden">
                 <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-[#f5f5f5] text-black px-6 py-2 rounded shadow hover:bg-gray-200 transition-colors font-bold"
                >
                    <MdReceipt /> Imprimir Reporte
                </button>
            </div>
            </div>

            {/* Print-only content */}
            <div className="hidden print:block print:text-black print:p-4">
                <div className="bg-white text-black">
                    {/* Print Header is already included above */}
                    
                    {/* Print version of the main content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold border-b border-gray-300 pb-2">Flujo de Efectivo</h3>
                            <div className="flex justify-between items-center">
                                <span>Fondo de caja (Base)</span>
                                <span className="font-medium">{formatCurrency(metrics.cashFund)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Ventas en Efectivo</span>
                                <span>+ {formatCurrency(metrics.cashSales)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Entradas de Efectivo</span>
                                <span>+ {formatCurrency(metrics.totalEntries)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Salidas de Efectivo</span>
                                <span>- {formatCurrency(metrics.totalExits)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Devoluciones en Efectivo</span>
                                <span>- {formatCurrency(metrics.cashRefunds)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-300 font-bold">
                                <span>Total Efectivo Esperado</span>
                                <span>{formatCurrency(metrics.calculatedTotalCash)}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold border-b border-gray-300 pb-2">Desglose de Ventas</h3>
                            <div className="flex justify-between items-center">
                                <span>Efectivo</span>
                                <span>{formatCurrency(metrics.cashSales)}</span>
                            </div>
                            <div className="bg-gray-100 p-3 rounded">
                                <h4 className="text-sm font-semibold mb-2">Métodos de Pago</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span>Tarjeta de Crédito/Débito</span>
                                        <span>{formatCurrency(metrics.creditCardSales)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Transferencias</span>
                                        <span>{formatCurrency(metrics.transferSales)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Vales de Despensa</span>
                                        <span>{formatCurrency(metrics.voucherSales)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>A Crédito (Por Cobrar)</span>
                                        <span>{formatCurrency(metrics.creditSales)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Otros Métodos</span>
                                        <span>{formatCurrency(metrics.otherSales)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-300 font-bold">
                                <span>Ventas Totales Brutas</span>
                                <span>{formatCurrency(metrics.totalSales)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>Impuestos Incluidos</span>
                                <span>{formatCurrency(metrics.totalTax)}</span>
                            </div>
                        </div>
                    </div>

                    {declaredCash && (
                        <div className="mt-4 p-4 bg-gray-100 rounded">
                            <h4 className="font-semibold mb-2">Declaración de Efectivo</h4>
                            <div className="flex justify-between items-center">
                                <span>Efectivo Declarado:</span>
                                <span>{formatCurrency(parseFloat(declaredCash))}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Diferencia:</span>
                                <span className={parseFloat(declaredCash) - metrics.calculatedTotalCash >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {formatCurrency(parseFloat(declaredCash) - metrics.calculatedTotalCash)}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="text-xs text-gray-500 mt-6 text-center">
                        Generado por LunIA - Sistema de Punto de Venta
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showCashierModal && (
                <CashierSelectionModal 
                    onClose={() => setShowCashierModal(false)}
                    onSelect={handleCashierSelect}
                />
            )}
            {showMovementModal && (
                <CashMovementModal 
                    type={movementType}
                    onClose={() => setShowMovementModal(false)}
                    onSuccess={() => {
                        setShowMovementModal(false);
                        refetch();
                    }}
                />
            )}
        </div>
    );
};

const CashMovementModal = ({ type, onClose, onSuccess }) => {
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    
    const mutation = useMutation({
        mutationFn: addCashMovement,
        onSuccess: () => {
            enqueueSnackbar(`${type === "Entry" ? "Entrada" : "Salida"} registrada`, { variant: "success" });
            onSuccess();
        },
        onError: () => enqueueSnackbar("Error al registrar movimiento", { variant: "error" })
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({
            type,
            amount: parseFloat(amount),
            description
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#1f1f1f] p-6 rounded-lg w-full max-w-sm border border-[#333]">
                <h3 className={`text-xl font-bold mb-4 ${type === "Entry" ? "text-green-500" : "text-red-500"}`}>
                    {type === "Entry" ? "Registrar Entrada" : "Registrar Salida"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[#ababab] mb-1">Monto</label>
                        <input 
                            type="number" required 
                            value={amount} onChange={e => setAmount(e.target.value)}
                            className="w-full bg-[#262626] text-white p-2 rounded outline-none border border-[#333] focus:border-[#ecab0f]"
                        />
                    </div>
                    <div>
                        <label className="block text-[#ababab] mb-1">Descripción / Motivo</label>
                        <textarea 
                            required 
                            value={description} onChange={e => setDescription(e.target.value)}
                            className="w-full bg-[#262626] text-white p-2 rounded outline-none border border-[#333] focus:border-[#ecab0f]"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-[#ababab] hover:text-white">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-[#ecab0f] text-black font-bold rounded">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CashCut;
