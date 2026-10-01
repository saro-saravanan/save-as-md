export const JAN1 = 1767225600; // 2026-01-01T00:00:00Z

export function redditThread({ post = {}, comments = [] } = {}) {
  return [
    { kind: 'Listing', data: { children: [{ kind: 't3', data: {
      title: 'A question', author: 'op', subreddit_name_prefixed: 'r/test', score: 42, created_utc: JAN1,
      selftext: 'Body **text**', is_self: true,
      url: 'https://www.reddit.com/r/test/comments/abc/a_question/', permalink: '/r/test/comments/abc/a_question/',
      ...post,
    } }] } },
    { kind: 'Listing', data: { children: comments } },
  ];
}

export function comment(author, body, replies = [], extra = {}) {
  return { kind: 't1', data: {
    author, body, score: 5, created_utc: JAN1,
    replies: replies.length ? { kind: 'Listing', data: { children: replies } } : '',
    ...extra,
  } };
}

export const more = (count) => ({ kind: 'more', data: { count, children: [] } });
