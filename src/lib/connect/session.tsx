"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";

export type NameMode = "alias" | "real";
export type ConnectTab = "find" | "contributions" | "circles" | "coaches";

type SessionState = {
  entered: boolean;
  displayName: string;
  nameMode: NameMode;
  email: string;
  tab: ConnectTab;
  urgentOpen: boolean;
  coachPreviewOpen: boolean;
};

const initialState: SessionState = {
  entered: false,
  displayName: "",
  nameMode: "alias",
  email: "",
  tab: "find",
  urgentOpen: false,
  coachPreviewOpen: false,
};

type Action =
  | { type: "enter"; displayName: string; nameMode: NameMode; email: string }
  | { type: "exit" }
  | { type: "set-tab"; tab: ConnectTab }
  | { type: "urgent"; open: boolean }
  | { type: "coach-preview"; open: boolean };

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "enter":
      return { ...initialState, entered: true, displayName: action.displayName, nameMode: action.nameMode, email: action.email };
    case "exit":
      return initialState;
    case "set-tab":
      return { ...state, tab: action.tab };
    case "urgent":
      return { ...state, urgentOpen: action.open };
    case "coach-preview":
      return { ...state, coachPreviewOpen: action.open };
    default:
      return state;
  }
}

const SessionContext = createContext<{ state: SessionState; dispatch: React.Dispatch<Action> } | null>(null);

export function ConnectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside ConnectProvider");
  return context;
}
