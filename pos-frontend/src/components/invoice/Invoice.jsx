import React, { useRef } from "react";
import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa6";
import { useCurrency } from "../../hooks/useCurrency";
import { useSelector } from "react-redux";
import { getShortId } from "../../utils";

const Invoice = ({ orderInfo, setShowInvoice }) => {
  const { role } = useSelector((state) => state.user);
  const invoiceRef = useRef(null);
  const { formatCurrency } = useCurrency();

  const handlePrint = () => {
    const printContent = invoiceRef.current.innerHTML;
    const WinPrint = window.open("", "", "width=900,height=650");

    WinPrint.document.write(`
            <html>
              <head>
                <title>Recibo de Orden</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; }
                  .receipt-container { width: 300px; border: 1px solid #ddd; padding: 10px; }
                  h2 { text-align: center; }
                  .legal-disclaimer-container {
                      margin-top: 20px;
                      border-top: 2px dashed #000;
                      padding-top: 10px;
                      text-align: center;
                  }
                  .legal-disclaimer-header {
                      font-size: 12px;
                      font-weight: bold;
                      text-transform: uppercase;
                      margin-bottom: 5px;
                  }
                  .legal-disclaimer-text {
                      font-size: 10px;
                      color: #666;
                      line-height: 1.2;
                  }
                </style>
              </head>
              <body>
                ${printContent}
              </body>
            </html>
          `);

    WinPrint.document.close();
    WinPrint.focus();
    setTimeout(() => {
      WinPrint.print();
      WinPrint.close();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-4 rounded-lg shadow-lg w-[400px] max-h-[90vh] flex flex-col">
        {/* Receipt Content for Printing */}

        <div ref={invoiceRef} className="p-4 overflow-y-auto scrollbar-hide">
          {/* Receipt Header */}
          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 150 }}
              className="w-12 h-12 border-8 border-green-500 rounded-full flex items-center justify-center shadow-lg bg-green-500"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="text-2xl"
              >
                <FaCheck className="text-white" />
              </motion.span>
            </motion.div>
          </div>

          <h2 className="text-xl font-bold text-center mb-2">Recibo de Orden</h2>
          <p className="text-gray-600 text-center">¡Gracias por su pedido!</p>

          {/* Order Details */}

          <div className="mt-4 border-t pt-4 text-sm text-gray-700">
            <p>
              <strong>ID de Orden:</strong>{" "}
              {getShortId(orderInfo._id)}
            </p>
            <p>
              <strong>Nombre:</strong> {orderInfo.customerDetails?.name || "Cliente"}
            </p>
            {orderInfo.orderType === "Delivery" ? (
              <>
                <p>
                  <strong>Tipo:</strong> Domicilio
                </p>
                <p>
                  <strong>Dirección:</strong> {orderInfo.deliveryAddress || "N/A"}
                </p>
                <p>
                  <strong>Estado de Pago:</strong>{" "}
                  {orderInfo.orderStatus === "Completed" ? (
                    <span className="text-green-600 font-bold">PAGADO</span>
                  ) : (
                    <span className="text-red-600 font-bold">PENDIENTE POR COBRAR</span>
                  )}
                </p>
              </>
            ) : (
              <p>
                <strong>Mesa:</strong> {orderInfo.table?.tableNo || "N/A"}
              </p>
            )}
            <p>
              <strong>Teléfono:</strong> {orderInfo.customerDetails?.phone || "N/A"}
            </p>
            {orderInfo.orderType !== "Delivery" && (
              <p>
                <strong>Invitados:</strong> {orderInfo.customerDetails?.guests || 0}
              </p>
            )}
          </div>

          {/* Items Summary */}

          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold">Artículos Pedidos</h3>
            <ul className="text-sm text-gray-700">
              {orderInfo.items?.map((item, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center text-xs"
                >
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>{formatCurrency(item.price)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bills Summary */}

          <div className="mt-4 border-t pt-4 text-sm">
            <p>
              <strong>Subtotal:</strong> {formatCurrency(orderInfo.bills.total)}
            </p>
            <p>
              <strong>Impuesto:</strong> {formatCurrency(orderInfo.bills.tax)}
            </p>
            {orderInfo.bills.tip > 0 && (
            <p>
              <strong>Propina:</strong> {formatCurrency(orderInfo.bills.tip)}
            </p>
            )}
            <p className="text-md font-semibold">
              <strong>Total General:</strong> {formatCurrency(orderInfo.bills.totalWithTax)}
            </p>
          </div>

          {/* Payment Details */}

          {role !== "Waiter" && (
          <div className="mb-2 mt-2 text-xs">
            {orderInfo.paymentMethod === "Cash" && (
              <>
                <p>
                  <strong>Método de Pago:</strong> Efectivo
                </p>
                {orderInfo.paymentDetails && (
                  <>
                    <p>
                        <strong>Dinero Recibido:</strong> {formatCurrency(orderInfo.paymentDetails.cashReceived)}
                    </p>
                    <p>
                        <strong>Cambio:</strong> {formatCurrency(orderInfo.paymentDetails.change)}
                    </p>
                  </>
                )}
              </>
            )}
            
            {orderInfo.paymentMethod === "Transfer" && (
              <>
                <p>
                  <strong>Método de Pago:</strong> Transferencia
                </p>
                {orderInfo.paymentDetails && (
                  <>
                    <p>
                        <strong>Plataforma:</strong> {orderInfo.paymentDetails.transferPlatform}
                    </p>
                    <p>
                        <strong>Monto:</strong> {formatCurrency(orderInfo.paymentDetails.transferAmount)}
                    </p>
                  </>
                )}
              </>
            )}

            {orderInfo.paymentMethod === "Mixed" && (
              <>
                <p>
                  <strong>Método de Pago:</strong> Mixto
                </p>
                {orderInfo.paymentDetails && (
                  <>
                    <p>
                        <strong>Efectivo:</strong> {formatCurrency(orderInfo.paymentDetails.cashReceived)}
                    </p>
                    <p>
                        <strong>Transferencia ({orderInfo.paymentDetails.transferPlatform}):</strong> {formatCurrency(orderInfo.paymentDetails.transferAmount)}
                    </p>
                  </>
                )}
              </>
            )}

            {/* Legacy/Online Fallback if needed */}
            {orderInfo.paymentMethod !== "Cash" && orderInfo.paymentMethod !== "Transfer" && orderInfo.paymentMethod !== "Mixed" && (
               <>
                <p>
                  <strong>Método de Pago:</strong> {orderInfo.paymentMethod}
                </p>
                {orderInfo.paymentData?.externalTransactionId && (
                    <p>
                    <strong>ID de Pago:</strong> {orderInfo.paymentData.externalTransactionId}
                    </p>
                )}
              </>
            )}
          </div>
          )}
          <div className="mt-6 border-t-2 border-dashed pt-4 text-center legal-disclaimer-container">
            <p className="text-xs font-bold text-gray-800 uppercase mb-1 legal-disclaimer-header">
              *** NO ES UNA FACTURA ***
            </p>
            <p className="text-[10px] text-gray-600 leading-tight legal-disclaimer-text">
              Por favor pagar en caja. Este documento es un comprobante de pedido y no reemplaza la factura legal. 
              La factura original será entregada en caja al momento del pago.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-4">
          <button
            onClick={handlePrint}
            className="text-blue-500 hover:underline text-xs px-4 py-2 rounded-lg"
          >
            Imprimir Recibo
          </button>
          <button
            onClick={() => setShowInvoice(false)}
            className="text-red-500 hover:underline text-xs px-4 py-2 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
