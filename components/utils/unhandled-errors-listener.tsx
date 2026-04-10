"use client";

import { useEffect } from "react";

export function UnhandledErrorsListener() {
  useEffect(() => {
    function onUnhandledRejection(event: PromiseRejectionEvent) {
      // Prevent Next dev overlay from crashing the whole tree on non-Error rejections (e.g. Event)
      event.preventDefault();
      // eslint-disable-next-line no-console
      console.error("[unhandledrejection]", event.reason);
    }

    function onError(event: ErrorEvent) {
      // eslint-disable-next-line no-console
      console.error("[window.error]", event.error ?? event.message);
    }

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  return null;
}

