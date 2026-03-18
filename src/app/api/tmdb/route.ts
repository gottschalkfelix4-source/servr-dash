import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

function getTmdbApiKey(): string {
  const config = getConfig();
  return config.tmdbApiKey as string || process.env.TMDB_API_KEY || "";
}

interface TmdbResult {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
  media_type?: string;
}

interface TrendingItem {
  tmdbId: number;
  title: string;
  year: number;
  overview: string;
  posterUrl: string | null;
  voteAverage: number;
  popularity: number;
  mediaType: "movie" | "tv";
}

function mapResult(item: TmdbResult, mediaType: "movie" | "tv"): TrendingItem {
  const title = mediaType === "movie" ? item.title : item.name;
  const dateStr = mediaType === "movie" ? item.release_date : item.first_air_date;
  return {
    tmdbId: item.id,
    title: title || "",
    year: dateStr ? new Date(dateStr).getFullYear() : 0,
    overview: item.overview || "",
    posterUrl: item.poster_path ? `${TMDB_IMG}${item.poster_path}` : null,
    voteAverage: item.vote_average || 0,
    popularity: item.popularity || 0,
    mediaType,
  };
}

// GET /api/tmdb?type=movie|tv&category=trending|popular|upcoming
export async function GET(request: Request) {
  const apiKey = getTmdbApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "TMDB API Key nicht konfiguriert" },
      { status: 400 }
    );
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "movie"; // movie | tv
  const category = url.searchParams.get("category") || "trending"; // trending | popular | upcoming

  let endpoint: string;
  switch (category) {
    case "popular":
      endpoint = `/${type}/popular`;
      break;
    case "upcoming":
      endpoint = type === "movie" ? "/movie/upcoming" : "/tv/on_the_air";
      break;
    case "trending":
    default:
      endpoint = `/trending/${type}/week`;
      break;
  }

  try {
    const res = await fetch(
      `${TMDB_BASE}${endpoint}?language=de-DE&page=1`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        next: { revalidate: 3600 }, // cache 1h
      }
    );

    if (!res.ok) {
      throw new Error(`TMDB API: ${res.status}`);
    }

    const data = await res.json();
    const mediaType = type === "tv" ? "tv" : "movie";
    const items: TrendingItem[] = (data.results || [])
      .slice(0, 20)
      .map((item: TmdbResult) => mapResult(item, mediaType as "movie" | "tv"));

    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "TMDB error" },
      { status: 500 }
    );
  }
}
