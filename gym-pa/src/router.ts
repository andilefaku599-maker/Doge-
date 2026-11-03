import { useEffect, useState } from 'react';

const current = () => location.pathname + location.search;

export function navigate(to: string, replace = false) {
  if (to === current()) return;
  history[replace ? 'replaceState' : 'pushState'](null, '', to);
  dispatchEvent(new PopStateEvent('popstate'));
}

export function useRoute() {
  const [path, setPath] = useState(current());
  useEffect(() => {
    const f = () => { setPath(current()); window.scrollTo(0, 0); };
    addEventListener('popstate', f);
    return () => removeEventListener('popstate', f);
  }, []);
  const url = new URL(path, location.origin);
  return { pathname: url.pathname, query: url.searchParams };
}
