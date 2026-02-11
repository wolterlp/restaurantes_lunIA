import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardMetrics } from "../https";
import BottomNav from "../components/shared/BottomNav";
import Greetings from "../components/home/Greetings";
import { useTheme } from "../context/ThemeContext";
import { BsCashCoin } from "react-icons/bs";
import { GrInProgress } from "react-icons/gr";
import MiniCard from "../components/home/MiniCard";
import RecentOrders from "../components/home/RecentOrders";
import PopularDishes from "../components/home/PopularDishes";

const Home = () => {
    const { theme } = useTheme();
    const earningsPeriod = theme?.customization?.earningsPeriod || 'shift';

    const { data: metricsRes } = useQuery({
        queryKey: ["dashboardMetrics", earningsPeriod],
        queryFn: () => getDashboardMetrics(earningsPeriod),
        refetchInterval: 60000, // Refresh every minute
    });

    const metrics = metricsRes?.data?.data || { revenue: 0, activeOrders: 0 };

    useEffect(() => {
      document.title = "POS | Inicio"
    }, [])

  return (
    <section className="bg-[#1f1f1f]  h-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden flex gap-3">
      {/* Left Div */}
      <div className="flex-[3]">
        <Greetings />
        <div className="flex items-center w-full gap-3 px-8 mt-8">
          <MiniCard title="Ganancias Totales" icon={<BsCashCoin />} number={metrics.revenue} footerNum={0} />
          <MiniCard title="En Progreso" icon={<GrInProgress />} number={metrics.activeOrders} footerNum={0} />
        </div>
        <RecentOrders />
      </div>
      {/* Right Div */}
      <div className="flex-[2]">
        <PopularDishes />
      </div>
      <BottomNav />
    </section>
  );
};

export default Home;
