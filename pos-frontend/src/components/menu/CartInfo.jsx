import React, { useEffect, useRef } from "react";
import { RiDeleteBin2Fill } from "react-icons/ri";
import { FaNotesMedical } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { removeItem } from "../../redux/slices/cartSlice";

const CartInfo = () => {
  const cartData = useSelector((state) => state.cart);
  const scrolLRef = useRef();
  const dispatch = useDispatch();

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
                <p className="text-[#f5f5f5] font-semibold text-md">x{item.quantity}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <RiDeleteBin2Fill
                    onClick={() => handleRemove(item.id)}
                    className="text-[#ababab] cursor-pointer hover:text-red-500 transition-colors"
                    size={20}
                  />
                  <FaNotesMedical
                    className="text-[#ababab] cursor-pointer hover:text-blue-500 transition-colors"
                    size={20}
                  />
                </div>
                <p className="text-[#f5f5f5] text-md font-bold">${item.price}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CartInfo;
