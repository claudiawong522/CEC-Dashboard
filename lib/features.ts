// One switch per optional tool, so turning something on or off is a single
// edit rather than a hunt through the nav, the routes and the proxy.
//
// These are constants rather than a database table on purpose: they change
// once a semester, and a settings screen nobody opens is another thing to
// maintain. When one needs to change per-event rather than per-semester, it
// belongs on the event row instead, the way `events.has_signin` does.

/**
 * The prospective-member coffee chat signup and the request pool it feeds.
 *
 * Off for this semester: recruitment coffee chats are already arranged, so
 * nobody is watching the pool. A public form feeding a queue no one reads is
 * worse than no form, because someone writes in and waits for a reply that
 * never comes.
 *
 * Turning it back on means flipping this and adding "/chat" back to
 * PUBLIC_PATHS in proxy.ts. The code, tables and tests all stay in place.
 */
export const COFFEE_CHAT_SIGNUP_ENABLED = false;
