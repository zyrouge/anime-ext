import { SourceRetriever } from "./model";
import SbPlay from "./sbplay";
// import StreamAniLoad from "./streamani-load";

export const extractors: SourceRetriever[] = [SbPlay /*, StreamAniLoad */];

export const getExtractor = (url: string) => {
    return extractors.find((ext) => ext.validate(url));
};
