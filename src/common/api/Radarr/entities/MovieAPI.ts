import {BaseEntityAPI} from "@/common/api/BaseEntityAPI"
import {MovieLookupResult} from "@/common/api/Radarr/entities/MovieLookupAPI"

// Define types for movie-related data
export interface Movie {
  title: string;
  cleanTitle: string;
  year: number;
  tmdbId: number;
  imdbId?: string;
  id?: number;
  qualityProfileId: number;
  rootFolderPath: string;
  monitored: boolean;
  overview: string;
  addOptions?: {
    searchForMovie: boolean;
  };
  images: {
    coverType: string;
    remoteUrl: string;
  }[];
  path: string
}

export interface MovieResponse extends Movie {
  id: number;
}

export interface MovieAddSetting {
  addOptions: { monitor: 'movieOnly' | 'movieAndCollection' | 'none'; searchForMovie: boolean };
  rootFolderPath: string;
  qualityProfileId: number;
  monitored: boolean;
  minimumAvailability: 'released' | 'inCinemas' | 'announced';
  tags: [];
}

export interface MovieAddData extends MovieLookupResult, MovieAddSetting {}


export class MovieAPI extends BaseEntityAPI {
  // Method to get all movies
  async get(id?: number | string, tmdbId?: number) {
    return await this._get<MovieResponse[] | Movie, any>("movie" + (id ? `/${id}` : ''), { tmdbId })
  }

  // Method to add a new movie
  async add(movie: MovieAddData) {
    return await this._post<MovieResponse, any>("movie", movie)
  }
}
