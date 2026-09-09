import { act } from "react";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type Connection, type RoomState } from "@/lib/room/client";
import { parseVoteCount } from "@/lib/room/supabase";

import type * as RoomTransport from "@/lib/room/supabase";

/*
 * The hook's rules, without a network.
 *
 * Everything mocked here is a transport. What is left is the part that decides
 * what a screen shows, and every rule below exists because breaking it would
 * put two different answers on two screens in the same room.
 */
const subscribe = vi.fn();
const watchCounts = vi.fn();
const refetchRoom = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ realtime: { setAuth: () => Promise.resolve() } }),
}));

vi.mock("@/lib/room/supabase", async (importOriginal) => {
  const actual = await importOriginal<typeof RoomTransport>();
  return {
    ...actual,
    supabaseRoom: () => ({ subscribe }),
    watchCounts: (...args: unknown[]) => watchCounts(...args),
  };
});

vi.mock("@/lib/actions/room", () => ({
  refetchRoom: (...args: unknown[]) => refetchRoom(...args),
}));

const { useLiveRoom } = await import("@/lib/room/use-live-room");

function state(overrides: Partial<RoomState> = {}): RoomState {
  return {
    runId: "run-1",
    scenarioId: "s1-delete-the-library",
    state: "voting",
    currentBeat: 0,
    results: [],
    tie: null,
    ...overrides,
  };
}

/** Lets the awaited setAuth resolve and the subscriptions be made. */
async function connect() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  subscribe.mockReset().mockReturnValue(() => undefined);
  watchCounts.mockReset().mockReturnValue(() => undefined);
  refetchRoom.mockReset();
});

describe("useLiveRoom", () => {
  it("renders what the server sent before anything is connected", () => {
    const { result } = renderHook(() => useLiveRoom(state(), "me"));

    expect(result.current.state.currentBeat).toBe(0);
    expect(result.current.connection).toBe("connecting");
    expect(result.current.voted).toBe(0);
  });

  it("replaces the whole state when the subscription says something changed", async () => {
    const { result } = renderHook(() => useLiveRoom(state(), "me"));
    await connect();

    const onChange = subscribe.mock.calls[0]![1] as (next: RoomState) => void;
    act(() => {
      onChange(state({ state: "revealing", currentBeat: 1 }));
    });

    expect(result.current.state.state).toBe("revealing");
    expect(result.current.state.currentBeat).toBe(1);
  });

  it("raises the connection as lost, so a stale screen can say so", async () => {
    const { result } = renderHook(() => useLiveRoom(state(), "me"));
    await connect();

    const onConnection = subscribe.mock.calls[0]![2] as (
      connection: Connection,
    ) => void;
    act(() => {
      onConnection("lost");
    });

    expect(result.current.connection).toBe("lost");
  });

  it("ignores a count left over from a beat the room has moved past", async () => {
    const { result } = renderHook(() => useLiveRoom(state(), "me"));
    await connect();

    const handlers = watchCounts.mock.calls[0]![3] as {
      onCount: (count: {
        beatIndex: number;
        voted: number;
        members: number;
      }) => void;
    };
    act(() => {
      handlers.onCount({ beatIndex: 0, voted: 7, members: 12 });
    });
    expect(result.current.voted).toBe(7);
    expect(result.current.members).toBe(12);

    // The room moves on. Seven is now somebody else's number, and showing it
    // next to the new beat would be a lie the projector tells confidently.
    const onChange = subscribe.mock.calls[0]![1] as (next: RoomState) => void;
    act(() => {
      onChange(state({ currentBeat: 1 }));
    });
    expect(result.current.voted).toBe(0);
  });

  it("catches up through the server when asked", async () => {
    refetchRoom.mockResolvedValue({
      ok: true,
      state: state({ state: "complete", currentBeat: 2 }),
    });

    const { result } = renderHook(() => useLiveRoom(state(), "me"));
    await connect();

    await act(async () => {
      result.current.refresh();
      await Promise.resolve();
    });

    expect(refetchRoom).toHaveBeenCalledWith("run-1");
    expect(result.current.state.state).toBe("complete");
  });

  it("leaves the screen alone when catching up fails", async () => {
    refetchRoom.mockResolvedValue({ ok: false, reason: "no" });

    const { result } = renderHook(() => useLiveRoom(state(), "me"));
    await connect();

    await act(async () => {
      result.current.refresh();
      await Promise.resolve();
    });

    expect(result.current.state.state).toBe("voting");
  });
});

describe("parseVoteCount", () => {
  it("reads a count the database sent", () => {
    expect(
      parseVoteCount({ beatIndex: 1, voted: 4, members: 9, id: "x" }),
    ).toEqual({ beatIndex: 1, voted: 4, members: 9 });
  });

  it("reads one that arrived wrapped", () => {
    expect(
      parseVoteCount({ payload: { beatIndex: 0, voted: 1, members: 2 } }),
    ).toEqual({ beatIndex: 0, voted: 1, members: 2 });
  });

  it("ignores anything that is not a count", () => {
    expect(parseVoteCount(null)).toBeNull();
    expect(parseVoteCount("12")).toBeNull();
    expect(parseVoteCount({ voted: 4 })).toBeNull();
    expect(parseVoteCount({ beatIndex: "1", voted: 4, members: 9 })).toBeNull();
  });
});
