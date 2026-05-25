'use client'

import {Movie} from "@/common/api/Radarr/entities/MovieAPI"
import InfinitProgressOverlay from "@/components/common/InfinitProgressOverlay"
import {Item} from "@/components/common/ItemsLayout/Grid"
import ModalPopup from "@/components/common/ModalPopup"
import MovieCard from "@/components/common/MovieCard"
import {useNotifications} from "@/components/NotificationsProvider"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Stack from "@mui/material/Stack"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import {Fragment, ReactNode, useCallback, useEffect, useMemo, useState} from "react"
import {App} from "@prisma/client"
import Box from "@mui/material/Box"
import Grid from "@/components/common/ItemsLayout/Grid"
import Typography from "@mui/material/Typography"
import InfoIcon from "@mui/icons-material/Info"
import CloseIcon from "@mui/icons-material/Close"
import {QueueEntry} from "@/common/api/Radarr/entities/QueueAPI"
import Link from "next/link"

const Issues = ({record}: {record: QueueEntry}) => {
  if(!record.statusMessages) {
    return null
  }
  return (
    <List>
      {record.statusMessages.map((statusMessage, statusMessageIndex) => (
        <Fragment key={statusMessageIndex}>
          <ListItem>
            {statusMessage.title}
          </ListItem>
          {statusMessage.messages.length > 0 && (
            <List disablePadding>
              {statusMessage.messages.map((message, messageIndex) => (
                <ListItem key={messageIndex}>{message}</ListItem>
              ))}
            </List>
          )}
        </Fragment>
      ))}
    </List>
  )
}

const AdditionalInfo = ({records, item}: { records: QueueEntry[], item: Item }) => {
  const record = useMemo(() => records.find(r => r.id === item.id), [records, item.id])
  const [showInfo, setShowInfo] = useState<boolean>(false)

  const onInfoToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowInfo(v => !v)
  }, [])

  if (!record?.statusMessages) {
    return null
  }

  return (
    <Box sx={{position: 'absolute', inset: 0}}>
      {!showInfo ?
        <InfoIcon onClick={onInfoToggle} sx={{position: 'absolute', right: 0, top: 0, zIndex: 2, cursor: 'pointer'}} fontSize="large" />
        :
        <CloseIcon onClick={onInfoToggle} sx={{position: 'absolute', right: 0, top: 0, zIndex: 2, cursor: 'pointer'}} fontSize="large" />
      }
      {showInfo && (
        <Box sx={{position: 'absolute', inset: 0, zIndex: 1, bgcolor: 'background.paper', textAlign: 'left', overflow: 'auto'}}>
          <Issues record={record} />
        </Box>
      )}
    </Box>
  )
}

const RecordActions = ({item, records, appId, onDetails, children}: {
  records: QueueEntry[]
  item: Item
  appId: string
  onDetails: (queueId: number) => void
  children: ReactNode
}) => {
  const record = useMemo(() => records.find(r => r.id === item.id), [records, item.id])

  if (!record) {
    return <>{children}</>
  }

  return (
    <Stack sx={{height: '100%'}}>
      {children}
      <Stack spacing={1} direction="row" justifyContent="space-between">
        {record.movieId && (
          <Button variant="contained" onClick={() => onDetails(Number(item.id))}>Details</Button>
        )}
        {record.movieId && (
          <Button
            color="secondary"
            variant="contained"
            component={Link}
            href={`/apps/${appId}/queue/${record.movieId}`}
          >
            Movie
          </Button>
        )}
      </Stack>
    </Stack>
  )
}

const Details = ({id, records, appId, onClose}: {id: number | string, records: QueueEntry[], appId: string, onClose: () => void}) => {
  const record = useMemo(() => records.find(r => r.id === id), [records, id])
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!record?.movieId) {
      return
    }

    let cancelled = false
    setLoadError(null)
    setMovie(null)

    fetch(`/api/app/${appId}/movie/${record.movieId}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load movie (${res.status})`)
        }
        return res.json()
      })
      .then((data) => {
        if (!cancelled) {
          setMovie(data)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setLoadError(err.message)
        }
      })

    return () => {
      cancelled = true
    }
  }, [record, appId])

  const moviePath = useMemo(() => {
    if (!record?.movie) {
      return null
    }
    return `${record.movie.path}/${record.movie.cleanTitle}.mkv`
  }, [record])

  if (!record) {
    return (
      <ModalPopup onClose={onClose} title="Queue item not found">
        <Typography color="warning.main">This queue item is no longer available.</Typography>
      </ModalPopup>
    )
  }

  if (loadError) {
    return (
      <ModalPopup onClose={onClose} title="Error">
        <Typography color="error">{loadError}</Typography>
      </ModalPopup>
    )
  }

  if (!movie) {
    return (
      <ModalPopup onClose={onClose}>
        <InfinitProgressOverlay />
      </ModalPopup>
    )
  }

  return (
    <ModalPopup onClose={onClose} title={`${movie.title} (${movie.year})`}>
      <MovieCard movie={movie}>
        <Stack spacing={2}>
          <Card raised>
            <CardContent>
              <Typography component="div">{record.title}</Typography>
              <Typography component="div" whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden" title={moviePath || 'not found'}>{moviePath}</Typography>
              {record.statusMessages && (
                <List>
                  {record.statusMessages.map((statusMessage, statusMessageIndex) => (
                    <ListItem key={statusMessageIndex} sx={{flexWrap: 'wrap'}}>
                      {statusMessage.title}
                      {statusMessage.messages.length > 0 && (
                        <List sx={{width: '100%'}}>
                          {statusMessage.messages.map((message, messageIndex) => (
                            <ListItem key={messageIndex}>{message}</ListItem>
                          ))}
                        </List>
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Stack>
      </MovieCard>
    </ModalPopup>
  )
}

export default function Queue({app}: { app: App }) {
  const {addNotification} = useNotifications()
  const [records, setRecords] = useState<QueueEntry[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showDetailsForID, setShowDetailsForID] = useState<number | string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch(`/api/app/${app.id}/queue`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load queue (${res.status})`)
        }
        return res.json()
      })
      .then((data) => {
        if (cancelled) {
          return
        }
        const queueRecords: QueueEntry[] = Array.isArray(data.records) ? data.records : []
        setRecords(queueRecords)
        setItems(queueRecords.map((record: QueueEntry) => {
          let poster = record.movie?.images.find((img) => img.coverType === 'poster')?.remoteUrl
          if (!poster) {
            poster = record.movie?.images.find((img) => img.coverType === 'screenshot')?.remoteUrl
          }

          return {
            id: record.id,
            image: poster,
            title: record.movie?.title || record.title,
          }
        }))
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setLoadError(err.message)
          addNotification({
            title: 'Queue',
            message: err.message,
            type: 'error',
          })
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [app.id, addNotification])

  if (loading) {
    return <InfinitProgressOverlay />
  }

  if (loadError) {
    return <Typography variant="h6" sx={{color: 'error.main'}}>{loadError}</Typography>
  }

  if (records.length === 0) {
    return <Typography variant="h6" sx={{color: 'warning.main'}}>No records found</Typography>
  }

  return (
    <>
      <Grid
        items={items}
        ActionComponent={({item, children}) => (
          <RecordActions records={records} item={item} appId={app.id} onDetails={setShowDetailsForID}>
            {children}
          </RecordActions>
        )}
        AdditionalContentComponent={({item}) => <AdditionalInfo records={records} item={item} />}
      />
      {showDetailsForID && (
        <Details id={showDetailsForID} records={records} appId={app.id} onClose={() => setShowDetailsForID(null)} />
      )}
    </>
  )
}
