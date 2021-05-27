const FourAnime = require("../../dist/extractors/anime/4anime").default;
const util = require("../util");

const EPISODE_URL = "https://4anime.to/high-school-dxd-episode-01";

const start = async () => {
    const extractor = new FourAnime({
        logger: util.logger,
        http: util.http,
    });

    const episodes = await extractor.getDownloadLinks(EPISODE_URL);
    console.log(episodes);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
