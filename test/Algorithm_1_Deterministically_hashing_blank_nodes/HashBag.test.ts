import HashBag from '../../src/Algorithm_1_Deterministically_hashing_blank_nodes/HashBag';
import { hashString } from "../../src/Algorithm_1_Deterministically_hashing_blank_nodes/hashingBNs";

test('HashBag: constructor()', () => {
    const input = ['y', 'x'];
    const current = new HashBag(input);
    const target = { _hashes: ['y', 'x'] };
    expect(current).toEqual(target);
});

test('HashBag: add()', () => {
    const input = ['y', 'x'];
    const current = new HashBag(input);
    current.add('z');
    const target = { _hashes: ['y', 'x', 'z'] };
    expect(current).toEqual(target);
});

test('HashBag: value()', () => {
    const input = ['1F', '15', 'B9'];
    const current = new HashBag(input);
    const target = hashString('151FB9');
    expect(current.value()).toEqual(target);
});