import GogoplayStream from "./gogoplay-streaming";
import GogoplayLoad from "./gogoplay-load";

export const extractors = [GogoplayStream, GogoplayLoad];

export const getExtractor = (url: string) => {
    return extractors.find((ext) => ext.validate(url));
};
