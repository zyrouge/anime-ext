const Gogoanime = require("../../dist/extractors/gogoanime").default;

const EPISODE_URL = "https://www1.gogoanime.ai/oregairu-episode-1";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new Gogoanime({
        logger: LOGGER,
    });

    const episodes = await extractor.getDownloadLinks(EPISODE_URL);
    console.log(episodes);
};

start();
