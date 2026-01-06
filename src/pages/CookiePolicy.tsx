import React from "react";
import FooterLayout from "../components/FooterLayout";

const CookiePolicy: React.FC = () => {
  return (
    <FooterLayout activePage="/cookie-policy">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-lg text-gray-600">Last updated: January 1, 2026</p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are Cookies?</h2>
            <p className="text-gray-700">
              Cookies are small text files that are stored on your device when you visit websites. They help websites 
              remember your preferences, understand how you use the site, and improve your overall experience. 
              Cookies are widely used across the internet and are essential for many website functions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why FlowLink Uses Cookies</h2>
            <p className="text-gray-700 mb-4">
              We use cookies to enhance your experience on our platform by:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Remembering your login status and account preferences</li>
              <li>Providing personalized content and product recommendations</li>
              <li>Understanding how you navigate and use our website</li>
              <li>Improving website performance and functionality</li>
              <li>Ensuring security and preventing fraud</li>
              <li>Providing targeted advertising that may be of interest to you</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Types of Cookies We Use</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Essential Cookies</h3>
                <p className="text-gray-700">
                  These cookies are necessary for our website to function properly. They enable you to navigate our 
                  site and use its features, such as accessing secure areas and managing your shopping cart. 
                  Without these cookies, certain services cannot be provided.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Cookies</h3>
                <p className="text-gray-700">
                  These cookies help us understand how visitors interact with our website by collecting and 
                  reporting information anonymously. This includes data on page visits, time spent on pages, 
                  and the paths users take through our site. We use this information to improve our services.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Functionality Cookies</h3>
                <p className="text-gray-700">
                  These cookies allow our website to remember choices you make (such as your username, language, 
                  or region) and provide enhanced, more personalized features. They may also be used to remember 
                  changes you've made to text size, fonts, and other parts of our website.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Performance Cookies</h3>
                <p className="text-gray-700">
                  These cookies help us improve the performance of our website by collecting information about 
                  how visitors use our site. They help us identify which pages are most and least popular, 
                  and see how visitors move around the site. This information helps us optimize our website.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Manage Cookies</h2>
            <p className="text-gray-700 mb-4">
              You can control and manage cookies in several ways:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Browser Settings:</strong> Most web browsers allow you to control cookies through their settings preferences</li>
              <li><strong>Cookie Consent Banner:</strong> When you first visit our site, you may see a banner asking for your consent to use cookies</li>
              <li><strong>Website Preferences:</strong> Some websites provide cookie preference centers where you can manage your choices</li>
              <li><strong>Third-Party Tools:</strong> There are browser extensions and other tools available to manage cookies</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To learn more about how to manage cookies in your browser, visit your browser's help section. 
              Please note that disabling certain cookies may impact your experience on our website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Cookies</h2>
            <p className="text-gray-700">
              We may allow third-party service providers to place cookies on our website for various purposes, 
              including analytics, advertising, and social media integration. These third parties have their 
              own privacy policies governing their use of cookies and other tracking technologies. 
              Please review their policies for more information about their practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this cookie policy from time to time to reflect changes in our practices or 
              for other operational, legal, or regulatory reasons. We will notify you of any material 
              changes by posting the new policy on our website and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy Policy Reference</h2>
            <p className="text-gray-700">
              For more information about how we collect, use, and protect your personal information, 
              please refer to our <a href="/privacy-policy" className="text-green-600 hover:text-green-800 underline">Privacy Policy</a>. 
              The Privacy Policy provides comprehensive information about our data practices and your rights regarding your personal information.
            </p>
          </section>

        </div>
      </div>
    </FooterLayout>
  );
};

export default CookiePolicy;