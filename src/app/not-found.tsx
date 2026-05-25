import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Link from 'next/link'

export default function NotFound() {
  return (
    <Paper sx={{p: 3, textAlign: 'center'}}>
      <Stack spacing={2} alignItems="center">
        <Typography variant="h6">Page not found</Typography>
        <Typography variant="body2" color="text.secondary">
          The page you requested does not exist.
        </Typography>
        <Button component={Link} href="/" variant="contained">
          Go home
        </Button>
      </Stack>
    </Paper>
  )
}
