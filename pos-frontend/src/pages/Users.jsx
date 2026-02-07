import React, { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllUsers, deleteUser, updateUser, register, getRoles, updateRolePermissions, resetRoles } from "../https";
import { enqueueSnackbar } from "notistack";
import { MdDelete, MdEdit } from "react-icons/md";
import Modal from "../components/shared/Modal";

const PERMISSION_LABELS = {
    "MANAGE_USERS": "Gestión de Usuarios",
    "MANAGE_SETTINGS": "Configuración del Restaurante",
    "MANAGE_CASH": "Caja y Movimientos",
    "MANAGE_MENU": "Gestión del Menú",
    "MANAGE_ORDERS": "Crear y Gestionar Pedidos",
    "VIEW_REPORTS": "Ver Reportes",
    "VIEW_DELIVERY": "Ver Domicilios",
    "VIEW_COMPLETED": "Ver Pedidos Completados"
};

const Users = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    countryCode: "+57",
    phone: "",
    password: "",
    role: "Waiter",
    status: "Active"
  });

  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  const countryCodes = [
    { code: "+1", country: "US/CA" },
    { code: "+52", country: "MX" },
    { code: "+57", country: "CO" },
    { code: "+34", country: "ES" },
    { code: "+54", country: "AR" },
    { code: "+56", country: "CL" },
    { code: "+51", country: "PE" },
    { code: "+593", country: "EC" },
    { code: "+58", country: "VE" },
    { code: "+503", country: "SV" },
    { code: "+502", country: "GT" },
    { code: "+504", country: "HN" },
    { code: "+505", country: "NI" },
    { code: "+506", country: "CR" },
    { code: "+507", country: "PA" },
    { code: "+591", country: "BO" },
    { code: "+595", country: "PY" },
    { code: "+598", country: "UY" },
    { code: "+86", country: "CN" },
    { code: "+91", country: "IN" },
    // Add more as needed
  ];

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
  });

  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
    enabled: isPermissionsModalOpen
  });

  const updateRoleMutation = useMutation({
    mutationFn: updateRolePermissions,
    onSuccess: () => {
        queryClient.invalidateQueries(["roles"]);
        enqueueSnackbar("Permisos actualizados", { variant: "success" });
    },
    onError: () => enqueueSnackbar("Error al actualizar permisos", { variant: "error" })
  });

  const resetRolesMutation = useMutation({
    mutationFn: resetRoles,
    onSuccess: () => {
        queryClient.invalidateQueries(["roles"]);
        enqueueSnackbar("Roles restablecidos a valores por defecto", { variant: "success" });
    },
    onError: () => enqueueSnackbar("Error al restablecer roles", { variant: "error" })
  });

  const handlePermissionChange = (role, permission) => {
    const currentPermissions = role.permissions || [];
    let newPermissions;
    if (currentPermissions.includes(permission)) {
        newPermissions = currentPermissions.filter(p => p !== permission);
    } else {
        newPermissions = [...currentPermissions, permission];
    }
    updateRoleMutation.mutate({ id: role._id, permissions: newPermissions });
  };

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
    onError: (error) => {
      const message = error.response?.data?.message || "Error al actualizar usuario";
      enqueueSnackbar(message, { variant: "error" });
    },
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
      phone: user.phone || "",
      countryCode: user.countryCode || "+57",
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
      countryCode: "+57",
      password: "",
      role: "Waiter",
      status: "Active",
    });
    setIsModalOpen(true);
  };

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-10 py-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
            Gestión de Usuarios
          </h1>
        </div>
        <div className="flex gap-4">
            <button
            onClick={() => setIsPermissionsModalOpen(true)}
            className="bg-[#383838] text-white px-4 py-2 rounded font-semibold hover:bg-[#4a4a4a]"
            >
            Ver Permisos
            </button>
            <button
            onClick={openCreateModal}
            className="bg-[#ecab0f] text-white px-4 py-2 rounded font-semibold"
            >
            + Nuevo Usuario
            </button>
        </div>
      </div>

      <div className="px-10 py-4 overflow-y-auto flex-1 pb-20">
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
                  <label className="inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={user.status === 'Active'} 
                        onChange={(e) => {
                            const newStatus = e.target.checked ? 'Active' : 'Inactive';
                            updateMutation.mutate({ id: user._id, status: newStatus });
                        }}
                        className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
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
            <div className="flex gap-2">
                <select
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] w-24"
                >
                    {countryCodes.map((c) => (
                        <option key={c.code} value={c.code}>
                            {c.code} {c.country}
                        </option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder="Teléfono (solo números)"
                    value={formData.phone}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*$/.test(val)) {
                            setFormData({ ...formData, phone: val });
                        }
                    }}
                    className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] flex-1"
                />
            </div>
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
            <button 
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-[#ecab0f] text-white py-2 rounded font-bold hover:bg-[#d49a0e] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending || updateMutation.isPending ? "Procesando..." : (editingUser ? "Actualizar" : "Crear")}
            </button>
          </form>
        </Modal>
      )}

      {isPermissionsModalOpen && (
        <Modal
          isOpen={isPermissionsModalOpen}
          title="Gestión de Permisos por Rol"
          onClose={() => setIsPermissionsModalOpen(false)}
        >
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
                <button 
                    onClick={() => {
                        if(confirm("¿Estás seguro de restablecer todos los permisos a sus valores originales?")) {
                            resetRolesMutation.mutate();
                        }
                    }}
                    className="text-red-400 hover:text-red-300 text-sm underline"
                >
                    Restablecer Permisos por Defecto
                </button>
            </div>
            
            {isLoadingRoles ? (
                <p className="text-white">Cargando roles...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-gray-300">
                        <thead>
                            <tr className="border-b border-[#383838]">
                                <th className="p-2">Permiso / Rol</th>
                                {rolesData?.data?.data?.map(role => (
                                    <th key={role._id} className="p-2 text-center text-sm">{role.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                                <tr key={key} className="border-b border-[#383838] hover:bg-[#2a2a2a]">
                                    <td className="p-2 text-sm font-medium">{label}</td>
                                    {rolesData?.data?.data?.map(role => {
                                        const hasPermission = role.permissions?.includes(key);
                                        return (
                                            <td key={`${role._id}-${key}`} className="p-2 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={hasPermission} 
                                                    onChange={() => handlePermissionChange(role, key)}
                                                    className="w-4 h-4 accent-[#ecab0f] cursor-pointer"
                                                    disabled={role.name === 'Admin' && key === 'MANAGE_USERS'} // Prevent locking out Admin
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
          </div>
        </Modal>
      )}

      <BottomNav />
    </section>
  );
};

export default Users;