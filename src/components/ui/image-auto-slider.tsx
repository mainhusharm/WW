
export const Component = () => {
  // Images for the infinite scroll - using Unsplash URLs
  const images = [
    "https://github.com/anchalw11/photos/raw/main/freepik__change-the-date-to-something-random-of-after-mid-2__5302.png",
    "https://github.com/anchalw11/photos/raw/main/freepik__change-the-date-to-something-random-of-after-mid-2__5303.png",
    "https://github.com/anchalw11/photos/raw/main/freepik__change-the-date-to-something-random-of-after-mid-2__5304.png",
    "https://github.com/anchalw11/photos/raw/main/freepik__change-the-date-to-something-random-of-after-mid-2__5305.png",
    "https://github.com/anchalw11/photos/raw/main/freepik__change-the-date-to-something-random-of-after-mid-2__5306.png",
    "https://github.com/anchalw11/photos/raw/main/freepik__change-the-date-to-something-random-of-after-mid-2__5307.png",
    "https://github.com/anchalw11/photos/raw/main/freepik__change-the-date-to-something-random-of-after-mid-2__5308.png",
    "https://github.com/anchalw11/photos/raw/main/freepik__change-the-date-to-something-random-of-after-mid-2__5309.png",
    "https://github.com/anchalw11/photos/raw/main/freepik__change-the-date-to-something-random-of-after-mid-2__5310.png",
    "https://github.com/anchalw11/photos/raw/main/freepik__change-the-date-to-something-random-of-after-mid-2__5311.png",
    "https://github.com/anchalw11/photos/raw/main/freepik__change-the-date-to-something-random-of-after-mid-2__5312.png",
    "https://github.com/anchalw11/photos/raw/main/freepik__change-the-date-to-something-random-of-after-mid-2__5313.png",
    "https://github.com/anchalw11/photos/raw/main/freepik__change-the-date-to-something-random-of-after-mid-2__5314.png",
    "https://github.com/anchalw11/photos/raw/main/freepik__change-the-date-to-something-random-of-after-mid-2__5315.png",
    "https://github.com/anchalw11/photos/raw/main/freepik__change-the-date-to-something-random-of-after-mid-2__5316.png"
  ];

  // Duplicate images for seamless loop
  const duplicatedImages = [...images, ...images];

  return (
    <>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        @keyframes scroll-right {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .infinite-scroll {
          animation: scroll-right 20s linear infinite;
        }

        .scroll-container {
          mask: linear-gradient(
            90deg,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
          -webkit-mask: linear-gradient(
            90deg,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
        }

        .image-item {
          transition: transform 0.3s ease, filter 0.3s ease;
        }

        .image-item:hover {
          transform: scale(1.05);
          filter: brightness(1.1);
        }
      `}</style>
      
      <div className="w-full min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black z-0" />
        
        {/* Scrolling images container */}
        <div className="relative z-10 w-full flex items-center justify-center py-8">
          <div className="scroll-container w-full max-w-6xl">
            <div className="infinite-scroll flex gap-6 w-max">
              {duplicatedImages.map((image, index) => (
                <div
                  key={index}
                  className="image-item flex-shrink-0 w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-xl overflow-hidden shadow-2xl"
                >
                  <img
                    src={image}
                    alt={`Gallery image ${(index % images.length) + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Bottom gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent z-20" />
      </div>
    </>
  );
};
