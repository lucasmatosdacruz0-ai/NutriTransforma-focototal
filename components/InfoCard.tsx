
import React from 'react';

interface InfoCardProps {
  icon: React.ReactNode;
  iconBg: string;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, iconBg, rightIcon, children, className = '' }) => {
  return (
    <div className={`bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative ${className}`}>
        <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBg}`}>
                {icon}
            </div>
            {rightIcon && (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/50 border border-gray-200">
                    {rightIcon}
                </div>
            )}
        </div>
        <div>{children}</div>
    </div>
  );
};

export default InfoCard;
