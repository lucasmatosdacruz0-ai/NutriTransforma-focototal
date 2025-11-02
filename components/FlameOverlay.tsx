import React from 'react';

interface FlameOverlayProps {
  show: boolean;
}

const FlameOverlay: React.FC<FlameOverlayProps> = ({ show }) => {
  if (!show) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex justify-center items-end h-full w-full">
        <div className="flame" style={{ left: '40%' }}></div>
        <div className="flame" style={{ left: '55%' }}></div>
        <div className="flame" style={{ left: '48%' }}></div>
      </div>
    </div>
  );
};

export default FlameOverlay;
