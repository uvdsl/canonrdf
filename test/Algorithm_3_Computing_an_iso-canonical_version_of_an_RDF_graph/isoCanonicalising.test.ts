import { expect } from 'chai';
import { BlankNode, Literal, NamedNode, Parser, Quad, Store, Util as n3Util } from "n3";
import { isoCanonicalise } from '../../src';

import rewire from 'rewire';
import { hashBNodes } from '../../src/Algorithm_1_Deterministically_hashing_blank_nodes/hashingBNs';
import OrderedHashPartition from '../../src/Algorithm_3_Computing_an_iso-canonical_version_of_an_RDF_graph/OrderedHashPartition';

const isoCan_rewired = rewire('../../src/Algorithm_3_Computing_an_iso-canonical_version_of_an_RDF_graph/isoCanonicalising');
const distinguish: (G: Store, b_id_to_hash: {
    [key: string]: Buffer;
}, hashPartition: OrderedHashPartition, G_lowest?: Store) => Store<Quad, Quad, Quad, Quad> = isoCan_rewired.__get__('distinguish');
const isLowerOrderThan: (G: Store, H: Store) => boolean = isoCan_rewired.__get__('isLowerOrderThan');



describe('isoCanonicalise()', () => {
    it('results in an emtpy blank node mapping for RDF graphs without blank nodes', () => {
        const graph = new Store([new Quad(new NamedNode('#s'), new NamedNode('#p'), new Literal('"o"'))]);
        const target = new Store(graph.getQuads(null, null, null, null));
        const current = isoCanonicalise(graph);
        expect(current).to.deep.equal(target);
    });
    it('results in a relabeled graph ', () => {
        const graph = new Store([
            new Quad(new BlankNode('bn'), new NamedNode('#p'), new Literal('"o"')),
            new Quad(new NamedNode('#s'), new NamedNode('#p'), new BlankNode('bn')),
        ]);
        const target = new Store([ // hash used from hashBNs test cases
            new Quad(new BlankNode('ee150da78d2b58fb4e40af496ed70ba5'), new NamedNode('#p'), new Literal('"o"')),
            new Quad(new NamedNode('#s'), new NamedNode('#p'), new BlankNode('ee150da78d2b58fb4e40af496ed70ba5')),
        ]);
        const current = isoCanonicalise(graph);
        expect(current).to.deep.equal(target);
    })
    it('results in a relabeld graph after distinguish', () => {
        // (Note: this is not ground truth/gold standard, I have no idea if the hashing was correct, but I assume so)
        const data = `
             _:a <p> _:b .
				_:b <p> _:c .
				_:c <p> _:a .
				_:x <p> _:y .
				_:y <p> _:z .
				_:z <p> _:x .
				<u> <p> <v> .
`
        const input = new Store();
        const parser = new Parser();
        const quads = parser.parse(data)
        input.addQuads(quads);
        const target = new Set([
            '_:467fc2816420be45ed00d5f65d8cd2b3',
            '_:ad33dde6cf23e0119c1d67465a4f75cd',
            '_:4d9962d5335797a88e52079a0a82653f',
            '_:a64690185d4edab5a3aa2c287b3a16f7',
            '_:6338ab136028b2b9c87943108f09c1c8',
            '_:597a342f8f77fe3e61450d25238a35ed'
        ]);
        const h = isoCanonicalise(input);
        const current = new Set(h.getQuads(null, null, null, null).map(quad => {
            const result = []
            if (n3Util.isBlankNode(quad.subject)) result.push(quad.subject.id)
            if (n3Util.isBlankNode(quad.object)) result.push(quad.object.id)
            return result
        }).flat())
        expect(current).to.deep.equal(target);
    })

});

describe('distinguish()', () => {
    it('results in a unique hash label for each blank node', () => {
        const data =
            `   _:a <p> _:b .
            _:b <p> _:c .
            _:c <p> _:a .
            _:x <p> _:y .
            _:y <p> _:z .
            _:z <p> _:x .
            <u> <p> <v> .
        `
        const graph = new Store();
        const parser = new Parser({ format: 'turtle*' });
        const quads = parser.parse(data)
        graph.addQuads(quads);

        const b_id_to_hash = hashBNodes(graph);
        // console.log(b_id_to_hash) // => 6125229b7e32f569124d2aa34e6a299a
        const hashPartition = new OrderedHashPartition(b_id_to_hash)

        // distinguish(G: Store, b_id_to_hash: { [key: string]: string }, hashPartition: OrderedHashPartition, G_lowest?: Store) 
        const h = distinguish(graph, b_id_to_hash, hashPartition)
        const c = new Set(h.getQuads(null, null, null, null).map(quad => {
            const result = []
            if (n3Util.isBlankNode(quad.subject)) result.push(quad.subject.id)
            if (n3Util.isBlankNode(quad.object)) result.push(quad.object.id)
            return result
        }).flat())
        const current = c.size
        const target = 6

        expect(current).to.equal(target);
    });
});


describe('isLowerOrderThan()', () => {
    it('returns `true` if G is a true subgraph of H', () => {
        const G = new Store([
            new Quad(new NamedNode('#s'), new NamedNode('#p'), new Literal("o"))
        ]);
        const H = new Store([
            new Quad(new NamedNode('#s'), new NamedNode('#p'), new Literal("o")),
            new Quad(new NamedNode('#s'), new NamedNode('#p'), new Literal("n"))
        ]);
        expect(isLowerOrderThan(G, H)).to.be.true;
    });
    it('returns `false` if G is eq to H', () => {
        const G = new Store([
            new Quad(new NamedNode('#s'), new NamedNode('#p'), new Literal("o"))
        ]);
        const H = new Store([
            new Quad(new NamedNode('#s'), new NamedNode('#p'), new Literal("o"))
        ]);
        expect(isLowerOrderThan(G, H)).to.be.false;
    });
    it('returns `false` if H is a true subgraph of G', () => {
        const G = new Store([
            new Quad(new NamedNode('#s'), new NamedNode('#p'), new Literal("o")),
            new Quad(new NamedNode('#s'), new NamedNode('#p'), new Literal("n"))
        ]);
        const H = new Store([
            new Quad(new NamedNode('#s'), new NamedNode('#p'), new Literal("o"))
        ]);
        expect(isLowerOrderThan(G, H)).to.be.false;
    });
    it('returns `false` if G\\H is not lexigraphic smaller than H\\G', () => {
        const G = new Store([
            new Quad(new NamedNode('#s'), new NamedNode('#p'), new Literal("o"))
        ]);
        const H = new Store([
            new Quad(new NamedNode('#s'), new NamedNode('#p'), new Literal("n"))
        ]);
        expect(isLowerOrderThan(G, H)).to.be.false;
    });
    it('returns `true` if G\\H is lexigraphic smaller than H\\G', () => {
        const G = new Store([
            new Quad(new NamedNode('#s'), new NamedNode('#p'), new Literal("o"))
        ]);
        const H = new Store([
            new Quad(new NamedNode('#s'), new NamedNode('#p'), new Literal("p"))
        ]);
        expect(isLowerOrderThan(G, H)).to.be.true;
    });
});

