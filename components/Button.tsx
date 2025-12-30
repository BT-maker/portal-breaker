import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}) => {
  // Modern base styles with backdrop blur and cleaner transitions
  const baseStyles = "font-display font-bold uppercase tracking-wider rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border border-opacity-50 backdrop-blur-sm relative overflow-hidden group";
  
  const variants = {
    // Turquoise/Teal for Primary
    primary: "bg-teal-600/90 hover:bg-teal-500 text-white border-teal-400 shadow-teal-500/30 hover:shadow-teal-400/50",
    // Emerald/Green for Secondary
    secondary: "bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border-emerald-600 shadow-emerald-900/40",
    // Red for Danger
    danger: "bg-red-600/80 hover:bg-red-500 text-white border-red-400 shadow-red-500/30",
    // Bright Green for Success
    success: "bg-green-600/90 hover:bg-green-500 text-white border-green-400 shadow-green-500/30",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs tracking-wide",
    md: "px-6 py-3 text-sm",
    lg: "px-10 py-5 text-xl",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {/* Glossy shine effect */}
      <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
    </button>
  );
};