import type React from "react"
import Image from "next/image"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Branding Panel (Hidden on mobile, visible on lg+) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0077FF] via-[#3FA9FF] to-[#00D4FF]" />
        
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl animate-pulse" />
          <div className="absolute bottom-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full bg-white/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-white/5 blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        {/* Floating Circles Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-4 h-4 rounded-full bg-white/30" />
          <div className="absolute top-40 right-32 w-6 h-6 rounded-full bg-white/20" />
          <div className="absolute bottom-32 left-40 w-3 h-3 rounded-full bg-white/25" />
          <div className="absolute bottom-48 right-20 w-5 h-5 rounded-full bg-white/15" />
          <div className="absolute top-1/2 left-16 w-2 h-2 rounded-full bg-white/30" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          {/* Logo */}
          <div className="mb-12">
            <Image
              src="/1xstore-logo.png"
              alt="1xstore Logo"
              width={200}
              height={64}
              className="h-auto w-auto max-w-[220px] brightness-0 invert drop-shadow-2xl"
              priority
            />
          </div>
          
          {/* Tagline */}
          <div className="text-center max-w-md">
            <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
              Bienvenue sur 1xstore
            </h1>
            <p className="text-lg xl:text-xl text-white/90 leading-relaxed">
              La plateforme de confiance pour vos dépôts et retraits sur les sites de paris sportifs en Afrique de l'Ouest.
            </p>
          </div>
          
          {/* Features */}
          <div className="mt-16 space-y-6 w-full max-w-sm">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Transactions Rapides</h3>
                <p className="text-sm text-white/70">Dépôts et retraits en quelques secondes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">100% Sécurisé</h3>
                <p className="text-sm text-white/70">Vos transactions sont protégées</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Support 24/7</h3>
                <p className="text-sm text-white/70">Une équipe à votre écoute</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Form Panel */}
      <div className="flex-1 flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-blue-50/50 dark:from-slate-950 dark:to-slate-900">
        {/* Mobile Header with gradient */}
        <div className="lg:hidden relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0077FF] via-[#3FA9FF] to-[#00D4FF]" />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-[-50%] right-[-20%] w-[300px] h-[300px] rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-[-30%] left-[-20%] w-[250px] h-[250px] rounded-full bg-white/10 blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col items-center py-10 px-6">
        <Image
          src="/1xstore-logo.png"
          alt="1xstore Logo"
              width={160}
              height={51}
              className="h-auto w-auto max-w-[160px] brightness-0 invert drop-shadow-xl"
          priority
        />
            <p className="mt-4 text-white/90 text-center text-sm max-w-xs">
              La plateforme de confiance pour vos transactions
            </p>
          </div>
          {/* Curved bottom edge */}
          <div className="absolute bottom-0 left-0 right-0 h-6">
            <svg viewBox="0 0 1440 48" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <path d="M0 48h1440V0C1440 0 1140 48 720 48S0 0 0 0v48z" className="fill-slate-50 dark:fill-slate-950" />
            </svg>
          </div>
        </div>
        
        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-[420px] lg:max-w-[460px]">
            {children}
          </div>
        </div>
        
        {/* Footer */}
        {/* <div className="py-4 px-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © 2024 1xstore. Tous droits réservés.
          </p>
        </div> */}
      </div>
    </div>
  )
}
