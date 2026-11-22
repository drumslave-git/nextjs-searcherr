import {RadarrAPI} from "@/common/api/Radarr/api"
import {resolveApiKey} from "@/lib/resolveApiKey"

export async function POST(req: Request) {
  const  {id, url, api_key} = await req.json()
  const key = await resolveApiKey(id, url, api_key)
  if ('error' in key) {
    return key.error
  }
  const api = new RadarrAPI({
    apiKey: key.apiKey,
    baseUrl: url
  })
  const resp = await api.system.getStatus()

  return Response.json(resp.data, {status: resp.status})
}
