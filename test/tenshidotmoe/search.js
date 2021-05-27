const TenshiDotMoe =
    require("../../dist/extractors/anime/tenshidotmoe").default;

const SEARCH_TERMS = "masamune";

const start = async () => {
    const extractor = new TenshiDotMoe({
        logger: util.logger,
        http: util.http,
    });

    const search = await extractor.search(SEARCH_TERMS);
    console.log(search);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
