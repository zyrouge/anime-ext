const Twistdotmoe = require("../../dist/extractors/anime/twistdotmoe").default;

const ANIME_URL =
    "https://twist.moe/a/seishun-buta-yarou-wa-bunny-girl-senpai-no-yume-wo-minai";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new Twistdotmoe({
        logger: LOGGER,
    });

    const episodes = await extractor.getEpisodeLinks(ANIME_URL);
    console.log(episodes);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
