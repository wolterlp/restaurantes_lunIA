import React, { useState } from "react";
import { register } from "../../https";
import { useMutation } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { FaUserShield, FaConciergeBell, FaCashRegister, FaUtensils, FaMotorcycle } from "react-icons/fa";

const Register = ({setIsRegister}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    countryCode: "+57",
    phone: "",
    password: "",
    role: "",
  });

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
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelection = (selectedRole) => {
    setFormData({ ...formData, role: selectedRole });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  const registerMutation = useMutation({
    mutationFn: (reqData) => register(reqData),
    onSuccess: (res) => {
      const { data } = res;
      enqueueSnackbar(data.message, { variant: "success" });
      setFormData({
        name: "",
        email: "",
        countryCode: "+57",
        phone: "",
        password: "",
        role: "",
      });
      
      const { _id, name, email, phone, role } = data.data;
      dispatch(setUser({ _id, name, email, phone, role }));
      if (role === "Admin") {
        navigate("/");
      } else if (role === "Waiter") {
        navigate("/orders");
      } else {
        navigate("/orders");
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Error al registrar empleado";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label className="block text-gray-300 mb-2 text-sm font-bold">
            Nombre del Empleado
          </label>
          <div className="flex items-center rounded-lg p-5 px-4 bg-[#262626] border border-gray-700 focus-within:border-yellow-400 focus-within:ring-1 focus-within:ring-yellow-400 transition-all">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ingrese nombre del empleado"
              className="bg-transparent flex-1 text-white focus:outline-none"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-300 mb-2 mt-3 text-sm font-bold">
            Correo del Empleado
          </label>
          <div className="flex items-center rounded-lg p-5 px-4 bg-[#262626] border border-gray-700 focus-within:border-yellow-400 focus-within:ring-1 focus-within:ring-yellow-400 transition-all">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ingrese correo del empleado"
              className="bg-transparent flex-1 text-white focus:outline-none"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-300 mb-2 mt-3 text-sm font-bold">
            Teléfono del Empleado
          </label>
          <div className="flex gap-2">
            <div className="flex items-center rounded-lg bg-[#262626] border border-gray-700 w-28 focus-within:border-yellow-400 focus-within:ring-1 focus-within:ring-yellow-400 transition-all">
                 <select
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleChange}
                    className="bg-transparent w-full p-4 text-white outline-none appearance-none text-center cursor-pointer"
                  >
                    {countryCodes.map((c) => (
                        <option key={c.code} value={c.code} className="bg-[#1f1f1f]">
                            {c.code} {c.country}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex items-center rounded-lg p-4 bg-[#262626] border border-gray-700 flex-1 focus-within:border-yellow-400 focus-within:ring-1 focus-within:ring-yellow-400 transition-all">
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) {
                          setFormData({ ...formData, phone: val });
                      }
                  }}
                  placeholder="Ingrese teléfono (solo números)"
                  className="bg-transparent flex-1 text-white focus:outline-none"
                  required
                />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-gray-300 mb-2 mt-3 text-sm font-bold">
            Contraseña
          </label>
          <div className="flex items-center rounded-lg p-5 px-4 bg-[#262626] border border-gray-700 focus-within:border-yellow-400 focus-within:ring-1 focus-within:ring-yellow-400 transition-all">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Ingrese contraseña"
              className="bg-transparent flex-1 text-white focus:outline-none"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-300 mb-2 mt-3 text-sm font-bold">
            Elige tu rol
          </label>

          <div className="flex item-center gap-3 mt-4 flex-wrap">
            {[
              { value: "Waiter", label: "Mesero", icon: <FaConciergeBell /> },
              { value: "Cashier", label: "Cajero", icon: <FaCashRegister /> },
              { value: "Admin", label: "Admin", icon: <FaUserShield /> },
              { value: "Kitchen", label: "Cocina", icon: <FaUtensils /> },
              { value: "Delivery", label: "Repartidor", icon: <FaMotorcycle /> }
            ].map((roleObj) => {
              return (
                <button
                  key={roleObj.value}
                  type="button"
                  onClick={() => handleRoleSelection(roleObj.value)}
                  className={`flex flex-col items-center justify-center gap-2 bg-[#262626] border border-gray-700 px-4 py-3 w-full sm:w-auto flex-1 rounded-lg text-[#ababab] hover:bg-[#333] transition-colors ${
                    formData.role === roleObj.value ? "bg-indigo-700 text-white border-indigo-700" : ""
                  }`}
                  title={roleObj.label}
                >
                  <span className="text-2xl">{roleObj.icon}</span>
                  <span className="text-xs font-medium">{roleObj.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg mt-6 py-3 text-lg bg-yellow-400 text-gray-900 font-bold"
        >
          Registrarse
        </button>
      </form>
    </div>
  );
};

export default Register;
