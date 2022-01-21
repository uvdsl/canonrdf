import { Term, Store, Util as n3Util } from 'n3';
import { createHash } from 'crypto';
import HashBag from './HashBag';
import { INITIAL_BN_HASH, EDGE_OUT, EDGE_IN, HASH_ALGO } from '../constants';
import HashTable from './HashTable';




/**
Page 16f. of https://aidanhogan.com/docs/rdf-canonicalisation.pdf
// TODO adjust for datasets : blank nodes are scoped within the graph...

In Algorithm 1, we propose such an iterative hashing scheme for initially labelling blank nodes
based on the ground terms that surround them in the RDF graph.

Lines in <p1>: A map of terms to hashes is initialised. IRIs and literals are assigned unique static hashes.
Blank nodes hashes are initialised to zero and will be computed iteratively in subsequent
steps. For now, we assume perfect hashing without clashes, where practical hashing issues
will be discussed later in Section 4.4.

Lines in <p2>:
A hash for each blank node is computed iteratively per its inward and outward edges
in the RDF graph. The function hashTuple(·) will compute an order-dependant hash of its
inputs, and is used to compute the hash of an edge based on the hash of the predicate, value (the subject for inward edges or the object for outward edges) and the direction. The symbols
‘+’ (outward) and ‘-’ (inward) are used to distinguish edge directions. The hash of the value is
static in the case of IRIs or literals; otherwise it is the hash of the blank node from the previous
iteration. The function hashBag(·) computes hashes in a commutative and associative way
over its inputs and is used to aggregate the hash across all edges.

Lines in <p3>: The computed hashes form a partition of blank nodes. The hash of each blank node
changes in every iteration. The loop terminates when either (i) the hash-based partition of
terms does not change in an iteration, or (ii) no two terms share a hash.
 
 * @param G n3.Store, the graph
 * @returns b_hash_table, a {@link HashTable} aka. unordered `HashPartition`
*/
export const hashBNodes = (G: Store, initOptions?: { b_hash_table: HashTable, il_hash_table: HashTable }) => {
    // <p1>
    let {
        il_hash_table, // hash table for iris and literals 
        b_hash_table,  // hash table for blank nodes
        b_hash_bags  // a simple mapping from blank node id to {@link HashBag}
    } = initHashes(G, initOptions);
    // </p1>
    if (Object.keys(b_hash_bags).length == 0) return {b_hash_table, il_hash_table}; // no blank nodes.

    // <p2>
    let b_hash_table_prev: HashTable;
    do {
        b_hash_table_prev = b_hash_table.clone()
        // for (b, p, o) ∈ G : b ∈ B do
        Object.keys(b_hash_bags).forEach(b => {
            G.getQuads(b, null, null, null).sort().forEach(quad => {  // .TODO adjust for datasets : blank nodes are scoped within the graph...
                const o_hash = (n3Util.isBlankNode(quad.object)) ? b_hash_table_prev.getHash(quad.object.id) : il_hash_table.getHash(quad.object.id)
                const p_hash = il_hash_table.getHash(quad.predicate.id)
                const c = hashTuple(o_hash, p_hash, EDGE_OUT);
                // B_ids_to_hashes[b.id] = hashBag(c, B_ids_to_hashes[b.id]); // (footnote 1)
                b_hash_bags[b].add(c); // (footnote 1)
            })
            // })
            // for (s, p, b) ∈ G : b ∈ B do
            // Object.values(B).forEach(b => {
            G.getQuads(null, null, b, null).sort().forEach(quad => {  // .TODO adjust for datasets : blank nodes are scoped within the graph...
                const s_hash = (n3Util.isBlankNode(quad.subject)) ? b_hash_table_prev.getHash(quad.subject.id) : il_hash_table.getHash(quad.subject.id)
                const p_hash = il_hash_table.getHash(quad.predicate.id)
                const c = hashTuple(s_hash, p_hash, EDGE_IN);
                // B_ids_to_hashes[b.id] = hashBag(c, B_ids_to_hashes[b.id]); // (footnote 1)
                b_hash_bags[b].add(c); // (footnote 1)
            })
        })
        // (footnote 1) 
        // in order to create a commutative and associative hash, we need an accumulator `HashBag` for each blanknode
        // (it is not possible to calculate a hash in such way in an iterative manner as it may appear from the listing in the paper)
        Object.keys(b_hash_bags).forEach(b_id => b_hash_table.setHash(b_id, b_hash_bags[b_id].value()));
        // </p2>
        // <p3>
        // until (∀x , y : hash_i [x] = hash_i [y] iff hash_{i−1}[x ] = hash_{i−1}[y]) or (∀x , y : hash_i [x ] = hash_i [y] iff x = y)
    } while (!b_hash_table.isStableComparedTo(b_hash_table_prev));
    // </p3>
    return {b_hash_table, il_hash_table};
}

/**
 * Initialises the hash tables and hash bags for the terms of G.
 * When provided, initOptions are used.
 * 
 * @param G graph 
 * @param initOptions?: { b_hash_table: HashTable, il_hash_table: HashTable }
 * @returns  \{ il_hash_table, b_hash_table, b_hash_bags \}
 */
const initHashes = (G: Store, initOptions?: { b_hash_table: HashTable, il_hash_table: HashTable }) => {
    let il_hash_table = new HashTable({});
    let b_hash_table = new HashTable({});
    let b_hash_bags: { [key: string]: HashBag } = {} // {B.id : HashBag Obj} 
    // a hashbag for commutative and associative hashes of blank nodes
    // TODO Question to Aidan, hashbag carries hashes over? would need to if truely commutative and associative (but iherman doesnt), iherman reassigns emtpy bag in each do-iteration

    if (initOptions) {
        il_hash_table = initOptions.il_hash_table;
        b_hash_table = initOptions.b_hash_table;
        Object.keys(b_hash_table.getBIdToHashMapping()).forEach(b_id => b_hash_bags[b_id] = new HashBag([b_hash_table.getHash(b_id)]))
        return { il_hash_table, b_hash_table, b_hash_bags }
    }

    // start from scratch
    // get the terms of the graph:
    const { IL, B } = getTerms(G);// IL (set of IRIs and Literals), B (set of BlankNodes), or rather mapping id to term.
    // IL hashes
    Object.values(IL).forEach(il => il_hash_table.setHash(il.id, hash(Buffer.from(il.id)))); // static hash based on the string of the term
    // B hashes
    Object.keys(B).forEach(b_id => {
        b_hash_table.setHash(b_id, INITIAL_BN_HASH);
        b_hash_bags[b_id] = new HashBag([INITIAL_BN_HASH]);
    });
    return { il_hash_table, b_hash_table, b_hash_bags }
}

/**
 * Get the terms of graph G.
 * @param G graph (n3 Store)
 * @returns \{ IL: { [key: string]: Term }, B: { [key: string]: Term } \}
 */
const getTerms = (G: Store) => {
    // a map from term to id
    let IL: { [key: string]: Term } = {}; // the set of IRIs and Literals { IL.id : term}
    let B: { [key: string]: Term } = {}; // the set of BlankNodes { B.id : term}
    let uniq_terms = new Set(G.getQuads(null, null, null, null).map(quad => [quad.subject, quad.predicate, quad.object]).flat()); // TODO adjust for datasets?
    uniq_terms.forEach(term => (n3Util.isBlankNode(term)) ? B[term.id] = term : IL[term.id] = term);
    return { IL, B }
}

/**
 *  NOTE from Ivan Hermanns implementation at https://github.com/iherman/canonical_rdf :
 * "A spec should clearly specify the details of this function. In this case the corresponding buffers (representing the hash values)
 * simply concatenated, but that is an arbitrary choice at this point"
 * 
 * This is my basic hack (so-called implementation)
 * 
 * @param ...data some binary data to join up and hash
 * @returns hash of input as buffer
 */
export const hashTuple = (...data: Buffer[]) => {
    return hash(Buffer.concat(data));
}

/**
 * Simply hashes some data
 * (aka produces a color)
 * 
 * @param buffer binary data to hash
 * @returns hash of input as Buffer
 */
export const hash = (buffer: Buffer) => {
    return createHash(HASH_ALGO).update(buffer).digest();
}
