import React, { useState } from "react";
import { FaCheckDouble, FaLongArrowAltRight, FaCheckCircle, FaMotorcycle, FaHome, FaPlay, FaUtensils, FaConciergeBell, FaPrint, FaBan } from "react-icons/fa";
import { FaCircle } from "react-icons/fa";
import { formatDateAndTime, getAvatarName, getShortId } from "../../utils/index";
import { useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrderStatus, updateItemStatus, serveAllReadyItems } from "../../https";
import { useSnackbar } from "notistack";
import Timer from "../shared/Timer";
import PaymentModal from "./PaymentModal";
import ReassignTableModal from "./ReassignTableModal";
import CancellationModal from "./CancellationModal";
import Invoice from "../invoice/Invoice";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "../../hooks/useCurrency";
import { useTheme } from "../../context/ThemeContext";
import { useEffect } from "react";

const OrderCard = ({ order, id }) => {
  const { role } = useSelector((state) => state.user);
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceIsCopy, setInvoiceIsCopy] = useState(false);
  const { formatCurrency } = useCurrency();
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    const calculateTime = () => {
        const now = new Date();
        const start = new Date(order.orderDate);
        const diff = (now - start) / 1000 / 60; // minutes
        setElapsedMinutes(diff);
    };
    calculateTime();
    const interval = setInterval(calculateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [order.orderDate]);

  const getBorderColor = () => {
      if (role !== "Kitchen" && role !== "Admin") return "border-[#333]";
      if (order.orderStatus === "Completed" || order.orderStatus === "Delivered") return "border-[#333]";

      const thresholds = theme?.customization?.orderTimeThresholds || { green: 15, orange: 30, red: 45 };
      
      if (elapsedMinutes >= thresholds.red) return "border-red-600 border-2";
      if (elapsedMinutes >= thresholds.orange) return "border-orange-500 border-2";
      if (elapsedMinutes < thresholds.green) return "border-green-600 border-2";
      
      return "border-[#333]"; // Gap between green and orange
  };

  const updateStatusMutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries(["orders"]);
      enqueueSnackbar("Estado del pedido actualizado", { variant: "success" });
    },
    onError: () => {
      enqueueSnackbar("Error al actualizar el estado", { variant: "error" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: updateItemStatus,
    onSuccess: () => {
      queryClient.invalidateQueries(["orders"]);
      // enqueueSnackbar("Estado del ítem actualizado", { variant: "success" });
    },
    onError: () => {
      enqueueSnackbar("Error al actualizar ítem", { variant: "error" });
    }
  });

  const serveAllMutation = useMutation({
    mutationFn: serveAllReadyItems,
    onSuccess: (data) => {
        queryClient.invalidateQueries(["orders"]);
        if (data.data.updatedCount > 0) {
            enqueueSnackbar(`¡${data.data.updatedCount} platos marcados como servidos!`, { variant: "success" });
        } else {
            enqueueSnackbar("No hay platos listos para servir", { variant: "info" });
        }
    },
    onError: () => {
        enqueueSnackbar("Error al servir todos los platos", { variant: "error" });
    }
  });

  const handleStatusChange = (newStatus) => {
    updateStatusMutation.mutate({ orderId: order._id, orderStatus: newStatus });
  };

  const handleItemStatus = (itemId, status) => {
    updateItemMutation.mutate({ orderId: order._id, itemId, status });
  };
  
  const hasReadyItems = order.items?.some(i => i.status === "Ready");
  const allServed = (order.items?.length || 0) > 0 && order.items.every(i => i.status === "Served");
  const pm = String(order.paymentMethod || "").trim().toLowerCase();
  const isPaymentPending = !pm || pm === "pending" || pm === "pendiente" || pm === "sin pago" || pm === "sinpago";

  return (
    <div id={id} className={`w-full bg-[#262626] p-3 md:p-4 rounded-lg mb-3 md:mb-4 shadow-lg relative ${getBorderColor() === "border-[#333]" ? "border border-[#333]" : getBorderColor()}`}>
      <div className="flex items-center gap-3 md:gap-5">
        <button className="bg-[#f6b100] p-2 md:p-3 text-lg md:text-xl font-bold rounded-lg text-[#1f1f1f]">
          {getAvatarName(order.customerDetails?.name || "C")}
        </button>
        <div className="flex items-center justify-between w-[100%]">
          <div className="flex flex-col items-start gap-1">
            <h1 className="text-[#f5f5f5] text-base md:text-lg font-semibold tracking-wide">
              {order.customerDetails?.name || "Cliente"}
            </h1>
            <div className="flex items-center gap-2">
               <span className="text-[#ababab] text-xs md:text-sm font-mono bg-[#333] px-1 rounded">{getShortId(order._id)}</span>
               {order.orderType === "Delivery" ? (
                 <span className="text-orange-500 text-[10px] md:text-xs font-bold uppercase bg-[#4a3b2e] px-2 py-0.5 rounded">Domicilio</span>
               ) : (
                 !order.table && <span className="text-[#ababab] text-[10px] md:text-xs font-bold uppercase bg-[#333] px-2 py-0.5 rounded">Para llevar</span>
               )}
            </div>
            {order.orderType === "Delivery" && order.deliveryAddress && (
              <p className="text-[#ababab] text-xs md:text-sm italic line-clamp-1 max-w-[200px]" title={order.deliveryAddress}>
                {order.deliveryAddress}
              </p>
            )}
            {order.table && <p className="text-[#ababab] text-xs md:text-sm">Mesa <FaLongArrowAltRight className="text-[#ababab] ml-2 inline" /> {order.table.tableNo}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            {role === "Waiter" && hasReadyItems && order.orderStatus !== "Completed" && order.orderStatus !== "Delivered" ? (
                <div title="Pendientes de entrega" className="text-pink-500 bg-[#4a2e3b] p-2 rounded-lg animate-pulse">
                  <FaConciergeBell size={18} />
                </div>
            ) : order.orderStatus === "Ready" ? (
                <div title="Listo" className="text-green-500 bg-[#2e4a40] p-2 rounded-lg">
                  <FaCheckDouble size={18} />
                </div>
            ) : order.orderStatus === "Completed" ? (
                <div title="Completado" className="text-blue-500 bg-[#2e3b4a] p-2 rounded-lg">
                  <FaCheckCircle size={18} />
                </div>
            ) : order.orderStatus === "Out for Delivery" ? (
                <div title="En Camino" className="text-orange-500 bg-[#4a3b2e] p-2 rounded-lg">
                  <FaMotorcycle size={18} />
                </div>
            ) : order.orderStatus === "Delivered" ? (
                <div title="Entregado" className="text-purple-500 bg-[#3b2e4a] p-2 rounded-lg">
                  <FaHome size={18} />
                </div>
            ) : order.orderStatus === "Cancelled" ? (
                <div title="Anulado" className="text-red-500 bg-[#3a1c1c] p-2 rounded-lg">
                  <FaBan size={18} />
                </div>
            ) : (
                <div title={order.orderStatus === "In Progress" ? "En Progreso" : "Pendiente"} className="text-yellow-500 bg-[#4a452e] p-2 rounded-lg">
                  <FaCircle size={18} />
                </div>
            )}
            {role === "Waiter" && allServed && order.orderStatus !== "Completed" && (
              <span className="text-green-300 bg-[#2e4a40] px-2 py-1 rounded text-[10px] font-bold uppercase">
                Todo servido
              </span>
            )}
            {(role === "Cashier" || role === "Admin") && isPaymentPending && order.orderStatus !== "Cancelled" && (
              <span className="text-red-300 bg-[#3a1c1c] px-2 py-1 rounded text-[10px] font-bold uppercase">
                Pago Pendiente
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Kitchen & Cashier/Waiter/Admin View: Item List with Timers */}
      {(role === "Admin" || role === "Kitchen" || role === "Waiter" || role === "Cashier") && order.orderStatus !== "Completed" && (
          <div className="mt-4 bg-[#1f1f1f] rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[#ababab] text-xs font-bold uppercase">Platos / Productos</h3>
                  {(role === "Waiter" || role === "Admin" || role === "Cashier") && hasReadyItems && (
                      <button 
                          onClick={() => serveAllMutation.mutate(order._id)}
                          disabled={serveAllMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider animate-pulse flex items-center gap-1"
                      >
                          <FaConciergeBell /> Servir Todo
                      </button>
                  )}
              </div>
              <div className="space-y-2">
                  {(role === "Kitchen" ? order.items?.filter(i => i.status !== "Served" && i.requiresPreparation !== false) : order.items)?.map((item) => (
                    <div key={item._id} className="flex items-center justify-between bg-[#262626] p-2 rounded border border-[#333]">
                      <div className="flex flex-col">
                        <span className="text-[#f5f5f5] font-semibold text-sm">
                          {item.quantity}x {item.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            item.status === "Pending" ? "bg-red-900 text-red-300" :
                            item.status === "In Progress" ? "bg-yellow-900 text-yellow-300" :
                            item.status === "Ready" ? "bg-green-900 text-green-300" :
                            "bg-blue-900 text-blue-300"
                          }`}>
                            {item.status === "Pending" ? "Pendiente" : 
                             item.status === "In Progress" ? "Preparando" : 
                             item.status === "Ready" ? "Listo para servir" : "Servido"}
                          </span>
                          {item.status !== "Ready" && item.status !== "Served" && (
                            <Timer startTime={item.createdAt || order.createdAt || order.orderDate} />
                          )}
                        </div>
                        <div className="mt-1 text-[11px] text-[#ababab] flex items-center gap-3">
                          {role !== "Kitchen" && (
                            <>
                              <span>Unit: {formatCurrency(item.pricePerQuantity || 0)}</span>
                              <span>Total: {formatCurrency(item.price || 0)}</span>
                            </>
                          )}
                          {(role === "Kitchen" || role === "Admin") && (
                            <span className="px-2 py-0.5 rounded bg-[#333] text-[#ababab]">Preparación</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {(role === "Admin" || role === "Kitchen") && (item.status === "Pending" || item.status === "In Progress") && (
                          <button 
                            onClick={() => handleItemStatus(item._id, "Ready")}
                            className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-full"
                            title="Marcar Listo"
                          >
                            <FaUtensils size={12} />
                          </button>
                        )}
                        {(role === "Admin" || role === "Waiter" || role === "Cashier") && item.status === "Ready" && (
                          <button 
                            onClick={() => handleItemStatus(item._id, "Served")}
                            className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full animate-pulse"
                            title="Marcar como Servido"
                          >
                            <FaConciergeBell size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
          </div>
      )}

      {order.orderStatus === "Completed" && (
        <div className="mt-4 bg-[#1f1f1f] rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[#ababab] text-xs font-bold uppercase">Resumen del Pedido</h3>
            <span className="text-blue-400 text-[10px] font-bold uppercase">Completado</span>
          </div>
          <div className="space-y-2">
            {order.items?.map((item) => (
              <div key={item._id} className="flex items-center justify-between bg-[#262626] p-2 rounded border border-[#333]">
                <div className="flex flex-col">
                  <span className="text-[#f5f5f5] font-semibold text-sm">
                    {item.quantity}x {item.name}
                  </span>
                </div>
                <span className="text-[#f6b100] text-sm font-bold">
                  {formatCurrency(item.price)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3">
            <h4 className="text-[#f5f5f5] text-sm font-semibold">Total</h4>
            <p className="text-[#f6b100] text-md font-bold">{formatCurrency((order.bills?.totalWithTax || 0) + (order.bills?.tip || 0))}</p>
          </div>
          <div className="flex justify-end mt-3">
            <button
              onClick={() => { setInvoiceIsCopy(true); setShowInvoice(true); }}
              className="bg-[#2a4a3b] hover:bg-[#3b6651] text-[#f5f5f5] px-4 py-2 rounded-lg font-medium transition-colors text-sm border border-[#3b6651]"
            >
              <FaPrint className="inline mr-1" /> Imprimir Copia
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-4 text-[#ababab] text-xs">
        <p>{formatDateAndTime(order.orderDate)}</p>
        <p>{(role === "Kitchen" ? (order.items?.filter(i => i.status !== "Served")?.length || 0) : (order.items?.length || 0))} Productos</p>
      </div>
      
      {/* Total for Cashier/Waiter */}
      {(role === "Admin" || role === "Waiter" || role === "Cashier") && (
        <>
            <hr className="w-full mt-3 border-t-1 border-[#333]" />
            <div className="flex items-center justify-between mt-3">
                <h1 className="text-[#f5f5f5] text-md font-semibold">Total</h1>
                <p className="text-[#f6b100] text-lg font-bold">{formatCurrency((order.bills?.totalWithTax || 0) + (order.bills?.tip || 0))}</p>
            </div>
        </>
      )}

      {/* Action Buttons based on Role */}
      <div className="flex flex-wrap gap-2 mt-4 justify-end">
        
        {/* Waiter Actions - Add Items */}
        {role === "Waiter" && order.orderType !== "Delivery" && order.table && order.orderStatus !== "Completed" && order.orderStatus !== "Closed" && (
           <>
               <AddItemButton order={order} />
               <button
                 onClick={() => setShowReassignModal(true)}
                 className="bg-[#333] hover:bg-[#444] text-[#f5f5f5] px-4 py-2 rounded-lg font-medium transition-colors text-sm border border-[#555]"
               >
                 Reasignar Mesa
               </button>
               <button
                 onClick={() => setShowInvoice(true)}
                 className="bg-[#2a4a3b] hover:bg-[#3b6651] text-[#f5f5f5] px-4 py-2 rounded-lg font-medium transition-colors text-sm border border-[#3b6651]"
               >
                 <FaPrint className="inline mr-1" /> Recibo
               </button>
           </>
        )}

        {/* Delivery Actions */}
        {(role === "Admin" || role === "Delivery") && order.orderType === "Delivery" && order.orderStatus === "Ready" && (
          <button
            onClick={() => handleStatusChange("Out for Delivery")}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            En Camino
          </button>
        )}
        {(role === "Admin" || role === "Delivery") && order.orderType === "Delivery" && order.orderStatus === "Out for Delivery" && (
          <button
            onClick={() => handleStatusChange("Delivered")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            Entregado
          </button>
        )}

        {/* Cashier/Admin: mostrar cobrar cuando pago pendiente o no definido */}
        {(role === "Cashier" || role === "Admin") 
          && isPaymentPending
          && (order.orderStatus === "Pending" || order.orderStatus === "In Progress" || order.orderStatus === "Ready" || order.orderStatus === "Delivered") && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-md"
          >
            Cobrar / Cerrar Mesa
          </button>
        )}

        {/* Admin Actions - Cancel Order */}
        {role === "Admin" && order.orderStatus !== "Completed" && order.orderStatus !== "Cancelled" && (
            <button
                onClick={() => setShowCancellationModal(true)}
                className="bg-red-900 hover:bg-red-800 text-red-200 px-4 py-2 rounded-lg font-medium transition-colors text-sm border border-red-800"
            >
                Anular
            </button>
        )}
      </div>

      {showPaymentModal && (role === "Cashier" || role === "Admin") && (
          <PaymentModal order={order} onClose={() => setShowPaymentModal(false)} />
      )}

      {showReassignModal && (
          <ReassignTableModal order={order} onClose={() => setShowReassignModal(false)} />
      )}

      {showCancellationModal && (
          <CancellationModal order={order} role={role} onClose={() => setShowCancellationModal(false)} />
      )}

      {showInvoice && (
          <Invoice orderInfo={order} setShowInvoice={setShowInvoice} isCopy={invoiceIsCopy} />
      )}

    </div>
  );
};

// Helper component to use navigate hook since OrderCard is used in Orders page
// Alternatively we could move navigate to OrderCard but we need to import useNavigate

const AddItemButton = ({ order }) => {
    const navigate = useNavigate();
    const handleAddItems = () => {
         navigate("/menu", { 
            state: { 
                orderId: order._id, 
                table: order.table || null,
                customerName: order.customerDetails.name,
                orderType: order.orderType || "Dine-In",
                deliveryAddress: order.deliveryAddress || ""
            } 
        });
    };
    return (
        <button
            onClick={handleAddItems}
            className="bg-[#f6b100] hover:bg-[#d49a00] text-[#1f1f1f] px-4 py-2 rounded-lg font-bold transition-colors text-sm"
        >
            Agregar Productos
        </button>
    );
};

export default OrderCard;
