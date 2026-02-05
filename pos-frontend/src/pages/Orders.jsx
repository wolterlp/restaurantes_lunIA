import React, { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import OrderCard from "../components/orders/OrderCard";
import BackButton from "../components/shared/BackButton";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrders } from "../https/index";
import { enqueueSnackbar } from "notistack"
import socket from "../socket";

const Orders = () => {

  const [status, setStatus] = useState("all");
  const queryClient = useQueryClient();

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

  const { data: resData, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    placeholderData: keepPreviousData
  })

  if(isError) {
    enqueueSnackbar("¡Algo salió mal!", {variant: "error"})
  }

  return (
    <section className="bg-[#1f1f1f]  h-[calc(100vh-5rem)] overflow-hidden">
      <div className="flex items-center justify-between px-10 py-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
            Orders
          </h1>
        </div>
        <div className="flex items-center justify-around gap-4">
          <button onClick={() => setStatus("all")} className={`text-[#ababab] text-lg ${status === "all" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            All
          </button>
          <button onClick={() => setStatus("pending")} className={`text-[#ababab] text-lg ${status === "pending" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            Pending
          </button>
          <button onClick={() => setStatus("progress")} className={`text-[#ababab] text-lg ${status === "progress" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            In Progress
          </button>
          <button onClick={() => setStatus("ready")} className={`text-[#ababab] text-lg ${status === "ready" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            Ready
          </button>
          <button onClick={() => setStatus("delivery")} className={`text-[#ababab] text-lg ${status === "delivery" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            Delivery
          </button>
          <button onClick={() => setStatus("completed")} className={`text-[#ababab] text-lg ${status === "completed" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            Completed
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-16 py-4 overflow-y-scroll scrollbar-hide">
        {
          resData?.data.data.length > 0 ? (
            resData.data.data.filter((order) => {
              if (status === "all") return true;
              if (status === "pending") return order.orderStatus === "Pending";
              if (status === "progress") return order.orderStatus === "In Progress";
              if (status === "ready") return order.orderStatus === "Ready";
              if (status === "delivery") return order.orderStatus === "Out for Delivery" || order.orderStatus === "Delivered";
              if (status === "completed") return order.orderStatus === "Completed";
              return true;
            }).map((order) => {
              return <OrderCard key={order._id} order={order} />
            })
          ) : <p className="col-span-3 text-gray-500">No orders available</p>
        }
      </div>

      <BottomNav />
    </section>
  );
};

export default Orders;
