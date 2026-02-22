import { S as w, c as m, b as F, f as i, g as s, i as d, m as L, B as y, F as P, H as S, j as n, D as x } from "./index-BkiyCPhv.js";
import { A as v } from "./AbstractID3Parser-B9auX4Fb.js";
import "electron";
import "path";
import "fs";
import "os";
import "child_process";
import "net";
import "url";
import "crypto";
import "fs/promises";
import "zlib";
import "stream/promises";
import "stream";
import "node:fs/promises";
import "tty";
import "util";
import "./ID3v2Parser-YegnuF6d.js";
const p = m("music-metadata:parser:musepack:sv8"), C = new w(2, "latin1"), l = {
  len: 5,
  get: (a, e) => ({
    crc: i.get(a, e),
    streamVersion: F.get(a, e + 4)
  })
}, u = {
  len: 2,
  get: (a, e) => ({
    sampleFrequency: [44100, 48e3, 37800, 32e3][s(a, e, 0, 3)],
    maxUsedBands: s(a, e, 3, 5),
    channelCount: s(a, e + 1, 0, 4) + 1,
    msUsed: d(a, e + 1, 4),
    audioBlockFrames: s(a, e + 1, 5, 3)
  })
};
class M {
  get tokenizer() {
    return this._tokenizer;
  }
  set tokenizer(e) {
    this._tokenizer = e;
  }
  constructor(e) {
    this._tokenizer = e;
  }
  async readPacketHeader() {
    const e = await this.tokenizer.readToken(C), t = await this.readVariableSizeField();
    return {
      key: e,
      payloadLength: t.value - 2 - t.len
    };
  }
  async readStreamHeader(e) {
    const t = {};
    p(`Reading SH at offset=${this.tokenizer.position}`);
    const r = await this.tokenizer.readToken(l);
    e -= l.len, Object.assign(t, r), p(`SH.streamVersion = ${r.streamVersion}`);
    const o = await this.readVariableSizeField();
    e -= o.len, t.sampleCount = o.value;
    const c = await this.readVariableSizeField();
    e -= c.len, t.beginningOfSilence = c.value;
    const z = await this.tokenizer.readToken(u);
    return e -= u.len, Object.assign(t, z), await this.tokenizer.ignore(e), t;
  }
  async readVariableSizeField(e = 1, t = 0) {
    let r = await this.tokenizer.readNumber(F);
    return r & 128 ? (r &= 127, r += t, this.readVariableSizeField(e + 1, r << 7)) : { len: e, value: t + r };
  }
}
class h extends L("Musepack") {
}
const T = m("music-metadata:parser:musepack");
class V extends y {
  constructor() {
    super(...arguments), this.audioLength = 0;
  }
  async parse() {
    if (await this.tokenizer.readToken(P) !== "MPCK")
      throw new h("Invalid Magic number");
    return this.metadata.setFormat("container", "Musepack, SV8"), this.parsePacket();
  }
  async parsePacket() {
    const e = new M(this.tokenizer);
    do {
      const t = await e.readPacketHeader();
      switch (T(`packet-header key=${t.key}, payloadLength=${t.payloadLength}`), t.key) {
        case "SH": {
          const r = await e.readStreamHeader(t.payloadLength);
          this.metadata.setFormat("numberOfSamples", r.sampleCount), this.metadata.setFormat("sampleRate", r.sampleFrequency), this.metadata.setFormat("duration", r.sampleCount / r.sampleFrequency), this.metadata.setFormat("numberOfChannels", r.channelCount);
          break;
        }
        case "AP":
          this.audioLength += t.payloadLength, await this.tokenizer.ignore(t.payloadLength);
          break;
        case "RG":
        case "EI":
        case "SO":
        case "ST":
        case "CT":
          await this.tokenizer.ignore(t.payloadLength);
          break;
        case "SE":
          return this.metadata.format.duration && this.metadata.setFormat("bitrate", this.audioLength * 8 / this.metadata.format.duration), S(this.metadata, this.tokenizer, this.options);
        default:
          throw new h(`Unexpected header: ${t.key}`);
      }
    } while (!0);
  }
}
class b {
  constructor(e) {
    this.pos = 0, this.dword = null, this.tokenizer = e;
  }
  /**
   *
   * @param bits 1..30 bits
   */
  async read(e) {
    for (; this.dword === null; )
      this.dword = await this.tokenizer.readToken(i);
    let t = this.dword;
    return this.pos += e, this.pos < 32 ? (t >>>= 32 - this.pos, t & (1 << e) - 1) : (this.pos -= 32, this.pos === 0 ? (this.dword = null, t & (1 << e) - 1) : (this.dword = await this.tokenizer.readToken(i), this.pos && (t <<= this.pos, t |= this.dword >>> 32 - this.pos), t & (1 << e) - 1));
  }
  async ignore(e) {
    if (this.pos > 0) {
      const o = 32 - this.pos;
      this.dword = null, e -= o, this.pos = 0;
    }
    const t = e % 32, r = (e - t) / 32;
    return await this.tokenizer.ignore(r * 4), this.read(t);
  }
}
const H = {
  len: 6 * 4,
  get: (a, e) => {
    const t = {
      // word 0
      signature: x(a.subarray(e, e + 3), "latin1"),
      // versionIndex number * 1000 (3.81 = 3810) (remember that 4-byte alignment causes this to take 4-bytes)
      streamMinorVersion: s(a, e + 3, 0, 4),
      streamMajorVersion: s(a, e + 3, 4, 4),
      // word 1
      frameCount: i.get(a, e + 4),
      // word 2
      maxLevel: n.get(a, e + 8),
      sampleFrequency: [44100, 48e3, 37800, 32e3][s(a, e + 10, 0, 2)],
      link: s(a, e + 10, 2, 2),
      profile: s(a, e + 10, 4, 4),
      maxBand: s(a, e + 11, 0, 6),
      intensityStereo: d(a, e + 11, 6),
      midSideStereo: d(a, e + 11, 7),
      // word 3
      titlePeak: n.get(a, e + 12),
      titleGain: n.get(a, e + 14),
      // word 4
      albumPeak: n.get(a, e + 16),
      albumGain: n.get(a, e + 18),
      // word
      lastFrameLength: i.get(a, e + 20) >>> 20 & 2047,
      trueGapless: d(a, e + 23, 0)
    };
    return t.lastFrameLength = t.trueGapless ? i.get(a, 20) >>> 20 & 2047 : 0, t;
  }
}, k = m("music-metadata:parser:musepack");
class O extends y {
  constructor() {
    super(...arguments), this.bitreader = null, this.audioLength = 0, this.duration = null;
  }
  async parse() {
    const e = await this.tokenizer.readToken(H);
    if (e.signature !== "MP+")
      throw new h("Unexpected magic number");
    k(`stream-version=${e.streamMajorVersion}.${e.streamMinorVersion}`), this.metadata.setFormat("container", "Musepack, SV7"), this.metadata.setFormat("sampleRate", e.sampleFrequency);
    const t = 1152 * (e.frameCount - 1) + e.lastFrameLength;
    this.metadata.setFormat("numberOfSamples", t), this.duration = t / e.sampleFrequency, this.metadata.setFormat("duration", this.duration), this.bitreader = new b(this.tokenizer), this.metadata.setFormat("numberOfChannels", e.midSideStereo || e.intensityStereo ? 2 : 1);
    const r = await this.bitreader.read(8);
    return this.metadata.setFormat("codec", (r / 100).toFixed(2)), await this.skipAudioData(e.frameCount), k(`End of audio stream, switching to APEv2, offset=${this.tokenizer.position}`), S(this.metadata, this.tokenizer, this.options);
  }
  async skipAudioData(e) {
    for (; e-- > 0; ) {
      const r = await this.bitreader.read(20);
      this.audioLength += 20 + r, await this.bitreader.ignore(r);
    }
    const t = await this.bitreader.read(11);
    this.audioLength += t, this.duration !== null && this.metadata.setFormat("bitrate", this.audioLength / this.duration);
  }
}
const g = m("music-metadata:parser:musepack");
class Y extends v {
  async postId3v2Parse() {
    const e = await this.tokenizer.peekToken(new w(3, "latin1"));
    let t;
    switch (e) {
      case "MP+": {
        g("Stream-version 7"), t = new O(this.metadata, this.tokenizer, this.options);
        break;
      }
      case "MPC": {
        g("Stream-version 8"), t = new V(this.metadata, this.tokenizer, this.options);
        break;
      }
      default:
        throw new h("Invalid signature prefix");
    }
    return this.metadata.setAudioOnly(), t.parse();
  }
}
export {
  Y as MusepackParser
};
