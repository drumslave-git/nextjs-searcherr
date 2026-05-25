'use client'

import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {startTransition, useEffect} from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error(error)
  }, [error])

  const retry = () => {
    startTransition(() => {
      router.refresh()
      reset()
    })
  }

  return (
    <Paper sx={{p: 3, textAlign: 'center'}}>
      <Stack spacing={2} alignItems="center">
        <Typography variant="h6" color="error">
          Something went wrong
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error.message || 'An unexpected error occurred.'}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={retry}>
            Try again
          </Button>
          <Button component={Link} href="/" variant="outlined">
            Go home
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}
