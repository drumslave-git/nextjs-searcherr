'use client'

import {MovieAddSetting} from "@/common/api/Radarr/entities/MovieAPI"
import {QualityProfile} from "@/common/api/Radarr/entities/QualityProfileAPI"
import {RootFolder} from "@/common/api/Radarr/entities/RootFolderAPI"
import {Genre} from "@/common/api/TMDB/entities/GenresAPI"
import {MovieResult} from "@/common/api/TMDB/entities/SearchAPI"
import InfinitProgressOverlay from "@/components/common/InfinitProgressOverlay"
import Grid, {Item} from "@/components/common/ItemsLayout/Grid"
import ModalPopup from "@/components/common/ModalPopup"
import MovieCard from "@/components/common/MovieCard"
import Rating from "@/components/common/TMDB/Rating"
import {useNotifications} from "@/components/NotificationsProvider"
import {useTMDBApi} from "@/components/TMDBApiProvider"
import CheckCircle from "@mui/icons-material/CheckCircle"
import {Checkbox, FormControlLabel, Switch} from "@mui/material"
import LinearProgress from "@mui/material/LinearProgress"
import Select from "@mui/material/Select"
import MenuItem from "@mui/material/MenuItem"
import InputLabel from "@mui/material/InputLabel"
import FormControl from "@mui/material/FormControl"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Chip from "@mui/material/Chip"
import Fab from "@mui/material/Fab"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemText from "@mui/material/ListItemText"
import styled from "@mui/material/styles/styled"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import IconButton from "@mui/material/IconButton"
import SearchIcon from '@mui/icons-material/Search'
import Stack from '@mui/material/Stack'
import {App} from "@prisma/client"
import Link from "next/link"
import {useSearchParams} from "next/navigation"
import { ReactNode, use, useCallback, useEffect, useMemo, useRef, useState } from "react"
import {alpha } from "@mui/material/styles"

const SearchIconButton = styled(IconButton)(() => ({
  aspectRatio: 1,
  height: '100%',
  alignSelf: 'center',
}))

const ActionComponent = ({item, children, onClick}: { item: Item, children: ReactNode, onClick: (id: number | string) => void }) => {
  const onClickHandler = useCallback(() => {
    onClick(item.id)
  }, [item.id, onClick])
  return (
    <Stack onClick={onClickHandler} sx={{height: '100%', cursor: 'pointer'}}>
      {children}
    </Stack>
  )
}

const SemiTransparentCard = styled(Card)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.9),
}))

const createDefaultAddOptions = (): MovieAddSetting => ({
  qualityProfileId: 1,
  minimumAvailability: 'released',
  rootFolderPath: '',
  monitored: true,
  addOptions: {
    searchForMovie: true,
    monitor: 'movieOnly',
  },
  tags: [],
})

const mergeUniqueResults = (current: MovieResult[] | undefined, incoming: MovieResult[]) => {
  const resultsById = new Map<number, MovieResult>()

  current?.forEach(result => {
    resultsById.set(result.id, result)
  })

  incoming.forEach(result => {
    const existing = resultsById.get(result.id)
    resultsById.set(result.id, existing ? {
      ...existing,
      ...result,
      movieAdded: existing.movieAdded || result.movieAdded,
    } : result)
  })

  return Array.from(resultsById.values())
}

const formatAddError = (data: any, status: number) => {
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.map((error: {errorMessage?: string}) => error.errorMessage).filter(Boolean).join(', ')
  }
  return data?.message || `Failed to add movie (${status})`
}

type DetailsProps = {
  id: number | string
  appId: string
  onClose: (id?: number | string) => void
}

const Details = ({id, appId, onClose}: DetailsProps) => {
  const {addNotification} = useNotifications()

  const [details, setDetails] = useState<MovieResult | null>(null)
  const [addingMovie, setAddingMovie] = useState(false)
  const [app, setApp] = useState<App | null>(null)
  const [addedMovie, setAddedMovie] = useState<boolean | undefined>(undefined)
  const [newMovie, setNewMovie] = useState<{tmdbId: string, options: MovieAddSetting}>({
    tmdbId: String(id),
    options: createDefaultAddOptions(),
  })
  const [rootFolders, setRootFolders] = useState<RootFolder[]>([])
  const [qualityProfiles, setQualityProfiles] = useState<QualityProfile[]>([])

  useEffect(() => {
    fetch(`/api/app/${appId}`).then(res => res.json()).then(data => {
      setApp(data)
    })
  }, [appId])

  useEffect(() => {
    fetch(`/api/tmdb/movie/${id}`)
      .then(res => res.json())
      .then(data => {
        setDetails(data.data ? data.data : data)
      })
  }, [id])

  useEffect(() => {
    fetch(`/api/app/${appId}/movie?tmdbId=${id}`).then(res => res.json()).then(data => {
      setAddedMovie(data.length > 0)
    })
  }, [appId, id])

  useEffect(() => {
    if(!addedMovie) {
      fetch(`/api/app/${appId}/rootFolder`).then(res => res.json()).then(data => {
        setRootFolders(data)
      })
      fetch(`/api/app/${appId}/qualityProfile`).then(res => res.json()).then(data => {
        setQualityProfiles(data)
      })
    }
  }, [addedMovie, appId])

  useEffect(() => {
    const options: Record<string, any> = {}
    if(rootFolders.length > 0) {
      options['rootFolderPath'] = rootFolders[0].path
    }
    if(qualityProfiles.length > 0) {
      options['qualityProfileId'] = qualityProfiles[0].id
    }
    setNewMovie((prev) =>
      ({...prev, options: {...prev.options, ...options}})
    )
  }, [qualityProfiles, rootFolders])

  const changeNewMovieOption = useCallback((key: string, value: any) => {
    setNewMovie((prev) => {
      const newOptions = { ...prev.options } // Clone the existing options
      const keys = key.split('.')
      let currentPart: any = newOptions

      // Traverse to the correct depth
      keys.forEach((part, index) => {
        if (index === keys.length - 1) {
          // If it's the last key, set the value
          currentPart[part] = value
        } else {
          // If the part doesn't exist, create it as an object
          currentPart[part] = { ...currentPart[part] }
          currentPart = currentPart[part]
        }
      })

      return {
        ...prev,
        options: newOptions,
      }
    })
  }, [])
  
  const addMovie = useCallback(() => {
    setAddingMovie(true)
    fetch(`/api/app/${appId}/movie`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newMovie)
    }).then(res => res.json()).then(data => {
      if(data.tmdbId) {
        addNotification({
          title: 'Success',
          message: 'Movie added successfully',
          type: 'success'
        })
        onClose(data.tmdbId)
      } else {
        if (data.postedDataWas) {
          console.error('Failed to add movie', data)
        }
        if(data.errors && data.errors.length > 0) {
          data.errors.forEach((error: {errorMessage: string}) => {
            addNotification({
              title: 'Error',
              message: error.errorMessage,
              type: 'error'
            })
          })
        } else if (data.message) {
          addNotification({
            title: 'Error',
            message: data.message,
            type: 'error'
          })
        }
      }
    })
      .finally(() => {
        setAddingMovie(false)
      })
  }, [addNotification, appId, newMovie, onClose])

  const onCloseHandler = useCallback(() => {
    if (!addingMovie) {
      onClose()
    }
  }, [addingMovie, onClose])

  if (!details) {
    return <ModalPopup onClose={onCloseHandler}>
      <InfinitProgressOverlay />
    </ModalPopup>
  }

  return (
    <ModalPopup onClose={onCloseHandler} title={details.title}>
      <MovieCard movie={details} actions={
        app ? (
          <>
            {addedMovie
              ? (
                <Link href={`${app.public_url || app.url}/movie/${id}`} target="_blank" passHref>
                  <Button variant="contained" color="success">View in {app.name}</Button>
                </Link>
              )
              : (
                <Button variant="contained" onClick={addMovie} color="primary">Add to {app.name}</Button>
              )
            }
          </>
        ) : null
      }>
        {!addedMovie && (
          <SemiTransparentCard raised>
            <CardContent>
              <Stack direction="column" spacing={2} paddingTop={2}>
                {rootFolders.length > 0 && (
                  <FormControl fullWidth>
                    <InputLabel>Root Folder</InputLabel>
                    <Select
                      value={newMovie.options.rootFolderPath}
                      label="Root Folder"
                      onChange={e => changeNewMovieOption('rootFolderPath', e.target.value)}
                    >
                      {rootFolders.map(folder => (
                        <MenuItem key={folder.id} value={folder.path}>{folder.path}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                {qualityProfiles.length > 0 && (
                  <FormControl fullWidth>
                    <InputLabel>Quality Profile</InputLabel>
                    <Select
                      value={newMovie.options.qualityProfileId}
                      label="Root Folder"
                      onChange={e => changeNewMovieOption('qualityProfileId', e.target.value)}
                    >
                      {qualityProfiles.map(qualityProfile => (
                        <MenuItem key={qualityProfile.id} value={qualityProfile.id}>{qualityProfile.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                <FormControl fullWidth>
                  <InputLabel>Monitor</InputLabel>
                  <Select
                    value={newMovie.options.addOptions.monitor}
                    label="Monitor"
                    onChange={e => changeNewMovieOption('addOptions.monitor', e.target.value)}
                  >
                    <MenuItem value="movieOnly">Movie</MenuItem>
                    <MenuItem value="movieAndCollection">Movie and Collection</MenuItem>
                    <MenuItem value="none">None</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </CardContent>
          </SemiTransparentCard>
        )}
      </MovieCard>
    </ModalPopup>
  )
}

type BulkAddStatus = 'pending' | 'adding' | 'added' | 'failed'

type BulkAddState = Record<number, {
  status: BulkAddStatus
  message?: string
}>

const BulkAddModal = ({appId, movies, onClose, onComplete}: {
  appId: string
  movies: MovieResult[]
  onClose: () => void
  onComplete: (addedIds: number[]) => void
}) => {
  const [rootFolders, setRootFolders] = useState<RootFolder[]>([])
  const [qualityProfiles, setQualityProfiles] = useState<QualityProfile[]>([])
  const [options, setOptions] = useState<MovieAddSetting>(createDefaultAddOptions())
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [statuses, setStatuses] = useState<BulkAddState>(() => {
    return Object.fromEntries(movies.map(movie => [movie.id, {status: 'pending' as BulkAddStatus}]))
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/app/${appId}/rootFolder`).then(res => res.json()).then(data => {
        setRootFolders(Array.isArray(data) ? data : [])
      }),
      fetch(`/api/app/${appId}/qualityProfile`).then(res => res.json()).then(data => {
        setQualityProfiles(Array.isArray(data) ? data : [])
      }),
    ])
  }, [appId])

  useEffect(() => {
    setOptions(prev => ({
      ...prev,
      rootFolderPath: rootFolders[0]?.path || prev.rootFolderPath,
      qualityProfileId: qualityProfiles[0]?.id || prev.qualityProfileId,
    }))
  }, [qualityProfiles, rootFolders])

  const completedCount = useMemo(() => {
    return Object.values(statuses).filter(({status}) => status === 'added' || status === 'failed').length
  }, [statuses])

  const addedCount = useMemo(() => {
    return Object.values(statuses).filter(({status}) => status === 'added').length
  }, [statuses])

  const progress = movies.length ? Math.round(completedCount * 100 / movies.length) : 0

  const changeOption = useCallback((key: string, value: any) => {
    setOptions(prev => {
      const newOptions = {...prev}
      const keys = key.split('.')
      let currentPart: any = newOptions

      keys.forEach((part, index) => {
        if (index === keys.length - 1) {
          currentPart[part] = value
        } else {
          currentPart[part] = {...currentPart[part]}
          currentPart = currentPart[part]
        }
      })

      return newOptions
    })
  }, [])

  const submit = useCallback(async () => {
    setSubmitting(true)
    setSubmitted(true)
    const addedIds: number[] = []

    for (const movie of movies) {
      setStatuses(prev => ({
        ...prev,
        [movie.id]: {status: 'adding'},
      }))

      try {
        const response = await fetch(`/api/app/${appId}/movie`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tmdbId: String(movie.id),
            options,
          }),
        })
        const data = await response.json().catch(() => ({}))

        if (!response.ok || !data.tmdbId) {
          throw new Error(formatAddError(data, response.status))
        }

        addedIds.push(movie.id)
        setStatuses(prev => ({
          ...prev,
          [movie.id]: {status: 'added'},
        }))
      } catch (err) {
        const error = err as Error
        setStatuses(prev => ({
          ...prev,
          [movie.id]: {status: 'failed', message: error.message},
        }))
      }
    }

    setSubmitting(false)
    onComplete(addedIds)
  }, [appId, movies, onComplete, options])

  const onCloseHandler = useCallback(() => {
    if (!submitting) {
      onClose()
    }
  }, [onClose, submitting])

  return (
    <ModalPopup onClose={onCloseHandler} title={`Add ${movies.length} Selected`}>
      <Stack spacing={2} sx={{p: 2}}>
        <Typography variant="body2" color="text.secondary">
          Movies will be added one by one using the same settings.
        </Typography>
        <Stack direction="column" spacing={2}>
          {rootFolders.length > 0 && (
            <FormControl fullWidth disabled={submitting || submitted}>
              <InputLabel>Root Folder</InputLabel>
              <Select
                value={options.rootFolderPath}
                label="Root Folder"
                onChange={e => changeOption('rootFolderPath', e.target.value)}
              >
                {rootFolders.map(folder => (
                  <MenuItem key={folder.id} value={folder.path}>{folder.path}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {qualityProfiles.length > 0 && (
            <FormControl fullWidth disabled={submitting || submitted}>
              <InputLabel>Quality Profile</InputLabel>
              <Select
                value={options.qualityProfileId}
                label="Quality Profile"
                onChange={e => changeOption('qualityProfileId', e.target.value)}
              >
                {qualityProfiles.map(qualityProfile => (
                  <MenuItem key={qualityProfile.id} value={qualityProfile.id}>{qualityProfile.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControl fullWidth disabled={submitting || submitted}>
            <InputLabel>Monitor</InputLabel>
            <Select
              value={options.addOptions.monitor}
              label="Monitor"
              onChange={e => changeOption('addOptions.monitor', e.target.value)}
            >
              <MenuItem value="movieOnly">Movie</MenuItem>
              <MenuItem value="movieAndCollection">Movie and Collection</MenuItem>
              <MenuItem value="none">None</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {submitted && (
          <Stack spacing={1}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="body2">Added {addedCount} out of {movies.length}</Typography>
          </Stack>
        )}

        <List dense sx={{maxHeight: 320, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, px: 1}}>
          {movies.map(movie => {
            const state = statuses[movie.id]
            return (
              <ListItem key={movie.id} disableGutters>
                <ListItemText
                  primary={movie.title}
                  secondary={state?.message}
                />
                <Chip
                  size="small"
                  color={state?.status === 'added' ? 'success' : state?.status === 'failed' ? 'error' : state?.status === 'adding' ? 'warning' : 'default'}
                  label={state?.status || 'pending'}
                />
              </ListItem>
            )
          })}
        </List>

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button onClick={onCloseHandler} disabled={submitting}>
            {submitted ? 'Close' : 'Cancel'}
          </Button>
          {!submitted && (
            <Button
              variant="contained"
              onClick={submit}
              disabled={!movies.length || !options.rootFolderPath || !options.qualityProfileId}
            >
              Add Movies
            </Button>
          )}
        </Stack>
      </Stack>
    </ModalPopup>
  )
}

const AdditionalInfo = ({item, results, selected, onToggleSelection}: {
  item: Item
  results: MovieResult[]
  selected: boolean
  onToggleSelection: (id: number) => void
}) => {
  const result = useMemo(() => {
    return results.find(r => r.id === item.id)
  }, [item.id, results])

  if (!result) {
    return null
  }

  return (
    <Stack direction="row" spacing={2} justifyContent="space-between" paddingTop={2}>
      <Rating value={result.vote_average} />
      <Stack direction="row" spacing={1} alignItems="center">
        {!result.movieAdded && (
          <Checkbox
            checked={selected}
            onClick={e => e.stopPropagation()}
            onChange={e => {
              e.stopPropagation()
              onToggleSelection(result.id)
            }}
          />
        )}
        {/* @ts-ignore */}
        <CheckCircle fontSize="large" sx={{width: '40px', height: '40px'}} color={result.movieAdded ? 'success' : 'error'} />
      </Stack>
    </Stack>
  )
}

const SearchResults = (props: {
  results: MovieResult[]
  items: Item[]
  selectedMovieIds: Set<number>
  onClick: (id: number | string) => void
  onToggleSelection: (id: number) => void
}) => {
  const {results, items, selectedMovieIds, onClick, onToggleSelection} = props

  return (
    <Grid
      items={items}
      aspectRatio={.5}
      ActionComponent={({item, children}) => <ActionComponent item={item} onClick={onClick}>{children}</ActionComponent>}
      AdditionalContentComponent={({item}) => (
        <AdditionalInfo
          item={item}
          results={results}
          selected={selectedMovieIds.has(Number(item.id))}
          onToggleSelection={onToggleSelection}
        />
      )}
    />
  )
}

export default function SearchPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const searchParams = useSearchParams()
  const {ok, formatImagePath, formatReleaseYear} = useTMDBApi()
  const {addNotification} = useNotifications()

  const [results, setResults] = useState<MovieResult[] | undefined>(undefined)
  const [genres, setGenres] = useState<Genre[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [detailsForID, setDetailsForID] = useState<number | string | null>(null)
  const [bulkAddOpen, setBulkAddOpen] = useState(false)
  const [bulkAddMovies, setBulkAddMovies] = useState<MovieResult[]>([])
  const [selectedMovieIds, setSelectedMovieIds] = useState<Set<number>>(new Set())
  const [hideAdded, setHideAdded] = useState(false)
  const [hideJavanese, setHideJavanese] = useState(false)
  const [hideNoPoster, setHideNoPoster] = useState(false)
  const [hideNoRating, setHideNoRating] = useState(false)

  const eventSource = useRef<EventSource | undefined>(undefined)
  const lastAutoSearchTerm = useRef<string | null>(null)

  const selectedMovies = useMemo(() => {
    if (!results) {
      return []
    }

    return results.filter(result => selectedMovieIds.has(result.id) && !result.movieAdded)
  }, [results, selectedMovieIds])

  const visibleResults = useMemo(() => {
    if(!results) {
      return []
    }
    let filteredResults = mergeUniqueResults(undefined, results)
    const filters: ((result: MovieResult) => boolean)[] = []
    if(hideJavanese) {
      filters.push((result: MovieResult) => result.original_language !== 'ja')
    }
    if(hideAdded) {
      filters.push((result: MovieResult) => !result.movieAdded)
    }
    if(hideNoPoster) {
      filters.push((result: MovieResult) => !!result.poster_path)
    }
    if(hideNoRating) {
      filters.push((result: MovieResult) => !!result.vote_average)
    }
    if(filters.length) {
      filteredResults = filteredResults.filter(result => filters.every(filter => filter(result)))
    }

    return filteredResults
  }, [results, hideAdded, hideJavanese, hideNoPoster, hideNoRating])

  const addableVisibleMovies = useMemo(() => {
    return visibleResults.filter(result => !result.movieAdded)
  }, [visibleResults])

  const bulkActionMovies = selectedMovies.length > 0 ? selectedMovies : addableVisibleMovies
  const bulkActionLabel = selectedMovies.length > 0 ? 'Add Selected' : 'Add All'

  const items = useMemo<Item[]>(() => {
    return visibleResults.map((result) => {
      const releaseYear = formatReleaseYear(result.release_date)
      return {
        id: result.id,
        title: `${result.title}${releaseYear ? ` (${releaseYear})` : ''}`,
        image: result.poster_path ? formatImagePath(result.poster_path, 'poster', 1) : undefined
      }
    })
  }, [formatImagePath, visibleResults, formatReleaseYear])

  useEffect(() => {
    if (ok) {
      fetch(`/api/tmdb/genres/movie`)
        .then(res => res.json())
        .then(data => {
          setGenres(data.genres)
        })
    }
  }, [ok])

  const search = useCallback((e: any) => {
    if (e.preventDefault) {
      e.preventDefault()
    }
    setResults(undefined)
    setSelectedMovieIds(new Set())
    let term = e
    if(typeof term !== 'string') {
      const formData = new FormData(term.target)
      term = formData.get('term') as string
    }
    if (!term) {
      return
    }
    setSearching(true)

    if (eventSource.current) {
      eventSource.current.close()
      eventSource.current = undefined
    }

    eventSource.current = new EventSource(`/api/app/${params.id}/search/${encodeURIComponent(term)}/tmdb`)

    eventSource.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if ((data as {message: string}).message) {
        setSearching(false)
        return addNotification({
          title: 'Error',
          message: (data as {message: string}).message,
          type: 'error'
        })
      }
      setResults(prev => mergeUniqueResults(prev, data.results))
    }

    eventSource.current.onerror = () => {
      if (eventSource.current) {
        eventSource.current.close()
        eventSource.current = undefined
      }
      setSearching(false)
    }

  }, [addNotification, params.id])

  useEffect(() => {
    const term = searchParams.get('term')
    if(term && lastAutoSearchTerm.current !== term) {
      lastAutoSearchTerm.current = term
      search(term)
    }
  }, [search, searchParams])

  const onDetailsClose = useCallback((tmdbId?: number | string) => {
    if (tmdbId) {
      // @ts-ignore
      setResults(prevState => {
        if (!prevState) {
          return prevState
        }
        return prevState.map(result => {
          if (result.id === tmdbId) {
            return {...result, movieAdded: true}
          }
          return result
        })
      })
      setSelectedMovieIds(prev => {
        const next = new Set(prev)
        next.delete(Number(tmdbId))
        return next
      })
    }
    setDetailsForID(null)
  }, [])

  const onToggleSelection = useCallback((id: number) => {
    setSelectedMovieIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const onBulkComplete = useCallback((addedIds: number[]) => {
    if (addedIds.length === 0) {
      return
    }

    setResults(prevState => {
      if (!prevState) {
        return prevState
      }
      return prevState.map(result => addedIds.includes(result.id) ? {...result, movieAdded: true} : result)
    })
    setSelectedMovieIds(prev => {
      const next = new Set(prev)
      addedIds.forEach(id => next.delete(id))
      return next
    })
  }, [])

  const openBulkAdd = useCallback(() => {
    setBulkAddMovies(bulkActionMovies)
    setBulkAddOpen(true)
  }, [bulkActionMovies])

  const closeBulkAdd = useCallback(() => {
    setBulkAddOpen(false)
    setBulkAddMovies([])
  }, [])

  const onHideAddedChange = useCallback((e: any) => {
    setHideAdded(e.target.checked)
  }, [])

  const onHideJavaneseChange = useCallback((e: any) => {
    setHideJavanese(e.target.checked)
  }, [])

  const onHideNoPosterChange = useCallback((e: any) => {
    setHideNoPoster(e.target.checked)
  }, [])

  const onHideNoRatingChange = useCallback((e: any) => {
    setHideNoRating(e.target.checked)
  }, [])

  if (!ok || !genres) {
    return (
      <div>Loading...</div>
    )
  }

  return (
    <Stack spacing={2}>
      <Card>
        <form onSubmit={search}>
          <CardContent>
            <Stack direction="row" spacing={2}>
              <TextField label="Search" variant="standard" name="term" defaultValue={searchParams.get('term')}
                         fullWidth/>
              <SearchIconButton type="submit">
                <SearchIcon />
              </SearchIconButton>
            </Stack>
            <Stack direction="row" spacing={2}>
              <FormControlLabel control={<Switch value={hideAdded} onChange={onHideAddedChange} />} label="Hide Added" />
              <FormControlLabel control={<Switch value={hideJavanese} onChange={onHideJavaneseChange} />} label="Hide Javanese" />
              <FormControlLabel control={<Switch value={hideNoPoster} onChange={onHideNoPosterChange} />} label="Hide No Poster" />
              <FormControlLabel control={<Switch value={hideNoRating} onChange={onHideNoRatingChange} />} label="Hide No Rating" />
            </Stack>
          </CardContent>
        </form>
      </Card>
      <Card>
        {searching && (
          <LinearProgress />
        )}
        <CardContent>
          {results && results.length === 0 && (
            <Typography>{`no results found`}</Typography>
          )}
          {results && (
            <SearchResults
              results={results}
              items={items}
              selectedMovieIds={selectedMovieIds}
              onClick={setDetailsForID}
              onToggleSelection={onToggleSelection}
            />
          )}
        </CardContent>
      </Card>
      {bulkActionMovies.length > 0 && (
        <Fab
          color="primary"
          variant="extended"
          sx={{position: 'fixed', right: 24, bottom: 88, zIndex: theme => theme.zIndex.modal - 1}}
          onClick={openBulkAdd}
        >
          {bulkActionLabel} ({bulkActionMovies.length})
        </Fab>
      )}
      {detailsForID && (
        <Details id={detailsForID} appId={params.id} onClose={onDetailsClose} />
      )}
      {bulkAddOpen && (
        <BulkAddModal
          appId={params.id}
          movies={bulkAddMovies}
          onClose={closeBulkAdd}
          onComplete={onBulkComplete}
        />
      )}
    </Stack>
  )
}