const Gogoanime = require("../../dist/extractors/anime/gogoanime").default;
const util = require("../util");

const EPISODE_URL = "https://www1.gogoanime.ai/oregairu-episode-1";

const start = async () => {
    const extractor = new Gogoanime({
        logger: util.logger,
        http: util.http,
    });

    const episodes = await extractor.getDownloadLinks(EPISODE_URL);
    console.log(episodes);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
