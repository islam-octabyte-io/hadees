import { buildHadithUci, parseHadithRef, splitLastColon } from './resolve';

describe('splitLastColon', () => {
  it('returns null when there is no colon', () => {
    expect(splitLastColon('bukhari')).toBeNull();
    expect(splitLastColon('HK3')).toBeNull();
  });

  it('splits a simple parent:child pair', () => {
    expect(splitLastColon('bukhari:3')).toEqual({
      parent: 'bukhari',
      child: '3',
    });
  });

  it('splits on the LAST colon so refs nest', () => {
    // baab 5 of kitab 3 of Bukhari — the parent is itself composite.
    expect(splitLastColon('bukhari:3:5')).toEqual({
      parent: 'bukhari:3',
      child: '5',
    });
  });

  it('rejects a leading or trailing colon', () => {
    expect(splitLastColon(':5')).toBeNull();
    expect(splitLastColon('bukhari:')).toBeNull();
  });
});

describe('parseHadithRef', () => {
  it('reads a bare hadith UCI, case-insensitively', () => {
    expect(parseHadithRef('HB100')).toEqual({ kind: 'uci', uci: 'HB100' });
    expect(parseHadithRef('hb100')).toEqual({ kind: 'uci', uci: 'HB100' });
  });

  it('reads a variant UCI', () => {
    expect(parseHadithRef('HA270A')).toEqual({ kind: 'uci', uci: 'HA270A' });
  });

  it('rejects structural UCIs that look like hadith UCIs', () => {
    // HZ/HK/HY/HE/HX belong to books, kitabs, baabs, editions and texts.
    for (const id of ['HZ1', 'HK3', 'HY1', 'HE2', 'HX10100100']) {
      expect(parseHadithRef(id)).toBeNull();
    }
  });

  it('reads a book:number composite', () => {
    expect(parseHadithRef('bukhari:100')).toEqual({
      kind: 'composite',
      bookRef: 'bukhari',
      number: 100,
      subNumber: 0,
    });
  });

  it('reads a dotted variant number as a sub-number', () => {
    expect(parseHadithRef('aladab-almufarrad:270.1')).toEqual({
      kind: 'composite',
      bookRef: 'aladab-almufarrad',
      number: 270,
      subNumber: 1,
    });
  });

  it('rejects a non-numeric or unencodable child', () => {
    expect(parseHadithRef('bukhari:abc')).toBeNull();
    expect(parseHadithRef('bukhari:270.99')).toBeNull();
  });

  it('rejects garbage', () => {
    expect(parseHadithRef('nope')).toBeNull();
    expect(parseHadithRef('')).toBeNull();
  });
});

describe('buildHadithUci', () => {
  it('leaves regular hadiths numeric', () => {
    expect(buildHadithUci('HB', 100, 0)).toBe('HB100');
  });

  it('encodes sub-numbers as letters, matching hadiths_uci_check', () => {
    expect(buildHadithUci('HA', 270, 1)).toBe('HA270A');
    expect(buildHadithUci('HA', 270, 2)).toBe('HA270B');
  });

  it('round-trips with parseHadithRef', () => {
    const ref = parseHadithRef('aladab-almufarrad:270.1');
    expect(ref).not.toBeNull();
    if (ref?.kind !== 'composite') throw new Error('expected a composite ref');
    expect(buildHadithUci('HA', ref.number, ref.subNumber)).toBe('HA270A');
  });
});
