import SbPlay from "./sbplay";
import { SourceRetriever } from "./model";

export const extractors: SourceRetriever[] = [SbPlay];

export const getExtractor = (url: string) => {
    return extractors.find((ext) => ext.validate(url));
};
