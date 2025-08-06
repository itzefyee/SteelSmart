import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import FeaturedProducts from '@/components/FeaturedProducts';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        
        {/* Featured Products Section */}
        <FeaturedProducts />
        
        {/* Product Categories Showcase */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Explore Our Product Categories</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                From precision robotics to heavy-duty structural components, discover our comprehensive range of industrial products.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Link href="/catalog?category=robotic" className="group cursor-pointer bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-full h-32 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg mb-4 flex items-center justify-center">
                  <div className="w-16 h-10 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg relative">
                    <div className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-6 bg-gray-700 rounded-r"></div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                  Robotic Components
                </h3>
                <p className="text-gray-600 text-sm">
                  High-precision servo motors, actuators, and automation components for industrial robotics.
                </p>
              </Link>
              
              <Link href="/catalog?category=structural" className="group cursor-pointer bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-full h-32 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg mb-4 flex items-center justify-center">
                  <div className="w-20 h-8 relative">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-gray-500 to-gray-700 rounded-sm"></div>
                    <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 w-1 h-5 bg-gradient-to-r from-gray-600 to-gray-800"></div>
                    <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-gray-500 to-gray-700 rounded-sm"></div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                  Structural Steel
                </h3>
                <p className="text-gray-600 text-sm">
                  I-beams, channels, angles, and structural steel components for construction and fabrication.
                </p>
              </Link>
              
              <Link href="/catalog?category=fasteners" className="group cursor-pointer bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-full h-32 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg mb-4 flex items-center justify-center">
                  <div className="flex space-x-2">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 bg-gradient-to-br from-yellow-600 to-orange-700 transform rotate-45 mb-1"></div>
                      <div className="w-1 h-6 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-sm"></div>
                    </div>
                    <div className="w-3 h-3 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full relative">
                      <div className="absolute inset-0.5 w-2 h-2 bg-gray-800 rounded-full"></div>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                  Fasteners
                </h3>
                <p className="text-gray-600 text-sm">
                  High-grade bolts, nuts, washers, and specialty fasteners for industrial applications.
                </p>
              </Link>
              
              <Link href="/catalog?category=custom" className="group cursor-pointer bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-full h-32 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg mb-4 flex items-center justify-center">
                  <div className="w-16 h-12 relative">
                    <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-sm"></div>
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-purple-600 to-indigo-700 rounded-sm"></div>
                    <div className="absolute top-1 left-1 w-1 h-1 bg-gray-800 rounded-full"></div>
                    <div className="absolute bottom-1 left-4 w-1 h-1 bg-gray-800 rounded-full"></div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                  Custom Parts
                </h3>
                <p className="text-gray-600 text-sm">
                  Custom fabricated brackets, enclosures, and precision-machined components to your specifications.
                </p>
              </Link>
            </div>
          </div>
        </section>
        
        
        {/* Value Propositions */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose SteelSmart?</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Advanced AI technology meets manufacturing expertise to deliver the best steel parts sourcing experience.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-xl mx-auto mb-6 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered Analysis</h3>
                <p className="text-gray-600 leading-relaxed">Upload your technical drawings and get instant product recommendations with confidence scores and detailed reasoning.</p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mx-auto mb-6 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Technical Expertise</h3>
                <p className="text-gray-600 leading-relaxed">Comprehensive specifications, compatibility information, and technical support for all industrial components.</p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl mx-auto mb-6 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Lightning Fast Quotes</h3>
                <p className="text-gray-600 leading-relaxed">Get competitive quotes for custom parts and bulk orders within 24 hours with transparent pricing.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}