import { BlankNode, Quad, Store, Util as n3Util } from "n3";
import { hashBNodes } from "..";
import { hashTuple } from "../Algorithm_1_Deterministically_hashing_blank_nodes/hashingBNs";
import OrderedHashPartition from "./OrderedHashPartition";

const MARKER = '@';

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
    const b_id_to_hash = hashBNodes(G) // or hashBNodesPerSplit(G)
    const hashPartition = new OrderedHashPartition(b_id_to_hash)
    // </p1>
    // <p2>
    if (hashPartition.isFine()) {
        // we are done: generate blank node labels from hash
        return relabel(G, b_id_to_hash);
    }
    // </p2>
    // distinguish
    return distinguish(G, b_id_to_hash, hashPartition);
}


/**
 * Relabels the blank nodes of G according to the input mapping.
 * @param G n3.Store, the graph
 * @param B_id_to_hashes mapping from BlankNode id to its hash
 * @returns relabeld graph
 */
const relabel = (G: Store, b_id_to_hash: { [key: string]: string }) => {
    return new Store(G.getQuads(null, null, null, null).map(quad => {
        const s = (n3Util.isBlankNode(quad.subject)) ? new BlankNode(b_id_to_hash[quad.subject.id]) : quad.subject;
        const p = quad.predicate
        const o = (n3Util.isBlankNode(quad.object)) ? new BlankNode(b_id_to_hash[quad.object.id]) : quad.object;
        const g = quad.graph
        return new Quad(s, p, o, g)
    }))
}


/**
 * 
 * The algorithm first orders the partition and then selects the lowest non-trivial part.
For each blank node in this part, the algorithm first marks the blank node with a new hash
and then calls Algorithm 1 initialised with the intermediate hashes. Based on the results of
this call, a new partition is computed and ordered.

f the new partition is fine, then the algorithm labels the blank nodes in G according
to the hashes, and checks to see if the resulting graph is lower than the lowest that has been
found before; if so, it is set as the lowest.

If the new partition is not fine, blank nodes in the lowest non-trivial part will be distin-
guished recursively.
 * 
 * @param G 
 * @param b_id_to_hash 
 * @param hashPartition 
 * @param G_lowest 
 * @returns 
 */
const distinguish = (G: Store, b_id_to_hash: { [key: string]: string }, hashPartition: OrderedHashPartition, G_lowest: Store = undefined) => {
    // hashPartition is already ordered.
    const lowestNonTrivialPart = hashPartition.getLowestNonTrivial()
    for (const b_id of lowestNonTrivialPart) {
        const b_id_to_hash_tick = Object.assign({}, b_id_to_hash)
        b_id_to_hash_tick[b_id] = hashTuple(b_id_to_hash_tick[b_id], MARKER)
        const b_id_to_hash_double_tick = hashBNodes(G, b_id_to_hash_tick) // or hashBNodesPerSplit(G) // TODO allow for initialisation of hash values
        const hashPartition_tick = new OrderedHashPartition(b_id_to_hash_double_tick)
        if (hashPartition_tick.isFine()) {
            const G_c = relabel(G, b_id_to_hash_double_tick)
            if (G_lowest === undefined || compareOrder(G_c, G_lowest)) {
                G_lowest = G_c
            } else {
                G_lowest = distinguish(G, b_id_to_hash_double_tick, hashPartition_tick, G_lowest)
            }
        }
    }
    return G_lowest
}


/**
 *  
 * @param G 
 * @returns 
 */
const compareOrder = (G: Store, H: Store) => {
    // TODO what is the meaning of "lowest graph" what is the order thing?
    return G.size < H.size // maybe? fore easy?
}