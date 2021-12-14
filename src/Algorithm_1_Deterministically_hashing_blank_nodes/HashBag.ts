import { hashString } from "./hashingBNs";



/**
 * Page 16f. of https://aidanhogan.com/docs/rdf-canonicalisation.pdf
 * 
 * says 
 * "The function hashBaд(·) computes hashes in a commutative and associative way over its inputs and is used to aggregate the hash across all edges."
 * 
 * Problem: commutative and associative calculation of hashes cannot be achieved in by iterative calculation of hashes => accumulator is needed
 * 
 * A HashBag is thus an accumulator for hashes of a blank node.
 */
export default class HashBag {
    // accumulating hashes
    private _hashes: Array<string>;
    /**
     * Accumulator of hashes (commutative and associative)
     * @param hashes previously calculated hashes if any.
     */
    constructor(hashes: Array<string>) {
        this._hashes = hashes
    }
    /**
     * Add a new hash value to be accumulated
     * @param hash the hash to be accumulated
     */
    add(hash: string) {
        this._hashes.push(hash)
    }
    /**
     * The value of the hashbag (commutative and associative)
     * @returns hash value as hex string
     */
    value() {
        // sorting takes care of commutative and associative property
       return hashString(this._hashes.sort().join())
    }

}