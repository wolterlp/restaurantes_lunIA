import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import BottomNav from "../components/shared/BottomNav";
import OrderCard from "../components/orders/OrderCard";
import BackButton from "../components/shared/BackButton";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrders } from "../https/index";
import { useSnackbar } from "notistack"
import socket from "../socket";
import { useTheme } from "../context/ThemeContext";

const Orders = () => {

  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { role, permissions } = useSelector((state) => state.user);
  const [searchTerm, setSearchTerm] = useState("");
  const { theme } = useTheme();

  useEffect(() => {
    document.title = "POS | Pedidos"
  }, [])
  
  useEffect(() => {
    if (role === "Delivery") {
      setStatus("delivery");
    }
  }, [role]);

  // Listen for search filter from header
  useEffect(() => {
    const handleSearchFilter = () => {
      const filter = localStorage.getItem('searchFilter');
      if (filter) {
        const parsedFilter = JSON.parse(filter);
        if (parsedFilter.type === 'order') {
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
    
    socket.on("new-order", () => {
      queryClient.invalidateQueries(["orders"]);
      enqueueSnackbar("¡Nuevo Pedido Recibido!", { variant: "info" });
    });

    socket.on("order-update", () => {
      queryClient.invalidateQueries(["orders"]);
    });

    return () => {
      window.removeEventListener('searchFilterUpdated', handleSearchFilter);
      socket.off("new-order");
      socket.off("order-update");
    };
  }, [enqueueSnackbar, queryClient])

  const { data: resData, isError, error } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    placeholderData: keepPreviousData,
  });

  const businessWindow = useMemo(() => {
    const open = theme?.customization?.businessHours?.openTime || "10:00";
    const close = theme?.customization?.businessHours?.closeTime || "22:00";
    const bufferHours = Number(theme?.customization?.businessHours?.viewBufferHours) || 0;
    const [openH, openM] = open.split(":").map(Number);
    const [closeH, closeM] = close.split(":").map(Number);
    const now = new Date();
    const openDT = new Date(now);
    openDT.setHours(openH, openM, 0, 0);
    let closeDT = new Date(now);
    closeDT.setHours(closeH, closeM, 0, 0);
    if (closeDT <= openDT) {
      closeDT.setDate(closeDT.getDate() + 1);
    }
    const start = new Date(openDT.getTime() - bufferHours * 60 * 60 * 1000);
    const end = new Date(closeDT.getTime() + bufferHours * 60 * 60 * 1000);
    return { start, end };
  }, [theme]);

  useEffect(() => {
    if(isError) {
      const msg = error?.response?.status === 403 
        ? "No tienes permisos para ver los pedidos." 
        : (error?.message || "¡Algo salió mal!");
      enqueueSnackbar(msg, {variant: "error"})
    }
  }, [isError, error, enqueueSnackbar]);

  useEffect(() => {
    setPage(1);
  }, [status, searchTerm]);

  const filteredOrders = useMemo(() => {
    const all = resData?.data?.data || [];
    return all
      .filter((order) => {
        const dt = new Date(order.orderDate);
        if (status !== "completed" && role !== "Admin") {
          if (dt < businessWindow.start || dt > businessWindow.end) return false;
        }
              if (role === "Kitchen") {
                const hasKitchenItems = order.items?.some(i => i.status !== "Served" && i.requiresPreparation !== false);
                if (!hasKitchenItems) return false;
              }
        if (role === "Delivery" && order.orderType !== "Delivery") return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const tableMatch = order.table?.tableNo?.toString()?.includes(term) || false;
          const customerMatch = order.customerDetails?.name?.toLowerCase()?.includes(term) || false;
          if (!tableMatch && !customerMatch) return false;
        }
        if (status === "delivery") return order.orderType === "Delivery" && order.orderStatus !== "Cancelled";
        if (status === "out") return order.orderType === "Delivery" && order.orderStatus === "Out for Delivery";
        if (status === "delivered") return order.orderType === "Delivery" && order.orderStatus === "Delivered";
        if (status === "completed") return order.orderStatus === "Completed";
        if (status === "all") return (role === "Waiter" || role === "Kitchen") ? order.orderStatus !== "Completed" && order.orderStatus !== "Cancelled" : true;
        if (status === "pending") return order.orderStatus === "Pending";
        if (status === "progress") return order.orderStatus === "In Progress";
        if (status === "ready") return role === "Waiter" ? order.items?.some(i => i.status === "Ready") : order.orderStatus === "Ready";
        if (status === "served") return role === "Waiter" && (order.items?.length || 0) > 0 && order.items.every(i => i.status === "Served") && order.orderType !== "Delivery" && order.orderStatus !== "Completed" && order.orderStatus !== "Cancelled";
        return true;
      })
      .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
  }, [resData, businessWindow, role, searchTerm, status]);

  const totalCompleted = useMemo(() => filteredOrders.length, [filteredOrders]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCompleted / pageSize)), [totalCompleted, pageSize]);
  const pagedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredOrders.slice(start, end);
  }, [filteredOrders, page, pageSize]);

  return (
    <section className="bg-[#1f1f1f] min-h-[calc(100vh-5rem)] overflow-hidden flex flex-col">
      <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-10 py-4 shrink-0 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-xl md:text-2xl font-bold tracking-wider hidden sm:block">
            Pedidos
          </h1>
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
            {role === "Delivery" ? (
              <>
                <button onClick={() => setStatus("delivery")} className={`text-[#ababab] text-xs md:text-lg whitespace-nowrap ${status === "delivery" && "bg-[#383838] text-[#f5f5f5]"} rounded-lg px-3 md:px-5 py-2 font-semibold transition-colors`}>
                  Domicilio
                </button>
                <button onClick={() => setStatus("out")} className={`text-[#ababab] text-xs md:text-lg whitespace-nowrap ${status === "out" && "bg-[#383838] text-[#f5f5f5]"} rounded-lg px-3 md:px-5 py-2 font-semibold transition-colors`}>
                  En Camino
                </button>
                <button onClick={() => setStatus("delivered")} className={`text-[#ababab] text-xs md:text-lg whitespace-nowrap ${status === "delivered" && "bg-[#383838] text-[#f5f5f5]"} rounded-lg px-3 md:px-5 py-2 font-semibold transition-colors`}>
                  Entregados
                </button>
              </>
            ) : (
              <>
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
                {role === "Waiter" && (
                  <button onClick={() => setStatus("served")} className={`text-[#ababab] text-xs md:text-lg whitespace-nowrap ${status === "served" && "bg-[#383838] text-[#f5f5f5]"} rounded-lg px-3 md:px-5 py-2 font-semibold transition-colors`}>
                    Servidos
                  </button>
                )}
                {(role === "Admin" || role === "Delivery" || permissions?.includes("VIEW_DELIVERY")) && (
                <button onClick={() => setStatus("delivery")} className={`text-[#ababab] text-xs md:text-lg whitespace-nowrap ${status === "delivery" && "bg-[#383838] text-[#f5f5f5]"} rounded-lg px-3 md:px-5 py-2 font-semibold transition-colors`}>
                  Domicilio
                </button>
                )}
                {(role === "Admin" || permissions?.includes("VIEW_COMPLETED")) && (
                <button onClick={() => setStatus("completed")} className={`text-[#ababab] text-xs md:text-lg whitespace-nowrap ${status === "completed" && "bg-[#383838] text-[#f5f5f5]"} rounded-lg px-3 md:px-5 py-2 font-semibold transition-colors`}>
                  Historial
                </button>
                )}
              </>
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

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
        {(filteredOrders.length > 0) && (
          <div className="sticky top-0 bg-[#1f1f1f] flex items-center justify-center gap-2 px-4 md:px-16 py-3 border-b border-[#333] shadow-lg">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={`px-3 py-1 rounded-lg text-sm font-semibold ${page <= 1 ? "bg-[#333] text-[#777] cursor-not-allowed" : "bg-[#383838] text-[#f5f5f5]"}`}
            >
              Anterior
            </button>
            <span className="text-[#ababab] text-sm">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={`px-3 py-1 rounded-lg text-sm font-semibold ${page >= totalPages ? "bg-[#333] text-[#777] cursor-not-allowed" : "bg-[#383838] text-[#f5f5f5]"}`}
            >
              Siguiente
            </button>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}
              className="ml-4 bg-[#383838] text-[#f5f5f5] text-sm rounded-lg px-2 py-1"
            >
              <option value={9}>9</option>
              <option value={12}>12</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-4 md:px-16 py-4">
          {
            filteredOrders?.length > 0 ? (
              pagedOrders.map((order) => {
                return <OrderCard key={order._id} order={order} id={`order-${order._id}`} />
              })
            ) : <p className="col-span-3 text-gray-500">No hay pedidos disponibles</p>
          }
        </div>
      </div>

      <BottomNav />
    </section>
  );
};

export default Orders;
