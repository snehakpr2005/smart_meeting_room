import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

const AlertBanner = ({ type = 'info', message, onClose }) => {
  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} style={{ color: '#059669', flexShrink: 0 }} />;
      case 'danger':
      case 'error':
        return <AlertCircle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />;
      case 'warning':
        return <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0 }} />;
      default:
        return <Info size={18} style={{ color: '#2563eb', flexShrink: 0 }} />;
    }
  };

  const alertClass = type === 'error' ? 'alert-danger' : `alert-${type}`;

  return (
    <div className={`alert ${alertClass}`}>
      {getIcon()}
      <div style={{ flex: 1 }}>{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'inherit',
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default AlertBanner;
