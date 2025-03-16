// src/contexts/QueueContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const QueueContext = createContext({
  refreshQueue: () => console.log("Queue refresh requested")
});

export const QueueProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Create WebSocket connection
    const ws = new WebSocket('ws://localhost:8000/ws/queue');
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };
    
    ws.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      // Handle incoming queue updates here
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };
    
    setSocket(ws);
    
    // Clean up on unmount
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const refreshQueue = () => {
    if (socket && connected) {
      socket.send(JSON.stringify({ action: 'refresh_queue' }));
    } else {
      console.log("WebSocket not connected, can't refresh queue");
    }
  };

  return (
    <QueueContext.Provider value={{ refreshQueue, connected }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => useContext(QueueContext);