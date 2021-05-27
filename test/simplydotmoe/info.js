const Simplydotmoe =
    require("../../dist/extractors/anime/simplydotmoe").default;
const util = require("../util");

const ANIME_URL = "https://simply.moe/anime/86-eighty-six";

const start = async () => {
    const extractor = new Simplydotmoe({
        logger: util.logger,
        http: util.http,
    });

    const episodes = await extractor.getInfo(ANIME_URL);
    console.log(episodes);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
