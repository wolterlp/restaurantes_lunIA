import React from "react";
import { orders } from "../../constants";
import { GrUpdate } from "react-icons/gr";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getOrders, updateOrderStatus } from "../../https/index";
import { formatDateAndTime } from "../../utils";

const RecentOrders = () => {
  const queryClient = useQueryClient();
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

  const sortedOrders = resData?.data?.data?.slice().sort((a, b) => {
    const statusPriority = {
      "Ready": 1,
      "In Progress": 2,
      "Completed": 3
    };
    return (statusPriority[a.orderStatus] || 4) - (statusPriority[b.orderStatus] || 4);
  });

  return (
    <div className="container mx-auto bg-[#262626] p-4 rounded-lg">
      <h2 className="text-[#f5f5f5] text-xl font-semibold mb-4">
        Pedidos Recientes
      </h2>
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
            {resData?.data?.data?.map((order, index) => (
              <tr
                key={index}
                className="border-b border-gray-600 hover:bg-[#333]"
              >
                <td className="p-4">#{Math.floor(new Date(order.orderDate).getTime())}</td>
                <td className="p-4">{order.customerDetails?.name || "N/A"}</td>
                <td className="p-4">
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
                </td>
                <td className="p-4">{formatDateAndTime(order.orderDate)}</td>
                <td className="p-4">{order.items?.length || 0} Ítems</td>
                <td className="p-4">Mesa - {order.table.tableNo}</td>
                <td className="p-4">${order.bills.totalWithTax}</td>
                <td className="p-4">
                  {order.paymentMethod}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrders;
