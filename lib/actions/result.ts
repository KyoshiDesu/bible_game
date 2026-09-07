/**
 * What a server action hands back to a form.
 *
 * Actions return a typed result rather than throwing, so "that code doesn't
 * match a group" reads as a sentence under the field instead of an error
 * boundary — which matters most on a phone, in a room, mid-meeting.
 */
export interface ActionState {
  error?: string;
  message?: string;
}

export const IDLE: ActionState = {};

export function failed(error: string): ActionState {
  return { error };
}

export function succeeded(message?: string): ActionState {
  return message === undefined ? { message: "" } : { message };
}
