import React, { useState } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllUsers, deleteUser, updateUser, register } from "../https";
import { enqueueSnackbar } from "notistack";
import { MdDelete, MdEdit } from "react-icons/md";
import Modal from "../components/shared/Modal";

const Users = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "Waiter",
    status: "Active"
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      enqueueSnackbar("Usuario eliminado", { variant: "success" });
    },
    onError: () => enqueueSnackbar("Error al eliminar usuario", { variant: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setIsModalOpen(false);
      enqueueSnackbar("Usuario actualizado", { variant: "success" });
    },
    onError: () => enqueueSnackbar("Error al actualizar usuario", { variant: "error" }),
  });

  const createMutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setIsModalOpen(false);
      enqueueSnackbar("Usuario creado", { variant: "success" });
    },
    onError: (err) => enqueueSnackbar(err.response?.data?.message || "Error al crear usuario", { variant: "error" }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
        // Update logic (exclude password if empty)
        const dataToUpdate = { id: editingUser._id, ...formData };
        if(!dataToUpdate.password) delete dataToUpdate.password;
        updateMutation.mutate(dataToUpdate);
    } else {
        createMutation.mutate(formData);
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: "", // Don't show password
      role: user.role,
      status: user.status || "Active",
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "Waiter",
      status: "Active",
    });
    setIsModalOpen(true);
  };

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden">
      <div className="flex items-center justify-between px-10 py-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
            Gestión de Usuarios
          </h1>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-[#ecab0f] text-white px-4 py-2 rounded font-semibold"
        >
          + Nuevo Usuario
        </button>
      </div>

      <div className="px-10 py-4 overflow-y-auto h-full pb-20">
        <table className="w-full text-left text-gray-400">
          <thead className="bg-[#383838] text-gray-200 uppercase">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usersData?.data?.data?.map((user) => (
              <tr key={user._id} className="border-b border-[#383838] hover:bg-[#2a2a2a]">
                <td className="px-4 py-3">{user.name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold 
                    ${user.role === 'Admin' ? 'bg-red-900 text-red-300' : 
                      user.role === 'Waiter' ? 'bg-blue-900 text-blue-300' : 
                      user.role === 'Kitchen' ? 'bg-orange-900 text-orange-300' : 
                      'bg-green-900 text-green-300'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold 
                    ${user.status === 'Inactive' ? 'bg-gray-700 text-gray-400' : 'bg-green-900 text-green-300'}`}>
                    {user.status || "Active"}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-3">
                  <button onClick={() => openEditModal(user)} className="text-blue-400 hover:text-blue-300 text-xl">
                    <MdEdit />
                  </button>
                  <button 
                    onClick={() => {
                        if(confirm('¿Estás seguro de eliminar este usuario?')) deleteMutation.mutate(user._id)
                    }} 
                    className="text-red-400 hover:text-red-300 text-xl"
                  >
                    <MdDelete />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838]"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838]"
              required
            />
            <input
              type="text"
              placeholder="Teléfono"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838]"
              required
            />
            <input
              type="password"
              placeholder={editingUser ? "Nueva Contraseña (opcional)" : "Contraseña"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838]"
              required={!editingUser}
            />
            <div className="flex gap-4">
                <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] flex-1"
                >
                <option value="Admin">Admin</option>
                <option value="Waiter">Mesero</option>
                <option value="Kitchen">Cocina</option>
                <option value="Cashier">Caja</option>
                <option value="Delivery">Repartidor</option>
                </select>

                <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] flex-1"
                >
                <option value="Active">Activo</option>
                <option value="Inactive">Inactivo</option>
                </select>
            </div>
            <button className="bg-[#ecab0f] text-white py-2 rounded font-bold hover:bg-[#d49a0e]">
              {editingUser ? "Actualizar" : "Crear"}
            </button>
          </form>
        </Modal>
      )}

      <BottomNav />
    </section>
  );
};

export default Users;