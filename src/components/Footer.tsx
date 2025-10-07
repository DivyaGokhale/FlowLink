import React from "react";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";

const Footer: React.FC = () => {
  return (
    <footer className="relative bg-gray-900 text-gray-300 py-10 overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -top-16 -left-16 w-56 h-56 rounded-full bg-emerald-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 animate-fade-in-up">
        {/* Logo & Social */}
        <div>
          <h2 className="text-white text-lg font-semibold">FlowLink</h2>
          <p className="mt-3 text-sm">
            Connecting Wholesalers, Retailers & Customers
          </p>
          <div className="flex space-x-4 mt-4">
            <a href="#" className="hover:text-white/90 transition-colors">
              <FaFacebookF />
            </a>
            <a href="#" className="hover:text-white/90 transition-colors">
              <FaTwitter />
            </a>
            <a href="#" className="hover:text-white/90 transition-colors">
              <FaInstagram />
            </a>
            <a href="#" className="hover:text-white/90 transition-colors">
              <FaLinkedinIn />
            </a>
          </div>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-white font-semibold mb-3">Company</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white/90 transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-white/90 transition-colors">Contact</a></li>
            <li><a href="#" className="hover:text-white/90 transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-white/90 transition-colors">Blog</a></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-white font-semibold mb-3">Support</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white/90 transition-colors">Help Center</a></li>
            <li><a href="#" className="hover:text-white/90 transition-colors">Returns</a></li>
            <li><a href="#" className="hover:text-white/90 transition-colors">Shipping Info</a></li>
            <li><a href="#" className="hover:text-white/90 transition-colors">Track Order</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="text-white font-semibold mb-3">Legal</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white/90 transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-white/90 transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white/90 transition-colors">Cookie Policy</a></li>
            <li><a href="#" className="hover:text-white/90 transition-colors">Refund Policy</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-gray-700 mt-10 pt-6 text-center text-sm text-gray-400">
        © 2025 FlowLink. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
