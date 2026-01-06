import React from "react";
import FooterLayout from "../components/FooterLayout";

const About: React.FC = () => {
  return (
    <FooterLayout activePage="/about">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">About FlowLink</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Connecting you with fresh groceries, delivered with care
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Story</h2>
          <p className="text-gray-700 mb-6 leading-relaxed">
            FlowLink was born from a simple idea: bringing fresh, quality groceries directly to your doorstep 
            while supporting local communities. We understand that your time is valuable, and shopping for 
            groceries shouldn't be a chore.
          </p>
          <p className="text-gray-700 mb-6 leading-relaxed">
            Our platform connects you with trusted local vendors who provide the freshest produce, 
            pantry staples, and household essentials. We believe in the power of local commerce and 
            strive to create a seamless shopping experience that brings convenience to your daily life.
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Convenience First</h3>
              <p className="text-gray-700">
                We make grocery shopping effortless with our easy-to-use platform and reliable delivery service.
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Quality Assured</h3>
              <p className="text-gray-700">
                We partner with trusted vendors to ensure you receive the freshest and highest quality products.
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Local Trust</h3>
              <p className="text-gray-700">
                We support local businesses and communities by connecting you with nearby trusted vendors.
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Reliable Service</h3>
              <p className="text-gray-700">
                Fast delivery and pickup options to fit your busy schedule and lifestyle.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Online Ordering</h3>
              <p className="text-gray-600">Browse and order from our wide selection of fresh groceries</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Checkout</h3>
              <p className="text-gray-600">Safe and secure payment options for your peace of mind</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Quick delivery and convenient pickup options available</p>
            </div>
          </div>
        </div>
      </div>
    </FooterLayout>
  );
};

export default About;