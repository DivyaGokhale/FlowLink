import React from "react";
import FooterLayout from "../components/FooterLayout";

const PrivacyPolicy: React.FC = () => {
  return (
    <FooterLayout activePage="/privacy-policy">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600">Last updated: January 1, 2026</p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
            <p className="text-gray-700 mb-4">
              We collect information you provide directly to us when you use our services, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Account Information:</strong> Name, email address, phone number, and password when you create an account</li>
              <li><strong>Order Information:</strong> Details about your orders, including items purchased, delivery addresses, and payment information</li>
              <li><strong>Delivery Information:</strong> Addresses and delivery preferences you provide for order fulfillment</li>
              <li><strong>Payment Information:</strong> Payment card information processed securely through our payment partners</li>
              <li><strong>Communication Information:</strong> Messages you send through our platform or customer support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Data</h2>
            <p className="text-gray-700 mb-4">
              We use your information to provide and improve our services:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Order Processing:</strong> To process, fulfill, and deliver your orders</li>
              <li><strong>Account Management:</strong> To create and manage your account and preferences</li>
              <li><strong>Customer Support:</strong> To respond to your inquiries and provide support</li>
              <li><strong>Service Improvement:</strong> To analyze usage patterns and improve our platform</li>
              <li><strong>Communication:</strong> To send order updates, promotional offers (with your consent), and important notices</li>
              <li><strong>Security:</strong> To protect your account and our services from fraud and unauthorized access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Security</h2>
            <p className="text-gray-700 mb-4">
              We take the security of your personal information seriously:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Data Encryption:</strong> We use industry-standard encryption to protect your data in transit and at rest</li>
              <li><strong>Secure Payment Processing:</strong> Payment information is processed by trusted third-party payment processors</li>
              <li><strong>Access Controls:</strong> We limit access to your personal information to authorized employees and contractors</li>
              <li><strong>Regular Security Audits:</strong> We conduct regular security assessments to identify and address vulnerabilities</li>
              <li><strong>Account Protection:</strong> We monitor for suspicious activity and may temporarily lock accounts when necessary</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-700 mb-4">
              We work with trusted third-party services to provide our platform:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Payment Processors:</strong> We use secure payment processors to handle payment transactions (e.g., Razorpay)</li>
              <li><strong>Analytics Services:</strong> We use analytics tools to understand how users interact with our platform</li>
              <li><strong>Delivery Partners:</strong> We share necessary delivery information with our delivery partners to fulfill orders</li>
              <li><strong>Cloud Services:</strong> We use cloud infrastructure providers to host and operate our services</li>
            </ul>
            <p className="text-gray-700 mt-4">
              These third parties are contractually obligated to protect your information and use it only for the purposes we specify.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 mb-4">
              You have rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Access:</strong> You can request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> You can update or correct inaccurate information in your account</li>
              <li><strong>Deletion:</strong> You can request deletion of your personal information, subject to legal requirements</li>
              <li><strong>Portability:</strong> You can request a portable copy of your personal information</li>
              <li><strong>Opt-out:</strong> You can opt out of marketing communications at any time</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise these rights, please contact us at support@flowlink.com. We will respond to your request within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-700">
              We retain your personal information for as long as necessary to provide our services and comply with legal obligations. 
              Generally, we retain information for as long as you maintain an account with us, plus a reasonable period afterward for 
              legal and business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this privacy policy from time to time. We will notify you of any material changes by posting the new 
              policy on our website and updating the "Last updated" date. Your continued use of our services after changes 
              constitutes acceptance of the updated policy.
            </p>
          </section>

        </div>
      </div>
    </FooterLayout>
  );
};

export default PrivacyPolicy;