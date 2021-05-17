# Anime Extractor ✨

## About

Anime extractor used in [Yukino](https://zyrouge.github.io/yukino)!

## Installation

```bash
npm install zyrouge/anime-ext#dist
```

## Includes

| Name                                                                  | Type          | Support                                  |
| --------------------------------------------------------------------- | ------------- | ---------------------------------------- |
| [4Anime](./lib/extractors/4anime.ts)                                  | `extractor`   | ✔️ Search <br>✔️ Episodes<br>✔️ Download |
| [GogoAnime](./lib/extractors/gogoanime.ts)                            | `extractor`   | ✔️ Search <br>✔️ Episodes<br>✔️ Download |
| [GogoStream](./lib/extractors/gogostream.ts)                          | `extractor`   | ✔️ Search <br>✔️ Episodes<br>✔️ Download |
| [Simply.moe](./lib/extractors/simplydotmoe.ts)                        | `extractor`   | ❌ Search <br>✔️ Episodes<br>✔️ Download |
| [Twist.moe](./lib/extractors/twistdotmoe.ts)                          | `extractor`   | ✔️ Search <br>✔️ Episodes<br>✔️ Download |
| [MyAnimeList](./lib/integrations/myanimelist)                         | `integration` | ✔️ Search <br>✔️ Anime Information       |
| [Gogo-play Iframe](./lib/extractors/parsers/gogoplay-iframe.ts)       | `parser`      | ✔️ Source extractor                      |
| [Gogo-play Streaming](./lib/extractors/sources/gogoplay-streaming.ts) | `source`      | ✔️ Stream link extractor                 |
| [Gogo-play Loadserver](./lib/extractors/sources/gogoplay-load.ts)     | `source`      | ✔️ Stream link extractor                 |

## Links

-   [Documentation](https://zyrouge.github.io/anime-ext/)
-   [License](./LICENSE)
