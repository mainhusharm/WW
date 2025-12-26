

const testimonials = [
  {
    name: "Alex Thompson",
    profession: "Prop Firm Trader",
    description: "This trading platform revolutionized my approach. The expert guidance and risk management tools helped me clear my prop firm challenge in just 3 weeks. The community support was incredible!",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    rating: 5,
  },
  {
    name: "Sarah Chen",
    profession: "Day Trader",
    description: "The analytics and real-time data made all the difference. I can now see exactly where I need to improve. Cleared my challenge and gained $15,200 in profits within 2 months!",
    avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    rating: 4,
  },
  {
    name: "Marcus Rodriguez",
    profession: "Funded Trader",
    description: "From struggling trader to funded account holder. The professional coaching and proven strategies transformed my trading career. Highly recommend to anyone serious about trading!",
    avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    rating: 5,
  },
  {
    name: "David Kim",
    profession: "Professional Trader",
    description: "The lightning-fast execution and zero slippage made all the difference. I cleared my $100K challenge in record time. This platform delivers on its promises!",
    avatar: "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    rating: 5,
  },
  {
    name: "Jennifer Walsh",
    profession: "Swing Trader",
    description: "Best investment I made for my trading career. The 24/7 support and expert analysis helped me turn my $5K account into consistent profits. The results speak for themselves!",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a6dd7228f2d?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    rating: 4,
  },
  {
    name: "Michael Johnson",
    profession: "Risk Manager",
    description: "The comprehensive risk management tools saved me from major losses. Combined with expert guidance, I cleared multiple challenges and now trade with confidence.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    rating: 5,
  },
];
const duplicatedTestimonials = [...testimonials, ...testimonials];

const highlightDollarAmounts = (text: string) => {
    const parts = text.split(/(\$[\d,K,M]+)/g);
    return parts.map((part: string, index: number) => {
        if (part.match(/\$[\d,K,M]+/)) {
            return <span key={index} className="font-bold text-yellow-400">{part}</span>;
        }
        return part;
    });
};

const FUITestimonialWithSlide = () => {
    return (
        <div className='max-w-8xl w-screen'>
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes testimonial-scroll {
                        0% {
                            transform: translateX(0);
                        }
                        100% {
                            transform: translateX(-50%);
                        }
                    }

                    .animate-testimonial-scroll {
                        animation: testimonial-scroll 20s linear infinite;
                    }
                `
            }} />
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className='mb-24 flex justify-center'>
                    <div className="text-center max-w-4xl mr-52">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
                            Success Stories
                        </h2>
                        <p className="mt-6 text-lg tracking-tight text-white/70 font-medium max-w-2xl mx-auto">
                            Real results from traders who cleared their challenges
                        </p>
                    </div>
                </div>
            </div>
            <div style={{
                maskImage:
                    'linear-gradient(90deg, black 0%, black 100%)',
            }}  className="flex relative overflow-hidden shrink-0 max-w-full overflow-hidden">
              <div className="flex gap-5 w-max animate-testimonial-scroll">
                {duplicatedTestimonials.map((testimonial, indx) => {
                    return (
                        <div key={indx} className="border-[1.2px] flex flex-col bg-white/[0.02] border-white/[0.08] dark:border-white/10 rounded-lg shrink-0 grow-0 w-[600px] h-full backdrop-blur-sm">
                            <p className="px-5 py-5 text-pretty text-lg font-light text-white/90 dark:text-dark-text-primary sm:text-xl md:text-2xl tracking-tight font-sans">
                                "{highlightDollarAmounts(testimonial.description)}"
                            </p>
                            <div className="border-t-[1.2px] w-full flex gap-1 overflow-hidden border-white/[0.08]">
                                <div className="w-full flex gap-3 items-center px-4 py-3">
                                    <img src={testimonial.avatar} alt='avatar' className='w-12 h-12 rounded-full' />
                                    <div className='flex flex-col flex-1 gap-0 justify-start items-start'>
                                        <h5 className='text-base font-medium md:text-lg text-white/90'>{testimonial.name}</h5>
                                        <p className='text-white/50 mt-[-4px] text-sm text-text-tertiary dark:text-dark-text-tertiary md:text-base'>{testimonial.profession}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            {[...Array(testimonial.rating)].map((_, i) => (
                                                <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
             </div>
            </div>
        </div>
    )
}
export default FUITestimonialWithSlide
