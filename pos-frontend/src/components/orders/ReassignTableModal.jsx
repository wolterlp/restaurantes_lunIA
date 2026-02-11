import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTables, axiosWrapper } from "../../https";
import { useSnackbar } from "notistack";
import { motion } from "framer-motion";
import { FaChair, FaExchangeAlt } from "react-icons/fa";

const ReassignTableModal = ({ order, onClose }) => {
  const [selectedTable, setSelectedTable] = useState("");
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // Fetch Tables
  const { data: tablesData, isLoading } = useQuery({
    queryKey: ["tables"],
    queryFn: getTables,
  });

  const availableTables = tablesData?.data?.data?.filter(t => t.status === "Available") || [];

  // Mutation
  const reassignMutation = useMutation({
    mutationFn: async (newTableId) => {
        return await axiosWrapper.put(`/api/order/${order._id}/reassign`, { newTableId });
    },
    onSuccess: (response) => {
      const updatedOrder = response.data.data;
      
      // Update orders cache immediately
      queryClient.setQueryData(["orders"], (oldData) => {
        if (!oldData) return oldData;
        const newOrders = oldData.data.data.map(o => o._id === updatedOrder._id ? updatedOrder : o);
        return { ...oldData, data: { ...oldData.data, data: newOrders } };
      });

      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["tables"]);
      enqueueSnackbar("Mesa reasignada con éxito", { variant: "success" });
      onClose();
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.message || "Error al reasignar mesa", { variant: "error" });
    },
  });

  const handleReassign = () => {
    if (!selectedTable) {
        enqueueSnackbar("Seleccione una mesa", { variant: "warning" });
        return;
    }
    reassignMutation.mutate(selectedTable);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1f1f1f] p-6 rounded-lg shadow-xl w-full max-w-md border border-[#333] max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        <h2 className="text-xl font-bold text-[#f5f5f5] mb-4 flex items-center gap-2">
            <FaExchangeAlt className="text-[#f6b100]" /> Reasignar Mesa
        </h2>
        
        <p className="text-[#ababab] mb-4">
            Mesa actual: <span className="font-bold text-[#f5f5f5]">{order.table?.tableNo || "N/A"}</span>
        </p>

        {isLoading ? (
            <p className="text-[#f5f5f5]">Cargando mesas...</p>
        ) : (
            <div className="grid grid-cols-3 gap-3 mb-6">
                {availableTables.length === 0 ? (
                    <p className="col-span-3 text-red-400 text-center">No hay mesas disponibles</p>
                ) : (
                    availableTables.map(table => (
                        <button
                            key={table._id}
                            onClick={() => setSelectedTable(table._id)}
                            className={`p-3 rounded border flex flex-col items-center justify-center gap-1 transition-all ${
                                selectedTable === table._id 
                                ? "bg-[#f6b100] text-[#1f1f1f] border-[#f6b100]" 
                                : "bg-[#262626] text-[#f5f5f5] border-[#333] hover:border-[#f6b100]"
                            }`}
                        >
                            <FaChair size={20} />
                            <span className="font-bold">Mesa {table.tableNo}</span>
                            <span className="text-xs">{table.seats} Asientos</span>
                        </button>
                    ))
                )}
            </div>
        )}

        <div className="flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 rounded text-[#ababab] hover:bg-[#333] transition-colors"
            >
                Cancelar
            </button>
            <button 
                onClick={handleReassign}
                disabled={reassignMutation.isPending || !selectedTable}
                className="px-4 py-2 rounded bg-[#f6b100] text-[#1f1f1f] font-bold hover:bg-[#d49a00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {reassignMutation.isPending ? "Reasignando..." : "Confirmar Cambio"}
            </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ReassignTableModal;
