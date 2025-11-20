import HeroLight from '@/components/layout/HeroLight';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function HeroPreview() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Light Theme Hero with 3D Model Animation */}
        <HeroLight />
        
        {/* Info Section */}
        <section className="py-16 bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">
                🎉 New Hero Section - Light Theme
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                This is a preview of the redesigned hero section featuring a rotating 3D brake rotor model
                with light theme styling following the design system.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6">
                  <div className="text-4xl mb-3">🎨</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Light Theme</h3>
                  <p className="text-gray-600">
                    Professional design with blue gradients, clean backgrounds, and subtle patterns
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
                  <div className="text-4xl mb-3">🔄</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">3D Animation</h3>
                  <p className="text-gray-600">
                    36-frame rotation sequence with smooth animation and floating info cards
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-cyan-50 to-purple-50 rounded-xl p-6">
                  <div className="text-4xl mb-3">⚡</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Lightweight</h3>
                  <p className="text-gray-600">
                    SVG-based frames totaling ~72KB with optional CDN delivery via Supabase
                  </p>
                </div>
              </div>

              <div className="pt-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Features Implemented</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-3xl mx-auto">
                  <div className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Animated text prompt with typing effect</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Rotating 3D model (36 frames)</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Gradient CTAs with hover effects</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Floating info cards with specs</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Stats section with gradient text</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Supabase CDN support</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Responsive grid layout</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Loading states & preloading</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t mt-12">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Next Steps</h3>
                <div className="bg-blue-50 rounded-xl p-6 text-left max-w-2xl mx-auto">
                  <ol className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="font-semibold text-primary mr-2">1.</span>
                      <span>Review the implementation in this preview</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold text-primary mr-2">2.</span>
                      <span>Check <code className="bg-white px-2 py-1 rounded text-sm">HERO_REDESIGN_INSTRUCTIONS.md</code> for usage</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold text-primary mr-2">3.</span>
                      <span>Update <code className="bg-white px-2 py-1 rounded text-sm">src/app/page.tsx</code> to use HeroLight</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold text-primary mr-2">4.</span>
                      <span>(Optional) Upload frames to Supabase CDN: <code className="bg-white px-2 py-1 rounded text-sm">npm run upload-frames</code></span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold text-primary mr-2">5.</span>
                      <span>(Optional) Generate photorealistic renders with Blender</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}






