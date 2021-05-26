const TenshiDotMoe =
    require("../../dist/extractors/anime/tenshidotmoe").default;

const ANIME_URL = "https://tenshi.moe/anime/pyx8n806";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new TenshiDotMoe({
        logger: LOGGER,
    });

    const episodes = await extractor.getInfo(ANIME_URL);
    console.log(episodes);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
