import React from 'react';

export const PinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="12" y1="17" x2="12" y2="22"></line>
        <path d="M9 10v-5a3 3 0 0 1 3-3v0a3 3 0 0 1 3 3v5"></path>
        <path d="M15 10H9"></path>
        <path d="M18 10h2v2a6 6 0 0 1-6 6H9.5a6 6 0 0 1-6-5.5V12h2"></path>
    </svg>
);
