import React, { useState, useEffect } from "react";
import { MdTableBar, MdCategory } from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import { FaBox } from "react-icons/fa";
import { FaTruck } from "react-icons/fa6";
import RecentOrders from "../components/dashboard/RecentOrders";
import CashCut from "../components/dashboard/CashCut";
import Modal from "../components/dashboard/Modal";
import { useSelector } from "react-redux";

const buttons = [
    { label: "Gestionar Mesas", icon: <MdTableBar />, action: "table" },
    { label: "Gestionar Categorías", icon: <MdCategory />, action: "category" },
    { label: "Gestionar Platillos", icon: <BiSolidDish />, action: "dishes" },
    { label: "Gestionar Inventario", icon: <FaBox />, action: "inventory" },
    { label: "Gestionar Proveedores", icon: <FaTruck />, action: "suppliers" },
  ];

  const allTabs = ["Pedidos", "Pagos", "Corte"];

  const Dashboard = () => {
    const { role, permissions } = useSelector((state) => state.user);
    const tabs = role === "Admin" ? allTabs : ["Corte"];

    useEffect(() => {
      document.title = "POS | Panel de Admin"
    }, [])

    const [activeModal, setActiveModal] = useState(null);
    const [activeTab, setActiveTab] = useState(role === "Admin" ? "Pedidos" : "Corte");

    const handleOpenModal = (action) => {
    setActiveModal(action);
  };

  return (
    <div className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden">
      <div className="container mx-auto flex flex-col xl:flex-row items-center justify-between py-10 px-4 gap-6">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {(() => {
            const canManageInventory = permissions?.includes("MANAGE_INVENTORY") || role === "Admin";
            const canManageSuppliers = permissions?.includes("MANAGE_SUPPLIERS") || role === "Admin";
            const allowedButtons = buttons.filter(b => {
              if (b.action === "inventory") return canManageInventory;
              if (b.action === "suppliers") return canManageSuppliers;
              return role === "Admin";
            });
            return allowedButtons.map(({ label, icon, action }) => (
              <button
                key={action}
                onClick={() => handleOpenModal(action)}
                className="bg-[#1a1a1a] hover:bg-[#262626] px-8 py-3 rounded-lg text-[#f5f5f5] font-semibold text-md flex items-center gap-2"
              >
                {label} {icon}
              </button>
            ));
          })()}
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
