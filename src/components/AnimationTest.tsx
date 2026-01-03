import React from 'react';

const AnimationTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Animation Test Page</h1>
      
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Basic Animations */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-blue-400">Basic Animations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 p-6 rounded-lg animate-fade-in">
              <h3 className="text-lg font-medium mb-2">Fade In</h3>
              <p className="text-gray-300">This element fades in on page load</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg animate-slide-up">
              <h3 className="text-lg font-medium mb-2">Slide Up</h3>
              <p className="text-gray-300">This element slides up from below</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg animate-slide-down">
              <h3 className="text-lg font-medium mb-2">Slide Down</h3>
              <p className="text-gray-300">This element slides down from above</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg animate-scale-in">
              <h3 className="text-lg font-medium mb-2">Scale In</h3>
              <p className="text-gray-300">This element scales in from small to normal</p>
            </div>
          </div>
        </section>

        {/* Advanced Animations */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-purple-400">Advanced Animations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 p-6 rounded-lg animate-float">
              <h3 className="text-lg font-medium mb-2">Float</h3>
              <p className="text-gray-300">This element gently floats up and down</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg animate-pulse-glow">
              <h3 className="text-lg font-medium mb-2">Pulse Glow</h3>
              <p className="text-gray-300">This element has a pulsing glow effect</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg animate-holographic-glow">
              <h3 className="text-lg font-medium mb-2">Holographic Glow</h3>
              <p className="text-gray-300">This element has a holographic glow effect</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg animate-geometric-float">
              <h3 className="text-lg font-medium mb-2">Geometric Float</h3>
              <p className="text-gray-300">This element has a complex floating animation</p>
            </div>
          </div>
        </section>

        {/* Scroll Animations */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-green-400">Scroll Animations</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-800 p-6 rounded-lg animate-on-scroll">
              <h3 className="text-lg font-medium mb-2">Scroll Animation 1</h3>
              <p className="text-gray-300">This element animates when scrolled into view</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg animate-on-scroll">
              <h3 className="text-lg font-medium mb-2">Scroll Animation 2</h3>
              <p className="text-gray-300">This element also animates when scrolled into view</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg animate-on-scroll">
              <h3 className="text-lg font-medium mb-2">Scroll Animation 3</h3>
              <p className="text-gray-300">And this one too!</p>
            </div>
          </div>
        </section>

        {/* Staggered Animations */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-yellow-400">Staggered Animations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 p-6 rounded-lg animate-stagger">
              <h3 className="text-lg font-medium mb-2">Stagger 1</h3>
              <p className="text-gray-300">First staggered element</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg animate-stagger">
              <h3 className="text-lg font-medium mb-2">Stagger 2</h3>
              <p className="text-gray-300">Second staggered element</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg animate-stagger">
              <h3 className="text-lg font-medium mb-2">Stagger 3</h3>
              <p className="text-gray-300">Third staggered element</p>
            </div>
          </div>
        </section>

        {/* Hover Effects */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-red-400">Hover Effects</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 p-6 rounded-lg hover-lift cursor-pointer">
              <h3 className="text-lg font-medium mb-2">Hover Lift</h3>
              <p className="text-gray-300">Hover over this element to see it lift up</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg glow-blue hover:glow-cyan transition-all duration-300 cursor-pointer">
              <h3 className="text-lg font-medium mb-2">Glow Effects</h3>
              <p className="text-gray-300">Hover to change glow color</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AnimationTest;
