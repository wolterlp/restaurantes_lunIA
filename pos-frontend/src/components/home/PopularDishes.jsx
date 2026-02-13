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
      {/* <div className="bg-[#1a1a1a] w-full rounded-lg flex flex-col h-[calc(280vh-160px)] md:h-[calc(300vh-170px)]"> */}
      <div className="bg-[#1a1a1a] w-full rounded-lg flex flex-col pb-20 md:pb-24">
        <div className="flex justify-between items-center px-4 md:px-5 py-4">
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

        <div className="flex-1 overflow-y-auto scrollbar-hide pb-20 md:pb-24">
          {isLoading ? (
             <div className="text-[#ababab] text-center py-10">Cargando...</div>
          ) : dishes.length === 0 ? (
             <div className="text-[#ababab] text-center py-10">No hay datos de ventas aún.</div>
          ) : (
             <>
             {dishes.slice(0, limit).map((dish, index) => {
                const displayId = index + 1;
                return (
                  <div
                    key={dish._id || index}
                    className="flex items-center gap-3 bg-[#1f1f1f] rounded-[15px] px-4 md:px-5 py-2 mt-2 ml-2 mr-4 md:ml-3 md:mr-6"
                  >
                    <h1 className="text-[#f5f5f5] font-bold text-lg mr-3 w-8 text-center shrink-0">{displayId < 10 ? `0${displayId}` : displayId}</h1>
                    {dish.image ? (
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-[40px] h-[40px] rounded-full object-cover shrink-0"
                        />
                    ) : (
                        <div className="w-[40px] h-[40px] rounded-full bg-[#333] flex items-center justify-center text-[#ababab] text-xs">Img</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h1 className="text-[#f5f5f5] font-semibold tracking-wide truncate text-sm md:text-base">{dish.name}</h1>
                      <p className="text-[#f5f5f5] text-xs md:text-sm font-semibold mt-1">
                        <span className="text-[#ababab]">Pedidos: </span>
                        {dish.numberOfOrders}
                      </p>
                    </div>
                  </div>
                );
             })}
             {/* Reserva de espacio para 11 platillos aunque se muestren 10 */}
             {Math.max(0, 11 - Math.min(limit, dishes.length)) > 0 && (
               <div
                 className="flex items-center gap-3 bg-[#1f1f1f] rounded-[15px] px-4 md:px-5 py-2 mt-2 ml-2 mr-4 md:ml-3 md:mr-6 opacity-0 pointer-events-none"
               >
                 <div className="w-8 shrink-0" />
                 <div className="w-[40px] h-[40px] rounded-full shrink-0" />
                 <div className="flex-1 min-w-0" />
               </div>
             )}
             </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PopularDishes;
