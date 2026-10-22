import React from 'react';

const LoadingSpinner = ({ text = 'Loading data from server...' }) => {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <p className="text-muted" style={{ fontSize: '0.9rem', fontWeight: 500 }}>{text}</p>
    </div>
  );
};

export default LoadingSpinner;
