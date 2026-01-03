import {
  Dribbble,
  Facebook,
  Github,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Shield,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const data = {
  facebookLink: 'https://facebook.com/tradereedgepro',
  instaLink: 'https://instagram.com/tradereedgepro',
  twitterLink: 'https://twitter.com/tradereedgepro',
  githubLink: 'https://github.com/tradereedgepro',
  dribbbleLink: 'https://dribbble.com/tradereedgepro',
  services: {
    features: '/features',
    about: '/about',
    membership: '/membership',
    dashboard: '/dashboard',
  },
  about: {
    history: '/about',
    team: '/contact-support',
    handbook: '/terms-of-service',
    careers: '/faq',
  },
  help: {
    faqs: '/faq',
    support: '/contact-support',
    livechat: '/contact-support',
  },
  contact: {
    email: 'support@traderedgepro.com',
  },
  company: {
    name: 'TraderEdge Pro',
    description:
      'Professional prop firm clearing service helping traders achieve funded account success through proven methodologies and expert guidance.',
    logo: '/logo.webp',
  },
};

const socialLinks = [
  { icon: Facebook, label: 'Facebook', href: data.facebookLink },
  { icon: Instagram, label: 'Instagram', href: data.instaLink },
  { icon: Twitter, label: 'Twitter', href: data.twitterLink },
  { icon: Github, label: 'GitHub', href: data.githubLink },
  { icon: Dribbble, label: 'Dribbble', href: data.dribbbleLink },
];

const aboutLinks = [
  { text: 'About Us', href: data.about.history },
  { text: 'Contact Support', href: data.about.team },
  { text: 'Terms of Service', href: data.about.handbook },
  { text: 'FAQ', href: data.about.careers },
];

const serviceLinks = [
  { text: 'Features', href: data.services.features },
  { text: 'About', href: data.services.about },
  { text: 'Trading Plans', href: data.services.membership },
  { text: 'Progress Tracking', href: data.services.dashboard },
];

const helpfulLinks = [
  { text: 'FAQs', href: data.help.faqs },
  { text: 'Support', href: data.help.support },
  { text: 'Live Chat', href: data.help.livechat, hasIndicator: true },
];

const contactInfo = [
  { icon: Mail, text: data.contact.email },
];

export default function Footer4Col() {
  return (
    <footer className="relative mt-6 w-full">
      {/* Glass background effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 via-purple-800/15 to-purple-700/8 backdrop-blur-[40px] rounded-t-xl shadow-2xl" />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/[0.02] via-purple-300/[0.01] to-transparent rounded-t-xl" />
      <div className="absolute inset-0 bg-gradient-to-t from-violet-600/[0.008] via-transparent to-indigo-500/[0.004] rounded-t-xl" />
      <div className="absolute inset-0 rounded-t-xl shadow-2xl shadow-purple-900/40" />

      {/* Content */}
      <div className="relative z-10">
      <div className="mx-auto max-w-screen-xl px-4 pt-6 pb-2 sm:px-6 lg:px-8 lg:pt-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div>
            <div className="text-blue-400 flex justify-center gap-2 sm:justify-start">
              <span className="text-lg font-semibold">
                {data.company.name}
              </span>
              <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-semibold">BETA</span>
            </div>

            <p className="text-gray-400 mt-3 max-w-md text-center leading-relaxed sm:max-w-xs sm:text-left text-xs">
              {data.company.description}
            </p>

            <div className="flex items-center justify-center gap-4 mt-3 sm:justify-start">
              <span className="text-yellow-400 text-xs">Trusted by 2,847+ traders worldwide</span>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold text-white mb-2 text-xs">Subscribe to our newsletter</h4>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const email = (e.target as any).email.value;
                  let apiEndpoint;
                  if (window.location.hostname === 'localhost') {
                    apiEndpoint = '/api/subscribe';
                  } else {
                    apiEndpoint = 'http://localhost:3001/api/subscribe';
                  }
                  await fetch(apiEndpoint, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                  });
                  alert('Successfully subscribed!');
                }}
                className="flex"
              >
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  className="bg-gray-800/50 border border-gray-700/50 text-white px-2 py-1.5 rounded-l-lg focus:ring-2 focus:ring-blue-500 flex-1 text-sm"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-r-lg font-semibold text-sm"
                >
                  Subscribe
                </button>
              </form>
            </div>

            <ul className="mt-4 flex justify-center gap-4 sm:justify-start md:gap-6">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-blue-400 hover:text-blue-300 transition"
                  >
                    <span className="sr-only">{label}</span>
                    <Icon className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:col-span-2">
            <div className="text-center sm:text-left">
              <p className="text-base font-medium text-white">About Us</p>
              <ul className="mt-4 space-y-2 text-sm">
                {aboutLinks.map(({ text, href }) => (
                  <li key={text}>
                    <Link
                      className="text-gray-400 transition hover:text-blue-400"
                      to={href}
                    >
                      {text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center sm:text-left">
              <p className="text-base font-medium text-white">Our Services</p>
              <ul className="mt-4 space-y-2 text-sm">
                {serviceLinks.map(({ text, href }) => (
                  <li key={text}>
                    <Link
                      className="text-gray-400 transition hover:text-blue-400"
                      to={href}
                    >
                      {text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center sm:text-left">
              <p className="text-base font-medium text-white">Helpful Links</p>
              <ul className="mt-4 space-y-2 text-sm">
                {helpfulLinks.map(({ text, href, hasIndicator }) => (
                  <li key={text}>
                    <Link
                      to={href}
                      className={`${
                        hasIndicator
                          ? 'group flex justify-center gap-1.5 sm:justify-start'
                          : 'text-gray-400 transition hover:text-blue-400'
                      }`}
                    >
                      <span className="text-gray-400 transition hover:text-blue-400">
                        {text}
                      </span>
                      {hasIndicator && (
                        <span className="relative flex size-2">
                          <span className="bg-blue-400 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                          <span className="bg-blue-400 relative inline-flex size-2 rounded-full" />
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center sm:text-left">
              <p className="text-base font-medium text-white">Contact Us</p>
              <ul className="mt-4 space-y-2 text-sm">
                {contactInfo.map(({ icon: Icon, text }) => (
                  <li key={text}>
                    <a
                      className="flex items-center justify-center gap-1.5 sm:justify-start cursor-pointer"
                      href={`mailto:${text}`}
                    >
                      <Icon className="text-blue-400 size-4 shrink-0 shadow-sm" />
                      <span className="text-gray-400 flex-1 transition">
                        {text}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3">
          <div className="flex flex-col gap-3">
            <div className="text-center sm:flex sm:justify-between sm:text-left">
              <p className="text-gray-400 text-xs">
                <span className="block sm:inline">All rights reserved.</span>
              </p>

              <p className="text-gray-500 mt-2 text-xs transition sm:order-first sm:mt-0">
                &copy; 2025 {data.company.name}
              </p>
            </div>

            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <h4 className="text-red-400 font-semibold text-sm mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Important Trading Disclaimer
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Trading involves substantial risk and is not suitable for all investors. Past performance does not guarantee future results. You may lose some or all of your investment. Only risk capital that you can afford to lose. Please trade responsibly and consider consulting a financial advisor before making trading decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </footer>
  );
}
