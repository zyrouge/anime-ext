const Simplydotmoe = require("../../dist/lib/extractors/simplydotmoe").default;

const SEARCH_TERMS = "highschool dxd";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new Simplydotmoe({
        logger: LOGGER,
    });

    const search = await extractor.search(SEARCH_TERMS);
    console.log(search);
};

start();
