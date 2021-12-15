import { Term, Store, Util as n3Util } from 'n3';
import { createHash } from 'crypto';
import HashBag from './HashBag';

const HASH_ALGO = 'md5' // TODO to be determined
const EDGE_OUT = true; // TODO to be determined
const EDGE_IN = false; // TODO to be determined

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
 * @returns an Object `B_ids_to_hashes: { [key: string]: string }`
*/
export const hashBNodes = (G: Store) => {
    // <p1>
    // a map from term to id
    let IL: { [key: string]: Term }; // the set of IRIs and Literals { IL.id : term}
    let B: { [key: string]: Term }; // the set of BlankNodes { B.id : term}
    let uniq_terms = new Set(G.getQuads(null, null, null, null).map(quad => [quad.subject, quad.predicate, quad.object, quad.graph]).flat());
    uniq_terms.forEach(term => {
        if (n3Util.isBlankNode(term)) {
            B[term.id] = term;
        } else {
            IL[term.id] = term;
        }
    });
    uniq_terms = undefined; // throw away terms set
    // a map from terms to hashes // TODO split between B and IL
    const IL_ids_to_hashes: { [key: string]: string } = {}; // { IL.id : hashvalue} aka a `hash partition` although not quite, it is actually the inverse
    const B_ids_to_hashes: { [key: string]: string } = {}; // { B.id : hashvalue} aka a `hash partition` although not quite, it is actually the inverse
    const B_HashBags: { [key: string]: HashBag } = {}; // {B.id : HashBag Obj}
    Object.values(IL).forEach(il => IL_ids_to_hashes[il.id] = hashString(il.id)); // static hash based on the string of the term
    Object.values(B).forEach(b => { B_ids_to_hashes[b.id] = "0"; B_HashBags[b.id] = new HashBag(["0"]); }); // initial hash
    // </p1>
    // <p2>
    // let i = 0
    let B_ids_to_hashes_prev: { [key: string]: string }; // { term.id : hashvalue} aka a `hash partition` of the previous iteration
    do {
        // i++;
        B_ids_to_hashes_prev = B_ids_to_hashes;
        // for (b, p, o) ∈ G : b ∈ B do
        Object.values(B).forEach(b => {
            G.getQuads(b, null, null, null).sort().forEach(quad => { // TODO adjust for datasets : blank nodes are scoped within the graph...
                const o_hash = (n3Util.isBlankNode(quad.object)) ? B_ids_to_hashes_prev[quad.object.id] : IL_ids_to_hashes[quad.object.id]
                const p_hash = IL_ids_to_hashes[quad.predicate.id]
                const c = hashTuple(o_hash, p_hash, EDGE_OUT);
                // B_ids_to_hashes[b.id] = hashBag(c, B_ids_to_hashes[b.id]); // (footnote 1)
                B_HashBags[b.id].add(c); // (footnote 1)
            })
            // })
            // for (s, p, b) ∈ G : b ∈ B do
            // Object.values(B).forEach(b => {
            G.getQuads(null, null, b, null).sort().forEach(quad => { // TODO adjust for datasets : blank nodes are scoped within the graph...
                const s_hash = (n3Util.isBlankNode(quad.subject)) ? B_ids_to_hashes_prev[quad.subject.id] : IL_ids_to_hashes[quad.subject.id]
                const p_hash = IL_ids_to_hashes[quad.predicate.id]
                const c = hashTuple(s_hash, p_hash, EDGE_IN);
                // B_ids_to_hashes[b.id] = hashBag(c, B_ids_to_hashes[b.id]); // (footnote 1)
                B_HashBags[b.id].add(c); // (footnote 1)
            })

            // (footnote 1) 
            // in order to create a commutative and associative hash, we need an accumulator `HashBag` for each blanknode
            // (it is not possible to calculate a hash in such way in an iterative manner as it may appear from the listing in the paper)
            B_ids_to_hashes[b.id] = B_HashBags[b.id].value();
        })
        // </p2>
        // <p3>
        // until (∀x , y : hash_i [x] = hash_i [y] iff hash_{i−1}[x ] = hash_{i−1}[y]) or (∀x , y : hash_i [x ] = hash_i [y] iff x = y)
    } while (isStableHashPartition(B_ids_to_hashes, B_ids_to_hashes_prev));
    // </p3>
    return B_ids_to_hashes;
}

/**
 * Simply hashes some string s
 * (aka produces a color)
 * 
 * @param s a string to hash
 * @returns hash of s as hex string
 */
export const hashString = (s: string) => {
    return createHash(HASH_ALGO).update(s).digest('hex');
    // `${hash.digest('hex')} ${filename}`;
}

/**
 *  NOTE from Ivan Hermanns implementation at https://github.com/iherman/canonical_rdf :
 * "A spec should clearly specify the details of this function. In this case the corresponding buffers (representing the hash values)
 * simply concatenated, but that is an arbitrary choice at this point"
 * 
 * This is my basic hack (so-called implementation)
 * 
 * @param s_o_hash the hash of the subject OR the object of the triple the blank node is in
 * @param p_hash the hash of the predicate of the triple the blank node is in
 * @param is_edge_out the edge direction flag
 */
const hashTuple = (s_o_hash: string, p_hash: string, is_edge_out: boolean) => {
    return hashString(`${s_o_hash}${p_hash}${is_edge_out}`);
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
 */
const isStableHashPartition = (p: { [key: string]: string }, p_prev: { [key: string]: string }) => {
    for (const x of Object.keys(p)) {
        for (const y of Object.keys(p)) {
            // // (i) the hash-based partition of terms does not change in an iteration
            // // ∀x,y: hash_i [x] = hash_i [y] iff hash_{i−1}[x ] = hash_{i−1}[y]
            // // i.e. if in prev it x and y hashEqual then in this it they must be hashEqual as well, otherwise return false
            // // i.e. x and y should only be hashEqual if x and y were hashEqual in prev iteration otherwise return false
            // // i.e. if hash not stable
            // if ((p[x] === p[y] && p_prev[x] !== p_prev[y]) || // OR
            //     //(ii) no two terms share a hash.
            //     // ∀x,y: hash_i [x] = hash_i [y] iff x = y)
            //     // i.e. x and y should only be hashEqual if x == y otherwise return false
            //     (p[x] === p[y] && x !== y)) return false;
            if ((p[x] === p[y] && (p_prev[x] !== p_prev[y]) || x !== y)) return false;
        }
    }
    return true
}