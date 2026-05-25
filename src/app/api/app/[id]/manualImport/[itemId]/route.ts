import {ApiEndpoints, AppType} from "@/consts"
import withApi, {NextRequestWithApi} from "@/lib/withApi"
import qs from "qs"

async function getHandler(req: NextRequestWithApi, {params}: { params: { id: string, itemId: string } }) {
  const {itemId} = await params

  const resp = await req.api.manualImport.get({downloadId: itemId})
  resp.data.sort((a: {path: string}, b: {path: string}) => a.path.localeCompare(b.path))
  return Response.json(resp.data, {status: resp.status})
}

async function postHandler(req: NextRequestWithApi, {params}: { params: { id: string, itemId: string } }) {
  const {itemId} = await params
  const body = await req.json()
  const data = {
    ...body,
    movieId: itemId,
    importMode: 'auto',
    name: 'ManualImport',
  }

  const resp = await fetch(`${req.app.url}${ApiEndpoints[req.app.type as AppType].command.uri}?${qs.stringify({apiKey: req.app.api_key})}`, {
    method: 'POST',
    body: JSON.stringify(data),
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const respData = await resp.json()
  return Response.json({...respData, requestedData: data}, {status: resp.status})
}

export const GET = withApi(getHandler)
export const POST = withApi(postHandler)
