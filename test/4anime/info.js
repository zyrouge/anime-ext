const FourAnime = require("../../dist/extractors/anime/4anime").default;
const util = require("../util");

const ANIME_URL = "https://4anime.to/anime/high-school-dxd";

const start = async () => {
    const extractor = new FourAnime({
        logger: util.logger,
        http: util.http,
    });

    const episodes = await extractor.getInfo(ANIME_URL);
    console.log(episodes);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
