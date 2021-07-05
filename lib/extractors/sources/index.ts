import { SourceRetriever } from "./model";
import SbPlay from "./sbplay";
import Streamtape from "./streamtape";

export const extractors: SourceRetriever[] = [SbPlay, Streamtape];

export const getExtractor = (url: string) => {
    return extractors.find((ext) => ext.validate(url));
};
