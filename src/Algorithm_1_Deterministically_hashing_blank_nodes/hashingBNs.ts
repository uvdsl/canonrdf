import { Term, Store, Util as n3Util } from 'n3';
import { createHash } from 'crypto';
import HashBag from './HashBag';

const HASH_ALGO = 'md5' // TODO to be determined
const EDGE_OUT = '+'; // TODO to be determined
const EDGE_IN = '-'; // TODO to be determined
const INITIAL_BN_HASH = '0' // TODO to be determined

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
export const hashBNodes = (G: Store, initialisedBlankNodeHashes?: { [key: string]: string }) => {
    // <p1>
    // a map from term to id
    let IL: { [key: string]: Term } = {}; // the set of IRIs and Literals { IL.id : term}
    let B: { [key: string]: Term } = {}; // the set of BlankNodes { B.id : term}
    let uniq_terms = new Set(G.getQuads(null, null, null, null).map(quad => [quad.subject, quad.predicate, quad.object]).flat()); // TODO adjust for datasets?
    uniq_terms.forEach(term => {
        if (n3Util.isBlankNode(term)) {
            B[term.id] = term;
        } else {
            IL[term.id] = term;
        }
    });
    if (Object.keys(B).length == 0) return {}; // if there is no blank nodes. stop.
    uniq_terms = undefined; // throw away terms set
    // a map from terms to hashes 
    const il_id_to_hash: { [key: string]: string } = {}; // { IL.id : hashvalue} aka a `hash table` although not quite, IL do not need a second dim
    Object.values(IL).forEach(il => il_id_to_hash[il.id] = hashString(il.id)); // static hash based on the string of the term

    // START allow for init of blank node hashes as necessary for algo 3
    let b_id_to_hash: { [key: string]: string } = {}; // { B.id : hashvalue} aka a  `hash table` although not quite, the second dimension is only created later
    const B_HashBags: { [key: string]: HashBag } = {}; // {B.id : HashBag Obj}
    if (initialisedBlankNodeHashes === undefined) {
        Object.values(B).forEach(b => { b_id_to_hash[b.id] = INITIAL_BN_HASH; B_HashBags[b.id] = new HashBag([INITIAL_BN_HASH]); }); // initial hash
    } else {
        b_id_to_hash = initialisedBlankNodeHashes;
        // TODO Question: are hashbags getting reused as well?
        Object.values(B).forEach(b => B_HashBags[b.id] = new HashBag([b_id_to_hash[b.id]])); // initial hash
    }
    //END allow for init of blank node hashes as necessary for algo 3
    // </p1>
    // <p2>
    // let i = 0
    let B_ids_to_hashes_prev: { [key: string]: string }; // { term.id : hashvalue} aka a `hash partition` of the previous iteration
    do {
        // i++;
        B_ids_to_hashes_prev = b_id_to_hash;
        // for (b, p, o) ∈ G : b ∈ B do
        Object.values(B).forEach(b => {
            G.getQuads(b, null, null, null).sort().forEach(quad => { // TODO sorting // TODO adjust for datasets : blank nodes are scoped within the graph...
                const o_hash = (n3Util.isBlankNode(quad.object)) ? B_ids_to_hashes_prev[quad.object.id] : il_id_to_hash[quad.object.id]
                const p_hash = il_id_to_hash[quad.predicate.id]
                const c = hashTuple(o_hash, p_hash, EDGE_OUT);
                // B_ids_to_hashes[b.id] = hashBag(c, B_ids_to_hashes[b.id]); // (footnote 1)
                B_HashBags[b.id].add(c); // (footnote 1)
            })
            // })
            // for (s, p, b) ∈ G : b ∈ B do
            // Object.values(B).forEach(b => {
            G.getQuads(null, null, b, null).sort().forEach(quad => { // TODO sorting // TODO adjust for datasets : blank nodes are scoped within the graph...
                const s_hash = (n3Util.isBlankNode(quad.subject)) ? B_ids_to_hashes_prev[quad.subject.id] : il_id_to_hash[quad.subject.id]
                const p_hash = il_id_to_hash[quad.predicate.id]
                const c = hashTuple(s_hash, p_hash, EDGE_IN);
                // B_ids_to_hashes[b.id] = hashBag(c, B_ids_to_hashes[b.id]); // (footnote 1)
                B_HashBags[b.id].add(c); // (footnote 1)
            })
        })
        // (footnote 1) 
        // in order to create a commutative and associative hash, we need an accumulator `HashBag` for each blanknode
        // (it is not possible to calculate a hash in such way in an iterative manner as it may appear from the listing in the paper)
        Object.keys(B).forEach(b_id => {
            b_id_to_hash[b_id] = B_HashBags[b_id].value();
        })
        // </p2>
        // <p3>
        // until (∀x , y : hash_i [x] = hash_i [y] iff hash_{i−1}[x ] = hash_{i−1}[y]) or (∀x , y : hash_i [x ] = hash_i [y] iff x = y)
    } while (!isStable(b_id_to_hash, B_ids_to_hashes_prev));
    // </p3>
    return b_id_to_hash;
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
export const hashTuple = (...data: string[]) => {
    return hashString(data.join(""));
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
const isStable = (p: { [key: string]: string }, p_prev: { [key: string]: string }) => {
    for (const x of Object.keys(p)) {
        for (const y of Object.keys(p)) {
            // // (i) the hash-based partition of terms does not change in an iteration
            // // ∀x,y: hash_i [x] = hash_i [y] iff hash_{i−1}[x ] = hash_{i−1}[y]
            // // i.e. if in prev it x and y hashEqual then in this it they must be hashEqual as well, otherwise return false
            // // i.e. x and y should only be hashEqual if x and y were hashEqual in prev iteration otherwise return false
            // // i.e. if hash not stable
            // if ((p[x] === p[y] && p_prev[x] !== p_prev[y]) && // OR -> negate to AND
            //     //(ii) no two terms share a hash.
            //     // ∀x,y: hash_i [x] = hash_i [y] iff x = y)
            //     // i.e. x and y should only be hashEqual if x == y otherwise return false
            //     (p[x] === p[y] && x !== y)) return false;
            if (p[x] === p[y] && /* iff */ (p_prev[x] !== p_prev[y] && x !== y)) return false; // NotTODO proper hash compare, should be ok.
        }
    }
    return true
}