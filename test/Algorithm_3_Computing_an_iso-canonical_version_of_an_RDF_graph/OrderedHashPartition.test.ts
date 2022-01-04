import OrderedHashPartition from '../../src/Algorithm_3_Computing_an_iso-canonical_version_of_an_RDF_graph/OrderedHashPartition';
import { expect } from 'chai';
import HashTable from '../../src/Algorithm_1_Deterministically_hashing_blank_nodes/HashTable';

describe('OrderedHashPartition', () => {
    it('orders by size of partitions', () => {
        const input = {
            '-3': Buffer.from('0c', 'hex'),
            '-2': Buffer.from('0c', 'hex'),
            '-1': Buffer.from('0c', 'hex'),
            '0': Buffer.from('0a', 'hex'),
            '1': Buffer.from('0b', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const current = new OrderedHashPartition(new HashTable(input));
        const target_map = {
            '0a': ['0', '2'],
            '0b': ['1'],
            '0c': ['-3', '-2', '-1']
        }
        const target = { _b_id_to_hash: input, _hash_to_b_ids: target_map, _ordering: [Buffer.from('0b', 'hex'), Buffer.from('0a', 'hex'), Buffer.from('0c', 'hex')] }
        expect(current).to.deep.equal(target)
    });
    it('orders with hash as tie breaker', () => {
        const input = {
            '-1': Buffer.from('0d', 'hex'),
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('aaaa', 'hex'),
            '2': Buffer.from('0b', 'hex')
        }
        const current = new OrderedHashPartition(new HashTable(input));
        const target_map = {
            '0d': ['-1'],
            '0b': ['2'],
            '0c': ['0'],
            'aaaa': ['1']
        }
        const target = { _b_id_to_hash: input, _hash_to_b_ids: target_map, _ordering: [Buffer.from('0b', 'hex'), Buffer.from('0c', 'hex'), Buffer.from('0d', 'hex'), Buffer.from('aaaa', 'hex')] }
        expect(current).to.deep.equal(target)
    });
    it('returns theLowestNonTrivial()', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0b', 'hex'),
            '2': Buffer.from('0a', 'hex'),
            '3': Buffer.from('0a', 'hex'),
            '4': Buffer.from('0b', 'hex')
        }
        const target = { lowestNonTrivialHash: Buffer.from('0a', 'hex'), lowestNonTrivialBNs: ['2', '3'] }
        const p = new OrderedHashPartition(new HashTable(input));
        const current = p.getLowestNonTrivial()
        expect(current).to.deep.equal(target)
    });
    it('returns undefined for theLowestNonTrivial() when fine', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0b', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const target = undefined
        const p = new OrderedHashPartition(new HashTable(input));
        const current = p.getLowestNonTrivial()
        expect(current).to.equal(target)
    });
});