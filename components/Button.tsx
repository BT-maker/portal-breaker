import React, { useState } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  style,
  onClick,
  ...props 
}) => {
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setRipple({ x, y });
      setTimeout(() => setRipple(null), 600);
      onClick(e);
    }
  };

  // Modern base styles with enhanced effects
  const baseStyles = "font-display font-bold uppercase tracking-wider rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl border-2 backdrop-blur-md relative overflow-hidden group";
  
  const variants = {
    // Turquoise/Teal for Primary with enhanced glow
    primary: "bg-gradient-to-br from-teal-600 via-teal-500 to-teal-600 hover:from-teal-500 hover:via-teal-400 hover:to-teal-500 text-white border-teal-400/60 shadow-teal-500/40 hover:shadow-teal-400/60 hover:shadow-2xl",
    // Emerald/Green for Secondary
    secondary: "bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:via-emerald-600 hover:to-emerald-700 text-emerald-100 border-emerald-600/60 shadow-emerald-900/50 hover:shadow-emerald-700/60",
    // Red for Danger
    danger: "bg-gradient-to-br from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:via-red-400 hover:to-red-500 text-white border-red-400/60 shadow-red-500/40 hover:shadow-red-400/60",
    // Bright Green for Success
    success: "bg-gradient-to-br from-green-600 via-green-500 to-green-600 hover:from-green-500 hover:via-green-400 hover:to-green-500 text-white border-green-400/60 shadow-green-500/40 hover:shadow-green-400/60",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs tracking-wide",
    md: "px-6 py-3 text-sm",
    lg: "px-10 py-5 text-xl",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={handleClick}
      style={{
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        WebkitTouchCallout: 'none',
        userSelect: 'none',
        ...style,
      }}
      {...props}
    >
      {/* Ripple Effect */}
      {ripple && (
        <span
          className="absolute rounded-full bg-white/30 pointer-events-none animate-ping"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
            transform: 'translate(-50%, -50%)',
            animation: 'ripple-expand 0.6s ease-out',
          }}
        />
      )}

      {/* Content */}
      <span className="relative z-10 pointer-events-none flex items-center justify-center gap-2">
        {children}
      </span>

      {/* Shimmer Effect */}
      <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
      
      {/* Inner Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
      
      {/* Border Glow on Hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
           style={{
             boxShadow: variant === 'primary' ? 'inset 0 0 20px rgba(20, 184, 166, 0.3)' :
                       variant === 'secondary' ? 'inset 0 0 20px rgba(16, 185, 129, 0.3)' :
                       variant === 'danger' ? 'inset 0 0 20px rgba(239, 68, 68, 0.3)' :
                       'inset 0 0 20px rgba(34, 197, 94, 0.3)',
           }}
      ></div>
    </button>
  );
};