'use client'

import AppIcon from "@/components/AppIcon"
import Button from "@mui/material/Button"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemIcon from "@mui/material/ListItemIcon"
import ListItemText from "@mui/material/ListItemText"
import Link from "next/link"
import {useEffect, useState} from "react"
import {App} from "@prisma/client"

const Apps = () => {
  const [apps, setApps] = useState<App[]>([])

  useEffect(() => {
    fetch('/api/app').then(res => res.json()).then(data => {
      setApps(data)
    })
  }, [])

  return (
    <List>
      {apps.map((app) => (
        <ListItem key={app.id}>
          <ListItemIcon>
            <AppIcon app={app}/>
          </ListItemIcon>
          <ListItemText primary={
            <Link href={`/apps/${app.id}/search`} passHref>
              <Button color="primary">
                {app.name}
              </Button>
            </Link>
          }/>
          <Link href={`/apps/${app.id}/search`} passHref>
            <Button color="secondary">
              Search
            </Button>
          </Link>
          <Link href={`/apps/${app.id}/edit`} passHref>
            <Button color="secondary">
              Edit
            </Button>
          </Link>
        </ListItem>
      ))}
    </List>
  )
}

export default Apps