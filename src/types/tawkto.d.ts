export {};

interface TawkAPI {
  onLoad?: () => void;
  onStatusChange?: (status: string) => void;
  onChatMaximized?: () => void;
  onChatMinimized?: () => void;
  onChatHidden?: () => void;
  hideWidget: () => void;
  showWidget: () => void;
  toggle: () => void;
  maximize: () => void;
  minimize: () => void;
  isChatMaximized: () => boolean;
  isChatMinimized: () => boolean;
  isChatHidden: () => boolean;
  isChatOngoing: () => boolean;
  isVisitorEngaged: () => boolean;
  endChat: () => void;
  setAttributes: (
    attributes: Record<string, string>,
    callback?: (error: unknown) => void
  ) => void;
  addEvent: (
    event: string,
    metadata?: Record<string, unknown>,
    callback?: (error: unknown) => void
  ) => void;
  addTags: (tags: string[], callback?: (error: unknown) => void) => void;
  removeTags: (tags: string[], callback?: (error: unknown) => void) => void;
}

declare global {
  interface Window {
    Tawk_API?: TawkAPI;
    Tawk_LoadStart?: Date;
    __TAWK_LOADED__?: boolean;
    __TAWK_READY__?: boolean;
  }
}