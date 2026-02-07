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

  useEffect(() => {
      document.title = "POS | Pedidos"
      
      socket.on("new-order", (data) => {
        queryClient.invalidateQueries(["orders"]);
        enqueueSnackbar("¡Nuevo Pedido Recibido!", { variant: "info" });
      });

      socket.on("order-update", (data) => {
        queryClient.invalidateQueries(["orders"]);
      });

      return () => {
        socket.off("new-order");
        socket.off("order-update");
      };
    }, [])

  const { data: resData, isError, error } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    placeholderData: keepPreviousData
  })

  useEffect(() => {
    if(isError) {
      const msg = error?.response?.status === 403 
        ? "No tienes permisos para ver los pedidos." 
        : (error?.message || "¡Algo salió mal!");
      enqueueSnackbar(msg, {variant: "error"})
    }
  }, [isError, error, enqueueSnackbar]);

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-10 py-4 shrink-0">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
            Pedidos
          </h1>
          {role === "Cashier" && (
            <div className="flex items-center gap-2 bg-[#383838] rounded-lg px-4 py-2 ml-4">
                 <input 
                    type="text" 
                    placeholder="Buscar mesa/cliente..." 
                    className="bg-transparent outline-none text-[#f5f5f5] w-48"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
            </div>
          )}
        </div>
        <div className="flex items-center justify-around gap-4">
          <button onClick={() => setStatus("all")} className={`text-[#ababab] text-lg ${status === "all" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            Todos
          </button>
          <button onClick={() => setStatus("pending")} className={`text-[#ababab] text-lg ${status === "pending" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            Pendientes
          </button>
          <button onClick={() => setStatus("progress")} className={`text-[#ababab] text-lg ${status === "progress" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            En Progreso
          </button>
          <button onClick={() => setStatus("ready")} className={`text-[#ababab] text-lg ${status === "ready" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            {role === "Waiter" ? "Pendientes de entrega" : "Listos"}
          </button>
          {(role === "Admin" || role === "Cashier" || permissions?.includes("VIEW_DELIVERY")) && (
          <button onClick={() => setStatus("delivery")} className={`text-[#ababab] text-lg ${status === "delivery" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            Domicilio
          </button>
          )}
          {(role === "Admin" || role === "Cashier" || permissions?.includes("VIEW_COMPLETED")) && (
          <button onClick={() => setStatus("completed")} className={`text-[#ababab] text-lg ${status === "completed" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            Completados
          </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-16 py-4 overflow-y-auto flex-1 scrollbar-hide pb-20">
        {
          resData?.data?.data?.length > 0 ? (
            resData.data.data.filter((order) => {
              if (searchTerm) {
                  const term = searchTerm.toLowerCase();
                  const tableMatch = order.table?.tableNo?.toString()?.includes(term) || false;
                  const customerMatch = order.customerDetails?.name?.toLowerCase()?.includes(term) || false;
                  if (!tableMatch && !customerMatch) return false;
              }
              if (status === "all") return role === "Waiter" ? order.orderStatus !== "Completed" : true;
              if (status === "pending") return order.orderStatus === "Pending";
              if (status === "progress") return order.orderStatus === "In Progress";
              if (status === "ready") return order.orderStatus === "Ready";
              if (status === "delivery") return order.orderStatus === "Out for Delivery" || order.orderStatus === "Delivered";
              if (status === "completed") return order.orderStatus === "Completed";
              return true;
            })
            .sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate))
            .map((order) => {
              return <OrderCard key={order._id} order={order} />
            })
          ) : <p className="col-span-3 text-gray-500">No hay pedidos disponibles</p>
        }
      </div>

      <BottomNav />
    </section>
  );
};

export default Orders;
