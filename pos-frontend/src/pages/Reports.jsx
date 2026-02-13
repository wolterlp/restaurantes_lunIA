import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPerformanceStats, getEconomicStats } from "../https";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import SpanishDateInput from "../components/shared/SpanishDateInput";
import Metrics from "../components/dashboard/Metrics";
import { useCurrency } from "../hooks/useCurrency";
import { getShortId } from "../utils";
import { FaChartPie, FaMoneyBillWave, FaExclamationTriangle, FaClock, FaFire, FaFileInvoiceDollar, FaCreditCard, FaUtensils, FaUserTie, FaStore } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

const Reports = () => {
  const { formatCurrency } = useCurrency();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("general");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [selectedPeriod, setSelectedPeriod] = useState("custom");
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState("previous");

  const getComparisonDateRange = () => {
    if (!comparisonMode || !dateRange.startDate || !dateRange.endDate) return null;
    
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    let comparisonStart, comparisonEnd;

    switch (comparisonPeriod) {
      case "previous":
        comparisonStart = new Date(startDate);
        comparisonStart.setDate(startDate.getDate() - diffDays);
        comparisonEnd = new Date(endDate);
        comparisonEnd.setDate(endDate.getDate() - diffDays);
        break;
      case "lastYear":
        comparisonStart = new Date(startDate);
        comparisonStart.setFullYear(startDate.getFullYear() - 1);
        comparisonEnd = new Date(endDate);
        comparisonEnd.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        return null;
    }

    return {
      startDate: comparisonStart.toISOString().split('T')[0],
      endDate: comparisonEnd.toISOString().split('T')[0]
    };
  };

  const comparisonDateRange = getComparisonDateRange();

  const { data: performanceData, isLoading: isLoadingPerf } = useQuery({
    queryKey: ["performanceStats", dateRange, comparisonMode, comparisonDateRange],
    queryFn: () => getPerformanceStats(dateRange, comparisonDateRange),
    refetchInterval: 60000,
    enabled: activeTab === "performance"
  });

  const { data: economicData, isLoading: isLoadingEco } = useQuery({
    queryKey: ["economicStats", dateRange, comparisonMode, comparisonDateRange],
    queryFn: () => getEconomicStats(dateRange, comparisonDateRange),
    refetchInterval: 60000,
    enabled: activeTab === "economic"
  });

  const isLoadingScreen = (activeTab === "performance" && isLoadingPerf) || (activeTab === "economic" && isLoadingEco);

  const perfStats = performanceData?.data?.data || {};
  const { trafficLight, criticalOrders, peakHours, slowestDishes, comparison: perfComparison } = perfStats;

  const ecoStats = economicData?.data?.data || {};
  const { salesOverview, paymentMethods, productPerformance, cancellations, salesByCategory, salesByUser, cashCuts, salesByChannel, comparison: ecoComparison } = ecoStats;

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    const today = new Date();
    let startDate, endDate;

    switch (period) {
      case "today":
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case "week":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case "month":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "year":
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
      case "custom":
        setDateRange({ startDate: "", endDate: "" });
        return;
      default:
        return;
    }

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  const ComparisonBadge = ({ current, previous, type = 'number' }) => {
    if (!previous || previous === 0) return null;
    
    const difference = current - previous;
    
    // Handle very small baseline values to prevent unrealistic percentages
    if (previous < 1 && Math.abs(difference) > previous * 100) {
      return (
        <span className="text-xs font-bold ml-2 text-blue-400">
          ↗ Nuevo
        </span>
      );
    }
    
    const percentage = ((difference / previous) * 100).toFixed(1);
    const isPositive = difference > 0;
    const isNeutral = difference === 0;
    
    let colorClass = 'text-gray-400';
    let arrow = '→';
    
    if (!isNeutral) {
      if (type === 'revenue' || type === 'number') {
        colorClass = isPositive ? 'text-green-500' : 'text-red-500';
        arrow = isPositive ? '↗' : '↘';
      } else if (type === 'time') {
        colorClass = isPositive ? 'text-red-500' : 'text-green-500';
        arrow = isPositive ? '↗' : '↘';
      }
    }
    
    return (
      <span className={`text-xs font-bold ml-2 ${colorClass}`}>
        {arrow} {Math.abs(percentage)}%
      </span>
    );
  };

  const translatePaymentMethod = (method) => {
      const map = {
          "Cash": "Efectivo",
          "Card": "Tarjeta",
          "Transfer": "Transferencia",
          "Mixed": "Mixto"
      };
      return map[method] || method || "No especificado";
  };

  const setDefaultsForTab = (tab) => {
    const now = new Date();
    if (tab === "general") {
      const open = theme?.customization?.businessHours?.openTime || "10:00";
      const close = theme?.customization?.businessHours?.closeTime || "22:00";
      const paddingHours = 2;
      const [openH, openM] = open.split(":").map(Number);
      const [closeH, closeM] = close.split(":").map(Number);
      const start = new Date(now);
      start.setHours(openH, openM, 0, 0);
      let end = new Date(now);
      end.setHours(closeH, closeM, 0, 0);
      start.setHours(start.getHours() - paddingHours);
      end.setHours(end.getHours() + paddingHours);
      if (end <= start) {
        end.setDate(end.getDate() + 1);
      }
      setSelectedPeriod("custom");
      setComparisonMode(false);
      setDateRange({
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      });
    } else if (tab === "performance") {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      setSelectedPeriod("year");
      setComparisonMode(false);
      setDateRange({
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      });
    } else if (tab === "economic") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setSelectedPeriod("month");
      setComparisonMode(false);
      setDateRange({
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      });
    }
  };

  useEffect(() => {
    setDefaultsForTab(activeTab);
    return () => {
      // Al salir de la ventana, los estados se restablecen con los valores por defecto al volver a entrar.
    };
  }, [activeTab]);

  if (isLoadingScreen) return <FullScreenLoader />;

  return (
    <div className="bg-[#1f1f1f] min-h-screen text-[#f5f5f5] p-6 pb-20 overflow-y-auto h-[calc(100vh-80px)]">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FaChartPie className="text-[#ecab0f]" /> Informes
        </h1>
        
        <div className="flex items-center gap-4 flex-wrap justify-center">
            {/* Period Selector */}
            <div className="flex items-center gap-2 bg-[#1a1a1a] p-2 rounded-lg border border-gray-700">
                <select 
                    className="bg-transparent text-sm text-gray-300 outline-none"
                    value={selectedPeriod}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                >
                    <option value="custom">Personalizado</option>
                    <option value="today">Hoy</option>
                    <option value="week">Esta Semana</option>
                    <option value="month">Este Mes</option>
                    <option value="year">Este Año</option>
                </select>
            </div>

            {/* Comparison Controls */}
            <div className="flex items-center gap-2 bg-[#1a1a1a] p-2 rounded-lg border border-gray-700">
                <label className="text-sm text-gray-300">Comparar:</label>
                <button
                    onClick={() => setComparisonMode(!comparisonMode)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                        comparisonMode ? 'bg-[#ecab0f] text-black font-bold' : 'bg-[#333] text-gray-300 hover:bg-[#444]'
                    }`}
                >
                    {comparisonMode ? 'Activado' : 'Desactivado'}
                </button>
                {comparisonMode && (
                    <select 
                        className="bg-transparent text-sm text-gray-300 outline-none"
                        value={comparisonPeriod}
                        onChange={(e) => setComparisonPeriod(e.target.value)}
                    >
                        <option value="previous">Período Anterior</option>
                        <option value="lastYear">Año Anterior</option>
                        <option value="custom">Personalizado</option>
                    </select>
                )}
            </div>

            {/* Date Range Picker - Available for ALL tabs now */}
            <div className="flex items-center gap-2 bg-[#1a1a1a] p-2 rounded-lg border border-gray-700">
                <SpanishDateInput
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                    label="Desde"
                    placeholder="dd/mm/aaaa"
                />
                <span className="text-gray-500 self-end pb-2">-</span>
                <SpanishDateInput
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                    label="Hasta"
                    placeholder="dd/mm/aaaa"
                />
                {(dateRange.startDate || dateRange.endDate) && (
                    <button 
                        onClick={() => {
                            setDateRange({ startDate: "", endDate: "" });
                            setSelectedPeriod("custom");
                            setComparisonMode(false);
                        }}
                        className="text-xs text-red-400 hover:text-red-300 ml-2"
                    >
                        Limpiar
                    </button>
                )}
            </div>

            <div className="flex bg-[#1a1a1a] rounded-lg p-1">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-6 py-2 rounded-md transition-all ${
              activeTab === "general" ? "bg-[#ecab0f] text-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab("performance")}
            className={`px-6 py-2 rounded-md transition-all ${
              activeTab === "performance" ? "bg-[#ecab0f] text-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Rendimiento
          </button>
          <button
            onClick={() => setActiveTab("economic")}
            className={`px-6 py-2 rounded-md transition-all ${
              activeTab === "economic" ? "bg-[#ecab0f] text-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Económico
          </button>
        </div>
      </div>
      </div>

      {/* Explicación del rango y guía rápida */}
      <div className="container mx-auto py-2 px-6 md:px-4">
        <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-4 mb-6">
          {activeTab === "general" && (
            <p className="text-sm text-[#ababab]">
              General: muestra la jornada según el horario configurado con margen ±2h. Rango usado: {dateRange.startDate} a {dateRange.endDate}. Puedes aplicar filtros recomendados, pero al salir regresa a estos valores por defecto.
            </p>
          )}
          {activeTab === "performance" && (
            <p className="text-sm text-[#ababab]">
              Rendimiento: analiza el año actual completo. Rango usado: {dateRange.startDate} a {dateRange.endDate}. Puedes comparar y filtrar temporalmente; al salir, vuelve al año actual.
            </p>
          )}
          {activeTab === "economic" && (
            <p className="text-sm text-[#ababab]">
              Económico: muestra datos del mes actual. Rango usado: {dateRange.startDate} a {dateRange.endDate}. Los cambios son temporales y se restablecen al cerrar esta ventana.
            </p>
          )}
        </div>
      </div>

      {activeTab === "general" && <Metrics dateRange={dateRange} />}

      {activeTab === "performance" && (
        <div className="space-y-8">
          
          {/* 1. Semaphore Section */}
          <section>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FaClock /> Distribución de Tiempos (Semáforo)
                </h2>
                {comparisonMode && comparisonDateRange && (
                  <div className="text-sm text-gray-400">
                    Comparando con: {comparisonDateRange.startDate} - {comparisonDateRange.endDate}
                  </div>
                )}
                {/* Health KPI Badge */}
                {trafficLight?.totalOrders > 0 && (
                    <div className="bg-[#262626] px-4 py-2 rounded-lg border border-gray-700 flex items-center gap-3">
                        <span className="text-sm text-gray-400">Salud del Servicio:</span>
                        <span className={`font-bold text-lg ${(trafficLight.green / trafficLight.totalOrders) >= 0.8 ? 'text-green-500' : (trafficLight.green / trafficLight.totalOrders) >= 0.6 ? 'text-orange-500' : 'text-red-500'}`}>
                            {Math.round((trafficLight.green / trafficLight.totalOrders) * 100)}%
                        </span>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-[#262626] p-6 rounded-xl border-l-4 border-blue-500 shadow-lg">
                <p className="text-gray-400 text-sm">Pedidos Finalizados</p>
                <p className="text-3xl font-bold">{trafficLight?.totalOrders || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Promedio: {Math.round(trafficLight?.avgTime || 0)} min
                  <ComparisonBadge 
                    current={trafficLight?.avgTime || 0} 
                    previous={perfComparison?.trafficLight?.avgTime} 
                    type="time" 
                  />
                </p>
              </div>
              <div className="bg-[#262626] p-6 rounded-xl border-l-4 border-purple-500 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <FaFire size={40} />
                </div>
                <p className="text-purple-400 text-sm font-bold">Pedidos Activos</p>
                <p className="text-3xl font-bold">{trafficLight?.activeOrders || 0}</p>
                <p className="text-xs text-gray-500 mt-1">En preparación</p>
              </div>
              <div className="bg-[#262626] p-6 rounded-xl border-l-4 border-green-500 shadow-lg">
                <p className="text-green-500 text-sm font-bold">A Tiempo (Verde)</p>
                <p className="text-3xl font-bold">{trafficLight?.green || 0}</p>
                <ComparisonBadge 
                  current={trafficLight?.green || 0} 
                  previous={perfComparison?.trafficLight?.green} 
                  type="number" 
                />
                <div className="w-full bg-gray-700 h-1 mt-2 rounded">
                  <div className="bg-green-500 h-1 rounded" style={{ width: trafficLight?.totalOrders ? `${(trafficLight.green / trafficLight.totalOrders) * 100}%` : '0%' }}></div>
                </div>
              </div>
              <div className="bg-[#262626] p-6 rounded-xl border-l-4 border-orange-500 shadow-lg">
                <p className="text-orange-500 text-sm font-bold">Demorados (Naranja)</p>
                <p className="text-3xl font-bold">{trafficLight?.orange || 0}</p>
                <ComparisonBadge 
                  current={trafficLight?.orange || 0} 
                  previous={perfComparison?.trafficLight?.orange} 
                  type="number" 
                />
                <div className="w-full bg-gray-700 h-1 mt-2 rounded">
                  <div className="bg-orange-500 h-1 rounded" style={{ width: trafficLight?.totalOrders ? `${(trafficLight.orange / trafficLight.totalOrders) * 100}%` : '0%' }}></div>
                </div>
              </div>
              <div className="bg-[#262626] p-6 rounded-xl border-l-4 border-red-500 shadow-lg">
                <p className="text-red-500 text-sm font-bold">Críticos (Rojo)</p>
                <p className="text-3xl font-bold">{trafficLight?.red || 0}</p>
                <ComparisonBadge 
                  current={trafficLight?.red || 0} 
                  previous={perfComparison?.trafficLight?.red} 
                  type="number" 
                />
                <div className="w-full bg-gray-700 h-1 mt-2 rounded">
                  <div className="bg-red-500 h-1 rounded" style={{ width: trafficLight?.totalOrders ? `${(trafficLight.red / trafficLight.totalOrders) * 100}%` : '0%' }}></div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 2. Peak Hours Chart */}
            <section className="bg-[#262626] p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <FaFire className="text-orange-400" /> Horas Pico
              </h2>
              <div className="h-64 flex items-end gap-2 overflow-x-auto pb-2">
                {peakHours?.length > 0 ? (
                  peakHours.map((hour) => {
                    const maxCount = Math.max(...peakHours.map(h => h.count));
                    const height = (hour.count / maxCount) * 100;
                    return (
                      <div key={hour._id} className="flex flex-col items-center gap-1 flex-1 min-w-[30px]">
                        <div 
                          className={`w-full rounded-t transition-all hover:opacity-80 ${hour.redCount > 0 ? 'bg-red-500' : 'bg-[#ecab0f]'}`}
                          style={{ height: `${height}%` }}
                          title={`${hour.count} pedidos (${hour.redCount} críticos)`}
                        ></div>
                        <span className="text-xs text-gray-400">{hour._id}:00</span>
                      </div>
                    );
                  })
                ) : (
                    <p className="text-gray-500 text-center w-full">No hay datos suficientes</p>
                )}
              </div>
            </section>

            {/* 3. Slowest Dishes */}
            <section className="bg-[#262626] p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <FaExclamationTriangle className="text-red-400" /> Platos Más Lentos
              </h2>
              <div className="space-y-4">
                {slowestDishes?.length > 0 ? (
                  slowestDishes.map((dish, index) => (
                    <div key={index} className="flex flex-col gap-1">
                      <div className="flex justify-between text-sm">
                        <span>{dish._id}</span>
                        <span className="text-gray-400">{Math.round(dish.avgPrepTime)} min prom.</span>
                      </div>
                      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${dish.avgPrepTime > 30 ? 'bg-red-500' : 'bg-orange-400'}`}
                          style={{ width: `${Math.min((dish.avgPrepTime / 60) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">{dish.totalOrdered} pedidos | {dish.redOrders} críticos</p>
                    </div>
                  ))
                ) : (
                    <p className="text-gray-500 text-center">No hay datos suficientes</p>
                )}
              </div>
            </section>
          </div>

          {/* 4. Critical Orders Table */}
          <section className="bg-[#262626] p-6 rounded-xl shadow-lg">
             <h2 className="text-xl font-semibold mb-4 text-red-400">Pedidos Críticos Recientes</h2>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="text-gray-400 border-b border-gray-700">
                     <th className="p-2">ID / Mesa</th>
                     <th className="p-2">Espera</th>
                     <th className="p-2">Hora</th>
                     <th className="p-2">Productos</th>
                   </tr>
                 </thead>
                 <tbody>
                    {criticalOrders?.length > 0 ? (
                        criticalOrders.map((order) => (
                            <tr key={order._id} className="border-b border-gray-800 hover:bg-[#333]">
                                <td className="p-2">
                                    <span className="font-mono text-xs text-gray-500">#{order._id.slice(-4)}</span>
                                    {order.table && <span className="ml-2 bg-gray-700 px-2 py-0.5 rounded text-xs">Mesa {order.table.tableNo}</span>}
                                </td>
                                <td className="p-2 text-red-400 font-bold">{Math.round(order.waitTimeMinutes)} min</td>
                                <td className="p-2 text-sm text-gray-400">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                <td className="p-2 text-sm text-gray-400">{order.items?.length || 0} productos</td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan="4" className="p-4 text-center text-gray-500">No hay pedidos críticos recientes</td></tr>
                    )}
                 </tbody>
               </table>
             </div>
          </section>

        </div>
      )}

      {activeTab === "economic" && (
        <div className="space-y-8">
            
            {/* 1. Sales Overview */}
            <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                      <FaFileInvoiceDollar className="text-green-400" /> Resumen de Ventas
                  </h2>
                  {comparisonMode && comparisonDateRange && (
                    <div className="text-sm text-gray-400">
                      Comparando con: {comparisonDateRange.startDate} - {comparisonDateRange.endDate}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-[#262626] p-4 rounded-xl shadow-lg">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Ventas Brutas</p>
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(salesOverview?.totalSales || 0)}</p>
                        <ComparisonBadge 
                          current={salesOverview?.totalSales || 0} 
                          previous={ecoComparison?.salesOverview?.totalSales} 
                          type="revenue" 
                        />
                    </div>
                    <div className="bg-[#262626] p-4 rounded-xl shadow-lg">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Ventas Netas</p>
                        <p className="text-2xl font-bold">{formatCurrency(salesOverview?.totalNetSales || 0)}</p>
                        <ComparisonBadge 
                          current={salesOverview?.totalNetSales || 0} 
                          previous={ecoComparison?.salesOverview?.totalNetSales} 
                          type="revenue" 
                        />
                    </div>
                    <div className="bg-[#262626] p-4 rounded-xl shadow-lg">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Impuestos</p>
                        <p className="text-2xl font-bold text-orange-400">{formatCurrency(salesOverview?.totalTax || 0)}</p>
                        <ComparisonBadge 
                          current={salesOverview?.totalTax || 0} 
                          previous={ecoComparison?.salesOverview?.totalTax} 
                          type="revenue" 
                        />
                    </div>
                     <div className="bg-[#262626] p-4 rounded-xl shadow-lg">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Propinas</p>
                        <p className="text-2xl font-bold text-yellow-400">{formatCurrency(salesOverview?.totalTips || 0)}</p>
                        <ComparisonBadge 
                          current={salesOverview?.totalTips || 0} 
                          previous={ecoComparison?.salesOverview?.totalTips} 
                          type="revenue" 
                        />
                    </div>
                    <div className="bg-[#262626] p-4 rounded-xl shadow-lg">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Descuentos</p>
                        <p className="text-2xl font-bold text-red-400">{formatCurrency(salesOverview?.totalDiscounts || 0)}</p>
                        <ComparisonBadge 
                          current={salesOverview?.totalDiscounts || 0} 
                          previous={ecoComparison?.salesOverview?.totalDiscounts} 
                          type="revenue" 
                        />
                    </div>
                    <div className="bg-[#262626] p-4 rounded-xl shadow-lg">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Tickets / Promedio</p>
                        <p className="text-2xl font-bold">{salesOverview?.totalTickets || 0}</p>
                        <p className="text-xs text-gray-500">Prom: {formatCurrency(Math.round(salesOverview?.avgTicket || 0))}</p>
                        <ComparisonBadge 
                          current={salesOverview?.totalTickets || 0} 
                          previous={ecoComparison?.salesOverview?.totalTickets} 
                          type="number" 
                        />
                    </div>
                    <div className="bg-[#262626] p-4 rounded-xl shadow-lg border-l-4 border-red-500">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Anulaciones</p>
                        <p className="text-2xl font-bold text-red-400">{formatCurrency(cancellations?.totalCancelled || 0)}</p>
                        <ComparisonBadge 
                          current={cancellations?.totalCancelled || 0} 
                          previous={ecoComparison?.cancellations?.totalCancelled} 
                          type="revenue" 
                        />
                        <p className="text-xs text-gray-500">{cancellations?.count || 0} tickets</p>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1.1 Sales by Channel */}
                <section className="bg-[#262626] p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <FaStore className="text-indigo-400" /> Ventas por Canal
                    </h2>
                    <div className="space-y-4">
                        {salesByChannel?.length > 0 ? (
                            salesByChannel.map((ch) => (
                                <div key={ch._id} className="flex items-center justify-between p-3 bg-[#333] rounded-lg">
                                    <span className="capitalize font-medium">{ch._id}</span>
                                    <div className="text-right">
                                        <p className="font-bold text-[#f5f5f5]">{formatCurrency(ch.totalSales)}</p>
                                        <p className="text-xs text-gray-400">{ch.count} pedidos</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center">No hay datos</p>
                        )}
                    </div>
                </section>

                {/* 2. Payment Methods */}
                <section className="bg-[#262626] p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <FaCreditCard className="text-blue-400" /> Métodos de Pago
                    </h2>
                    <div className="space-y-4">
                        {paymentMethods?.length > 0 ? (
                            paymentMethods.map((pm) => (
                                <div key={pm._id} className="flex items-center justify-between p-3 bg-[#333] rounded-lg">
                                    <span className="capitalize font-medium">{translatePaymentMethod(pm._id)}</span>
                                    <div className="text-right">
                                        <p className="font-bold text-[#f5f5f5]">{formatCurrency(pm.total)}</p>
                                        <p className="text-xs text-gray-400">{pm.count} transacciones</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">No hay datos de pagos</p>
                        )}
                    </div>
                </section>

                {/* 3. Sales by Category */}
                <section className="bg-[#262626] p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <FaUtensils className="text-orange-400" /> Ventas por Categoría
                    </h2>
                    <div className="space-y-3">
                        {salesByCategory?.length > 0 ? (
                            salesByCategory.map((cat, index) => (
                                <div key={index} className="flex flex-col gap-1">
                                    <div className="flex justify-between text-sm">
                                        <span>{cat._id}</span>
                                        <span className="font-bold">{formatCurrency(cat.totalSales)}</span>
                                    </div>
                                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-orange-400 h-full rounded-full"
                                            style={{ width: `${(cat.totalSales / (salesOverview?.totalSales || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500">{cat.quantity} productos vendidos</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">No hay datos por categoría</p>
                        )}
                    </div>
                </section>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* 4. Top Products (Detailed) */}
                 <section className="bg-[#262626] p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <FaStore className="text-yellow-400" /> Detalle de Productos Vendidos
                    </h2>
                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-[#262626]">
                                <tr className="text-gray-400 border-b border-gray-700 text-sm">
                                    <th className="pb-2">Producto</th>
                                    <th className="pb-2 text-right">Cant.</th>
                                    <th className="pb-2 text-right">Ingreso</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productPerformance?.length > 0 ? (
                                    productPerformance.map((prod, index) => (
                                        <tr key={index} className="border-b border-gray-800 last:border-0">
                                            <td className="py-2 text-sm">{prod._id}</td>
                                            <td className="py-2 text-right text-sm">{prod.quantitySold}</td>
                                            <td className="py-2 text-right text-sm font-bold text-green-400">{formatCurrency(prod.revenueGenerated)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="3" className="text-center py-4 text-gray-500">Sin datos</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 5. Sales by Staff */}
                <section className="bg-[#262626] p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <FaUserTie className="text-purple-400" /> Rendimiento de Personal
                    </h2>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {salesByUser?.length > 0 ? (
                            salesByUser.map((user, index) => {
                                const isUnknown = user._id === "Desconocido" || !user._id;
                                return (
                                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${isUnknown ? 'bg-red-900/20 border border-red-800' : 'bg-[#333]'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isUnknown ? 'bg-red-600 text-white' : 'bg-purple-900'}`}>
                                            {isUnknown ? "?" : user._id.substring(0,2).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`font-medium ${isUnknown ? 'text-red-400' : ''}`}>
                                                {user._id || "Desconocido"}
                                            </span>
                                            {isUnknown && <span className="text-[10px] text-red-300">⚠️ Requiere revisión</span>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-[#f5f5f5]">{formatCurrency(user.totalSales)}</p>
                                        <p className="text-xs text-gray-400">{user.tickets} tickets</p>
                                    </div>
                                </div>
                                );
                            })
                        ) : (
                            <p className="text-gray-500">No hay datos de personal</p>
                        )}
                    </div>
                </section>
            </div>

            {/* 6. Cancellations Detail */}
            {cancellations?.list?.length > 0 && (
                <section className="bg-[#262626] p-6 rounded-xl shadow-lg">
                     <h2 className="text-xl font-semibold mb-4 text-red-400">Detalle de Anulaciones Recientes</h2>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-gray-400 border-b border-gray-700">
                                    <th className="p-3">Fecha</th>
                                    <th className="p-3">Monto</th>
                                    <th className="p-3">Motivo</th>
                                    <th className="p-3">Autorizado Por</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cancellations.list.map((order) => (
                                    <tr key={order._id} className="border-b border-gray-800 hover:bg-[#333]">
                                        <td className="p-3 text-sm">{new Date(order.orderDate).toLocaleString()}</td>
                                        <td className="p-3 text-sm font-bold text-red-400">{formatCurrency(order.bills?.totalWithTax || 0)}</td>
                                        <td className="p-3 text-sm text-gray-300">{order.cancellationReason || "No especificado"}</td>
                                        <td className="p-3 text-sm text-gray-400">{order.cancelledBy?.name || "Desconocido"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                </section>
            )}

            {/* 7. Cash Cuts History */}
            <section className="bg-[#262626] p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-300">Cierre de Caja (Historial)</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-gray-400 border-b border-gray-700">
                                <th className="p-3">Fecha</th>
                                <th className="p-3">Responsable</th>
                                <th className="p-3 text-right">Base</th>
                                <th className="p-3 text-right">Ventas Efec.</th>
                                <th className="p-3 text-right">Calculado</th>
                                <th className="p-3 text-right">Declarado</th>
                                <th className="p-3 text-right">Diferencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cashCuts?.length > 0 ? (
                                cashCuts.map((cut) => (
                                    <tr key={cut._id} className="border-b border-gray-800 hover:bg-[#333]">
                                    <td className="p-3 text-sm">{new Date(cut.cutDate).toLocaleString()}</td>
                                    <td className="p-3 text-sm">{cut.performedBy?.name || "Desconocido"}</td>
                                    <td className="p-3 text-right font-mono text-gray-400">{formatCurrency(cut.metrics?.cashFund || 0)}</td>
                                    <td className="p-3 text-right font-mono">{formatCurrency(cut.metrics?.cashSales || 0)}</td>
                                    <td className="p-3 text-right font-mono text-gray-400">{formatCurrency(cut.metrics?.calculatedTotalCash || 0)}</td>
                                    <td className="p-3 text-right font-mono text-yellow-400">{formatCurrency(cut.metrics?.declaredTotalCash || 0)}</td>
                                    <td className={`p-3 text-right font-bold ${cut.metrics?.difference < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        {formatCurrency(cut.metrics?.difference || 0)}
                                    </td>
                                </tr>
                                ))
                            ) : (
                                <tr><td colSpan="7" className="p-6 text-center text-gray-500">No hay cortes registrados en este periodo</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

        </div>
      )}
    </div>
  );
};

export default Reports;
