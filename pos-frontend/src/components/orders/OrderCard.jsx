import React, { useState } from "react";
import { FaCheckDouble, FaLongArrowAltRight, FaCheckCircle, FaMotorcycle, FaHome, FaPlay, FaUtensils, FaConciergeBell, FaPrint } from "react-icons/fa";
import { FaCircle } from "react-icons/fa";
import { formatDateAndTime, getAvatarName } from "../../utils/index";
import { useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrderStatus, updateItemStatus } from "../../https";
import { useSnackbar } from "notistack";
import Timer from "../shared/Timer";
import PaymentModal from "./PaymentModal";
import ReassignTableModal from "./ReassignTableModal";
import Invoice from "../invoice/Invoice";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "../../hooks/useCurrency";

const OrderCard = ({ order }) => {
  const { role } = useSelector((state) => state.user);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const { formatCurrency } = useCurrency();

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

  const handleStatusChange = (newStatus) => {
    updateStatusMutation.mutate({ orderId: order._id, orderStatus: newStatus });
  };

  const handleItemStatus = (itemId, status) => {
    updateItemMutation.mutate({ orderId: order._id, itemId, status });
  };
  
  const hasReadyItems = order.items?.some(i => i.status === "Ready");

  return (
    <div className="w-full bg-[#262626] p-4 rounded-lg mb-4 border border-[#333] shadow-lg relative">
      <div className="flex items-center gap-5">
        <button className="bg-[#f6b100] p-3 text-xl font-bold rounded-lg text-[#1f1f1f]">
          {getAvatarName(order.customerDetails?.name || "C")}
        </button>
        <div className="flex items-center justify-between w-[100%]">
          <div className="flex flex-col items-start gap-1">
            <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
              {order.customerDetails?.name || "Cliente"}
            </h1>
            <p className="text-[#ababab] text-sm">#{Math.floor(new Date(order.orderDate).getTime()).toString().slice(-4)} / {order.table ? "Comer aquí" : "Para llevar"}</p>
            {order.table && <p className="text-[#ababab] text-sm">Mesa <FaLongArrowAltRight className="text-[#ababab] ml-2 inline" /> {order.table.tableNo}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            {role === "Waiter" && hasReadyItems && order.orderStatus !== "Completed" && order.orderStatus !== "Delivered" ? (
                <p className="text-pink-500 bg-[#4a2e3b] px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider animate-pulse">
                  <FaConciergeBell className="inline mr-1" /> Pendientes de entrega
                </p>
            ) : order.orderStatus === "Ready" ? (
              <>
                <p className="text-green-500 bg-[#2e4a40] px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                  <FaCheckDouble className="inline mr-1" /> Listo
                </p>
              </>
            ) : order.orderStatus === "Completed" ? (
              <>
                <p className="text-blue-500 bg-[#2e3b4a] px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                  <FaCheckCircle className="inline mr-1" /> Completado
                </p>
              </>
            ) : order.orderStatus === "Out for Delivery" ? (
              <>
                <p className="text-orange-500 bg-[#4a3b2e] px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                  <FaMotorcycle className="inline mr-1" /> En Camino
                </p>
              </>
            ) : order.orderStatus === "Delivered" ? (
              <>
                <p className="text-purple-500 bg-[#3b2e4a] px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                  <FaHome className="inline mr-1" /> Entregado
                </p>
              </>
            ) : (
              <>
                <p className="text-yellow-500 bg-[#4a452e] px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                  <FaCircle className="inline mr-1" /> {order.orderStatus === "In Progress" ? "En Progreso" : "Pendiente"}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Kitchen View: Item List with Timers */}
      {(role === "Admin" || role === "Kitchen") && order.orderStatus !== "Completed" && (
          <div className="mt-4 bg-[#1f1f1f] rounded-lg p-3">
              <h3 className="text-[#ababab] text-xs font-bold uppercase mb-2">Platos / Ítems</h3>
              <div className="space-y-2">
                  {order.items?.map((item) => (
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
                                       item.status === "Ready" ? "Listo" : "Servido"}
                                  </span>
                                  {item.status !== "Ready" && item.status !== "Served" && (
                                      <Timer startTime={item.createdAt || order.createdAt} />
                                  )}
                              </div>
                          </div>
                          
                          <div className="flex gap-2">
                              {(item.status === "Pending" || item.status === "In Progress") && (
                                  <button 
                                    onClick={() => handleItemStatus(item._id, "Ready")}
                                    className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-full"
                                    title="Marcar Listo"
                                  >
                                      <FaUtensils size={12} />
                                  </button>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div className="flex justify-between items-center mt-4 text-[#ababab] text-xs">
        <p>{formatDateAndTime(order.orderDate)}</p>
        <p>{order.items?.length || 0} Ítems</p>
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
        {role === "Waiter" && order.orderStatus !== "Completed" && order.orderStatus !== "Closed" && (
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
        {(role === "Admin" || role === "Delivery") && order.orderStatus === "Ready" && (
          <button
            onClick={() => handleStatusChange("Out for Delivery")}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            En Camino
          </button>
        )}
        {(role === "Admin" || role === "Delivery") && order.orderStatus === "Out for Delivery" && (
          <button
            onClick={() => handleStatusChange("Delivered")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            Entregado
          </button>
        )}

        {/* Cashier Actions - For Dine-in/Pickup */}
        {(role === "Cashier") && (order.orderStatus === "Ready" || order.orderStatus === "Delivered") && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-md"
          >
            Cobrar / Cerrar Mesa
          </button>
        )}
      </div>

      {showPaymentModal && (
          <PaymentModal order={order} onClose={() => setShowPaymentModal(false)} />
      )}

      {showReassignModal && (
          <ReassignTableModal order={order} onClose={() => setShowReassignModal(false)} />
      )}

      {showInvoice && (
          <Invoice orderInfo={order} setShowInvoice={setShowInvoice} />
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
                table: order.table,
                customerName: order.customerDetails.name
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
