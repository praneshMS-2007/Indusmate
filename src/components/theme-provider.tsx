"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Light is the default and the class is toggled explicitly, never inferred
 * from `prefers-color-scheme`. A judge's laptop can be in dark mode for
 * unrelated reasons; this app should not silently open on a different
 * screen than the one it was built to be seen on first. Dark stays fully
 * available — just a click away in the sidebar — for the field-use case the
 * original palette was designed around.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
