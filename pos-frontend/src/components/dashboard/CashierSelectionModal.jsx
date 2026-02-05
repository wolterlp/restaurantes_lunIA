import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { IoMdClose, IoMdPerson } from 'react-icons/io';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../../https';

const CashierSelectionModal = ({ onClose, onSelect }) => {
    // We assume getUsers fetches all users. We might filter for cashiers if roles exist.
    const { data: usersRes } = useQuery({
        queryKey: ["users"],
        queryFn: getUsers
    });

    const users = usersRes?.data?.data || [];
    
    // Filter logic if role exists, otherwise show all
    // Assuming role 'Cashier' or 'Admin' can do sales.
    // For now, list all users to be safe or filter if we know the role string.
    const cashiers = users.filter(u => u.role === "Cashier" || u.role === "Admin" || u.role === "Waiter");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#1f1f1f] rounded-lg shadow-xl w-full max-w-md p-6 border border-[#333]"
            >
                <div className="flex justify-between items-center mb-6 border-b border-[#333] pb-4">
                    <h2 className="text-xl font-bold text-[#f5f5f5]">Seleccionar Cajero</h2>
                    <button onClick={onClose} className="text-[#ababab] hover:text-white">
                        <IoMdClose size={24} />
                    </button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {cashiers.map(cashier => (
                        <button
                            key={cashier._id}
                            onClick={() => onSelect(cashier)}
                            className="w-full flex items-center gap-4 p-4 bg-[#262626] rounded-lg hover:bg-[#333] transition-colors border border-transparent hover:border-[#ecab0f] group"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-[#ecab0f] group-hover:bg-[#ecab0f] group-hover:text-white transition-colors">
                                <IoMdPerson size={20} />
                            </div>
                            <div className="text-left">
                                <h3 className="text-[#f5f5f5] font-semibold">{cashier.name}</h3>
                                <p className="text-[#ababab] text-sm">{cashier.role}</p>
                            </div>
                        </button>
                    ))}

                    {cashiers.length === 0 && (
                        <div className="text-center text-[#ababab] py-8">
                            No se encontraron cajeros.
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default CashierSelectionModal;
