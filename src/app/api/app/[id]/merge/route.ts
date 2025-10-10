import {QueueEntry} from "@/common/api/Radarr/entities/QueueAPI"
import withApi, {NextRequestWithApi} from "@/lib/withApi"
import withMergerrApi, {NextRequestWithMergerrApi} from "@/lib/withMergerrApi"

const postHandler = async (req: NextRequestWithMergerrApi & NextRequestWithApi) => {
  const {queueId, movieId} = await req.json()
  const queueDetailsResp = await req.api.queue.details(movieId, {includeMovie: true})
  const queueDetails = await queueDetailsResp.data as QueueEntry[]
  const queue = queueDetails.find(q => q.id === parseInt(queueId))
  if (!queue) {
    return Response.json({message: `queue not found for movie id: ${movieId} and queue id: ${queueId}`}, {status: 404})
  }
  if (!queue.movie) {
    return Response.json({message: 'queue does not have a movie'}, {status: 400})
  }

  const manualImportResp = await req.api.manualImport.get({
    downloadId: queue.downloadId
  })

  if (manualImportResp.status !== 200) {
    return Response.json({message: 'manual import failed'}, {status: manualImportResp.status})
  }

  if (!queue.movieId) {
    throw Error('Movie ID is required')
  }

  const merge = await req.mergerrAPI.create({
    movieId: queue.movieId,
    tmdbId: queue.movie.tmdbId,
    queueId: queue.id,
    inputs: manualImportResp.data.map(({path, name}: {path: string, name: string}) => ({
      path,
      name
    }))
  })

  return Response.json(merge)
}

async function getHandler(req: NextRequestWithMergerrApi) {
  const queueId = await req.nextUrl.searchParams.get('queueId')
  let resp
  if (!queueId) {
    resp = await req.mergerrAPI.get()
  } else {
    resp = await req.mergerrAPI.find({queueId: parseInt(queueId)})
  }

  return Response.json(resp)
}

export const POST = withApi(withMergerrApi(postHandler))
export const GET = withMergerrApi(getHandler)