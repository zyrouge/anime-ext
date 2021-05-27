const AnimeInfo =
    require("../../dist/integrations/myanimelist/anime-info").default;
const util = require("../util");

const ANIME_URL = "https://myanimelist.net/anime/10110/Mayo_Chiki";

const start = async () => {
    const info = await AnimeInfo(ANIME_URL, {
        logger: util.logger,
        http: util.http,
    });

    console.log(info);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
