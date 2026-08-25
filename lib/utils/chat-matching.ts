import { onlyKnownTags, type InterestTag } from "@/lib/utils/interests";

// Ranking a pool of coffee chat requests for one member.
//
// The score is the number of interests they share, and nothing cleverer. The
// member is the one choosing: the ranking only has to order the list well
// enough that the good ones are near the top, and the card shows which tags
// matched plus the prospect's own sentence so the actual judgement stays with
// a person. That also keeps this a pure function with no model call, so the
// feature does not depend on an API key being present.

export type RankableRequest = {
  id: string;
  interests: string[] | null;
  created_at: string;
};

export type RankedRequest<T extends RankableRequest> = {
  request: T;
  score: number;
  shared: InterestTag[];
};

export function sharedInterests(
  memberInterests: readonly string[] | null | undefined,
  requestInterests: readonly string[] | null | undefined,
): InterestTag[] {
  const mine = new Set(onlyKnownTags(memberInterests));
  return onlyKnownTags(requestInterests).filter((tag) => mine.has(tag));
}

/**
 * Best fit first. Ties break toward the request that has been waiting longest,
 * so nothing settles permanently at the bottom of the list: a request with no
 * shared tags still rises as everything newer gets claimed.
 */
export function rankRequests<T extends RankableRequest>(
  requests: readonly T[],
  memberInterests: readonly string[] | null | undefined,
): RankedRequest<T>[] {
  return requests
    .map((request) => {
      const shared = sharedInterests(memberInterests, request.interests);
      return { request, score: shared.length, shared };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.request.created_at.localeCompare(b.request.created_at);
    });
}
