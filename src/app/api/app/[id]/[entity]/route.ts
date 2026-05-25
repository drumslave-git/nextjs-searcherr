import withApi, {NextRequestWithApi} from "@/lib/withApi"

const allowedEntities = ['rootFolder', 'qualityProfile'] as const
type AllowedEntity = typeof allowedEntities[number]

const isAllowedEntity = (entity: string): entity is AllowedEntity => {
  return allowedEntities.includes(entity as AllowedEntity)
}

const getHandler = async (req: NextRequestWithApi, {params}: {params: {id: string, entity: string}}) => {
  const {entity} = await params
  if (!isAllowedEntity(entity)) {
    return Response.json({message: 'Entity not found'}, {status: 404})
  }

  const resp = await req.api[entity].get()

  return Response.json(resp.data, {status: resp.status})
}

export const GET = withApi(getHandler)