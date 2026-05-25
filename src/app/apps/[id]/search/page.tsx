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
import {TMDBImage} from "@/components/common/TMDB/Image"
import Rating from "@/components/common/TMDB/Rating"
import {useNotifications} from "@/components/NotificationsProvider"
import {useTMDBApi} from "@/components/TMDBApiProvider"
import CheckCircle from "@mui/icons-material/CheckCircle"
import {FormControlLabel, Switch} from "@mui/material"
import LinearProgress from "@mui/material/LinearProgress"
import Select from "@mui/material/Select"
import MenuItem from "@mui/material/MenuItem"
import InputLabel from "@mui/material/InputLabel"
import FormControl from "@mui/material/FormControl"
import Grid2 from "@mui/material/Grid2"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Chip from "@mui/material/Chip"
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
    options: {
      qualityProfileId: 1,
      minimumAvailability: 'released',
      rootFolderPath: '',
      monitored: true,
      addOptions: {
        searchForMovie: true,
        monitor: 'movieOnly'
      },
      tags: []
    },
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

const AdditionalInfo = ({item, results}: { item: Item, results: MovieResult[] }) => {
  const result = useMemo(() => {
    return results.find(r => r.id === item.id)
  }, [item.id, results])

  if (!result) {
    return null
  }

  return (
    <Stack direction="row" spacing={2} justifyContent="space-between" paddingTop={2}>
      <Rating value={result.vote_average} />
      {/* @ts-ignore */}
      <CheckCircle fontSize="large" sx={{width: '40px', height: '40px'}} color={result.movieAdded ? 'success' : 'error'} />
    </Stack>
  )
}

const SearchResults = (props: { results: MovieResult[], items: Item[], onClick: (id: number | string) => void }) => {
  const {results, items, onClick} = props

  return (
    <Grid
      items={items}
      aspectRatio={.5}
      ActionComponent={({item, children}) => <ActionComponent item={item} onClick={onClick}>{children}</ActionComponent>}
      AdditionalContentComponent={({item}) => <AdditionalInfo item={item} results={results} />}
    />
  )
}

export default function SearchPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const searchParams = useSearchParams()
  const {ok, configuration, formatImagePath, formatReleaseYear} = useTMDBApi()
  const {addNotification} = useNotifications()

  const [results, setResults] = useState<MovieResult[] | undefined>(undefined)
  const [items, setItems] = useState<Item[]>([])
  const [genres, setGenres] = useState<Genre[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [detailsForID, setDetailsForID] = useState<number | string | null>(null)
  const [hideAdded, setHideAdded] = useState(false)
  const [hideJavanese, setHideJavanese] = useState(false)
  const [hideNoPoster, setHideNoPoster] = useState(false)
  const [hideNoRating, setHideNoRating] = useState(false)

  const eventSource = useRef<EventSource | undefined>(undefined)

  useEffect(() => {
    if (ok) {
      fetch(`/api/tmdb/genres/movie`)
        .then(res => res.json())
        .then(data => {
          setGenres(data.genres)
        })
    }
  }, [ok])

  useEffect(() => {
    if(!results) {
      setItems([])
      return
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

    const items: Item[] = filteredResults.map((result) => {
      const releaseYear = formatReleaseYear(result.release_date)
      return {
        id: result.id,
        title: `${result.title}${releaseYear ? ` (${releaseYear})` : ''}`,
        image: result.poster_path ? formatImagePath(result.poster_path, 'poster', 1) : undefined
      }
    })
    setItems(items)
  }, [configuration, formatImagePath, results, hideAdded, hideJavanese, hideNoPoster, hideNoRating, formatReleaseYear])

  const search = useCallback((e: any) => {
    if (e.preventDefault) {
      e.preventDefault()
    }
    setResults(undefined)
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
    if(term) {
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
    }
    setDetailsForID(null)
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
            <SearchResults results={results} items={items} onClick={setDetailsForID} />
          )}
        </CardContent>
      </Card>
      {detailsForID && (
        <Details id={detailsForID} appId={params.id} onClose={onDetailsClose} />
      )}
    </Stack>
  )
}