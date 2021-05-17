const FourAnime = require("../../dist/extractors/anime/4anime").default;

const EPISODE_URL = "https://4anime.to/high-school-dxd-episode-01";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new FourAnime({
        logger: LOGGER,
    });

    const episodes = await extractor.getDownloadLinks(EPISODE_URL);
    console.log(episodes);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
