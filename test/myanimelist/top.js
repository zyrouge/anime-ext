const {
    TopAnimeTypes,
    default: top,
} = require("../../dist/integrations/myanimelist/top");

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    TopAnimeTypes.push("all");

    const type =
        TopAnimeTypes[Math.floor(Math.random() * TopAnimeTypes.length)];

    const results = await top(type, {
        logger: LOGGER,
    });

    console.log(results);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
