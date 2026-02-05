import React, { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getPopularDishes } from "../../https";

const PopularDishes = () => {
  const [limit, setLimit] = useState(10);

  const { data: popularDishesRes, isLoading } = useQuery({
    queryKey: ["popularDishes", limit],
    queryFn: () => getPopularDishes({ limit }),
    refetchInterval: 30000, // Refresh every 30 seconds
    placeholderData: keepPreviousData,
  });

  const dishes = popularDishesRes?.data?.data || [];

  return (
    <div className="mt-6 pr-6">
      <div className="bg-[#1a1a1a] w-full rounded-lg">
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
            Platillos Populares
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[#ababab] text-sm font-semibold">Top:</span>
            <select 
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="bg-[#1f1f1f] text-[#f5f5f5] text-sm rounded-lg px-2 py-1 outline-none border border-[#333] focus:border-[#f6b100]"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="overflow-y-scroll h-[680px] scrollbar-hide">
          {isLoading ? (
             <div className="text-[#ababab] text-center py-10">Cargando...</div>
          ) : dishes.length === 0 ? (
             <div className="text-[#ababab] text-center py-10">No hay datos de ventas aún.</div>
          ) : (
             dishes.map((dish, index) => {
                const displayId = index + 1;
                return (
                  <div
                    key={dish._id || index}
                    className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-6 py-4 mt-4 mx-6"
                  >
                    <h1 className="text-[#f5f5f5] font-bold text-xl mr-4">{displayId < 10 ? `0${displayId}` : displayId}</h1>
                    {dish.image ? (
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-[50px] h-[50px] rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-[50px] h-[50px] rounded-full bg-[#333] flex items-center justify-center text-[#ababab] text-xs">Img</div>
                    )}
                    <div>
                      <h1 className="text-[#f5f5f5] font-semibold tracking-wide">{dish.name}</h1>
                      <p className="text-[#f5f5f5] text-sm font-semibold mt-1">
                        <span className="text-[#ababab]">Pedidos: </span>
                        {dish.numberOfOrders}
                      </p>
                    </div>
                  </div>
                );
             })
          )}
        </div>
      </div>
    </div>
  );
};

export default PopularDishes;