const MangaInfo =
    require("../../dist/integrations/myanimelist/manga-info").default;
const util = require("../util");

const MANGA_URL = "https://myanimelist.net/manga/108407/Kanojo_Okarishimasu";

const start = async () => {
    const info = await MangaInfo(MANGA_URL, {
        logger: util.logger,
        http: util.http,
    });

    console.log(info);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
