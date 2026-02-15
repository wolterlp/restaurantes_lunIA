import React, { useState, useEffect } from "react";
import { menus } from "../../constants";
import { GrRadialSelected } from "react-icons/gr";
import { FaShoppingCart } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { addItems } from "../../redux/slices/cartSlice";
import { useQuery } from "@tanstack/react-query";
import { getAllCategories } from "../../https";
import { useCurrency } from "../../hooks/useCurrency";


const MenuContainer = () => {
  const dispatch = useDispatch();
  const { formatCurrency } = useCurrency();
  
  const { data: remoteCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: getAllCategories,
  });

  const displayMenus = remoteCategories?.data?.length > 0 ? remoteCategories.data : menus;

  const [selected, setSelected] = useState(displayMenus[0]);
  const [itemCount, setItemCount] = useState(0);
  const [itemId, setItemId] = useState();

  useEffect(() => {
    if (remoteCategories?.data?.length > 0) {
      setSelected(remoteCategories.data[0]);
    }
  }, [remoteCategories]);

  const increment = (id) => {
    setItemId(id);
    if (itemCount >= 4) return;
    setItemCount((prev) => prev + 1);
  };

  const decrement = (id) => {
    setItemId(id);
    if (itemCount <= 0) return;
    setItemCount((prev) => prev - 1);
  };

  const handleAddToCart = (item) => {
    if(itemCount === 0) return;

    const {name, price} = item;
    const isNoPrep = ((item.prepTime ?? 15) === 0);
    const availableStock = typeof item.stock === "number" ? item.stock : Infinity;
    if (isNoPrep) {
      if (availableStock <= 0) return;
      if (itemCount > availableStock) return;
    }
    const newObj = { 
      id: Date.now(), 
      dishId: item._id || item.id, // Store original dish ID
      name, 
      pricePerQuantity: price, 
      quantity: itemCount, 
      price: price * itemCount 
    };

    dispatch(addItems(newObj));
    setItemCount(0);
  }


  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-10 py-4 w-[100%]">
        {displayMenus.map((menu) => {
          return (
            <div
              key={menu._id || menu.id}
              className="flex flex-col items-start justify-between p-4 rounded-lg min-h-[80px] sm:min-h-[100px] h-full cursor-pointer transition-all duration-200"
              style={{ backgroundColor: menu.bgColor }}
              onClick={() => {
                setSelected(menu);
                setItemId(0);
                setItemCount(0);
              }}
            >
              <div className="flex items-start justify-between w-full">
                <h1 className="text-[#f5f5f5] text-base sm:text-lg font-semibold break-words w-[90%]">
                  {menu.icon} {menu.name}
                </h1>
                {selected && (selected._id || selected.id) === (menu._id || menu.id) && (
                  <GrRadialSelected className="text-white shrink-0 mt-1" size={20} />
                )}
              </div>
              <p className="text-[#ababab] text-xs sm:text-sm font-semibold">
                {menu.items.length} Ítems
              </p>
            </div>
          );
        })}
      </div>

      <hr className="border-[#2a2a2a] border-t-2 mt-4" />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 sm:px-10 py-4 w-[100%]">
        {selected?.items?.map((item) => {
          return (
            <div
              key={item._id || item.id}
              className="flex flex-col items-start justify-between p-3 rounded-lg min-h-[140px] cursor-pointer hover:bg-[#2a2a2a] bg-[#1a1a1a]"
            >
              <div className="flex items-start justify-between w-full">
                <h1 className="text-[#f5f5f5] text-md font-semibold truncate pr-2">
                  {item.name}
                </h1>
                <button onClick={() => handleAddToCart(item)} className="bg-[#2e4a40] text-[#02ca3a] p-1.5 rounded-lg"><FaShoppingCart size={16} /></button>
              </div>
              <div className="flex items-center justify-between w-full">
                <p className="text-[#f5f5f5] text-md font-bold">
                  {formatCurrency(item.price)}
                </p>
                <div className="flex items-center justify-between bg-[#1f1f1f] px-2 py-1 rounded-lg gap-2">
                  <button
                    onClick={() => decrement(item._id || item.id)}
                    className="text-yellow-500 text-xl font-bold"
                  >
                    &minus;
                  </button>
                  <span className="text-white text-sm">
                    {(itemId == (item._id || item.id)) ? itemCount : "0"}
                  </span>
                  <button
                    onClick={() => increment(item._id || item.id)}
                    className="text-yellow-500 text-xl font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="w-full mt-2">
                {((item.prepTime ?? 15) === 0) ? (
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${item.stock === 0 ? "bg-red-900 text-red-300" : "bg-[#333] text-[#ababab]"}`}>
                    Stock: {typeof item.stock === "number" ? item.stock : "N/A"}
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-[#333] text-[#ababab]">Preparación</span>
                )}
              </div>
              <div className="w-full mt-2">
                {(item.sku || item.barcode) && (
                  <p className="text-[#888] text-[11px] truncate">
                    {item.sku ? `SKU: ${item.sku}` : ""}{item.sku && item.barcode ? " | " : ""}{item.barcode ? `Código: ${item.barcode}` : ""}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default MenuContainer;
