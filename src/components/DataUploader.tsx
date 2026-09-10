import React from 'react';
import { Database } from 'lucide-react';
import './DataUploader.css';

interface DataUploaderProps {
  loadingMessage?: string;
}

const DataUploader: React.FC<DataUploaderProps> = ({ loadingMessage = 'Veriler okunuyor...' }) => {
  return (
    <div className="uploader-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="loading-card glass-panel" style={{ textAlign: 'center', padding: '40px', maxWidth: '400px', width: '100%' }}>
        <div className="loading-icon-wrapper" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
          <Database size={48} className="pulse-icon text-blue" />
        </div>
        <h2 className="loading-title">Sistem Hazırlanıyor</h2>
        <p className="loading-desc">{loadingMessage}</p>
        <div className="progress-bar-container" style={{ marginTop: '20px', width: '100%', height: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div className="progress-bar-fill real-time" style={{ width: '100%', height: '100%', background: '#3b82f6', animation: 'indeterminate 1.5s infinite linear' }}></div>
        </div>
      </div>
      <style>
        {`
          @keyframes indeterminate {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </div>
  );
};

export default DataUploader;
