// src/state/presence.ts
/** userId → Set<socketId> — multi-tab safe online presence map */
export const onlineUsers = new Map<string, Set<string>>();
