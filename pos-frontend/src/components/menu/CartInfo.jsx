import React, { useEffect, useRef } from "react";
import { RiDeleteBin2Fill } from "react-icons/ri";
import { FaNotesMedical } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { removeItem, incrementItem, decrementItem, updateItemNote } from "../../redux/slices/cartSlice";
import { useCurrency } from "../../hooks/useCurrency";
import { FaMinus, FaPlus } from "react-icons/fa";

const CartInfo = () => {
  const cartData = useSelector((state) => state.cart);
  const scrolLRef = useRef();
  const dispatch = useDispatch();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    if(scrolLRef.current){
      scrolLRef.current.scrollTo({
        top: scrolLRef.current.scrollHeight,
        behavior: "smooth"
      })
    }
  },[cartData]);

  const handleRemove = (itemId) => {
    dispatch(removeItem(itemId));
  }

  const handleIncrement = (itemId) => {
    dispatch(incrementItem(itemId));
  }

  const handleDecrement = (itemId) => {
    dispatch(decrementItem(itemId));
  }

  const handleNote = (itemId, currentNote) => {
    const note = window.prompt("Agregar nota al plato:", currentNote || "");
    if (note !== null) {
      dispatch(updateItemNote({ id: itemId, note }));
    }
  }

  return (
    <div className="px-4 py-2 flex flex-col">
      <h1 className="text-xl text-[#e4e4e4] font-bold tracking-wide mb-2">
        Detalles del Pedido
      </h1>
      <div className="mt-2" ref={scrolLRef} >
        {cartData.length === 0 ? (
          <p className="text-[#ababab] text-sm flex justify-center items-center h-full">Tu carrito está vacío. ¡Empieza a agregar productos!</p>
        ) : cartData.map((item) => {
          return (
            <div key={item.id} className="bg-[#1f1f1f] rounded-lg px-3 py-3 mb-2">
              <div className="flex items-center justify-between">
                <h1 className="text-[#f5f5f5] font-semibold tracking-wide text-md">
                  {item.name}
                </h1>
                <div className="flex items-center gap-3 bg-[#2a2a2a] rounded-lg px-2 py-1">
                  <button 
                    onClick={() => handleDecrement(item.id)}
                    className="text-[#f6b100] hover:text-[#ffc107] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={item.quantity <= 1}
                  >
                    <FaMinus size={12} />
                  </button>
                  <span className="text-[#f5f5f5] font-semibold text-md w-4 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => handleIncrement(item.id)}
                    className="text-[#f6b100] hover:text-[#ffc107] transition-colors"
                  >
                    <FaPlus size={12} />
                  </button>
                </div>
              </div>
              {item.note && (
                <p className="text-[#ababab] text-xs mt-1 italic">Nota: {item.note}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <RiDeleteBin2Fill
                    onClick={() => handleRemove(item.id)}
                    className="text-[#ababab] cursor-pointer hover:text-red-500 transition-colors"
                    size={20}
                  />
                  <FaNotesMedical
                    onClick={() => handleNote(item.id, item.note)}
                    className="text-[#ababab] cursor-pointer hover:text-blue-500 transition-colors"
                    size={20}
                  />
                </div>
                <p className="text-[#f5f5f5] text-md font-bold">{formatCurrency(item.price)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CartInfo;
