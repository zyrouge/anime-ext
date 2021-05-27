const TenshiDotMoe =
    require("../../dist/extractors/anime/tenshidotmoe").default;
const util = require("../util");

const ANIME_URL = "https://tenshi.moe/anime/pyx8n806";

const start = async () => {
    const extractor = new TenshiDotMoe({
        logger: util.logger,
        http: util.http,
    });

    const episodes = await extractor.getInfo(ANIME_URL);
    console.log(episodes);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
