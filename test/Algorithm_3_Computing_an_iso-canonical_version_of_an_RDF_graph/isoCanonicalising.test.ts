import { expect } from 'chai';
import { BlankNode, Literal, NamedNode, Parser, Quad, Store, Util as n3Util } from "n3";
import { isoCanonicalise } from '../../src';

import rewire from 'rewire';
import { hashBNodes } from '../../src/Algorithm_1_Deterministically_hashing_blank_nodes/hashingBNs';
import OrderedHashPartition from '../../src/Algorithm_3_Computing_an_iso-canonical_version_of_an_RDF_graph/OrderedHashPartition';
import HashTable from '../../src/Algorithm_1_Deterministically_hashing_blank_nodes/HashTable';

const isoCan_rewired = rewire('../../src/Algorithm_3_Computing_an_iso-canonical_version_of_an_RDF_graph/isoCanonicalising');
const distinguish: (G: Store, hashPartition: OrderedHashPartition, il_hash_table: HashTable, G_lowest?: Store) => Store<Quad, Quad, Quad, Quad> = isoCan_rewired.__get__('distinguish');
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
        // (If you are comparing this to iherman's implementation, differences in hashes stem from the usage of hashbag. I do reuse hashbags across iterations while hashing, iherman doesnt)
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
            '_:8366093b238e871f2a9caed52d853f3a',
            '_:e91985e34c8d5fce0436c2d9b613ebce',
            '_:5d863db9e340b106d06f45d0091885fa',
            '_:28dab46ab57827cbbaa8b8a524a49a32',
            '_:3a2d93a3adcc926fb88fddfff3bd4128',
            '_:7c555763308b1b619d5d9402f77db92a'
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

        const { b_hash_table, il_hash_table } = hashBNodes(graph);
        // console.log(b_id_to_hash) // => 8a38955e084bf72bacbffbfb583a67e3
        const hashPartition = new OrderedHashPartition(b_hash_table)

        // distinguish(G: Store, b_id_to_hash: { [key: string]: string }, hashPartition: OrderedHashPartition, G_lowest?: Store) 
        const h = distinguish(graph, hashPartition, il_hash_table)
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

