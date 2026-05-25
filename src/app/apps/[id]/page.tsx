import AppIcon from "@/components/AppIcon"
import Queue from "@/components/Queue"
import {prisma} from "@/lib/prisma"
import Box from "@mui/material/Box"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
import {notFound} from "next/navigation"

export default async function AppPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const app = await prisma.app.findUnique({
    where: {
      id: params.id,
    },
  })
  if (!app) {
    notFound()
  }

  return <Paper>
    <Box sx={{p: 2}}>
      <Box sx={{display: 'flex', gap: 2}}>
        <AppIcon app={app} />
        <Typography variant="subtitle1" gutterBottom>
          {app.name}
        </Typography>
      </Box>
      <Typography variant="subtitle2" gutterBottom>
        {app.url}
      </Typography>
      <Queue app={app} />
    </Box>
  </Paper>
}
