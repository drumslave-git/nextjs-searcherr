import {WhisparrAPI} from "@/common/api/Whisparr/api"
import appIdMiddleware from '@/middleware/appIdMiddleware'
import {RadarrAPI} from "@/common/api/Radarr/api"
import {App} from "@prisma/client"
import {NextRequest} from "next/server"

export type NextRequestWithApi = NextRequest & {
  api: RadarrAPI | WhisparrAPI
  app: App
}

export default function withApi(
  handler: (req: any, { params }: { params: { id: string } & any } & any) => any | Promise<any>
) {
  return async (req: NextRequestWithApi, { params, ...rest }: { params: { id: string } & any } & any) => {
    const { id } = await params
    const middlewareResponse = await appIdMiddleware(req, id)
    if (middlewareResponse) {
      return middlewareResponse
    }
    return handler(req, {params, ...rest})
  }
}

