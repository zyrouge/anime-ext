const Gogostream = require("../../dist/extractors/anime/gogostream").default;
const util = require("../util");

const ANIME_URL = "https://gogo-stream.com/videos/mayo-chiki-dub-episode-13";

const start = async () => {
    const extractor = new Gogostream({
        logger: util.logger,
        http: util.http,
    });

    const episodes = await extractor.getInfo(ANIME_URL);
    console.log(episodes);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
