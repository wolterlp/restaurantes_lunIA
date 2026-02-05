import React from "react";
import { FaCheckDouble, FaLongArrowAltRight, FaCheckCircle, FaMotorcycle, FaHome } from "react-icons/fa";
import { FaCircle } from "react-icons/fa";
import { formatDateAndTime, getAvatarName } from "../../utils/index";
import { useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrderStatus } from "../../https";
import { useSnackbar } from "notistack";

const OrderCard = ({ order }) => {
  const { role } = useSelector((state) => state.user);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

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

  const handleStatusChange = (newStatus) => {
    updateStatusMutation.mutate({ orderId: order._id, orderStatus: newStatus });
  };

  return (
    <div className="w-full bg-[#262626] p-4 rounded-lg mb-4">
      <div className="flex items-center gap-5">
        <button className="bg-[#f6b100] p-3 text-xl font-bold rounded-lg">
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
            {order.orderStatus === "Ready" ? (
              <>
                <p className="text-green-600 bg-[#2e4a40] px-2 py-1 rounded-lg">
                  <FaCheckDouble className="inline mr-2" /> Listo
                </p>
                <p className="text-[#ababab] text-sm">
                  <FaCircle className="inline mr-2 text-green-600" /> Listo para servir/entregar
                </p>
              </>
            ) : order.orderStatus === "Completed" ? (
              <>
                <p className="text-blue-600 bg-[#2e3b4a] px-2 py-1 rounded-lg">
                  <FaCheckCircle className="inline mr-2" /> Completado
                </p>
                <p className="text-[#ababab] text-sm">
                  <FaCircle className="inline mr-2 text-blue-600" /> Pedido Completado
                </p>
              </>
            ) : order.orderStatus === "Out for Delivery" ? (
              <>
                <p className="text-orange-600 bg-[#4a3b2e] px-2 py-1 rounded-lg">
                  <FaMotorcycle className="inline mr-2" /> En Camino
                </p>
                <p className="text-[#ababab] text-sm">
                  <FaCircle className="inline mr-2 text-orange-600" /> Repartidor en ruta
                </p>
              </>
            ) : order.orderStatus === "Delivered" ? (
              <>
                <p className="text-purple-600 bg-[#3b2e4a] px-2 py-1 rounded-lg">
                  <FaHome className="inline mr-2" /> Entregado
                </p>
                <p className="text-[#ababab] text-sm">
                  <FaCircle className="inline mr-2 text-purple-600" /> Pedido Entregado
                </p>
              </>
            ) : (
              <>
                <p className="text-yellow-600 bg-[#4a452e] px-2 py-1 rounded-lg">
                  <FaCircle className="inline mr-2" /> {order.orderStatus === "In Progress" ? "En Progreso" : "Pendiente"}
                </p>
                <p className="text-[#ababab] text-sm">
                  <FaCircle className="inline mr-2 text-yellow-600" /> {order.orderStatus === "In Progress" ? "Preparando..." : "En espera"}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mt-4 text-[#ababab]">
        <p>{formatDateAndTime(order.orderDate)}</p>
        <p>{order.items.length} Ítems</p>
      </div>
      <hr className="w-full mt-4 border-t-1 border-gray-500" />
      <div className="flex items-center justify-between mt-4">
        <h1 className="text-[#f5f5f5] text-lg font-semibold">Total</h1>
        <p className="text-[#f5f5f5] text-lg font-semibold">${order.bills.totalWithTax.toFixed(2)}</p>
      </div>

      {/* Action Buttons based on Role */}
      <div className="flex flex-wrap gap-2 mt-4 justify-end">
        {/* Kitchen Actions */}
        {(role === "Admin" || role === "Kitchen") && order.orderStatus === "Pending" && (
          <button
            onClick={() => handleStatusChange("In Progress")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Empezar Preparación
          </button>
        )}
        {(role === "Admin" || role === "Kitchen") && order.orderStatus === "In Progress" && (
          <button
            onClick={() => handleStatusChange("Ready")}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Marcar Listo
          </button>
        )}

        {/* Delivery Actions */}
        {(role === "Admin" || role === "Delivery") && order.orderStatus === "Ready" && (
          <button
            onClick={() => handleStatusChange("Out for Delivery")}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            En Camino
          </button>
        )}
        {(role === "Admin" || role === "Delivery") && order.orderStatus === "Out for Delivery" && (
          <button
            onClick={() => handleStatusChange("Delivered")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Entregado
          </button>
        )}

        {/* Cashier Actions - For Dine-in/Pickup */}
        {(role === "Cashier") && order.orderStatus === "Ready" && (
          <button
            onClick={() => handleStatusChange("Completed")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Completar Pago
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
