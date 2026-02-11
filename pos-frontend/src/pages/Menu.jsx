import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import { MdRestaurantMenu } from "react-icons/md";
import MenuContainer from "../components/menu/MenuContainer";
import CustomerInfo from "../components/menu/CustomerInfo";
import CartInfo from "../components/menu/CartInfo";
import Bill from "../components/menu/Bill";
import { useSelector, useDispatch } from "react-redux";
import { setCustomer, updateTable } from "../redux/slices/customerSlice";

const Menu = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { orderId, table, customerName, orderType, deliveryAddress } = location.state || {};

  useEffect(() => {
    document.title = "POS | Menú"
    
    if (orderId) {
        dispatch(setCustomer({ 
          name: customerName || "Cliente", 
          phone: "", 
          guests: 0,
          orderType: orderType || "Dine-In",
          deliveryAddress: deliveryAddress || ""
        }));
        if (table) {
          dispatch(updateTable({ table: table }));
        }
    }
  }, [orderId, table, customerName, orderType, deliveryAddress, dispatch])

  const customerData = useSelector((state) => state.customer);

  return (
    <section className="bg-[#1f1f1f] min-h-[calc(100vh-5rem)] flex flex-col md:flex-row gap-3">
      {/* Left Div */}
      <div className="w-full md:flex-[3] pb-20">
        <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-10 py-4 gap-3">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <BackButton />
            <h1 className="text-[#f5f5f5] text-xl md:text-2xl font-bold tracking-wider">
              Menú
            </h1>
          </div>
          <div className="flex items-center justify-around gap-4">
            <div className="flex items-center gap-3 cursor-pointer">
              <MdRestaurantMenu className="text-[#f5f5f5] text-2xl md:text-4xl" />
              <div className="flex flex-col items-start">
                <h1 className="text-sm md:text-md text-[#f5f5f5] font-semibold tracking-wide">
                  {customerData.customerName || "Nombre del Cliente"}
                </h1>
                <p className="text-xs text-[#ababab] font-medium">
                  {customerData.orderType === "Delivery" ? "Domicilio" : `Mesa : ${customerData.table?.tableNo || "N/A"}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <MenuContainer />
      </div>
      {/* Right Div */}
      <div className="w-full md:flex-[1] bg-[#1a1a1a] mt-0 md:mt-4 mb-20 md:mr-3 rounded-lg pt-2 flex flex-col">
        {/* Customer Info */}
        <CustomerInfo />
        <hr className="border-[#2a2a2a] border-t-2" />
        {/* Cart Items */}
        <CartInfo />
        <hr className="border-[#2a2a2a] border-t-2" />
        {/* Bills */}
        <Bill orderId={orderId} />
      </div>

      <BottomNav />
    </section>
  );
};

export default Menu;
