# Anime Extractor ✨

## About

Anime extractor used in [Yukino](https://zyrouge.github.io/yukino-app)!

[![Documentation](https://github.com/zyrouge/anime-ext/actions/workflows/Documentation.yml/badge.svg)](https://github.com/zyrouge/anime-ext/actions/workflows/Documentation.yml) [![CodeQL](https://github.com/zyrouge/anime-ext/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/zyrouge/anime-ext/actions/workflows/codeql-analysis.yml)

## Installation

```bash
npm install anime-ext
```

## Includes

| Name                                                                  | Type                | Support                                  |
| --------------------------------------------------------------------- | ------------------- | ---------------------------------------- |
| [4Anime](./lib/extractors/anime/4anime.ts)                            | `extractor (anime)` | ✔️ Search <br>✔️ Episodes<br>✔️ Download |
| [GogoAnime](./lib/extractors/anime/gogoanime.ts)                      | `extractor (anime)` | ✔️ Search <br>✔️ Episodes<br>✔️ Download |
| [GogoStream](./lib/extractors/anime/gogostream.ts)                    | `extractor (anime)` | ✔️ Search <br>✔️ Episodes<br>✔️ Download |
| [Simply.moe](./lib/extractors/anime/simplydotmoe.ts)                  | `extractor (anime)` | ❌ Search <br>✔️ Episodes<br>✔️ Download |
| [Twist.moe](./lib/extractors/anime/twistdotmoe.ts)                    | `extractor (anime)` | ✔️ Search <br>✔️ Episodes<br>✔️ Download |
| [Fanfox.net](./lib/extractors/manga/fanfox.ts)                        | `extractor (manga)` | ✔️ Search <br>✔️ Chapters<br>✔️ Pages    |
| [MyAnimeList](./lib/integrations/myanimelist)                         | `integration`       | ✔️ Search <br>✔️ Anime Information       |
| [Gogo-play Iframe](./lib/extractors/parsers/gogoplay-iframe.ts)       | `parser`            | ✔️ Source extractor                      |
| [Gogo-play Streaming](./lib/extractors/sources/gogoplay-streaming.ts) | `source`            | ✔️ Stream link extractor                 |
| [Gogo-play Loadserver](./lib/extractors/sources/gogoplay-load.ts)     | `source`            | ✔️ Stream link extractor                 |

## Links

-   [Documentation](https://zyrouge.github.io/anime-ext/)
-   [License](./LICENSE)
