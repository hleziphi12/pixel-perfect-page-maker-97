<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- All AI calls go through the `aiGenerate` server function in src/lib/ai.functions.ts, which falls back to labelled demo content on failure — keeps the API key server-side and the app usable offline.
- User data (tasks, research, chat) lives in browser localStorage via hooks in src/lib/store.ts — the brief requires no sign-in.
