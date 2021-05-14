import GogoplayStream from "./gogoplay-streaming";
import GogoplayLoad from "./gogoplay-load";
import { SourceRetriever } from "./model";

export const extractors: SourceRetriever[] = [GogoplayStream, GogoplayLoad];

export const getExtractor = (url: string) => {
    return extractors.find((ext) => ext.validate(url));
};
