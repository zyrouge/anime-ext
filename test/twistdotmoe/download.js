const Twistdotmoe = require("../../dist/extractors/anime/twistdotmoe").default;
const util = require("../util");

const EPISODE_URL =
    "https://twist.moe/a/seishun-buta-yarou-wa-bunny-girl-senpai-no-yume-wo-minai/13";

const start = async () => {
    const extractor = new Twistdotmoe({
        logger: util.logger,
        http: util.http,
    });

    const episodes = await extractor.getDownloadLinks(EPISODE_URL);
    console.log(episodes);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
