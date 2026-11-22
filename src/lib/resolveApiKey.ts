import {prisma} from "@/lib/prisma"

type ResolveResult = {apiKey: string} | {error: Response}

/**
 * The edit form never receives the stored API key, so it submits a blank one to mean "keep it".
 * The stored key is reused only when the URL is unchanged: otherwise a caller could point an
 * existing app at their own server and have the stored key sent there.
 */
export async function resolveApiKey(id: unknown, url: unknown, apiKey: unknown): Promise<ResolveResult> {
  if (typeof apiKey === 'string' && apiKey) {
    return {apiKey}
  }
  if (typeof id !== 'string' || !id) {
    return {error: Response.json({message: 'api_key is required'}, {status: 400})}
  }
  const existing = await prisma.app.findUnique({where: {id}})
  if (!existing) {
    return {error: Response.json({message: 'App not found'}, {status: 404})}
  }
  if (url !== existing.url) {
    return {error: Response.json({message: 'api_key is required when changing the URL'}, {status: 400})}
  }
  return {apiKey: existing.api_key}
}
