export function toPathname(href) {
	try {
		return new URL(href, window.location.origin).pathname.replace(/\/+$/, '') || '/'
	} catch {
		return href
	}
}
