import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, TrendingUp } from 'lucide-react';

const AnimatedNavLink = ({ to, children, isActive }: { to: string; children: React.ReactNode; isActive: boolean }) => {
  const defaultTextColor = 'text-gray-300';
  const hoverTextColor = 'text-white';
  const activeTextColor = 'text-gray-100';
  const textSizeClass = 'text-sm';

  return (
    <Link to={to} className={`group relative inline-block h-6 flex items-center justify-center ${textSizeClass} transition-colors duration-300 ${isActive ? activeTextColor : defaultTextColor} hover:${hoverTextColor}`}>
      {children}
    </Link>
  );
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [headerShapeClass, setHeaderShapeClass] = useState('rounded-full');
  const shapeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (shapeTimeoutRef.current) {
      clearTimeout(shapeTimeoutRef.current);
    }

    if (isMenuOpen) {
      setHeaderShapeClass('rounded-xl');
    } else {
      shapeTimeoutRef.current = setTimeout(() => {
        setHeaderShapeClass('rounded-full');
      }, 300);
    }

    return () => {
      if (shapeTimeoutRef.current) {
        clearTimeout(shapeTimeoutRef.current);
      }
    };
  }, [isMenuOpen]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-20
                       flex flex-col items-center
                       pl-10 pr-10 py-3 backdrop-blur-sm
                       ${headerShapeClass}
                       border border-gray-800 bg-gray-950/95
                       w-[calc(100%-0.5rem)] sm:w-auto
                       transition-[border-radius,transform] duration-300 ease-in-out navbar-glass
                       hover:scale-[1.02] hover:bg-gray-950/98
                       animate-in zoom-in-50 fade-in slide-in-from-top-4 duration-1000 delay-200`}>

      <div className="flex items-center justify-between w-full gap-x-4 sm:gap-x-6">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 group px-6 py-2 min-w-[220px]">
          <div className="relative">
            <TrendingUp className="w-7 h-7 text-blue-400 group-hover:text-blue-300 transition-colors" />
            <div className="absolute -inset-1 bg-blue-400/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <span className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors whitespace-nowrap">
            TraderEdge Pro
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center space-x-4 sm:space-x-6 text-sm">
          <AnimatedNavLink to="/" isActive={isActive('/')}>Home</AnimatedNavLink>
          <AnimatedNavLink to="/features" isActive={isActive('/features')}>Features</AnimatedNavLink>
          <AnimatedNavLink to="/about" isActive={isActive('/about')}>About</AnimatedNavLink>
          <AnimatedNavLink to="/faq" isActive={isActive('/faq')}>FAQ</AnimatedNavLink>
          <AnimatedNavLink to="/membership" isActive={isActive('/membership')}>Pricing</AnimatedNavLink>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          <Link
            to="/signin"
            className="px-6 py-2 text-sm border border-[#333] bg-[rgba(31,31,31,0.62)] text-gray-300 rounded-full hover:border-white/50 hover:text-white transition-colors duration-200 min-w-[100px] text-center"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 text-sm rounded-full font-medium transition-all duration-300 min-w-[120px] text-center"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="sm:hidden flex items-center justify-center w-8 h-8 text-gray-300 focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Close Menu' : 'Open Menu'}
        >
          {isMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className={`sm:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden
                       ${isMenuOpen ? 'max-h-[1000px] opacity-100 pt-4' : 'max-h-0 opacity-0 pt-0 pointer-events-none'}`}>
        <nav className="flex flex-col items-center space-y-4 text-base w-full">
          <Link
            to="/"
            className={`text-gray-300 hover:text-white transition-colors w-full text-center ${isActive('/') ? 'text-blue-400' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/membership"
            className={`text-gray-300 hover:text-white transition-colors w-full text-center ${isActive('/membership') ? 'text-blue-400' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Pricing
          </Link>
          <Link
            to="/features"
            className={`text-gray-300 hover:text-white transition-colors w-full text-center ${isActive('/features') ? 'text-blue-400' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Features
          </Link>
          <Link
            to="/about"
            className={`text-gray-300 hover:text-white transition-colors w-full text-center ${isActive('/about') ? 'text-blue-400' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
          <Link
            to="/faq"
            className={`text-gray-300 hover:text-white transition-colors w-full text-center ${isActive('/faq') ? 'text-blue-400' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            FAQ
          </Link>
        </nav>
        <div className="flex flex-col items-center space-y-4 mt-4 w-full">
          <Link
            to="/signin"
            className="px-4 py-2 sm:px-3 text-xs sm:text-sm border border-[#333] bg-[rgba(31,31,31,0.62)] text-gray-300 rounded-full hover:border-white/50 hover:text-white transition-colors duration-200 w-full sm:w-auto text-center"
            onClick={() => setIsMenuOpen(false)}
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:px-3 text-xs sm:text-sm rounded-full font-medium transition-all duration-300 w-full sm:w-auto text-center"
            onClick={() => setIsMenuOpen(false)}
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
