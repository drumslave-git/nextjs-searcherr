import withApi, {NextRequestWithApi} from "@/lib/withApi"

async function getHandler(req: NextRequestWithApi) {
  const resp = await req.api.queue.getAll()
  const records = Array.isArray(resp.data?.records) ? resp.data.records : []
  const filteredRecords = records.filter(record => req.api.queue.isCompleted(record))

  const payload = {
    ...(resp.data ?? {}),
    records: filteredRecords,
  }

  console.log(payload)

  return Response.json(payload, {status: resp.status >= 400 ? resp.status : 200})
}

export const GET = withApi(getHandler)