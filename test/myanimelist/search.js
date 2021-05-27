const search =
    require("../../dist/integrations/myanimelist/search-anime").default;
const util = require("../util");

const SEARCH_TERMS = "mayo chiki";

const start = async () => {
    const results = await search(SEARCH_TERMS, {
        logger: util.logger,
        http: util.http,
    });

    console.log(results);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
