"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

const ThemeProvider = ({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) => (
  <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem {...props}>
    {children}
  </NextThemesProvider>
);

export { ThemeProvider };
