const AnimeParadise =
    require("../../dist/extractors/anime/animeparadise").default;
const util = require("../util");

const ANIME_URL = "https://animeparadise.org/anime.php?s=11";

const start = async () => {
    const extractor = new AnimeParadise({
        logger: util.logger,
        http: util.http,
    });

    const episodes = await extractor.getInfo(ANIME_URL);
    console.log(episodes);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
