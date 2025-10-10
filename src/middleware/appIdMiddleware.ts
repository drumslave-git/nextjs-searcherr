import {RadarrAPI} from "@/common/api/Radarr/api"
import {WhisparrAPI} from "@/common/api/Whisparr/api"
import {prisma} from "@/lib/prisma"
import {NextRequestWithApi} from "@/lib/withApi"

export default async function appIdMiddleware(
  req: NextRequestWithApi,
  id: string
) {
  if (!id) {
    return Response.json({ message: 'appId is required' }, {status: 404})
  }

  const app = await prisma.app.findUnique({
    where: {
      id,
    },
  })

  if (!app) {
    return Response.json({message: 'App not found'}, {status: 404})
  }

  const tmdbConfig = await prisma.tMDB.findFirst()

  let APIClass = RadarrAPI
  if (app.type === 'whisparr') {
    APIClass = WhisparrAPI
  }

  // You can add a variable to the request object for use in route handlers
  req.api = new APIClass({
    apiKey: app.api_key,
    baseUrl: app.url,
    tmdbApiKey: tmdbConfig?.key,
  })
}