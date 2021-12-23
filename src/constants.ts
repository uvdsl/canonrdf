import { createHash } from "crypto";

// needed for Algo 1
export const HASH_ALGO = 'md5' // TODO to be determined
export const EDGE_OUT = Buffer.from('+'); // TODO to be determined 
export const EDGE_IN = Buffer.from('-'); // TODO to be determined 
export const INITIAL_BN_HASH = Buffer.alloc(16); // TODO to be determined

// needed for Algo 3
export const MARKER = Buffer.from('@'); // TODO to be determined


// TODO ordering of graphs