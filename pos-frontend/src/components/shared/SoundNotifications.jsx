import React, { useEffect } from 'react';
import socket from '../../socket';
import { enqueueSnackbar } from 'notistack';

const SoundNotifications = () => {
  useEffect(() => {
    const playSound = (soundFile) => {
      const audio = new Audio(soundFile);
      audio.play().catch(error => {
        // Auto-play policy might block this if no user interaction happened yet
        console.error("Error playing sound:", error);
      });
    };

    const handleNewOrder = (data) => {
      console.log("New order received:", data);
      playSound('/sounds/campana.mp3');
      enqueueSnackbar("¡Nuevo pedido recibido!", { variant: "info" });
    };

    const handleOrderUpdate = (data) => {
       if (data.orderStatus === "Ready") {
          console.log("Order ready:", data);
          playSound('/sounds/campanaListo.mp3');
          const clientName = data.customerDetails?.name || "Cliente";
          enqueueSnackbar(`¡Pedido #${data._id.slice(-6)} de ${clientName} listo!`, { variant: "success" });
       }
    };

    socket.on("new-order", handleNewOrder);
    socket.on("order-update", handleOrderUpdate);

    return () => {
      socket.off("new-order", handleNewOrder);
      socket.off("order-update", handleOrderUpdate);
    };
  }, []);

  return null;
};

export default SoundNotifications;
