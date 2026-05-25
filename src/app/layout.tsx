import ScrollToTop from "@/components/common/ScrollToTop"
import {TMDBApiProvider} from "@/components/TMDBApiProvider"
import Version from "@/components/Version"
import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import type {Metadata} from "next"
import Link from "next/link"
import {ReactNode} from "react"
import {AppRouterCacheProvider} from '@mui/material-nextjs/v15-appRouter'
import Button from "@mui/material/Button"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"

import ClientTheme from "@/components/ClientTheme"
import { NotificationsProvider } from "@/components/NotificationsProvider"

export const metadata: Metadata = {
  title: "Mergerr",
  description: "Search TMDB and add movies to your *arr stack",
}

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: ReactNode;
}>) {

  return (
    <html lang="en">
    <body>
    <AppRouterCacheProvider>
      <ClientTheme>
        <NotificationsProvider>
          <TMDBApiProvider>
              <Box sx={{maxWidth: 1200, margin: "10px auto"}}>
                <Paper elevation={2} component="header" sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1,
                  mb: 2,
                }}>
                  <Link href="/" style={{textDecoration: 'none'}}>
                    <Typography variant="h6" component="div" sx={{flexGrow: 1}} color="textSecondary">
                      Mergerr
                      <Version/>
                    </Typography>
                  </Link>
                  <Stack direction="row" spacing={1}>
                    <Link href="/" passHref>
                      <Button>Home</Button>
                    </Link>
                    <Link href="/settings" passHref>
                      <Button>Settings</Button>
                    </Link>
                  </Stack>
                </Paper>
                {children}
              </Box>
          </TMDBApiProvider>
        </NotificationsProvider>
      </ClientTheme>
    </AppRouterCacheProvider>
    <ScrollToTop />
    </body>
    </html>
  )
}
