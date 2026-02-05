import React, { useState, useEffect } from "react";
import { MdTableBar, MdCategory } from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import Metrics from "../components/dashboard/Metrics";
import RecentOrders from "../components/dashboard/RecentOrders";
import CashCut from "../components/dashboard/CashCut";
import Modal from "../components/dashboard/Modal";
import { useSelector } from "react-redux";

const buttons = [
    { label: "Gestionar Mesas", icon: <MdTableBar />, action: "table" },
    { label: "Gestionar Categorías", icon: <MdCategory />, action: "category" },
    { label: "Gestionar Platillos", icon: <BiSolidDish />, action: "dishes" },
  ];

  const allTabs = ["Métricas", "Pedidos", "Pagos", "Corte"];

  const Dashboard = () => {
    const { role } = useSelector((state) => state.user);
    const tabs = role === "Admin" ? allTabs : ["Corte"];

    useEffect(() => {
      document.title = "POS | Panel de Admin"
    }, [])

    const [activeModal, setActiveModal] = useState(null);
    const [activeTab, setActiveTab] = useState(role === "Admin" ? "Métricas" : "Corte");

    const handleOpenModal = (action) => {
    setActiveModal(action);
  };

  return (
    <div className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden">
      <div className="container mx-auto flex flex-col xl:flex-row items-center justify-between py-10 px-4 gap-6">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {role === "Admin" && buttons.map(({ label, icon, action }) => {
            return (
              <button
                key={action}
                onClick={() => handleOpenModal(action)}
                className="bg-[#1a1a1a] hover:bg-[#262626] px-8 py-3 rounded-lg text-[#f5f5f5] font-semibold text-md flex items-center gap-2"
              >
                {label} {icon}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {tabs.map((tab) => {
            return (
              <button
                key={tab}
                className={`
                px-8 py-3 rounded-lg text-[#f5f5f5] font-semibold text-md flex items-center gap-2 ${
                  activeTab === tab
                    ? "bg-[#262626]"
                    : "bg-[#1a1a1a] hover:bg-[#262626]"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "Métricas" && <Metrics />}
      {activeTab === "Pedidos" && <RecentOrders />}
      {activeTab === "Pagos" && 
        <div className="text-white p-6 container mx-auto">
          Componente de Pagos Próximamente
        </div>
      }
      {activeTab === "Corte" && <CashCut />}

      {activeModal && <Modal activeModal={activeModal} setActiveModal={setActiveModal} />}
    </div>
  );
};

export default Dashboard;
