'use client'

import {MergeStatus, MergeWithInputs} from "@/common/api/Mergerr/types"
import {Movie} from "@/common/api/Radarr/entities/MovieAPI"
import InfinitProgressOverlay from "@/components/common/InfinitProgressOverlay"
import {Item} from "@/components/common/ItemsLayout/Grid"
import ModalPopup from "@/components/common/ModalPopup"
import MovieCard from "@/components/common/MovieCard"
import {useNotifications} from "@/components/NotificationsProvider"
import {PauseCircle, Report} from "@mui/icons-material"
import CheckCircle from "@mui/icons-material/CheckCircle"
import {Avatar, CardHeader} from "@mui/material"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import ListItemText from "@mui/material/ListItemText"
import Stack from "@mui/material/Stack"
import useTheme from "@mui/material/styles/useTheme"
import Chip from "@mui/material/Chip"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import {Fragment, ReactNode, useCallback, useEffect, useMemo, useState} from "react"
import {App, Merge} from "@prisma/client"
import Box from "@mui/material/Box"
import Grid from "@/components/common/ItemsLayout/Grid"
import Typography from "@mui/material/Typography"
import InfoIcon from "@mui/icons-material/Info"
import CloseIcon from "@mui/icons-material/Close"
import {QueueEntry} from "@/common/api/Radarr/entities/QueueAPI"

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

const DownloadingChip = ({record}: {record: QueueEntry}) => {
  const theme = useTheme()

  const percentage = useMemo(() => {
    return Math.round(record.sizeleft * 100 / record.size)
  }, [record.sizeleft, record.size])

  const bgcolor = useMemo(() => {
    if(percentage === 100) {
      return theme.palette.success.main
    }
    if(percentage >= 80) {
      return theme.palette.info.main
    }
    return theme.palette.warning.main
  }, [percentage, theme])

  return <Chip sx={{position: 'relative', overflow: 'hidden'}} title={`${percentage}%`} label={
    <Box>
      <Box position="absolute" left={0} top={0} width={`${percentage}%`} height="100%" bgcolor={bgcolor} />
      <Typography position="relative">{record.trackedDownloadState}</Typography>
    </Box>
  } />
}

const Statuses = ({record}: {record: QueueEntry}) => {
  return <Box paddingTop={2}>
    <Chip label={record.status} />
    {record.trackedDownloadState && record.sizeleft > 0 && (
      <DownloadingChip record={record} />
    )}
    {record.trackedDownloadStatus && (
      <Chip label={record.trackedDownloadStatus} />
    )}
  </Box>
}

const AdditionalInfo = ({records, item}: { records: QueueEntry[], item: Item }) => {
  const record = useMemo(() => records.find(r => r.id === item.id) as QueueEntry, [records, item.id])
  const [showInfo, setShowInfo] = useState<boolean>(false)

  const onInfoToggle = useCallback((e: any) => {
    e.preventDefault()
    e.stopPropagation()
    setShowInfo(v => !v)
  }, [])

  return <>
    {record.statusMessages && (
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
    )}
    {/*<Statuses record={record} />*/}
  </>
}

const RecordActions = ({item, records, onMerge, onMovieChange, children}: { records: QueueEntry[], item: Item, onMerge: (queueId: number) => void, onMovieChange: (queueId: number) => void, children: ReactNode }) => {
  const record = useMemo(() => records.find(r => r.id === item.id) as QueueEntry, [records, item.id])

  return <Stack onClick={() => onMerge(Number(item.id))} sx={{height: '100%'}}>
    {children}
    <Stack spacing={1} direction="row" justifyContent="space-between">
      {record.movieId && (
        <Button variant="contained" onClick={() => onMerge(Number(item.id))}>Merge</Button>
      )}
      <Button color="secondary" variant="contained" onClick={() => onMovieChange(Number(item.id))}>Movie</Button>
    </Stack>
  </Stack>
}

const Details = ({id, records, appId, onClose}: {id: number | string, records: QueueEntry[], appId: string, onClose: () => void}) => {
  const {addNotification} = useNotifications()
  const record = useMemo(() => records.find(r => r.id === id) as QueueEntry, [records, id])
  const [movie, setMovie] = useState<Movie | null>(null)
  const [merge, setMerge] = useState<MergeWithInputs>()

  useEffect(() => {
    if(!record.movieId) {
      return
    }
    fetch(`/api/app/${appId}/movie/${record.movieId}`).then(res => res.json())
      .then(setMovie)
  }, [record, appId])

  useEffect(() => {
    fetch(`/api/app/${appId}/merge?queueId=${record.id}`).then(res => res.json())
      .then(setMerge)
  }, [record, appId])

  const moviePath = useMemo(() => {
    return record.movie ? `${record.movie.path}/${record.movie.cleanTitle}.mkv` : null
  }, [record])

  const mergeStatusColor = useMemo(() => {
    if(!merge) {
      return 'default'
    }
    if(merge.status === MergeStatus.created) {
      return 'info'
    }
    if(merge.status === MergeStatus.running) {
      return 'warning'
    }
    if(merge.status === MergeStatus.failed) {
      return 'error'
    }
    if(merge.status === MergeStatus.done) {
      return 'success'
    }
  }, [merge])

  const onMerge = useCallback(() => {
    fetch(`/api/app/${appId}/merge`, {
      method: 'POST',
      body: JSON.stringify({
        queueId: record.id,
        movieId: record.movieId,
      }),
      headers: {
        'Content-Type': 'application/json'
      },
    }).then(res => res.json())
      .then(data => {
        if(data.error) {
          addNotification({
            title: 'Error',
            message: data.error,
            type: 'error',
          })
        }
      })
  }, [appId, record, addNotification])

  if(!movie) {
    return (
      <ModalPopup onClose={onClose}>
        <InfinitProgressOverlay />
      </ModalPopup>
    )
  }

  return (
    <ModalPopup onClose={onClose} title={`${movie.title} (${movie.year})`}>
      <MovieCard movie={movie} actions={(
        <Button variant="contained" onClick={onMerge}>Merge</Button>
      )}>
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
          {merge && (
            <Card raised>
              <CardHeader
                title={`Merge: ${movie.cleanTitle}.mkv`}
                avatar={(
                  <>
                    {merge.status === MergeStatus.created && <PauseCircle color="info" fontSize="large" />}
                    {merge.status === MergeStatus.running && <PauseCircle color="warning" fontSize="large" />}
                    {merge.status === MergeStatus.failed && <Report color="error" fontSize="large" />}
                    {merge.status === MergeStatus.done && <CheckCircle color="success" fontSize="large" />}
                  </>
                )}
                action={(
                  <>
                  {merge.status === MergeStatus.created && <Button variant="contained" onClick={onMerge}>Run</Button>}
                  {merge.status === MergeStatus.running && <Button variant="contained" color="warning" onClick={onMerge}>Stop</Button>}
                  {(merge.status === MergeStatus.failed || merge.status === MergeStatus.done) && <Button variant="contained" color="warning" onClick={onMerge}>Stop</Button>}
                  </>
                )}
                subheader={merge.status}
              />
              <CardContent>
                <List>
                  {merge.inputs.map(({name, path}) => (
                    <ListItem key={path}>
                      <ListItemText primary={name} secondary={path} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Stack>
      </MovieCard>
    </ModalPopup>
  )
}

export default function Queue({app}: { app: App }) {
  const [records, setRecords] = useState<QueueEntry[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showDetailsForID, setShowDetailsForID] = useState<number | string | null>(null)
  const [showMovieSelectorForID, setShowMovieSelectorForID] = useState<number | string | null>(null)

  useEffect(() => {
    fetch(`/api/app/${app.id}/queue`).then(res => res.json())
      .then(data => {
        setRecords(data.records)
        setItems(data.records.map((record: QueueEntry) => {
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
        setLoading(false)
      })
  }, [app.id])

  if (loading) {
    return <InfinitProgressOverlay />
  }

  if (records.length === 0) {
    return <Typography variant="h6" sx={{color: 'warning.main'}}>No records found</Typography>
  }

  return (
    <>
      <Grid
        items={items}
        ActionComponent={({item, children}) => <RecordActions records={records} item={item} onMerge={setShowDetailsForID} onMovieChange={setShowDetailsForID}>{children}</RecordActions>}
        AdditionalContentComponent={({item}) => <AdditionalInfo records={records} item={item} />}
      />
      {showDetailsForID && (
        <Details id={showDetailsForID} records={records} appId={app.id} onClose={() => setShowDetailsForID(null)} />
      )}
    </>
  )
}