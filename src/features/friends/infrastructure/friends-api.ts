import { authorizedFetch } from '../../../shared/network/authorized-fetch';
import { localProfile } from '../../../shared/storage/local-profile';

/**
 * Social (HU31, HU32). Tudo aqui depende de conexão: amizades e ranking não ficam no SQLite.
 * Só a quantidade de amigos é guardada, para o eixo "Social" do relatório funcionar offline.
 */

export type PublicPet = { speciesId: string; name: string; level: number };
export type Relation = 'self' | 'friend' | 'outgoing' | 'incoming' | 'none';

export type FriendSummary = {
  id: string;
  displayName: string;
  handle: string | null;
  pet: PublicPet | null;
  online: boolean;
  streak: number;
  xpTotal: number;
  periodXp: number;
};

export type FriendRequest = { id: string; createdAt: string; user?: { id: string; displayName: string; handle: string | null; pet: PublicPet | null } };
export type SearchResult = { id: string; displayName: string; handle: string | null; pet: PublicPet | null; relation: Relation };
export type RankingEntry = FriendSummary & { position: number; me: boolean };
export type Profile = (FriendSummary & { relation: 'friend' | 'self' }) | { id: string; displayName: string; handle: string | null; pet: PublicPet | null; relation: Exclude<Relation, 'friend' | 'self'> };

const friendsCountKey = 'social.friendsCount';

export async function listFriends() {
  const friends = await authorizedFetch<FriendSummary[]>('/friends');
  await localProfile.set(friendsCountKey, String(friends.length));
  return friends;
}

export async function cachedFriendsCount() {
  return Number(await localProfile.get(friendsCountKey)) || 0;
}

export function listRequests() {
  return authorizedFetch<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>('/friends/requests');
}

export function sendRequest(handle: string) {
  return authorizedFetch('/friends/requests', { method: 'POST', body: JSON.stringify({ handle: handle.replace(/^@/, '').trim().toLowerCase() }) });
}

export function respondRequest(id: string, accept: boolean) {
  return authorizedFetch(`/friends/requests/${id}/${accept ? 'accept' : 'decline'}`, { method: 'POST' });
}

export function removeFriend(userId: string) {
  return authorizedFetch(`/friends/${userId}`, { method: 'DELETE' });
}

export function cheer(userId: string) {
  return authorizedFetch(`/friends/${userId}/cheer`, { method: 'POST' });
}

export function searchUsers(query: string) {
  return authorizedFetch<SearchResult[]>(`/users/search?q=${encodeURIComponent(query.replace(/^@/, '').trim().toLowerCase())}`);
}

export function fetchProfile(userId: string) {
  return authorizedFetch<Profile>(`/users/${userId}/profile`);
}

export async function fetchRanking(period: 'week' | 'month') {
  return (await authorizedFetch<{ period: string; entries: RankingEntry[] }>(`/ranking?period=${period}`)).entries;
}
