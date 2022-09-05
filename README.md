# Amber
## SPA && SEO

Meta-frameworks! There's just *so many* for you to **learn**. But what if you're... *lazy*?

Then you're my kind of people because Amber is perhaps simplest way to get your ideas *isomorphized* and roaming out in the wild.

First it embeds your single page app in a resin of Deno-powered goodness for all to see (yes, including search engines).
Then sit back and watch as it re-animates your beautiful creation in the browser!

Basic router and and data fetching included so you can hit the ground running.

Almost forgot: Tailwind! It just works[^1] when you [use the classes](https://tailwindcss.com/docs/installation).

### 🤔 How to Amber??

1. [Install Deno](https://deno.land/#installation)
2. Scaffold! `deno run -A AmberRunner.tsx init`
3. Go! `deno task go`
4. Weep for those waiting for nextjs to install.

### 🤮 Is Amber bad for my health?

Warning: **Don't** use Amber if your project:

- Values "Islands-architecture" over "full hydration". (use [Fresh](https://fresh.deno.dev/) instead)
- Values "React Streaming" over SEO. (use [Ultra](https://github.com/exhibitionist-digital/ultra) instead)
- Requires a serious, vetted framework.

[^1]: Technically Amber uses [*twind*](https://twind.style/docs/) and some Tailwind conventions like "before:"/"after:" and border sides/colors don't work and will need to be made in a configuration.

------

## Rules

The client and server need to be on the same version of React. Scaffolding does this automatically, but if you're being *brave* and making *two files* required to run an Amber project *all on your own* then you will need:
1. A `deno.json(c)` config file
2. An `importMap` set within the config file
3. Both `react` and `react-dom/*` named imports within the importMap

To work with the default (configurable) filesystem conventions: 
- Static assets go into `static/` (configurable `--static=dir/`)
- .TS/.TSX/.JSX files etc. go into `client/`  (configurable `--client=dir/`)
- The app shell/entry is `client/App.tsx`  (configurable `--launch=file.tsx`)

The Amber hooks available:
- **useFetch** `const { Data, Error, Expiry, Pending } = useFetch("https://randomuser.me/api/");`
- **useRoute** `const [routeGet, routeSet] = useRoute();`
- **useMetas** `useMetas({Title:"Home Page!" Description:"A search engine will see this im sure", Image:"static/og.jpg"});`

------

Prior Art:
- Ultra
- Twind, Twd