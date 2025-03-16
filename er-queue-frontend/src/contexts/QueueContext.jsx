import React, { createContext, useState, useEffect, useContext } from 'react';
import Pusher from 'pusher-js';
import { queueService } from '../api';

const QueueContext = createContext(null);

export const useQueue = () => useContext(QueueContext);

export const QueueProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchQueue = async () => {
    try {
      setLoading(true);
      const data = await queueService.getQueue();
      setQueue(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch queue:', err);
      setError('Failed to load queue data');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchQueue();
    
    // Set up Pusher
    const pusher = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY, {
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
      encrypted: true,
    });
    
    const channel = pusher.subscribe('queue');
    
    channel.bind('queue.updated', () => {
      fetchQueue();
    });
    
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, []);
  
  const value = {
    queue,
    loading,
    error,
    refreshQueue: fetchQueue,
  };
  
  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
};