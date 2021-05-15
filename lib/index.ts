import FourAnime from "./extractors/4anime";
import Gogoanime from "./extractors/gogoanime";
import Simplydotmoe from "./extractors/simplydotmoe";
import { version } from "../package.json";

export default {
    version,
    extractors: {
        FourAnime,
        Gogoanime,
        Simplydotmoe,
    },
};
