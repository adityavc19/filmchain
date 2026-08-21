import { PathStep, supabaseAdmin } from './supabase';
import { TmdbFilmCredit, TmdbFilm } from './tmdb';

/**
 * Validates that a submitted path actually connects start → end
 * through valid cast/crew relationships.
 */
export async function validatePath(path: PathStep[]): Promise<{ valid: boolean; error?: string }> {
  if (path.length < 3) return { valid: false, error: 'Path too short.' };
  if (path[0].type !== 'film' || path[path.length - 1].type !== 'film') {
    return { valid: false, error: 'Path must start and end with a film.' };
  }


  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    const next = path[i + 1];

    if (current.type === next.type) {
      return { valid: false, error: 'Path must alternate between films and people.' };
    }

    if (current.type === 'film' && next.type === 'person') {
      const { data, error } = await supabaseAdmin.from('films').select('cast_crew').eq('tmdb_id', current.id).single();
      if (error || !data) return { valid: false, error: `Could not find film ${current.id}` };
      
      const castCrew: TmdbFilmCredit[] = data.cast_crew;
      const found = castCrew.some(c => c.id === next.id);
      if (!found) return { valid: false, error: `${next.name} is not credited in ${current.name}.` };
    } else if (current.type === 'person' && next.type === 'film') {
      const { data, error } = await supabaseAdmin.from('people').select('filmography').eq('tmdb_id', current.id).single();
      if (error || !data) return { valid: false, error: `Could not find person ${current.id}` };
      
      const filmography: TmdbFilm[] = data.filmography;
      const found = filmography.some(f => f.id === next.id);
      if (!found) return { valid: false, error: `${current.name} is not credited in ${next.name}.` };
    }
  }

  return { valid: true };
}

/**
 * Finds shortest hop count between two films.
 * Uses an in-memory adjacency graph.
 * Returns the hop count (number of edges), or -1 if disconnected.
 * 
 * graph is a Map<string, Set<string>> where keys are 'film:ID' or 'person:ID'
 */
export function bfsShortestPath(
  graph: Map<string, Set<string>>,
  startFilmId: number,
  endFilmId: number
): number {
  const startNode = `film:${startFilmId}`;
  const endNode = `film:${endFilmId}`;

  if (!graph.has(startNode) || !graph.has(endNode)) return -1;

  const queue: { node: string; depth: number }[] = [{ node: startNode, depth: 0 }];
  const visited = new Set<string>();
  visited.add(startNode);

  while (queue.length > 0) {
    const { node, depth } = queue.shift()!;

    if (node === endNode) {
      return depth;
    }

    const neighbors = graph.get(node) || new Set<string>();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ node: neighbor, depth: depth + 1 });
      }
    }
  }

  return -1;
}
