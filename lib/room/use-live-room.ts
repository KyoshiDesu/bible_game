"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { refetchRoom } from "@/lib/actions/room";
import { createClient } from "@/lib/supabase/client";

import { type Connection, type RoomState, type Unsubscribe } from "./client";
import { supabaseRoom, watchCounts } from "./supabase";

export interface LiveRoom {
  /** What to render. Always a whole state, never a patch. */
  state: RoomState;
  connection: Connection;
  /** People on the room channel, the leader included. */
  present: number;
  /** How many have voted on the current beat. Zero until told otherwise. */
  voted: number;
  /**
   * How many are in the group, as of the last count broadcast. Null until one
   * arrives, so a caller can fall back to what the server rendered with.
   */
  members: number | null;
  /** Re-reads the room through the server. Works when the socket does not. */
  refresh: () => void;
  refreshing: boolean;
  /** For a caller that already has fresher state — a leader's own action. */
  apply: (state: RoomState) => void;
}

/**
 * One room, live.
 *
 * The rule this hook exists to keep: a realtime message is a nudge to refetch,
 * never the new state itself. Rendering a payload would mean a screen that
 * missed one message shows something no other screen in the building agrees
 * with, and nobody would know which one was wrong. Every update here — the
 * subscription, the leader's own actions, the refresh button — replaces the
 * whole state with something read back from the database.
 *
 * Two connections, and only one of them is worth telling the leader about.
 * State rides Postgres Changes; losing it means the screen can go stale, so it
 * raises the banner. Counts ride a broadcast channel; losing them means a
 * number disappears, which is not worth interrupting a meeting for.
 */
/** Enough of a room's state to tell one server render from the next. */
function signature(state: RoomState): string {
  return [
    state.runId,
    state.state,
    state.currentBeat,
    state.results.length,
    state.tie?.tied.join("") ?? "",
  ].join("/");
}

export function useLiveRoom(initial: RoomState, presenceKey: string): LiveRoom {
  const [state, setState] = useState(initial);
  const [connection, setConnection] = useState<Connection>("connecting");
  const [present, setPresent] = useState(0);
  const [count, setCount] = useState<{
    beatIndex: number;
    voted: number;
    members: number | null;
  }>({ beatIndex: -1, voted: 0, members: null });
  const [refreshing, setRefreshing] = useState(false);

  const runId = initial.runId;

  // A server render newer than what is on screen — a navigation, or the page
  // being re-rendered after an action — wins. It came from the database.
  //
  // Compared by what it says rather than by object identity: a parent that
  // rebuilds the prop on every render would otherwise hand this effect a new
  // object each time, and setting state from it would re-render the parent,
  // which would build another one.
  const seeded = useRef(signature(initial));
  useEffect(() => {
    const next = signature(initial);
    if (next !== seeded.current) {
      seeded.current = next;
      setState(initial);
    }
  }, [initial]);

  const client = useMemo(() => {
    try {
      return createClient();
    } catch {
      // No project configured. The page still renders what the server sent,
      // and the banner says why nothing is moving.
      return null;
    }
  }, []);

  useEffect(() => {
    if (!client) {
      setConnection("lost");
      return;
    }

    let disposed = false;
    let unsubscribeState: Unsubscribe | undefined;
    let unsubscribeCounts: Unsubscribe | undefined;

    // The token has to be on the socket before either channel joins, not just
    // on the HTTP client: the private counts channel is authorised by a policy
    // that asks who the caller is, and Postgres Changes are filtered by row
    // level security the same way. Subscribing first and authenticating after
    // joins as nobody, and the room silently hears nothing.
    void client.realtime
      .setAuth()
      .catch(() => undefined)
      .then(() => {
        if (disposed) return;
        const room = supabaseRoom(client);
        unsubscribeState = room.subscribe(runId, setState, setConnection);
        unsubscribeCounts = watchCounts(client, runId, presenceKey, {
          onCount: setCount,
          onPresence: setPresent,
        });
      });

    return () => {
      disposed = true;
      unsubscribeState?.();
      unsubscribeCounts?.();
    };
  }, [client, runId, presenceKey]);

  const apply = useCallback((next: RoomState) => {
    setState(next);
  }, []);

  /**
   * Re-reading the room through the application rather than through the
   * socket. This is the path that still works in a hall with bad wifi: it is an
   * ordinary request to the server, which has its own connection to the
   * database, so a leader whose subscription has died can keep the meeting
   * moving by pressing a button.
   */
  const refresh = useCallback(() => {
    setRefreshing(true);
    void refetchRoom(runId)
      .then((result) => {
        if (result.ok) setState(result.state);
      })
      .finally(() => {
        setRefreshing(false);
      });
  }, [runId]);

  return {
    state,
    connection,
    present,
    voted: count.beatIndex === state.currentBeat ? count.voted : 0,
    members: count.members,
    refresh,
    refreshing,
    apply,
  };
}
