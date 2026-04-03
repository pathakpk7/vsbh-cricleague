import React, { useState, useEffect, createContext, useContext } from 'react';
import './ToastNotifications.css';

// Toast Context
const ToastContext = createContext();

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message,
      type,
      duration,
      timestamp: new Date()
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  // Predefined toast methods
  const toast = {
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    warning: (message, duration) => addToast(message, 'warning', duration),
    info: (message, duration) => addToast(message, 'info', duration),
    bid: (message, duration) => addToast(message, 'bid', duration),
    sold: (message, duration) => addToast(message, 'sold', duration),
    failed: (message, duration) => addToast(message, 'failed', duration)
  };

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast, clearAllToasts }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

// Individual Toast Item
const ToastItem = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    setIsVisible(true);

    // Setup auto remove with exit animation
    const timer = setTimeout(() => {
      setIsRemoving(true);
      setTimeout(() => {
        onRemove();
      }, 300);
    }, toast.duration - 300);

    return () => clearTimeout(timer);
  }, [toast.duration, onRemove]);

  const getToastConfig = () => {
    const configs = {
      success: {
        icon: '✅',
        bgColor: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
        borderColor: '#27ae60',
        textColor: '#fff'
      },
      error: {
        icon: '❌',
        bgColor: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
        borderColor: '#e74c3c',
        textColor: '#fff'
      },
      warning: {
        icon: '⚠️',
        bgColor: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
        borderColor: '#f39c12',
        textColor: '#fff'
      },
      info: {
        icon: 'ℹ️',
        bgColor: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
        borderColor: '#3498db',
        textColor: '#fff'
      },
      bid: {
        icon: '💰',
        bgColor: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
        borderColor: '#4a90e2',
        textColor: '#fff'
      },
      sold: {
        icon: '🏷️',
        bgColor: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
        borderColor: '#27ae60',
        textColor: '#fff'
      },
      failed: {
        icon: '🚫',
        bgColor: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
        borderColor: '#e74c3c',
        textColor: '#fff'
      }
    };

    return configs[toast.type] || configs.info;
  };

  const config = getToastConfig();

  const handleManualClose = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove();
    }, 300);
  };

  return (
    <div
      className={`toast-item ${isVisible ? 'visible' : ''} ${isRemoving ? 'removing' : ''}`}
      style={{
        background: config.bgColor,
        borderColor: config.borderColor,
        color: config.textColor
      }}
    >
      <div className="toast-content">
        <div className="toast-icon">
          {config.icon}
        </div>
        <div className="toast-message">
          {toast.message}
        </div>
        <button
          className="toast-close"
          onClick={handleManualClose}
          aria-label="Close toast"
        >
          ×
        </button>
      </div>
      
      {/* Progress Bar */}
      <div className="toast-progress">
        <div 
          className="progress-fill"
          style={{
            animation: `progress ${toast.duration}ms linear`
          }}
        />
      </div>
    </div>
  );
};

// Convenience Component for Common Toast Types
export const Toast = {
  Success: ({ message, duration = 3000 }) => {
    const { toast } = useToast();
    useEffect(() => {
      toast.success(message, duration);
    }, [message, duration]);
    return null;
  },
  
  Error: ({ message, duration = 3000 }) => {
    const { toast } = useToast();
    useEffect(() => {
      toast.error(message, duration);
    }, [message, duration]);
    return null;
  },
  
  Warning: ({ message, duration = 3000 }) => {
    const { toast } = useToast();
    useEffect(() => {
      toast.warning(message, duration);
    }, [message, duration]);
    return null;
  },
  
  Info: ({ message, duration = 3000 }) => {
    const { toast } = useToast();
    useEffect(() => {
      toast.info(message, duration);
    }, [message, duration]);
    return null;
  },
  
  Bid: ({ message, duration = 3000 }) => {
    const { toast } = useToast();
    useEffect(() => {
      toast.bid(message, duration);
    }, [message, duration]);
    return null;
  },
  
  Sold: ({ message, duration = 3000 }) => {
    const { toast } = useToast();
    useEffect(() => {
      toast.sold(message, duration);
    }, [message, duration]);
    return null;
  },
  
  Failed: ({ message, duration = 3000 }) => {
    const { toast } = useToast();
    useEffect(() => {
      toast.failed(message, duration);
    }, [message, duration]);
    return null;
  }
};

export default ToastProvider;
