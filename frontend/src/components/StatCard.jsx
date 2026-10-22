import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, colorTheme = 'blue' }) => {
  return (
    <div className="stat-card">
      <div className="stat-info">
        <div className="stat-label">{title}</div>
        <div className="stat-value">{value}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      </div>
      {Icon && (
        <div className={`stat-icon-wrapper stat-icon-${colorTheme}`}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
