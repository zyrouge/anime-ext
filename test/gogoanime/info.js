const Gogoanime = require("../../dist/extractors/anime/gogoanime").default;
const util = require("../util");

const ANIME_URL = "https://gogoanime.pe/category/one-piece";

const start = async () => {
    const extractor = new Gogoanime({
        logger: util.logger,
        http: util.http,
    });

    const episodes = await extractor.getInfo(ANIME_URL);
    console.log(episodes);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
