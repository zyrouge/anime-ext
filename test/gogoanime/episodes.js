const Gogoanime = require("../../dist/lib/extractors/anime/gogoanime").default;

const ANIME_URL = "https://www1.gogoanime.ai/category/oregairu";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new Gogoanime({
        logger: LOGGER,
    });

    const episodes = await extractor.getEpisodeLinks(ANIME_URL);
    console.log(episodes);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
