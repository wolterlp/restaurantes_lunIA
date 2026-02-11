import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query"
import { login } from "../../https/index"
import { enqueueSnackbar } from "notistack";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
 
const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const[formData, setFormData] = useState({
      email: "",
      password: "",
    });
  
    const handleChange = (e) => {
      setFormData({...formData, [e.target.name]: e.target.value});
    }

  
    const handleSubmit = (e) => {
      e.preventDefault();
      loginMutation.mutate(formData);
    }

    const loginMutation = useMutation({
      mutationFn: (reqData) => login(reqData),
      onSuccess: (res) => {
          const { data } = res;
          console.log(data);
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
        const message = error.response?.data?.message || "Error al iniciar sesión";
        enqueueSnackbar(message, { variant: "error" });
      }
    })

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label className="block text-[#ababab] mb-2 mt-3 text-sm font-medium">
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
          <label className="block text-[#ababab] mb-2 mt-3 text-sm font-medium">
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

        <button
          type="submit"
          className="w-full rounded-lg mt-6 py-3 text-lg bg-yellow-400 text-gray-900 font-bold"
        >
          Iniciar Sesión
        </button>
      </form>
    </div>
  );
};

export default Login;
