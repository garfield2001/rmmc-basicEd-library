function getCookieValue(name: string) {
    const cookie = document.cookie
        .split('; ')
        .find((value) => value.startsWith(`${name}=`))
        ?.split('=')
        .slice(1)
        .join('=');

    return cookie ? decodeURIComponent(cookie) : null;
}

function getCsrfMetaToken() {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? null;
}

export function csrfFetch(input: RequestInfo | URL, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    const xsrfToken = getCookieValue('XSRF-TOKEN');
    const csrfToken = getCsrfMetaToken();

    headers.set('X-Requested-With', 'XMLHttpRequest');

    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }

    if (xsrfToken) {
        headers.set('X-XSRF-TOKEN', xsrfToken);
    } else if (csrfToken) {
        headers.set('X-CSRF-TOKEN', csrfToken);
    }

    return fetch(input, {
        ...init,
        credentials: init.credentials ?? 'same-origin',
        headers,
    });
}
