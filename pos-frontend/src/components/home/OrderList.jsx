import React from "react";
import { FaCheckDouble, FaLongArrowAltRight, FaCheckCircle, FaBan, FaMotorcycle, FaHome } from "react-icons/fa";
import { FaCircle } from "react-icons/fa";
import { getAvatarName, getShortId } from "../../utils/index";

const OrderList = ({ order }) => {
  return (
    <div className="flex items-center gap-4 md:gap-5 mb-3">
      <button className="bg-[#f6b100] p-2 md:p-3 text-lg md:text-xl font-bold rounded-lg">
        {getAvatarName(order.customerDetails?.name || "C")}
      </button>
      <div className="flex items-center justify-between w-[100%]">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-[#f5f5f5] text-base md:text-lg font-semibold tracking-wide">
            {order.customerDetails?.name || "Cliente"} 
            <span className="text-xs md:text-sm text-gray-500 font-mono ml-2">{getShortId(order._id)}</span>
          </h1>
          <p className="text-[#ababab] text-xs md:text-sm">{order.items?.length || 0} Ítems</p>
        </div>

        <div className="flex items-center gap-1 text-[#f6b100] font-semibold border border-[#f6b100] rounded-lg px-2 py-1">
          <FaLongArrowAltRight className="text-[#ababab]" />
          <span className="text-xs md:text-sm">Mesa {order.table?.tableNo || "N/A"}</span>
        </div>

        <div className="flex flex-col items-end gap-2">
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
  );
};

export default OrderList;
