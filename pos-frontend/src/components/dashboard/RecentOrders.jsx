import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { orders } from "../../constants";
import { GrUpdate } from "react-icons/gr";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getOrders, updateOrderStatus } from "../../https/index";
import { formatDateAndTime, getShortId } from "../../utils";

const RecentOrders = () => {
  const queryClient = useQueryClient();
  const { role } = useSelector((state) => state.user);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const handleStatusChange = ({orderId, orderStatus}) => {
    console.log(orderId)
    orderStatusUpdateMutation.mutate({orderId, orderStatus});
  };

  const orderStatusUpdateMutation = useMutation({
    mutationFn: ({orderId, orderStatus}) => updateOrderStatus({orderId, orderStatus}),
    onSuccess: (data) => {
      enqueueSnackbar("¡Estado del pedido actualizado con éxito!", { variant: "success" });
      queryClient.invalidateQueries(["orders"]); // Refresh order list
      queryClient.invalidateQueries(["tables"]); // Refresh tables list
    },
    onError: () => {
      enqueueSnackbar("¡Error al actualizar el estado del pedido!", { variant: "error" });
    }
  })

  const { data: resData, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    placeholderData: keepPreviousData,
  });

  if (isError) {
    enqueueSnackbar("¡Algo salió mal!", { variant: "error" });
  }

  const timeSorted = resData?.data?.data?.slice().sort((a, b) => {
    return new Date(b.orderDate) - new Date(a.orderDate);
  });

  const rangeFiltered = useMemo(() => {
    if (!startDate || !endDate) return [];
    const rangeStart = new Date(startDate);
    rangeStart.setHours(0,0,0,0);
    const rangeEnd = new Date(endDate);
    rangeEnd.setHours(23,59,59,999);
    if (rangeStart > rangeEnd) return [];
    return (timeSorted || []).filter(o => {
      const dt = new Date(o.orderDate);
      return dt >= rangeStart && dt <= rangeEnd;
    });
  }, [timeSorted, startDate, endDate]);

  const baseList = useMemo(() => {
    return (!!startDate && !!endDate) ? rangeFiltered : (timeSorted || []);
  }, [rangeFiltered, timeSorted, startDate, endDate]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(baseList.length / pageSize)), [baseList, pageSize]);
  const pagedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return baseList.slice(start, end);
  }, [baseList, page, pageSize]);

  return (
    <div className="container mx-auto bg-[#262626] p-4 rounded-lg">
      <h2 className="text-[#f5f5f5] text-xl font-semibold mb-4">
        Pedidos Recientes
      </h2>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[#ababab] text-sm font-semibold">Rango:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="bg-[#1a1a1a] text-[#f5f5f5] text-sm rounded-lg px-2 py-1 outline-none border border-[#333] focus:border-[#f6b100]"
          />
          <span className="text-[#ababab] text-sm">—</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="bg-[#1a1a1a] text-[#f5f5f5] text-sm rounded-lg px-2 py-1 outline-none border border-[#333] focus:border-[#f6b100]"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[#ababab] text-sm font-semibold">Por página:</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="bg-[#1a1a1a] text-[#f5f5f5] text-sm rounded-lg px-2 py-1 outline-none border border-[#333] focus:border-[#f6b100]"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[#f5f5f5]">
          <thead className="bg-[#333] text-[#ababab]">
            <tr>
              <th className="p-3">ID Pedido</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Fecha y Hora</th>
              <th className="p-3">Ítems</th>
              <th className="p-3">No. Mesa</th>
              <th className="p-3">Total</th>
              <th className="p-3 text-center">Método de Pago</th>
            </tr>
          </thead>
          <tbody>
            {pagedOrders?.map((order, index) => (
              <tr
                key={index}
                className="border-b border-gray-600 hover:bg-[#333]"
              >
                <td className="p-4">{getShortId(order._id)}</td>
                <td className="p-4">{order.customerDetails?.name || "N/A"}</td>
                <td className="p-4">
                  {order.orderStatus === "Cancelled" ? (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#3a1c1c] text-red-500 border border-red-900">
                      Anulado
                    </span>
                  ) : role === "Delivery" && order.orderType === "Delivery" ? (
                    <>
                      {order.orderStatus === "Ready" && (
                        <button
                          onClick={() => handleStatusChange({ orderId: order._id, orderStatus: "Out for Delivery" })}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-lg text-xs font-semibold"
                        >
                          En Camino
                        </button>
                      )}
                      {order.orderStatus === "Out for Delivery" && (
                        <button
                          onClick={() => handleStatusChange({ orderId: order._id, orderStatus: "Delivered" })}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-xs font-semibold"
                        >
                          Entregado
                        </button>
                      )}
                      {(order.orderStatus !== "Ready" && order.orderStatus !== "Out for Delivery") && (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                          order.orderStatus === "Delivered" ? "bg-[#3b2e4a] text-purple-500 border-purple-900" :
                          order.orderStatus === "Completed" ? "bg-[#2e3b4a] text-blue-500 border-blue-900" :
                          order.orderStatus === "In Progress" ? "bg-[#4a452e] text-yellow-500 border-yellow-900" :
                          "bg-[#333] text-[#ababab] border-[#444]"
                        }`}>
                          {order.orderStatus === "Delivered" ? "Entregado" :
                           order.orderStatus === "Completed" ? "Completado" :
                           order.orderStatus === "In Progress" ? "En Progreso" : "Pendiente"}
                        </span>
                      )}
                    </>
                  ) : (
                    <select
                      className={`bg-[#1a1a1a] border border-gray-500 p-2 rounded-lg focus:outline-none ${
                        order.orderStatus === "Ready"
                          ? "text-green-500"
                          : order.orderStatus === "Completed"
                          ? "text-blue-500"
                          : "text-yellow-500"
                      }`}
                      value={order.orderStatus}
                      onChange={(e) => handleStatusChange({orderId: order._id, orderStatus: e.target.value})}
                    >
                      <option className="text-yellow-500" value="In Progress">
                        En Progreso
                      </option>
                      <option className="text-green-500" value="Ready">
                        Listo
                      </option>
                      <option className="text-blue-500" value="Completed">
                        Completado
                      </option>
                    </select>
                  )}
                </td>
                <td className="p-4">{formatDateAndTime(order.orderDate)}</td>
                <td className="p-4">{order.items?.length || 0} Ítems</td>
                <td className="p-4">
                  {order.orderType === "Delivery" ? (
                    "Domicilio"
                  ) : order.table?.tableNo ? (
                    `Mesa - ${order.table.tableNo}`
                  ) : (
                    "Para Llevar"
                  )}
                </td>
                <td className="p-4">${order.bills.totalWithTax}</td>
                <td className="p-4">
                  {order.paymentMethod}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-3 mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#f5f5f5] px-3 py-1 rounded-lg border border-[#333]"
          disabled={page <= 1}
        >
          Anterior
        </button>
        <span className="text-[#ababab] text-sm">
          Página <span className="text-[#f5f5f5]">{page}</span> de <span className="text-[#f5f5f5]">{totalPages}</span>
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#f5f5f5] px-3 py-1 rounded-lg border border-[#333]"
          disabled={page >= totalPages}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default RecentOrders;
