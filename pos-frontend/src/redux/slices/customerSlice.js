import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    orderId: "",
    customerName: "",
    customerPhone: "",
    guests: 0,
    table: null,
    orderType: "Dine-In",
    deliveryAddress: ""
}


const customerSlice = createSlice({
    name : "customer",
    initialState,
    reducers : {
        setCustomer: (state, action) => {
            const { name, phone, guests, orderType, deliveryAddress } = action.payload;
            state.orderId = `${Date.now()}`;
            state.customerName = name;
            state.customerPhone = phone;
            state.guests = guests || 0;
            state.orderType = orderType || "Dine-In";
            state.deliveryAddress = deliveryAddress || "";
        },

        removeCustomer: (state) => {
            state.customerName = "";
            state.customerPhone = "";
            state.guests = 0;
            state.table = null;
            state.orderType = "Dine-In";
            state.deliveryAddress = "";
        },

        updateTable: (state, action) => {
            state.table = action.payload.table;
        }

    }
})


export const { setCustomer, removeCustomer, updateTable } = customerSlice.actions;
export default customerSlice.reducer;