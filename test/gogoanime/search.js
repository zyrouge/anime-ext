const Gogoanime = require("../../dist/extractors/gogoanime").default;

const SEARCH_TERMS = "highschool dxd";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new Gogoanime({
        logger: LOGGER,
    });

    const search = await extractor.search(SEARCH_TERMS);
    console.log(search);
};

start();
