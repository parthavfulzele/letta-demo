export function teamNamespace(teamId: string) {
  return `team:${teamId}`;
}

export function matchNamespace(matchId: string) {
  return `match:${matchId}`;
}

export function namespaceMetadata(teamId: string, matchId: string) {
  return {
    team: teamNamespace(teamId),
    match: matchNamespace(matchId),
  };
}

export type NamespaceBundle = ReturnType<typeof namespaceMetadata>;
