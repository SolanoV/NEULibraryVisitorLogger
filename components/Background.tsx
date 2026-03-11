import { ReactNode } from 'react'

type BackgroundProps = {
  children: ReactNode
}

export default function Background({ children }: BackgroundProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-slate-50 dark:bg-black text-black dark:text-white overflow-hidden transition-colors duration-300">
      
      {/* 1. THE NEW SUBTLE IMAGE LAYER */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 dark:opacity-[0.07] transition-opacity duration-300"
        style={{ backgroundImage: "url('/background.webp')" }}
      />

      {/* 2. THE ANIMATED ORBS */}
      {/* Added mix-blend modes here so the neon orbs colorize the library image underneath! */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center mix-blend-multiply dark:mix-blend-screen opacity-80">
        
        {/* Purple Orb */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 dark:bg-purple-600/30 rounded-full filter blur-[100px] animate-blob transition-colors duration-300"></div>
        
        {/* Cyan/Blue Orb */}
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-600/20 dark:bg-cyan-600/30 rounded-full filter blur-[100px] animate-blob [animation-delay:2s] transition-colors duration-300"></div>
        
        {/* Darker Blue/Indigo Orb */}
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-indigo-500/20 dark:bg-indigo-900/20 rounded-full filter blur-[120px] animate-blob [animation-delay:4s] transition-colors duration-300"></div>
      </div>

      {/* 3. FOREGROUND CONTENT */}
      <div className="relative z-10 w-full flex-1 flex flex-col">
        {children}
      </div>
      
    </div>
  )
}