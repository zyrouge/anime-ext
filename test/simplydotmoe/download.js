const Simplydotmoe =
    require("../../dist/extractors/anime/simplydotmoe").default;
const util = require("../util");

const EPISODE_URL = "https://simply.moe/86-eighty-six-episode-01";

const start = async () => {
    const extractor = new Simplydotmoe({
        logger: util.logger,
        http: util.http,
    });

    const episodes = await extractor.getDownloadLinks(EPISODE_URL);
    console.log(episodes);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
