import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardMetrics } from "../../https";
import { useCurrency } from "../../hooks/useCurrency";

const Metrics = () => {
  const { formatCurrency } = useCurrency();
  const { data: metricsRes } = useQuery({
    queryKey: ["metrics"],
    queryFn: getDashboardMetrics,
  });

  const metrics = metricsRes?.data?.data || {};

  // const formatCurrency = (amount) => {
  //   return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
  // };

  const generalMetrics = [
    { 
      title: "Ingresos", 
      value: formatCurrency(metrics.revenue || 0), 
      percentage: "", 
      color: "#025cca", 
      isIncrease: true 
    },
    { 
      title: "Pedidos Totales", 
      value: metrics.totalOrders || 0, 
      percentage: "", 
      color: "#02ca3a", 
      isIncrease: true 
    },
    { 
      title: "Total Clientes", 
      value: metrics.totalGuests || 0, 
      percentage: "", 
      color: "#f6b100", 
      isIncrease: true 
    },
    { 
      title: "Promedio Pedido", 
      value: formatCurrency(metrics.revenue && metrics.totalOrders ? metrics.revenue / metrics.totalOrders : 0), 
      percentage: "", 
      color: "#be3e3f", 
      isIncrease: true 
    },
  ];

  const inventoryMetrics = [
    { 
      title: "Categorías Totales", 
      value: metrics.totalCategories || 0, 
      percentage: "", 
      color: "#5b45b0", 
      isIncrease: false 
    },
    { 
      title: "Platillos Totales", 
      value: metrics.totalDishes || 0, 
      percentage: "", 
      color: "#285430", 
      isIncrease: true 
    },
    { 
      title: "Pedidos Activos", 
      value: metrics.activeOrders || 0, 
      percentage: "", 
      color: "#735f32", 
      isIncrease: true 
    },
    { 
      title: "Mesas Totales", 
      value: metrics.totalTables || 0, 
      percentage: "", 
      color: "#7f167f", 
      isIncrease: false 
    }
  ];

  const topDishes = metrics.topSellingDishes || [];
  const displayBottomMetrics = topDishes.length > 0 ? topDishes.map((d, i) => ({
      title: d.name,
      value: `${d.totalSold} vendidos`,
      percentage: formatCurrency(d.salesValue),
      color: ["#5b45b0", "#285430", "#735f32", "#7f167f"][i % 4],
      isIncrease: true
  })) : inventoryMetrics;

  return (
    <div className="container mx-auto py-2 px-6 md:px-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-[#f5f5f5] text-xl">
            Rendimiento General
          </h2>
          <p className="text-sm text-[#ababab]">
            Resumen de métricas clave y rendimiento.
          </p>
        </div>
        {/* Removed "Last Month" button as it's not functional yet and misleading for real-time all-time stats */}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {generalMetrics.map((metric, index) => {
          return (
            <div
              key={index}
              className="shadow-sm rounded-lg p-4"
              style={{ backgroundColor: metric.color }}
            >
              <div className="flex justify-between items-center">
                <p className="font-medium text-xs text-[#f5f5f5]">
                  {metric.title}
                </p>
                {/* Percentage indicator removed as it requires historical data comparison */}
              </div>
              <p className="mt-1 font-semibold text-2xl text-[#f5f5f5]">
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col justify-between mt-12 pb-10">
        <div>
          <h2 className="font-semibold text-[#f5f5f5] text-xl">
            {topDishes.length > 0 ? "Platillos Más Vendidos" : "Detalles del Ítem"}
          </h2>
          <p className="text-sm text-[#ababab]">
            {topDishes.length > 0 ? "Top 4 platos favoritos de tus clientes." : "Detalles de inventario y estado."}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {
                displayBottomMetrics.map((item, index) => {
                    return (
                        <div key={index} className="shadow-sm rounded-lg p-4" style={{ backgroundColor: item.color }}>
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-xs text-[#f5f5f5]">{item.title}</p>
                          {item.percentage && (
                            <p className="font-medium text-xs text-[#f5f5f5]">{item.percentage}</p>
                          )}
                        </div>
                        <p className="mt-1 font-semibold text-2xl text-[#f5f5f5]">{item.value}</p>
                      </div>
                    )
                })
            }
        </div>
      </div>
    </div>
  );
};

export default Metrics;
