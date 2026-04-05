'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

let socket: Socket | null = null;

export function useSocket() {
  const { isAuthenticated, user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
        withCredentials: true,
        autoConnect: true,
      });
    }

    socketRef.current = socket;

    // Join room based on role
    const roleRoomMap: Record<string, string> = {
      ADMIN: 'room:orders',
      ATENDENTE: 'room:orders',
      COZINHA: 'room:kitchen',
      ENTREGADOR: 'room:delivery',
    };

    const room = roleRoomMap[user.role];
    if (room) socket.emit('join_room', room);

    return () => {
      // Don't disconnect — reuse across components
    };
  }, [isAuthenticated, user]);

  return socketRef.current;
}
