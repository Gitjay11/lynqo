/**
 * useSocket.js — Custom hook to consume SocketContext
 * Usage: const socket = useSocket();
 */

import { useContext } from "react";
import { SocketContext } from "../context/SocketContext.jsx";

export const useSocket = () => {
  return useContext(SocketContext);
};
