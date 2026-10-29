import { Link as RLink, NavLink as RNavLink, Navigate as RNavigate } from 'react-router-dom';
import { useHub } from './HubProvider.jsx';

/* Inside a hub every absolute link ("/queue") really goes to "/h/<hub>/queue". Links to the platform console
   ("/platform...") and relative links are left alone. */
const prefix = (id, to) => (id && typeof to === 'string' && to.startsWith('/') && !to.startsWith('/platform') ? `/h/${id}${to === '/' ? '' : to}` : to);

export function Link({ to, ...p }) { const { id } = useHub(); return <RLink to={prefix(id, to)} {...p} />; }
export function NavLink({ to, ...p }) { const { id } = useHub(); return <RNavLink to={prefix(id, to)} {...p} />; }
export function Navigate({ to, ...p }) { const { id } = useHub(); return <RNavigate to={prefix(id, to)} {...p} />; }

// for plain <a href> links (new tab): "#/h/<hub>/tv"
export function useHubHref() { const { id } = useHub(); return (p) => `#${id ? `/h/${id}` : ''}${p === '/' ? '' : p}`; }
