/**
Also referred to as a unordered `HashPartition`, 
a HashTable is maps a `blank node id` to its current `hash value` (Buffer) and, 
simultaneously, the `hash value` to the `array of blank node ids` that have that hash:
 { map<b_id, hash>, map< hash, b_id[] > }.
 */
export default class HashTable {
    // store values and manage them
    protected _b_id_to_hash: { [key: string]: Buffer };
    protected _hash_to_b_ids: { [key: string]: string[] };
    // create partition: compute hash partition P of bnodes(G) w.r.t. hash
    constructor(b_id_to_hash: { [key: string]: Buffer }) {
        this._b_id_to_hash = b_id_to_hash;
        this._hash_to_b_ids = {};
        // fill the partition
        Object.entries(b_id_to_hash).forEach(([k, v]) => {
            if (this._hash_to_b_ids[v.toString('hex')] === undefined) {
                this._hash_to_b_ids[v.toString('hex')] = []
            }
            this._hash_to_b_ids[v.toString('hex')].push(k)
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


    // <p3>
    /**
     * checks the hash partition: true (Termination) if
     * (i) the hash-based partition of terms does not change in an iteration, OR
     * (ii) no two terms share a hash.
     *  (∀x , y : hash_i [x] = hash_i [y] iff hash_{i−1}[x ] = hash_{i−1}[y]) or (∀x , y : hash_i [x] = hash_i [y] iff x = y)
     * 
     * I.e.:
     * (i)  x and y should only be hashEqual if x and y were hashEqual in prev iteration otherwise return false
     * (ii) x and y should only be hashEqual if x == y otherwise return false
     * @param other {@link HashTable} to compare to
     * @return boolean
     */
    isStableComparedTo(other: HashTable) {
        // (ii) no two terms share a hash
        if (this.isFine()) return true; // condition (ii)
        // (i) hash based partitions do not change compared to the other partition
        for (const BNs of Object.values(this._hash_to_b_ids)) {
            if (!other.hasHashFor(BNs)) return false; // if there is some sub-partition B' of B that is not the same in the other partition (i.e. something has changed), return false
        }
        // if everything is partitoned in this partition as in the other partition then return true
        return true;
    }

    /**
     * Checks if the input array of blank node IDs has a common hash value.
     * @param BNs the string ids of some blank nodes.
     * @returns booelan, true if the blank nodes share a common hash value.
     */
    hasHashFor(BNs: string[]) {
        if (BNs.length == 0) return false;
        const assumedHash = this._b_id_to_hash[BNs[0]]
        const hashBNs = this._hash_to_b_ids[assumedHash.toString('hex')]
        if (BNs.length !== hashBNs.length) return false;
        for (const bn of BNs) {
            if (!hashBNs.includes(bn)) return false;
        }
        return true;
    }

    /**
     * 
     * @returns a cloned `HashTable`
     */
    clone() {
        return new HashTable(Object.assign({}, this._b_id_to_hash))
    }

    /**
     * 
     * @returns mapping of blank node id to hash
     */
    getBIdToHashMapping() {
        return this._b_id_to_hash;
    }

    /**
     * 
     * @returns mapping of hash to blank node ids
     */
    getHashToBIdsMapping() {
        return this._hash_to_b_ids;
    }

    /**
 * 
 * @param key blank node id
 * @param value hash value
 */
    setHash(key: string, value: Buffer) {
        if (this._b_id_to_hash[key] !== undefined) {
            const prev_val = this._b_id_to_hash[key].toString('hex')
            const index = this._hash_to_b_ids[prev_val].indexOf(key)
            this._hash_to_b_ids[prev_val].splice(index, 1)
            if (this._hash_to_b_ids[prev_val].length == 0) {
                delete this._hash_to_b_ids[prev_val];
            }
        }
        this._b_id_to_hash[key] = value;
        if (this._hash_to_b_ids[value.toString('hex')] === undefined) {
            this._hash_to_b_ids[value.toString('hex')] = [];
        }
        this._hash_to_b_ids[value.toString('hex')].push(key)
    }

    /**
     * 
     * @param key blank node id
     * @returns hash value as buffer
     */
    getHash(key: string) {
        return this._b_id_to_hash[key]
    }

}