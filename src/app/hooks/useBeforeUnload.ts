import { useEffect } from 'react';

const DEFAULT_MESSAGE = 'Your JSON or diff inputs may not be saved.';

/**
 * Subscribes to the browser's beforeunload event when there is unsaved progress.
 * Shows the native "Leave site?" dialog on refresh or close tab so the user can stay or leave.
 */
export function useBeforeUnload(
  hasUnsavedProgress: boolean,
  message: string = DEFAULT_MESSAGE
): void {
  useEffect(() => {
    if (!hasUnsavedProgress) return;

    function handleBeforeUnload(e: BeforeUnloadEvent): string {
      e.preventDefault();
      e.returnValue = message;
      return message;
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedProgress, message]);
}
