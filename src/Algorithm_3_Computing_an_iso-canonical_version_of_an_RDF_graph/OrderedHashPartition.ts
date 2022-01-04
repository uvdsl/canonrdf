import { hashTuple } from "../Algorithm_1_Deterministically_hashing_blank_nodes/hashingBNs";
import HashTable from "../Algorithm_1_Deterministically_hashing_blank_nodes/HashTable";

/**
 * Page 21 of https://aidanhogan.com/docs/rdf-canonicalisation.pdf
 * 
 * says
 * 
 * "
 * Definition 4.10 (Ordered partition). Given P = {B1, . . . , Bn }, a hash partition of B with respect
to hash, we call a sequence of sets of blank nodes P := (B1, . . . , Bn ) an ordered partition of B with
respect to hash.

To deterministically compute an initial P from an input P and hash, we use a total ordering ≤
of parts such that B′ < B′′ if |B′| < |B′′|, or in the case that |B′| = |B′′|, then B′ < B′′ if and only
if hash(b′) < hash(b′′) for b′ ∈ B′ and b′′ ∈ B′′ (recall that all elements of B′ have the same hash
and likewise for B′′, and that B′ and B′′ are disjoint)."
 */
export default class OrderedHashPartition extends HashTable {
    // store values and manage them, inherited
    // private _b_id_to_hash: { [key: string]: Buffer };
    // private _hash_to_b_ids: { [key: string]: string[] };
    // and now for ordering
    protected _ordering: Array<Buffer>;

    /**
     * Creates an ordering on a `HashPartition`, i.e. a `HashTable`.
     * @param hashTable {@link HashTable}
     */
    constructor(hashTable: HashTable) {
        super({}); // init emtpy
        this._b_id_to_hash = hashTable.getBIdToHashMapping(); // fill with existing
        this._hash_to_b_ids = hashTable.getHashToBIdsMapping(); // fill with existing
        // order the partition
        this._ordering = Object.keys(this._hash_to_b_ids).map(hash => Buffer.from(hash, 'hex'))

        this._ordering.sort((a, b) => {
            //  order by smallest parts first; use hash to break ties
            if (this._hash_to_b_ids[a.toString('hex')].length < this._hash_to_b_ids[b.toString('hex')].length) {
                return -1;
            }
            if (this._hash_to_b_ids[a.toString('hex')].length > this._hash_to_b_ids[b.toString('hex')].length) {
                return 1;
            }
            // // return (a < b) ? -1 : 1; // use hash value as tie breaker 
            if (a.length < b.length) return -1;
            if (a.length > b.length) return 1;
            // return (a < b) ? -1 : 1; // equality cannot happen by definition
            // // if (a < b) return -1; //this does not work as expected
            // // if (a > b) return 1; // this does not work as expected
            // // return 0;
            return Buffer.compare(a, b)
        })
    }

    /**
     * Gets the part B' of the partition that has first |B'| > 1
     * @returns hash of B'
     */
    getLowestNonTrivial() {
        for (const hash of this._ordering) {
            if (this._hash_to_b_ids[hash.toString('hex')].length > 1) {
                const bns = this._hash_to_b_ids[hash.toString('hex')]
                return { lowestNonTrivialHash: hash, lowestNonTrivialBNs: bns }
            }
        }
        return undefined
    }

}