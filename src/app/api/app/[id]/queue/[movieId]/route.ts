import {QueueEntry} from "@/common/api/Radarr/entities/QueueAPI"
import formatOutputFilePath from "@/lib/formatOutputFilePath"
import withApi, {NextRequestWithApi} from "@/lib/withApi"

async function deleteHandler(req: NextRequestWithApi, { params }: { params: { id: string, movieId: string } }) {
  const queueId = req.nextUrl.searchParams.get('queueId')
  if (!queueId) {
    return Response.json({message: 'queueId query parameter is required'}, {status: 400})
  }

  const resp = await req.api.queue.delete(Number(queueId))

  return Response.json(resp.data, {status: resp.status})
}

async function getHandler(req: NextRequestWithApi, { params }: { params: { id: string, movieId: string } }) {
  const {movieId} = await params
  const includeMovie = req.nextUrl.searchParams.get('includeMovie') === 'true'
  const resp = await req.api.queue.details(movieId, {includeMovie})
  const records = Array.isArray(resp.data) ? resp.data : []

  return Response.json(records.map((record: QueueEntry) => ({
    ...record,
    outputFile: formatOutputFilePath(record)
  })), {status: resp.status})
}

export const DELETE = withApi(deleteHandler)
export const GET = withApi(getHandler)
