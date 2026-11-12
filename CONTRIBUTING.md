# Contributing to Geek Jr

Thank you for helping children learn. Small, clear improvements are the most useful here.

## Development

1. Create a branch from `main`.
2. Run `npm ci` with Node.js 20.9 or newer, then `npm run dev`.
3. Make one focused change and check it at a phone width and a desktop width.
4. Run `npm run lint` and `npm run build`.
5. Open a pull request with a short description, screenshots for visual changes, and manual steps for new activities.

Pull requests are squash-merged.

## Learning content

Read [content guidelines](docs/CONTENT_GUIDELINES.md). Put prompts in the relevant JSON file in `src/data`, assign a unique `id` and an age `tier`, and make the correct answer unambiguous. Keep wording short enough for an adult to read aloud. Content for ages 1–2 should use recognizable visual examples and support parent participation.

Do not add a child’s personal information, external tracking, or copyrighted question banks. Check facts and spelling before opening a pull request.
