import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import BottomNav from "../components/shared/BottomNav";
import OrderCard from "../components/orders/OrderCard";
import BackButton from "../components/shared/BackButton";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrders } from "../https/index";
import { useSnackbar } from "notistack"
import socket from "../socket";

const Orders = () => {

  const [status, setStatus] = useState("all");
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { role, permissions } = useSelector((state) => state.user);
  const [searchTerm, setSearchTerm] = useState("");
  const [headerSearchFilter, setHeaderSearchFilter] = useState(null);

  useEffect(() => {
    document.title = "POS | Pedidos"
  }, [])

  // Listen for search filter from header
  useEffect(() => {
    const handleSearchFilter = () => {
      const filter = localStorage.getItem('searchFilter');
      if (filter) {
        const parsedFilter = JSON.parse(filter);
        if (parsedFilter.type === 'order') {
          setHeaderSearchFilter(parsedFilter);
          // Auto-focus on the order after navigation
          setTimeout(() => {
            const orderElement = document.getElementById(`order-${parsedFilter.value}`);
            if (orderElement) {
              orderElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              orderElement.classList.add('ring-2', 'ring-[#ecab0f]');
              setTimeout(() => orderElement.classList.remove('ring-2', 'ring-[#ecab0f]'), 3000);
            }
          }, 500);
        }
        localStorage.removeItem('searchFilter');
      }
    };

    window.addEventListener('searchFilterUpdated', handleSearchFilter);
    
    socket.on("new-order", (data) => {
      queryClient.invalidateQueries(["orders"]);
      enqueueSnackbar("¡Nuevo Pedido Recibido!", { variant: "info" });
    });

    socket.on("order-update", (data) => {
      queryClient.invalidateQueries(["orders"]);
    });

    return () => {
      window.removeEventListener('searchFilterUpdated', handleSearchFilter);
      socket.off("new-order");
      socket.off("order-update");
    };
  }, [])

  const { data: resData, isError, error } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if(isError) {
      const msg = error?.response?.status === 403 
        ? "No tienes permisos para ver los pedidos." 
        : (error?.message || "¡Algo salió mal!");
      enqueueSnackbar(msg, {variant: "error"})
    }
  }, [isError, error, enqueueSnackbar]);

  return (
    <section className="bg-[#1f1f1f] min-h-[calc(100vh-5rem)] overflow-hidden flex flex-col">
      <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-10 py-4 shrink-0 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-xl md:text-2xl font-bold tracking-wider hidden sm:block">
            Pedidos
          </h1>
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
            <button onClick={() => setStatus("all")} className={`text-[#ababab] text-xs md:text-lg whitespace-nowrap ${status === "all" && "bg-[#383838] text-[#f5f5f5]"} rounded-lg px-3 md:px-5 py-2 font-semibold transition-colors`}>
              Todos
            </button>
            <button onClick={() => setStatus("pending")} className={`text-[#ababab] text-xs md:text-lg whitespace-nowrap ${status === "pending" && "bg-[#383838] text-[#f5f5f5]"} rounded-lg px-3 md:px-5 py-2 font-semibold transition-colors`}>
              Pendientes
            </button>
            <button onClick={() => setStatus("progress")} className={`text-[#ababab] text-xs md:text-lg whitespace-nowrap ${status === "progress" && "bg-[#383838] text-[#f5f5f5]"} rounded-lg px-3 md:px-5 py-2 font-semibold transition-colors`}>
              En Progreso
            </button>
            <button onClick={() => setStatus("ready")} className={`text-[#ababab] text-xs md:text-lg whitespace-nowrap ${status === "ready" && "bg-[#383838] text-[#f5f5f5]"} rounded-lg px-3 md:px-5 py-2 font-semibold transition-colors`}>
              {role === "Waiter" ? "Por entregar" : "Listos"}
            </button>
            {(role === "Admin" || role === "Cashier" || permissions?.includes("VIEW_DELIVERY")) && (
            <button onClick={() => setStatus("delivery")} className={`text-[#ababab] text-xs md:text-lg whitespace-nowrap ${status === "delivery" && "bg-[#383838] text-[#f5f5f5]"} rounded-lg px-3 md:px-5 py-2 font-semibold transition-colors`}>
              Domicilio
            </button>
            )}
            {(role === "Admin" || role === "Cashier" || permissions?.includes("VIEW_COMPLETED")) && (
            <button onClick={() => setStatus("completed")} className={`text-[#ababab] text-xs md:text-lg whitespace-nowrap ${status === "completed" && "bg-[#383838] text-[#f5f5f5]"} rounded-lg px-3 md:px-5 py-2 font-semibold transition-colors`}>
              Historial
            </button>
            )}
          </div>
        </div>
        
        {role === "Cashier" && (
          <div className="flex items-center gap-2 bg-[#383838] rounded-lg px-4 py-2 w-full md:w-auto">
               <input 
                  type="text" 
                  placeholder="Buscar mesa/cliente..." 
                  className="bg-transparent outline-none text-[#f5f5f5] w-full md:w-48 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-4 md:px-16 py-4 overflow-y-auto flex-1 scrollbar-hide pb-20">
        {
          resData?.data?.data?.length > 0 ? (
            resData.data.data.filter((order) => {
              if (searchTerm) {
                  const term = searchTerm.toLowerCase();
                  const tableMatch = order.table?.tableNo?.toString()?.includes(term) || false;
                  const customerMatch = order.customerDetails?.name?.toLowerCase()?.includes(term) || false;
                  if (!tableMatch && !customerMatch) return false;
              }
              if (status === "delivery") return order.orderType === "Delivery" && order.orderStatus !== "Completed" && order.orderStatus !== "Cancelled";
              if (status === "completed") return order.orderStatus === "Completed";
              if (status === "all") return (role === "Waiter" || role === "Kitchen") ? order.orderStatus !== "Completed" && order.orderStatus !== "Cancelled" : true;
              if (status === "pending") return order.orderStatus === "Pending";
              if (status === "progress") return order.orderStatus === "In Progress";
              if (status === "ready") return order.orderStatus === "Ready";
              return true;
            })
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
            .map((order) => {
              return <OrderCard key={order._id} order={order} id={`order-${order._id}`} />
            })
          ) : <p className="col-span-3 text-gray-500">No hay pedidos disponibles</p>
        }
      </div>

      <BottomNav />
    </section>
  );
};

export default Orders;
