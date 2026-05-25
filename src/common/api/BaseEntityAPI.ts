import {AxiosError, AxiosInstance, AxiosResponse} from "axios"
import qs from "qs"

export class BaseEntityAPI {
  private _axios: AxiosInstance

  constructor(axios: AxiosInstance) {
    this._axios = axios
  }

  protected async _get<T, E>(uri: string, params: any = {}): Promise<AxiosResponse<T, any> | AxiosResponse<E, any>> {
    try {
      return await this._axios.get<T>(`/${uri}?${qs.stringify(params)}`)
    } catch (e) {
      const error = e as AxiosError
      if (error.response) {
        return error.response as AxiosResponse<E, any>
      }
      return {
        data: {message: error.message || 'Request failed'} as E,
        status: 503,
        statusText: 'Service Unavailable',
        headers: {},
        config: error.config!,
      } as AxiosResponse<E, any>
    }
  }

  protected async _post<T, E>(uri: string, data: any = {}, params: any = {}): Promise<AxiosResponse<T, any> | AxiosResponse<E, any>> {
    try {
      return await this._axios.post<T>(`/${uri}?${qs.stringify(params)}`, data)
    } catch (e) {
      const error = e as AxiosError
      if (error.response) {
        return error.response as AxiosResponse<E, any>
      }
      return {
        data: {message: error.message || 'Request failed'} as E,
        status: 503,
        statusText: 'Service Unavailable',
        headers: {},
        config: error.config!,
      } as AxiosResponse<E, any>
    }
  }

  protected async _put<T>(uri: string, data: any = {}, params: any = {}): Promise<AxiosResponse<T, any>> {
    return await this._axios.put<T>(`/${uri}?${qs.stringify(params)}`, data)
  }

  protected async _delete<T>(uri: string, params: any = {}): Promise<AxiosResponse<T, any>> {
    return await this._axios.delete<T>(`/${uri}?${qs.stringify(params)}`)
  }
}