import { BlankNode, Quad, Store, Util as n3Util } from "n3";
import { hashTuple, hashBNodes } from "../Algorithm_1_Deterministically_hashing_blank_nodes/hashingBNs";
import HashTable from "../Algorithm_1_Deterministically_hashing_blank_nodes/HashTable";
import { MARKER } from "../constants";
import OrderedHashPartition from "./OrderedHashPartition";

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
    const { b_hash_table, il_hash_table } = hashBNodes(G) // or hashBNodesPerSplit(G)
    // </p1>
    // <p2>
    if (b_hash_table.isFine()) {
        // we are done: generate blank node labels from hash
        return relabel(G, b_hash_table);
    }
    // </p2>
    // distinguish
    const orderedHashPartition = new OrderedHashPartition(b_hash_table)
    return distinguish(G, orderedHashPartition, il_hash_table);
}


/**
 * Relabels the blank nodes of G according to the input mapping.
 * @param G n3.Store, the graph
 * @param b_hash_table {@link HashTable}
 * @returns relabeld graph
 */
const relabel = (G: Store, b_hash_table: HashTable) => {
    return new Store(G.getQuads(null, null, null, null).map(quad => {
        const s = (n3Util.isBlankNode(quad.subject)) ? new BlankNode(b_hash_table.getHash(quad.subject.id).toString('hex')) : quad.subject;
        const p = quad.predicate
        const o = (n3Util.isBlankNode(quad.object)) ? new BlankNode(b_hash_table.getHash(quad.object.id).toString('hex')) : quad.object;
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
const distinguish = (G: Store, hashPartition: OrderedHashPartition, il_hash_table: HashTable, G_lowest?: Store) => {
    // hashPartition is already ordered.
    const { lowestNonTrivialBNs } = hashPartition.getLowestNonTrivial()
    for (const b_id of lowestNonTrivialBNs) {
        const hash_table_prime = hashPartition.clone() //clone
        hash_table_prime.setHash(b_id, hashTuple(hash_table_prime.getHash(b_id), MARKER))
        const { b_hash_table: hash_table_double_prime } = hashBNodes(G, { b_hash_table: hash_table_prime, il_hash_table }) // or hashBNodesPerSplit(G)
        const hashPartition_prime = new OrderedHashPartition(hash_table_double_prime)
        if (hashPartition_prime.isFine()) {
            const G_c = relabel(G, hash_table_double_prime)
            if (G_lowest === undefined || isLowerOrderThan(G_c, G_lowest)) {
                G_lowest = G_c
            }
        } else {
            G_lowest = distinguish(G, hashPartition_prime, il_hash_table, G_lowest)
        }
    }
    return G_lowest
}

// TODO Question to Aidan, ordering??
/**
 *  
 * @param G 
 * @param H
 * @returns true if G lower order than H
 */
const isLowerOrderThan = (G: Store, H: Store) => {
    const GQuads = G.getQuads(null, null, null, null);
    const HQuads = H.getQuads(null, null, null, null);
    const GwoH = GQuads.filter(q => !H.has(q));
    const HwoG = HQuads.filter(q => !G.has(q));

    if (GwoH.length == 0 && !(HwoG.length == 0)) return true // G sub H
    if (GwoH.length == 0 && HwoG.length == 0) return false // G eq H
    if (!(GwoH.length == 0) && HwoG.length == 0) return false // H sub G
    //  if (!(GwoH.length == 0) && !(HwoG.length == 0)) // neither

    for (const quad of GwoH) {
        const qlex = `${quad.subject.id}${quad.predicate.id}${quad.object.id}${quad.graph.id}`
        for (const puad of HwoG) {
            const plex = `${puad.subject.id}${puad.predicate.id}${puad.object.id}${puad.graph.id}`
            if (plex <= qlex) return false
        }
    }
    return true
}