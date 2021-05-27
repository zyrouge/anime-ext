const {
    TopAnimeTypes,
    default: top,
} = require("../../dist/integrations/myanimelist/top");
const util = require("../util");

const start = async () => {
    TopAnimeTypes.push("all");

    const type =
        TopAnimeTypes[Math.floor(Math.random() * TopAnimeTypes.length)];

    const results = await top(type, {
        logger: util.logger,
        http: util.http,
    });

    console.log(results);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
