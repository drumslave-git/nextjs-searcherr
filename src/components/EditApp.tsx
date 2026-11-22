'use client'
import {SystemStatus} from "@/common/api/Radarr/entities/SystemAPI"
import {useNotifications} from "@/components/NotificationsProvider"
import Box from "@mui/material/Box"
import {useRouter} from "next/navigation"
import {useCallback, useEffect, useState} from "react"
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import {App} from '@prisma/client'
import CheckIcon from '@mui/icons-material/Check'

import {AppType} from "@/consts"
import {PublicApp} from "@/lib/publicApp"

const defaultApp: App = {
  id: '',
  name: '',
  type: AppType.radarr,
  api_key: '',
  url: '',
  public_url: '',
}

const REQUIRED_FIELDS: Array<keyof App> = ['name', 'type', 'url']

// The stored API key is never sent to the browser, so an existing app may leave it blank to keep it,
// unless the URL changes: the server then refuses to reuse the stored key.
const isApiKeyRequired = (config: App, original?: PublicApp) => !original || config.url !== original.url

const validate = (config: App, original?: PublicApp) => {
  const errors: Record<string, string> = {}
  REQUIRED_FIELDS.forEach((field) => {
    if (!config[field]) {
      errors[field] = 'Field is required'
    }
  })
  if (!config.api_key && isApiKeyRequired(config, original)) {
    errors.api_key = original ? 'Required when changing the URL' : 'Field is required'
  }
  return errors
}

export default function EditApp({app}: { app?: PublicApp }) {
  const [appConfig, setAppConfig] = useState<App>(app ? {...app, api_key: ''} : defaultApp)
  const [tested, setTested] = useState<boolean>(false)
  const [disableButtons, setDisableButtons] = useState<boolean>(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const {addNotification} = useNotifications()

  const router = useRouter()

  const onChange = useCallback((e: any) => {
    setTested(false)
    setErrors(prev => {
      const {[e.target.name]: _, ...rest} = prev
      return rest
    })
    const config = {
      ...appConfig,
      [e.target.name]: e.target.value
    }
    const errors = validate(config, app)
    setDisableButtons(Object.keys(errors).length > 0)
    setAppConfig(config)
  }, [app, appConfig])

  const onTest = useCallback(() => {
    const errors = validate(appConfig, app)
    if (Object.keys(errors).length) {
      setErrors(errors)
      return
    }
    setDisableButtons(true)
    fetch('/api/app/test', {
      method: 'POST',
      body: JSON.stringify(appConfig),
    }).then(res => {
      if (res.status !== 200) {
        throw new Error(`${res.status} - ${res.statusText}`)
      }
      return res.json()
    }).then((data: SystemStatus) => {
      const type = data?.appName?.toLowerCase()
      // @ts-ignore
      if(!AppType[type]) {
        console.error(data)
        addNotification({
          title: 'Error',
          message: `Invalid app type: ${type?.toString()}`,
          type: 'error',
        })
        return
      }
      setAppConfig(cfg => ({
        ...cfg,
        type: data.appName
      }))
      setTested(true)
    }).catch(err => {
      console.error(err)
      addNotification({
        title: 'Error',
        message: err.message,
        type: 'error',
      })
      setTested(false)
    })
      .finally(() => {
        setDisableButtons(false)
      })
  }, [addNotification, app, appConfig])

  const onSave = useCallback(() => {
    const errors = validate(appConfig, app)
    if (Object.keys(errors).length) {
      setErrors(errors)
      return
    }
    setDisableButtons(true)
    fetch('/api/app/save', {
      method: 'POST',
      body: JSON.stringify(appConfig),
    }).then(res => {
      if (!res.ok) {
        throw new Error(`${res.status} - ${res.statusText}`)
      }
      return res.json()
    }).then(data => {
      router.push(`/apps/${data.id}/search`)
    }).catch(err => {
      console.error(err)
      addNotification({
        title: 'Error',
        message: err.message,
        type: 'error',
      })
    })
      .finally(() => {
        setTested(false)
        setDisableButtons(false)
      })
  }, [addNotification, app, appConfig, router])

  const apiKeyRequired = isApiKeyRequired(appConfig, app)

  return (
    <>
      <Paper>
        <Box sx={{p: 2, display: 'flex', flexDirection: 'row', gap: 2}}>
          <TextField required error={!!errors.name} label="Name" name="name" value={appConfig.name} onChange={onChange} fullWidth/>
        </Box>
        <Box sx={{p: 2, display: 'flex', flexDirection: 'row', gap: 2}}>
          <TextField required error={!!errors.url} label="Url" name="url" value={appConfig.url} onChange={onChange} fullWidth/>
          <TextField error={!!errors.public_url} label="Public Url" name="public_url" value={appConfig.public_url} onChange={onChange} fullWidth/>
          <TextField
            required={apiKeyRequired}
            error={!!errors.api_key}
            helperText={errors.api_key || (!apiKeyRequired ? 'Leave blank to keep the current key' : undefined)}
            label="Api Key"
            name="api_key"
            value={appConfig.api_key}
            onChange={onChange}
            fullWidth
          />
        </Box>
      </Paper>
      <Box sx={{display: 'flex', justifyContent: 'center', mt: 2}}>
        <Button variant="contained" color="secondary" onClick={onTest} disabled={disableButtons || tested}>
          {tested ? <CheckIcon color="success"/> : 'Test'}
        </Button>
        {tested && <Button variant="contained" color="primary" disabled={disableButtons} onClick={onSave}>Save</Button>}
      </Box>
    </>
  )
}