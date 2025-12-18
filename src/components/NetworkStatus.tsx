import React from 'react';
import './NetworkStatus.css';

interface NetworkStatusProps {
  isOnline: boolean;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ isOnline }) => {
  return (
    <div className={`network-status ${isOnline ? 'online' : 'offline'}`}>
      <span className="status-indicator"></span>
      <span className="status-text">
        {isOnline ? 'Online' : 'Offline - Changes will sync when connection returns'}
      </span>
    </div>
  );
};

export default NetworkStatus;
