import {BaseEntityAPI} from "@/common/api/BaseEntityAPI"
import {AxiosResponse} from "axios"

export interface MovieResult {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  genres?: string[];
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  poster: string | null;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
  movieAdded?: boolean;
}

export interface TVResult extends MovieResult{}

export interface SearchResponse {
  page: number;
  results: MovieResult[] | TVResult[];
  total_pages: number;
  total_results: number;
}

export class SearchAPI extends BaseEntityAPI {
  async generic<Result extends {adult: boolean}, Response>(type: 'tv' | 'movie', query: string, include_adult = false, iterationCallback = (iteration: AxiosResponse<Response>) => Promise.resolve(), language = 'en-US', page = 1) {
    let results: Result[] = []
    let currentPage = page
    let resp = await this._get<Response, any>(`search/${type}`, {
      query,
      include_adult,
      language,
      page: currentPage
    })

    results = resp.data.results.filter((result: Result) => result.adult === include_adult)
    await iterationCallback({
      ...resp,
      data: {
        ...resp.data,
        results
      }
    })

    do {
      resp = await this._get<Response, any>(`search/${type}`, {
        query,
        include_adult,
        language,
        page: ++currentPage
      })
      const iterationResults = resp.data.results.filter((result: Result) => result.adult === include_adult)
      await iterationCallback({
        ...resp,
        data: {
          ...resp.data,
          results: iterationResults
        }
      })
      results = results.concat(iterationResults)
    } while (resp.data.results.length > 0)

    return {
      ...resp,
      data: {
        ...resp.data,
        results
      }
    }
  }
  async tv(query: string, include_adult = false, iterationCallback = (iteration: AxiosResponse<SearchResponse>) => Promise.resolve(), language = 'en-US', page = 1) {
    return await this.generic<TVResult, SearchResponse>('tv', query, include_adult, iterationCallback, language, page)
  }
  async movie(query: string, include_adult = false, iterationCallback = (iteration: AxiosResponse<SearchResponse>) => Promise.resolve(), language = 'en-US', page = 1) {
    return await this.generic<MovieResult, SearchResponse>('movie', query, include_adult, iterationCallback, language, page)
  }
}