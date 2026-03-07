import { ReactNode } from 'react'

type BackgroundProps = {
  children: ReactNode
}

export default function Background({ children }: BackgroundProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-24">
      {children}
    </div>
  )
}