'use client'

import { ThemeProvider as NextThemesProvider } from "next-themes"

// By adding ...props and React.ComponentProps, we tell TypeScript it's safe 
// to accept things like 'attribute' and 'defaultTheme' from layout.tsx!
export function ThemeProvider({ 
  children, 
  ...props 
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  )
}