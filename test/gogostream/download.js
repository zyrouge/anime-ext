const Gogostream = require("../../dist/extractors/anime/gogostream").default;
const util = require("../util");

const EPISODE_URL = "https://gogo-stream.com/videos/mayo-chiki-dub-episode-13";

const start = async () => {
    const extractor = new Gogostream({
        logger: util.logger,
        http: util.http,
    });

    const episodes = await extractor.getDownloadLinks(EPISODE_URL);
    console.log(episodes);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
