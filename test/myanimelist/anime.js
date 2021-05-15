const AnimeInfo =
    require("../../dist/lib/integrations/myanimelist/anime-info").default;

const ANIME_URL = "https://myanimelist.net/anime/10110/Mayo_Chiki";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const info = await AnimeInfo(ANIME_URL, {
        logger: LOGGER,
    });

    console.log(info);
};

start();
