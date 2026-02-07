import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

const cartSlice = createSlice({
    name : "cart",
    initialState,
    reducers : {
        addItems : (state, action) => {
            const existingItem = state.find(item => item.dishId === action.payload.dishId && item.name === action.payload.name);
            if (existingItem) {
                existingItem.quantity += action.payload.quantity;
                existingItem.price = existingItem.pricePerQuantity * existingItem.quantity;
            } else {
                state.push(action.payload);
            }
        },

        removeItem: (state, action) => {
            return state.filter(item => item.id != action.payload);
        },

        removeAllItems: (state) => {
            return [];
        },

        incrementItem: (state, action) => {
            const item = state.find(item => item.id === action.payload);
            if (item) {
                item.quantity += 1;
                item.price = item.pricePerQuantity * item.quantity;
            }
        },

        decrementItem: (state, action) => {
            const item = state.find(item => item.id === action.payload);
            if (item && item.quantity > 1) {
                item.quantity -= 1;
                item.price = item.pricePerQuantity * item.quantity;
            }
        },

        updateItemNote: (state, action) => {
            const { id, note } = action.payload;
            const item = state.find(item => item.id === id);
            if (item) {
                item.note = note;
            }
        }
    }
})

export const getTotalPrice = (state) => state.cart.reduce((total, item) => total + item.price, 0);
export const { addItems, removeItem, removeAllItems, incrementItem, decrementItem, updateItemNote } = cartSlice.actions;
export default cartSlice.reducer;