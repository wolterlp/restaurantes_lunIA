import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardMetrics } from "../../https";
import { useCurrency } from "../../hooks/useCurrency";

const Metrics = ({ dateRange }) => {
  const { formatCurrency } = useCurrency();
  const { data: metricsRes } = useQuery({
    queryKey: ["metrics", dateRange],
    queryFn: () => getDashboardMetrics(dateRange),
  });

  const metrics = metricsRes?.data?.data || {};

  // "Pedidos Totales" aligned with "Tickets" (Completed Orders) to match Revenue
  // "Active Orders" shown separately
  const generalMetrics = [
    { 
      title: "Ingresos (Netos)", 
      value: formatCurrency(metrics.revenue || 0), 
      percentage: "", 
      color: "#025cca", 
      isIncrease: true 
    },
    { 
      title: "Tickets (Pedidos)", 
      value: metrics.totalCompletedOrders || 0, 
      percentage: `Total: ${metrics.totalOrders || 0}`, 
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
      title: "Promedio Ticket", 
      value: formatCurrency(metrics.revenue && metrics.totalCompletedOrders ? metrics.revenue / metrics.totalCompletedOrders : 0), 
      percentage: "", 
      color: "#be3e3f", 
      isIncrease: true 
    },
  ];

  const inventoryMetrics = [
    { 
      title: "Categorías", 
      value: metrics.totalCategories || 0, 
      percentage: "", 
      color: "#5b45b0", 
      isIncrease: false 
    },
    { 
      title: "Platillos", 
      value: metrics.totalDishes || 0, 
      percentage: "", 
      color: "#285430", 
      isIncrease: true 
    },
    { 
      title: "Pedidos Activos", 
      value: metrics.activeOrders || 0, 
      percentage: "En curso", 
      color: "#735f32", 
      isIncrease: true 
    },
    { 
      title: "Mesas", 
      value: metrics.totalTables || 0, 
      percentage: "", 
      color: "#7f167f", 
      isIncrease: false 
    }
  ];

  const topDishes = metrics.topSellingDishes || [];
  const displayTopProducts = topDishes.length > 0 ? topDishes.map((d, i) => ({
      title: d.name,
      value: `${d.totalSold} vendidos`,
      // Show revenue as percentage/subtitle or just hide if redundant. User said "No repetir valores exactos".
      // But showing revenue is good context. Let's make it subtle.
      percentage: formatCurrency(d.salesValue), 
      color: ["#FFD700", "#C0C0C0", "#CD7F32"][i] || "#333", // Gold, Silver, Bronze colors
      isIncrease: true
  })) : [];

  return (
    <div className="container mx-auto py-2 px-6 md:px-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-[#f5f5f5] text-xl">
            Estado Rápido del Negocio
          </h2>
          <p className="text-sm text-[#ababab]">
            KPIs principales y salud operativa.
          </p>
        </div>
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
                {metric.percentage && (
                    <span className="text-xs text-white opacity-80 bg-black/20 px-2 py-0.5 rounded">
                        {metric.percentage}
                    </span>
                )}
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
            {displayTopProducts.length > 0 ? "Top 3 Productos (Ingresos)" : "Detalles Operativos"}
          </h2>
          <p className="text-sm text-[#ababab]">
            {displayTopProducts.length > 0 ? "Los productos que más ingresos generan." : "Resumen de inventario."}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Top 3 Products */}
            {
                displayTopProducts.map((item, index) => {
                    return (
                        <div key={index} className="shadow-sm rounded-lg p-4 relative overflow-hidden" style={{ backgroundColor: '#262626', borderLeft: `4px solid ${item.color}` }}>
                        <div className="flex justify-between items-center z-10 relative">
                          <p className="font-bold text-sm text-[#f5f5f5] truncate pr-2">{item.title}</p>
                          <div className="text-xs font-bold px-2 py-1 rounded bg-black/30 text-white">
                              #{index + 1}
                          </div>
                        </div>
                        <div className="mt-2 z-10 relative">
                            <p className="font-semibold text-xl text-[#f5f5f5]">{item.value}</p>
                            <p className="text-xs text-gray-400 mt-1">Generó {item.percentage}</p>
                        </div>
                      </div>
                    )
                })
            }
            {/* Fill remaining slots with Inventory Metrics if needed, or just show Inventory Metrics separately? 
                User wants "General" to be "Quick State". Inventory counts are useful.
                Let's show Inventory Metrics below or alongside if Top Products are few.
                Actually, let's always show Inventory Metrics in a separate row or grid if possible.
                Or just append them.
            */}
             {
                inventoryMetrics.map((item, index) => {
                    return (
                        <div key={`inv-${index}`} className="shadow-sm rounded-lg p-4 bg-[#262626] border-t-4" style={{ borderColor: item.color }}>
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-xs text-gray-400">{item.title}</p>
                          {item.percentage && (
                            <p className="font-bold text-xs text-green-400">{item.percentage}</p>
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
