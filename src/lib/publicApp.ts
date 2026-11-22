import type {App} from "@prisma/client"

/** An App row without its *arr API key: the only shape that may be sent to the browser. */
export type PublicApp = Omit<App, 'api_key'>

export const toPublicApp = (app: App): PublicApp => {
  const {api_key: _apiKey, ...rest} = app
  return rest
}
