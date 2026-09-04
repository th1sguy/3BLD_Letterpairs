export type ImageSearchSource = 'wikipedia' | 'openverse';

export interface ImageSearchResult {
  id: string;
  thumbnailUrl: string;
  imageUrl: string;
  title: string;
  source: ImageSearchSource;
}

const RESULT_LIMIT = 10;

interface OpenverseResult {
  id: string;
  title?: string;
  url: string;
  thumbnail?: string;
}

export async function searchOpenverse(
  query: string,
  signal?: AbortSignal,
): Promise<ImageSearchResult[]> {
  const params = new URLSearchParams({ q: query, page_size: String(RESULT_LIMIT) });
  const res = await fetch(`https://api.openverse.org/v1/images/?${params}`, { signal });
  if (!res.ok) throw new Error(`Openverse search failed (${res.status})`);
  const data: { results?: OpenverseResult[] } = await res.json();
  return (data.results ?? []).map((r) => ({
    id: `openverse-${r.id}`,
    thumbnailUrl: r.thumbnail ?? r.url,
    imageUrl: r.url,
    title: r.title ?? query,
    source: 'openverse',
  }));
}

interface WikipediaPage {
  pageid: number;
  title: string;
  thumbnail?: { source: string };
}

/**
 * MediaWiki action API, generator=search: `origin=*` opts the request into CORS for browser use.
 * Requests thumbnail-only (no `original`) — resolving the full-res image doubles the per-result
 * thumbnailing work MediaWiki has to do and noticeably slows the search down, and at 400px this
 * is already larger than the card ever renders it.
 */
export async function searchWikipedia(
  query: string,
  signal?: AbortSignal,
): Promise<ImageSearchResult[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    origin: '*',
    generator: 'search',
    gsrsearch: query,
    gsrlimit: String(RESULT_LIMIT),
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '400',
  });
  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, { signal });
  if (!res.ok) throw new Error(`Wikipedia search failed (${res.status})`);
  const data: { query?: { pages?: WikipediaPage[] } } = await res.json();
  return (data.query?.pages ?? [])
    .filter((p): p is WikipediaPage & { thumbnail: { source: string } } => Boolean(p.thumbnail))
    .map((p) => ({
      id: `wikipedia-${p.pageid}`,
      thumbnailUrl: p.thumbnail.source,
      imageUrl: p.thumbnail.source,
      title: p.title,
      source: 'wikipedia',
    }));
}
