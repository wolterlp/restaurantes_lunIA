import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import OrderList from "./OrderList";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getOrders } from "../../https/index";

const RecentOrders = () => {
  const [limit, setLimit] = useState(10);
  
  const { data: resData, isError } = useQuery({
    queryKey: ["orders", limit],
    queryFn: async () => {
      return await getOrders({ limit });
    },
    placeholderData: keepPreviousData,
  });

  if (isError) {
    enqueueSnackbar("¡Algo salió mal!", { variant: "error" });
  }

  return (
    <div className="px-8 mt-6">
      <div className="bg-[#1a1a1a] w-full h-[450px] rounded-lg">
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
            Pedidos Recientes
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[#ababab] text-sm font-semibold">Mostrar:</span>
            <select 
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="bg-[#1f1f1f] text-[#f5f5f5] text-sm rounded-lg px-2 py-1 outline-none border border-[#333] focus:border-[#f6b100]"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={0}>Todos</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-6 py-4 mx-6">
          <FaSearch className="text-[#f5f5f5]" />
          <input
            type="text"
            placeholder="Buscar pedidos recientes"
            className="bg-[#1f1f1f] outline-none text-[#f5f5f5]"
          />
        </div>

        {/* Order list */}
        <div className="mt-4 px-6 overflow-y-scroll h-[300px] scrollbar-hide">
          {resData?.data.data.length > 0 ? (
            resData.data.data.map((order) => {
              return <OrderList key={order._id} order={order} />;
            })
          ) : (
            <p className="col-span-3 text-gray-500">No hay pedidos disponibles</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentOrders;
