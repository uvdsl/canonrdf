


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
export default class OrderedHashPartition {
    // store values and manage them
    private _b_id_to_hash: { [key: string]: string };
    private _hash_to_b_ids: { [key: string]: string[] };
    private _ordering: Array<string>;
    // create partition: compute hash partition P of bnodes(G) w.r.t. hash
    constructor(B_id_to_hash: { [key: string]: string }) {
        this._b_id_to_hash = B_id_to_hash;
        this._hash_to_b_ids = {};
        this._ordering = []
        // fill the partition
        Object.entries(B_id_to_hash).forEach(([k, v]) => {
            if (this._hash_to_b_ids[v] === undefined) {
                this._hash_to_b_ids[v] = []
                this._ordering.push(v)
            }
            this._hash_to_b_ids[v].push(k)
        })
        // order the partition
        this._ordering.sort((a, b) => {
            //  order by smallest parts first; use hash to break ties
            if (this._hash_to_b_ids[a].length < this._hash_to_b_ids[b].length) {
                return -1;
            }
            if (this._hash_to_b_ids[a].length > this._hash_to_b_ids[b].length) {
                return 1;
            }
            // return (a < b) ? -1 : 1; // use hash value as tie breaker 
            if (a.length < b.length) return -1;
            if (a.length > b.length) return 1;
            return (a < b) ? -1 : 1; // equality cannot happen by definition
            // if (a < b) return -1;
            // if (a > b) return 1;
            // return 0;
        })
    }


    /*
        We call B′ ∈ P a part of P.
        We call a part B′ trivial if |B′| = 1; otherwise we call it non-trivial. We call a partition P fine if it has
        only trivial parts, coarse if it has only one part, and intermediate if it is neither coarse nor fine.
        */
    isFine() {
        // if P is fine then // fine if all parts of P are trivial
        // this must be the case if B_ids_to_hashes and hash_to_B_ids have the same length.
        // B_ids_to_hashes has size of all blank nodes,i.e. |B|, where as hash_to_B_ids (to be fine) must have |B| entries with array length of 1.
        // hence
        return (Object.keys(this._b_id_to_hash).length === Object.keys(this._hash_to_b_ids).length)
    }


    /**
     * Gets the part B' of the partition that has first not |B'| == 1
     * @returns hash of B'
     */
    getLowestNonTrivial() {
        for (const hash of this._ordering) {
            if (this._hash_to_b_ids[hash].length > 1) {
                return hash
            }
        }
        return undefined
    }

    // /**
    //  * Get the hash of the blank node
    //  * @param b_id id of the blank node
    //  * @returns hash of the blank node
    //  */

    // getHash(b_id: string) {
    //     return this._b_id_to_hash[b_id]
    // }

    // get B_id_to_hash() {
    //     return this._B_id_to_hash;
    // }

    // get hash_to_B_ids() {
    //     return this._hash_to_B_ids;
    // }

    // get ordering() {
    //     return this._ordering;
    // }



}