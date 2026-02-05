import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTotalPrice } from "../../redux/slices/cartSlice";
import {
  addOrder,
  updateTable,
} from "../../https/index";
import { useSnackbar } from "notistack";
import { useMutation } from "@tanstack/react-query";
import { removeAllItems } from "../../redux/slices/cartSlice";
import { removeCustomer } from "../../redux/slices/customerSlice";
import Invoice from "../invoice/Invoice";

const Bill = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const customerData = useSelector((state) => state.customer);
  const cartData = useSelector((state) => state.cart);
  const total = useSelector(getTotalPrice);
  const taxRate = 5.25;
  const tax = (total * taxRate) / 100;
  const totalPriceWithTax = total + tax;

  const [paymentMethod, setPaymentMethod] = useState();
  const [cashReceived, setCashReceived] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferPlatform, setTransferPlatform] = useState("");
  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [orderInfo, setOrderInfo] = useState();

  // Calcular cambio para pago en efectivo
  const change = paymentMethod === "Cash" && cashReceived 
    ? (parseFloat(cashReceived) - totalPriceWithTax).toFixed(2) 
    : (paymentMethod === "Online" && isMixedPayment && cashReceived && transferAmount)
    ? ((parseFloat(cashReceived) + parseFloat(transferAmount)) - totalPriceWithTax).toFixed(2)
    : "0.00";

  // Calcular faltante/sobrante para pago mixto o transferencia
  const totalPaid = (parseFloat(cashReceived) || 0) + (parseFloat(transferAmount) || 0);
  const remaining = (totalPriceWithTax - totalPaid).toFixed(2);
  const isPaid = totalPaid >= totalPriceWithTax - 0.01; // Tolerancia pequeña

  const handlePlaceOrder = async () => {
    console.log("--- START PLACE ORDER ---");
    console.log("Cart Data Length:", cartData.length);
    console.log("Customer Data:", customerData);
    console.log("Payment Method:", paymentMethod);

    if (cartData.length === 0) {
      console.log("Error: Cart is empty");
      enqueueSnackbar("¡Tu carrito está vacío!", {
        variant: "warning",
      });
      return;
    }

    if (!customerData.table) {
      console.log("Error: No table selected");
      enqueueSnackbar("¡Por favor selecciona una mesa primero!", {
        variant: "warning",
      });
      return;
    }

    if (!customerData.customerName) {
      console.log("Error: No customer name");
      enqueueSnackbar("¡Por favor ingresa el nombre del cliente!", {
        variant: "warning",
      });
      return;
    }

    if (!paymentMethod) {
      console.log("Error: No payment method selected");
      enqueueSnackbar("¡Por favor selecciona un método de pago!", {
        variant: "warning",
      });
      return;
    }

    // Validaciones de pago
    if (paymentMethod === "Cash" && parseFloat(cashReceived) < totalPriceWithTax) {
        enqueueSnackbar("¡Dinero recibido insuficiente!", { variant: "warning" });
        return;
    }

    if (paymentMethod === "Online") {
        if (!transferPlatform) {
            enqueueSnackbar("¡Selecciona la plataforma de transferencia!", { variant: "warning" });
            return;
        }
        
        if (isMixedPayment) {
             if (!isPaid) {
                enqueueSnackbar(`¡Pago incompleto! Faltan $${remaining}`, { variant: "warning" });
                return;
             }
        } else {
            // If not mixed, assumes full transfer
            // No specific validation needed other than platform selected
        }
    }

    // Preparar datos de pago
    let paymentDetails = {
        cashReceived: 0,
        change: 0,
        transferPlatform: "",
        transferAmount: 0
    };

    if (paymentMethod === "Cash") {
        paymentDetails = {
            cashReceived: parseFloat(cashReceived) || 0,
            change: parseFloat(change),
            transferPlatform: "",
            transferAmount: 0
        };
    } else if (paymentMethod === "Online") {
        if (isMixedPayment) {
            paymentDetails = {
                cashReceived: parseFloat(cashReceived) || 0,
                change: parseFloat(change) > 0 ? parseFloat(change) : 0,
                transferPlatform: transferPlatform,
                transferAmount: parseFloat(transferAmount) || 0
            };
        } else {
             paymentDetails = {
                cashReceived: 0,
                change: 0,
                transferPlatform: transferPlatform,
                transferAmount: totalPriceWithTax
            };
        }
    }

    // Place the order
    const orderData = {
      customerDetails: {
        name: customerData.customerName,
        phone: customerData.customerPhone,
        guests: customerData.guests,
      },
      orderStatus: "In Progress",
      bills: {
        total: total,
        tax: tax,
        totalWithTax: totalPriceWithTax,
      },
      items: cartData,
      table: customerData.table.tableId,
      paymentMethod: paymentMethod,
      paymentDetails: paymentDetails, // Updated to match backend schema
    };
    
    console.log("Submitting Order Data:", orderData);
    orderMutation.mutate(orderData);
  };

  const orderMutation = useMutation({
    mutationFn: (reqData) => addOrder(reqData),
    onSuccess: (resData, variables) => { // variables contains the orderData passed to mutate
      const { data } = resData.data;
      console.log(data);

      // Merge backend response with local cash details if available
      // The backend should return the saved paymentDetails
      const finalOrderInfo = {
          ...data,
          paymentDetails: variables.paymentDetails
      };

      setOrderInfo(finalOrderInfo);

      // Update Table
      const tableData = {
        status: "Booked",
        orderId: data._id,
        tableId: data.table,
      };

      setTimeout(() => {
        tableUpdateMutation.mutate(tableData);
      }, 1500);

      enqueueSnackbar("¡Pedido Realizado!", {
        variant: "success",
      });
      setShowInvoice(true);
    },
    onError: (error) => {
      console.log(error);
      enqueueSnackbar("¡Error al realizar el pedido!", {
        variant: "error",
      });
    },
  });

  const tableUpdateMutation = useMutation({
    mutationFn: (reqData) => updateTable(reqData),
    onSuccess: (resData) => {
      console.log(resData);
      dispatch(removeCustomer());
      dispatch(removeAllItems());
    },
    onError: (error) => {
      console.log(error);
    },
  });

  return (
    <>
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">
          Ítems({cartData.length})
        </p>
        <h1 className="text-[#f5f5f5] text-md font-bold">
          ${total.toFixed(2)}
        </h1>
      </div>
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">Impuesto(5.25%)</p>
        <h1 className="text-[#f5f5f5] text-md font-bold">${tax.toFixed(2)}</h1>
      </div>
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">
          Total con Impuestos
        </p>
        <h1 className="text-[#f5f5f5] text-md font-bold">
          ${totalPriceWithTax.toFixed(2)}
        </h1>
      </div>
      <div className="flex items-center gap-3 px-5 mt-2">
        <button
          onClick={() => setPaymentMethod("Cash")}
          className={`px-4 py-2 w-full rounded-lg font-semibold ${
            paymentMethod === "Cash" ? "bg-[#f6b100] text-[#1f1f1f]" : "bg-[#1f1f1f] text-[#ababab]"
          }`}
        >
          Efectivo
        </button>
        <button
          onClick={() => setPaymentMethod("Online")}
          className={`px-4 py-2 w-full rounded-lg font-semibold ${
            paymentMethod === "Online" ? "bg-[#f6b100] text-[#1f1f1f]" : "bg-[#1f1f1f] text-[#ababab]"
          }`}
        >
          En línea
        </button>
      </div>

      {paymentMethod === "Cash" && (
        <div className="px-5 mt-4">
          <label className="block text-[#ababab] text-xs font-medium mb-1">
            Dinero Recibido
          </label>
          <div className="flex items-center justify-between gap-4">
            <input
              type="number"
              min="0"
              value={cashReceived}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || parseFloat(val) >= 0) {
                    setCashReceived(val);
                }
              }}
              placeholder="Ingresar monto"
              className="bg-[#1f1f1f] text-[#f5f5f5] px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-[#f6b100]"
            />
            <div className="text-right w-1/2">
                <p className="text-[#ababab] text-xs">Cambio</p>
                <p className={`font-bold text-lg ${parseFloat(change) < 0 ? 'text-red-500' : 'text-[#f5f5f5]'}`}>${change}</p>
            </div>
          </div>
        </div>
      )}

      {paymentMethod === "Online" && (
        <div className="px-5 mt-4 space-y-3">
             <div className="flex items-center gap-2 mb-3">
                <input 
                    type="checkbox" 
                    checked={isMixedPayment} 
                    onChange={(e) => setIsMixedPayment(e.target.checked)} 
                    id="mixedPayment"
                    className="w-4 h-4 text-[#f6b100] bg-[#1f1f1f] border-gray-600 rounded focus:ring-[#f6b100]"
                />
                <label htmlFor="mixedPayment" className="text-[#ababab] text-sm cursor-pointer select-none">Pago Mixto (Efectivo + Transferencia)</label>
            </div>

            <div>
                <label className="block text-[#ababab] text-xs font-medium mb-1">
                    Plataforma de Transferencia
                </label>
                <select 
                    value={transferPlatform} 
                    onChange={(e) => setTransferPlatform(e.target.value)}
                    className="bg-[#1f1f1f] text-[#f5f5f5] px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-[#f6b100]"
                >
                    <option value="">Seleccionar plataforma...</option>
                    <option value="Bancolombia">Bancolombia</option>
                    <option value="Nequi">Nequi</option>
                    <option value="Daviplata">Daviplata</option>
                    <option value="Movii">Movii</option>
                    <option value="Otro">Otro</option>
                </select>
            </div>

            {isMixedPayment ? (
                <>
                    <div>
                        <label className="block text-[#ababab] text-xs font-medium mb-1">
                            Monto Transferencia
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={transferAmount}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || parseFloat(val) >= 0) {
                                    setTransferAmount(val);
                                }
                            }}
                            placeholder="Monto por transferencia"
                            className="bg-[#1f1f1f] text-[#f5f5f5] px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-[#f6b100]"
                        />
                    </div>
                    <div>
                        <label className="block text-[#ababab] text-xs font-medium mb-1">
                            Efectivo
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={cashReceived}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || parseFloat(val) >= 0) {
                                    setCashReceived(val);
                                }
                            }}
                            placeholder="Monto en efectivo"
                            className="bg-[#1f1f1f] text-[#f5f5f5] px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-[#f6b100]"
                        />
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[#333]">
                        <p className="text-[#ababab] text-xs">Total Pagado: <span className="text-white font-bold">${totalPaid.toFixed(2)}</span></p>
                         <div className="text-right">
                            <p className="text-[#ababab] text-xs">{parseFloat(change) >= 0 ? "Cambio" : "Faltante"}</p>
                            <p className={`font-bold text-lg ${parseFloat(change) < 0 ? 'text-red-500' : 'text-[#f5f5f5]'}`}>
                                ${parseFloat(change) >= 0 ? change : remaining}
                            </p>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-[#1f1f1f] p-3 rounded-lg border border-[#333]">
                    <p className="text-[#ababab] text-sm text-center">
                        Pago completo por transferencia: <span className="text-[#f6b100] font-bold text-lg block mt-1">${totalPriceWithTax.toFixed(2)}</span>
                    </p>
                </div>
            )}
        </div>
      )}

      <div className="flex items-center gap-3 px-5 mt-2">
        <button className="bg-[#025cca] px-4 py-2 w-full rounded-lg text-[#f5f5f5] font-semibold text-lg">
          Imprimir Recibo
        </button>
        <button
          onClick={handlePlaceOrder}
          className="bg-[#f6b100] px-4 py-2 w-full rounded-lg text-[#1f1f1f] font-semibold text-lg"
        >
          Realizar Pedido
        </button>
      </div>

      {showInvoice && (
        <Invoice orderInfo={orderInfo} setShowInvoice={setShowInvoice} />
      )}
    </>
  );
};

export default Bill;
