import { Quad, Store } from "n3";
import { hashBNodes } from "..";


/**
 * Page 19f. https://aidanhogan.com/docs/rdf-canonicalisation.pdf
 * 
 * First, we compute split(G) using a standard Union–Find algorithm, which runs in O(n log n)
 * worst-case for n the number of triples in G.
 * 
 * Then, the results of each split are computed by calling Algorithm 1 and unioned: two splits 
 * cannot disagree on the hash of a given term since hashes for IRIs and literals are static and
 * no blank node can appear in two splits.
 *
 * Lastly, the union of hashes for blank node splits are returned. If needed, we can also add the 
 * hashes of constants in the ground split not appearing elsewhere to align the results with 
 * Algorithm 1; however, most of the time we are only interested in the hashes of blank nodes.
 * 
 * @param G n3.Store, the graph
 * @returns an Object `B_ids_to_hashes: { [key: string]: string }`
 */
export const hashBNodesPerSplit = (G: Store) => {
    let B_ids_to_hashes: { [key: string]: string } = {};
    const G_split = split(G);
    G_split.forEach(G_i => Object.assign(B_ids_to_hashes, hashBNodes(G_i)));
    return B_ids_to_hashes;
}


/**
 * 
 * @param G n3.Store, the graph
 * @returns The blank node split of G contains a set of non-overlapping subgraphs of G, where each subgraph
 * G′ contains all and only the triples for a given group of connected blank-nodes in G. 
 */
const split = (G: Store) => {
    // TODO real UNION-FIND
    // for now just simply:
    // a array of split graphs
    const graphs: Array<Store> = []; 
    // now get individual nodes
    const quads = G.getQuads(null, null, null, null); // TODO adjust for datasets : blank nodes are scoped within the graph... ?
    const id_to_split: { [key: string]: number } = {}
    new Set(quads.map(quad => [quad.subject, quad.object]).flat()).forEach(term => {
        id_to_split[term.id] = -1
    });
    // then check for every edge which split it belongs to
    for (const quad of quads) {
        if (id_to_split[quad.subject.id] == -1 && id_to_split[quad.object.id] == -1) {
            // edge not connected to anything
            id_to_split[quad.subject.id] = graphs.length;
            id_to_split[quad.object.id] = graphs.length;
            graphs[graphs.length] = new Store([quad]);
            continue
        }
        if (id_to_split[quad.subject.id] != -1 && id_to_split[quad.object.id] == -1) {
            // subject connected to something
            id_to_split[quad.object.id] = id_to_split[quad.subject.id]
            graphs[id_to_split[quad.subject.id]].addQuad(quad)
            continue
        }
        if (id_to_split[quad.subject.id] == -1 && id_to_split[quad.object.id] != -1) {
            // object connected to something
            id_to_split[quad.subject.id] = id_to_split[quad.object.id]
            graphs[id_to_split[quad.object.id]].addQuad(quad)
            continue
        }
        // if (id_to_split[quad.subject.id] != -1 && id_to_split[quad.object.id] != -1) {
        // both connected to something
        graphs[id_to_split[quad.subject.id]].addQuad(quad) // for simplicity: just add to subject split
        if (id_to_split[quad.subject.id] === id_to_split[quad.object.id]) {
            // if both nodes were in the same split => double edge
            continue
        }
        // nodes were in different splits
        // merge the graph of object into the subject graph
        const tmp_quads = graphs[id_to_split[quad.object.id]].getQuads(null, null, null, null);
        new Set(tmp_quads.map(quad => [quad.subject, quad.object]).flat()).forEach(term => {
            id_to_split[term.id] = id_to_split[quad.subject.id];
        });
        graphs[id_to_split[quad.subject.id]].addQuads(tmp_quads);
        // remove object graph from list
        graphs.splice(id_to_split[quad.subject.id], 1)
        // continue
        // }
    }
    return graphs;
}
