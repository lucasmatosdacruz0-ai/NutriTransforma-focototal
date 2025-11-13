import React from 'react';

export const WavingHandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="currentColor"
        className="inline-block w-8 h-8 text-yellow-500"
        {...props}
    >
        <path d="M22 13.91c0-1.1-1.34-1.58-2.09-1.32l-3.32.99c-.58.17-1.25-.13-1.42-.71l-1.42-4.73c-.2-.62-.97-1.42-1.74-1.42s-1.55.8-1.74 1.42l-1.42 4.73c-.17.58-.84.88-1.42.71l-3.32-.99C2.34 12.33 1 12.8 1 13.91V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2v-5.09z"/>
    </svg>
);