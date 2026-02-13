import React from "react";
import { FaCheckDouble, FaLongArrowAltRight, FaCheckCircle, FaBan, FaMotorcycle, FaHome } from "react-icons/fa";
import { FaCircle } from "react-icons/fa";
import { getAvatarName, getShortId } from "../../utils/index";

const OrderList = ({ order }) => {
  return (
    <div className="bg-[#1f1f1f] border border-[#333] rounded-xl px-4 md:px-5 py-2 md:py-2 mt-2">
      <div className="flex items-center gap-4 w-full">
        <button className="bg-[#f6b100] text-[#1f1f1f] w-10 h-10 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold shrink-0">
          {getAvatarName(order.customerDetails?.name || "C")}
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-[#f5f5f5] text-sm md:text-base font-semibold tracking-wide truncate">
            {order.customerDetails?.name || "Cliente"}
            <span className="text-xs md:text-sm text-gray-500 font-mono ml-2">{getShortId(order._id)}</span>
          </h1>
          <p className="text-[#ababab] text-xs md:text-sm">{order.items?.length || 0} Ítems</p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="hidden sm:flex items-center gap-1 text-[#f6b100] font-semibold border border-[#f6b100] rounded-lg px-2 py-0.5">
            <FaLongArrowAltRight className="text-[#ababab]" />
            <span className="text-xs md:text-sm">Mesa {order.table?.tableNo || "N/A"}</span>
          </div>
          <div>
            {order.orderStatus === "Ready" ? (
              <p className="text-green-600 bg-[#2e4a40] px-2 py-1 rounded-lg text-xs md:text-sm">
                <FaCheckDouble className="inline mr-2" /> Listo
              </p>
            ) : order.orderStatus === "Completed" ? (
              <p className="text-blue-600 bg-[#2e3b4a] px-2 py-1 rounded-lg text-xs md:text-sm">
                <FaCheckCircle className="inline mr-2" /> Completado
              </p>
            ) : order.orderStatus === "Cancelled" ? (
              <p className="text-red-600 bg-[#3a1c1c] px-2 py-1 rounded-lg text-xs md:text-sm">
                <FaBan className="inline mr-2" /> Anulado
              </p>
            ) : order.orderStatus === "Out for Delivery" ? (
              <p className="text-orange-600 bg-[#4a3b2e] px-2 py-1 rounded-lg text-xs md:text-sm">
                <FaMotorcycle className="inline mr-2" /> En Camino
              </p>
            ) : order.orderStatus === "Delivered" ? (
              <p className="text-purple-600 bg-[#3b2e4a] px-2 py-1 rounded-lg text-xs md:text-sm">
                <FaHome className="inline mr-2" /> Entregado
              </p>
            ) : (
              <p className="text-yellow-600 bg-[#4a452e] px-2 py-1 rounded-lg text-xs md:text-sm">
                <FaCircle className="inline mr-2" /> {order.orderStatus === "In Progress" ? "En Progreso" : "Pendiente"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderList;
