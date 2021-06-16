const AnimeParadise =
    require("../../dist/extractors/anime/animeparadise").default;
const util = require("../util");

const EPISODE_URL = "https://animeparadise.org/watch.php?s=11&ep=13";

const start = async () => {
    const extractor = new AnimeParadise({
        logger: util.logger,
        http: util.http,
    });

    const episodes = await extractor.getDownloadLinks(EPISODE_URL);
    console.log(episodes);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
