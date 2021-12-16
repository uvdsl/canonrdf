import { BlankNode, Quad, Store, Util as n3Util } from "n3";
import { hashBNodes } from "..";



/**
Page 22 of https://aidanhogan.com/docs/rdf-canonicalisation.pdf
// TODO adjust for datasets : blank nodes are scoped within the graph...

Lines in <p1>: The algorithm first calls Algorithm 1 to compute an initial set of hashes for blank nodes
(note that depending on the user’s preference, we could equivalently call Algorithm 2). The
results are used to compute an initial hash partition.

Lines in <p2>: If the initial hashes produce a fine partition, we can just label the graph according to the
initial hashes and return the result as the iso-canonical version.
 * 
 * @param G n3.Store, the graph
 */
export const isoCanonicalise = (G: Store) => {
    // <p1>
    // {b.id: hex}
    const B_ids_to_hashes = hashBNodes(G) // or hashBNodesPerSplit(G)
    // convert to actual partition: compute hash partition P of bnodes(G) w.r.t. hash
    const hash_to_B_ids: { [key: string]: string[] } = {}// a so-called partition P
    const ordering: Array<string> = [] // of P, i.e. ordering of hashes where smaller index corresponds to small |B|, // initially unordered
    Object.entries(B_ids_to_hashes).forEach(([k, v]) => {
        if (hash_to_B_ids[v] === undefined) {
            hash_to_B_ids[v] = []
            ordering.push(v)
        }
        hash_to_B_ids[v].push(k)
    })

    // </p1>
    // <p2>
    /*
    We call B′ ∈ P a part of P.
    We call a part B′ trivial if |B′| = 1; otherwise we call it non-trivial. We call a partition P fine if it has
    only trivial parts, coarse if it has only one part, and intermediate if it is neither coarse nor fine.
    */
    // if P is fine then // fine if all parts of P are trivial
    // this must be the case if B_ids_to_hashes and hash_to_B_ids have the same length.
    // B_ids_to_hashes has size of all blank nodes,i.e. |B|, where as hash_to_B_ids (to be fine) must have |B| entries with array length of 1.
    // hence
    if (Object.keys(B_ids_to_hashes).length === Object.keys(hash_to_B_ids).length) {
        // we are done: generate blank node labels from hash
        return relabel(G, B_ids_to_hashes);
    }
    // </p2>
    // distinguish
    // TODO
}


/**
 * Relabels the blank nodes of G according to the input mapping.
 * @param G n3.Store, the graph
 * @param B_id_to_hashes mapping from BlankNode id to its hash
 * @returns relabeld graph
 */
const relabel = (G: Store, B_id_to_hashes: { [key: string]: string }) => {
    return new Store(G.getQuads(null,null,null,null).map(quad => {
        const s = (n3Util.isBlankNode(quad.subject)) ? new BlankNode(B_id_to_hashes[quad.subject.id]) : quad.subject;
        const p = quad.predicate
        const o = (n3Util.isBlankNode(quad.object)) ? new BlankNode(B_id_to_hashes[quad.object.id]) : quad.object;
        const g = quad.graph
        return new Quad(s, p, o, g)
    }))
}



