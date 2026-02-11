import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { FaKey, FaExclamationTriangle, FaCheckCircle, FaLock } from 'react-icons/fa';
import { BsShieldLockFill } from 'react-icons/bs';

const LicenseLock = () => {
    const [licenseKey, setLicenseKey] = useState('');
    const [error, setError] = useState(null);
    const queryClient = useQueryClient();

    // Fetch config to check license status
    const { data: config, isLoading } = useQuery({
        queryKey: ['restaurantConfig'],
        queryFn: async () => {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/restaurant/config`);
            return res.data.data || null;
        }
    });

    const activateMutation = useMutation({
        mutationFn: async (key) => {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/restaurant/license/activate`, { licenseKey: key });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['restaurantConfig']);
            window.location.reload(); // Hard reload to clear any state
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Error al activar licencia');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);
        if (!licenseKey.trim()) return;
        activateMutation.mutate(licenseKey);
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-gray-900 text-white">Cargando sistema...</div>;

    // Check if license is valid
    const license = config?.license;
    const isLicenseValid = license?.status === 'active' && new Date(license.expirationDate) > new Date();
    
    // If valid, don't render anything (or render children if used as wrapper)
    if (isLicenseValid) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900 bg-opacity-95 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                <div className="bg-[#ecab0f] p-6 text-center">
                    <BsShieldLockFill className="text-6xl text-white mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
                        {license?.status === 'expired' ? 'Licencia Expirada' : 'Activación Requerida'}
                    </h2>
                </div>
                
                <div className="p-8">
                    <p className="text-gray-600 text-center mb-6">
                        {license?.status === 'expired' 
                            ? 'Su licencia de uso ha expirado. Por favor, renueve su suscripción para continuar usando el sistema.'
                            : 'Bienvenido. Para comenzar a utilizar el sistema POS, por favor ingrese su clave de licencia válida.'}
                    </p>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
                            <div className="flex">
                                <FaExclamationTriangle className="text-red-500 mt-1 mr-3" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Clave de Licencia</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaKey className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={licenseKey}
                                    onChange={(e) => setLicenseKey(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-[#ecab0f] focus:border-[#ecab0f] transition-colors uppercase font-mono tracking-widest"
                                    placeholder="XXXX-XXXX-XXXX-XXXX"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={activateMutation.isPending}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#ecab0f] hover:bg-[#d49a0e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ecab0f] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {activateMutation.isPending ? 'Validando...' : (
                                <>
                                    <FaCheckCircle className="mr-2" /> Activar Sistema
                                </>
                            )}
                        </button>
                    </form>
                    
                    <div className="mt-6 text-center text-xs text-gray-400">
                        <p>ID de Instalación: {config?._id || 'Desconocido'}</p>
                        <p className="mt-1">Contacte a soporte si necesita ayuda.</p>
                        <p className="mt-1 font-semibold text-[#ecab0f]">ey.lunia@gmail.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LicenseLock;
