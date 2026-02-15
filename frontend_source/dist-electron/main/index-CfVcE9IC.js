var ts = Object.defineProperty;
var rs = (r, e, t) => e in r ? ts(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var L = (r, e, t) => (rs(r, typeof e != "symbol" ? e + "" : e, t), t);
import * as is from "electron";
import { ipcMain as Ur, app as rt, net as gr } from "electron";
import z from "path";
import F from "fs";
import ci, { exec as bt } from "child_process";
import ns from "net";
import { fileURLToPath as ss } from "url";
import _t from "crypto";
import be from "fs/promises";
import { createGzip as as } from "zlib";
import { pipeline as os } from "stream/promises";
import { Readable as cs } from "stream";
import { open as ls } from "node:fs/promises";
import sn from "tty";
import us from "util";
import an from "os";
var hs = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function on(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r;
}
var cn = { exports: {} };
(function(r, e) {
  (function(t, i) {
    r.exports = i(ci, _t);
  })(hs, function(t, i) {
    return function(n) {
      function a(o) {
        if (s[o])
          return s[o].exports;
        var c = s[o] = { exports: {}, id: o, loaded: !1 };
        return n[o].call(c.exports, c, c.exports, a), c.loaded = !0, c.exports;
      }
      var s = {};
      return a.m = n, a.c = s, a.p = "", a(0);
    }([function(n, a, s) {
      n.exports = s(34);
    }, function(n, a, s) {
      var o = s(29)("wks"), c = s(33), l = s(2).Symbol, u = typeof l == "function", h = n.exports = function(d) {
        return o[d] || (o[d] = u && l[d] || (u ? l : c)("Symbol." + d));
      };
      h.store = o;
    }, function(n, a) {
      var s = n.exports = typeof window < "u" && window.Math == Math ? window : typeof self < "u" && self.Math == Math ? self : Function("return this")();
      typeof __g == "number" && (__g = s);
    }, function(n, a, s) {
      var o = s(9);
      n.exports = function(c) {
        if (!o(c))
          throw TypeError(c + " is not an object!");
        return c;
      };
    }, function(n, a, s) {
      n.exports = !s(24)(function() {
        return Object.defineProperty({}, "a", { get: function() {
          return 7;
        } }).a != 7;
      });
    }, function(n, a, s) {
      var o = s(12), c = s(17);
      n.exports = s(4) ? function(l, u, h) {
        return o.f(l, u, c(1, h));
      } : function(l, u, h) {
        return l[u] = h, l;
      };
    }, function(n, a) {
      var s = n.exports = { version: "2.4.0" };
      typeof __e == "number" && (__e = s);
    }, function(n, a, s) {
      var o = s(14);
      n.exports = function(c, l, u) {
        if (o(c), l === void 0)
          return c;
        switch (u) {
          case 1:
            return function(h) {
              return c.call(l, h);
            };
          case 2:
            return function(h, d) {
              return c.call(l, h, d);
            };
          case 3:
            return function(h, d, f) {
              return c.call(l, h, d, f);
            };
        }
        return function() {
          return c.apply(l, arguments);
        };
      };
    }, function(n, a) {
      var s = {}.hasOwnProperty;
      n.exports = function(o, c) {
        return s.call(o, c);
      };
    }, function(n, a) {
      n.exports = function(s) {
        return typeof s == "object" ? s !== null : typeof s == "function";
      };
    }, function(n, a) {
      n.exports = {};
    }, function(n, a) {
      var s = {}.toString;
      n.exports = function(o) {
        return s.call(o).slice(8, -1);
      };
    }, function(n, a, s) {
      var o = s(3), c = s(26), l = s(32), u = Object.defineProperty;
      a.f = s(4) ? Object.defineProperty : function(h, d, f) {
        if (o(h), d = l(d, !0), o(f), c)
          try {
            return u(h, d, f);
          } catch {
          }
        if ("get" in f || "set" in f)
          throw TypeError("Accessors not supported!");
        return "value" in f && (h[d] = f.value), h;
      };
    }, function(n, a, s) {
      var o = s(42), c = s(15);
      n.exports = function(l) {
        return o(c(l));
      };
    }, function(n, a) {
      n.exports = function(s) {
        if (typeof s != "function")
          throw TypeError(s + " is not a function!");
        return s;
      };
    }, function(n, a) {
      n.exports = function(s) {
        if (s == null)
          throw TypeError("Can't call method on  " + s);
        return s;
      };
    }, function(n, a, s) {
      var o = s(9), c = s(2).document, l = o(c) && o(c.createElement);
      n.exports = function(u) {
        return l ? c.createElement(u) : {};
      };
    }, function(n, a) {
      n.exports = function(s, o) {
        return { enumerable: !(1 & s), configurable: !(2 & s), writable: !(4 & s), value: o };
      };
    }, function(n, a, s) {
      var o = s(12).f, c = s(8), l = s(1)("toStringTag");
      n.exports = function(u, h, d) {
        u && !c(u = d ? u : u.prototype, l) && o(u, l, { configurable: !0, value: h });
      };
    }, function(n, a, s) {
      var o = s(29)("keys"), c = s(33);
      n.exports = function(l) {
        return o[l] || (o[l] = c(l));
      };
    }, function(n, a) {
      var s = Math.ceil, o = Math.floor;
      n.exports = function(c) {
        return isNaN(c = +c) ? 0 : (c > 0 ? o : s)(c);
      };
    }, function(n, a, s) {
      var o = s(11), c = s(1)("toStringTag"), l = o(/* @__PURE__ */ function() {
        return arguments;
      }()) == "Arguments", u = function(h, d) {
        try {
          return h[d];
        } catch {
        }
      };
      n.exports = function(h) {
        var d, f, p;
        return h === void 0 ? "Undefined" : h === null ? "Null" : typeof (f = u(d = Object(h), c)) == "string" ? f : l ? o(d) : (p = o(d)) == "Object" && typeof d.callee == "function" ? "Arguments" : p;
      };
    }, function(n, a) {
      n.exports = "constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf".split(",");
    }, function(n, a, s) {
      var o = s(2), c = s(6), l = s(7), u = s(5), h = "prototype", d = function(f, p, m) {
        var g, y, w, v = f & d.F, x = f & d.G, S = f & d.S, E = f & d.P, O = f & d.B, k = f & d.W, U = x ? c : c[p] || (c[p] = {}), j = U[h], G = x ? o : S ? o[p] : (o[p] || {})[h];
        x && (m = p);
        for (g in m)
          y = !v && G && G[g] !== void 0, y && g in U || (w = y ? G[g] : m[g], U[g] = x && typeof G[g] != "function" ? m[g] : O && y ? l(w, o) : k && G[g] == w ? function(Y) {
            var ce = function(le, ee, ye) {
              if (this instanceof Y) {
                switch (arguments.length) {
                  case 0:
                    return new Y();
                  case 1:
                    return new Y(le);
                  case 2:
                    return new Y(le, ee);
                }
                return new Y(le, ee, ye);
              }
              return Y.apply(this, arguments);
            };
            return ce[h] = Y[h], ce;
          }(w) : E && typeof w == "function" ? l(Function.call, w) : w, E && ((U.virtual || (U.virtual = {}))[g] = w, f & d.R && j && !j[g] && u(j, g, w)));
      };
      d.F = 1, d.G = 2, d.S = 4, d.P = 8, d.B = 16, d.W = 32, d.U = 64, d.R = 128, n.exports = d;
    }, function(n, a) {
      n.exports = function(s) {
        try {
          return !!s();
        } catch {
          return !0;
        }
      };
    }, function(n, a, s) {
      n.exports = s(2).document && document.documentElement;
    }, function(n, a, s) {
      n.exports = !s(4) && !s(24)(function() {
        return Object.defineProperty(s(16)("div"), "a", { get: function() {
          return 7;
        } }).a != 7;
      });
    }, function(n, a, s) {
      var o = s(28), c = s(23), l = s(57), u = s(5), h = s(8), d = s(10), f = s(45), p = s(18), m = s(52), g = s(1)("iterator"), y = !([].keys && "next" in [].keys()), w = "@@iterator", v = "keys", x = "values", S = function() {
        return this;
      };
      n.exports = function(E, O, k, U, j, G, Y) {
        f(k, O, U);
        var ce, le, ee, ye = function(T) {
          if (!y && T in te)
            return te[T];
          switch (T) {
            case v:
              return function() {
                return new k(this, T);
              };
            case x:
              return function() {
                return new k(this, T);
              };
          }
          return function() {
            return new k(this, T);
          };
        }, qe = O + " Iterator", Oe = j == x, ct = !1, te = E.prototype, ke = te[g] || te[w] || j && te[j], ie = ke || ye(j), lt = j ? Oe ? ye("entries") : ie : void 0, b = O == "Array" && te.entries || ke;
        if (b && (ee = m(b.call(new E())), ee !== Object.prototype && (p(ee, qe, !0), o || h(ee, g) || u(ee, g, S))), Oe && ke && ke.name !== x && (ct = !0, ie = function() {
          return ke.call(this);
        }), o && !Y || !y && !ct && te[g] || u(te, g, ie), d[O] = ie, d[qe] = S, j)
          if (ce = { values: Oe ? ie : ye(x), keys: G ? ie : ye(v), entries: lt }, Y)
            for (le in ce)
              le in te || l(te, le, ce[le]);
          else
            c(c.P + c.F * (y || ct), O, ce);
        return ce;
      };
    }, function(n, a) {
      n.exports = !0;
    }, function(n, a, s) {
      var o = s(2), c = "__core-js_shared__", l = o[c] || (o[c] = {});
      n.exports = function(u) {
        return l[u] || (l[u] = {});
      };
    }, function(n, a, s) {
      var o, c, l, u = s(7), h = s(41), d = s(25), f = s(16), p = s(2), m = p.process, g = p.setImmediate, y = p.clearImmediate, w = p.MessageChannel, v = 0, x = {}, S = "onreadystatechange", E = function() {
        var k = +this;
        if (x.hasOwnProperty(k)) {
          var U = x[k];
          delete x[k], U();
        }
      }, O = function(k) {
        E.call(k.data);
      };
      g && y || (g = function(k) {
        for (var U = [], j = 1; arguments.length > j; )
          U.push(arguments[j++]);
        return x[++v] = function() {
          h(typeof k == "function" ? k : Function(k), U);
        }, o(v), v;
      }, y = function(k) {
        delete x[k];
      }, s(11)(m) == "process" ? o = function(k) {
        m.nextTick(u(E, k, 1));
      } : w ? (c = new w(), l = c.port2, c.port1.onmessage = O, o = u(l.postMessage, l, 1)) : p.addEventListener && typeof postMessage == "function" && !p.importScripts ? (o = function(k) {
        p.postMessage(k + "", "*");
      }, p.addEventListener("message", O, !1)) : o = S in f("script") ? function(k) {
        d.appendChild(f("script"))[S] = function() {
          d.removeChild(this), E.call(k);
        };
      } : function(k) {
        setTimeout(u(E, k, 1), 0);
      }), n.exports = { set: g, clear: y };
    }, function(n, a, s) {
      var o = s(20), c = Math.min;
      n.exports = function(l) {
        return l > 0 ? c(o(l), 9007199254740991) : 0;
      };
    }, function(n, a, s) {
      var o = s(9);
      n.exports = function(c, l) {
        if (!o(c))
          return c;
        var u, h;
        if (l && typeof (u = c.toString) == "function" && !o(h = u.call(c)) || typeof (u = c.valueOf) == "function" && !o(h = u.call(c)) || !l && typeof (u = c.toString) == "function" && !o(h = u.call(c)))
          return h;
        throw TypeError("Can't convert object to primitive value");
      };
    }, function(n, a) {
      var s = 0, o = Math.random();
      n.exports = function(c) {
        return "Symbol(".concat(c === void 0 ? "" : c, ")_", (++s + o).toString(36));
      };
    }, function(n, a, s) {
      function o(S) {
        return S && S.__esModule ? S : { default: S };
      }
      function c() {
        return process.platform !== "win32" ? "" : process.arch === "ia32" && process.env.hasOwnProperty("PROCESSOR_ARCHITEW6432") ? "mixed" : "native";
      }
      function l(S) {
        return (0, g.createHash)("sha256").update(S).digest("hex");
      }
      function u(S) {
        switch (w) {
          case "darwin":
            return S.split("IOPlatformUUID")[1].split(`
`)[0].replace(/\=|\s+|\"/gi, "").toLowerCase();
          case "win32":
            return S.toString().split("REG_SZ")[1].replace(/\r+|\n+|\s+/gi, "").toLowerCase();
          case "linux":
            return S.toString().replace(/\r+|\n+|\s+/gi, "").toLowerCase();
          case "freebsd":
            return S.toString().replace(/\r+|\n+|\s+/gi, "").toLowerCase();
          default:
            throw new Error("Unsupported platform: " + process.platform);
        }
      }
      function h(S) {
        var E = u((0, m.execSync)(x[w]).toString());
        return S ? E : l(E);
      }
      function d(S) {
        return new p.default(function(E, O) {
          return (0, m.exec)(x[w], {}, function(k, U, j) {
            if (k)
              return O(new Error("Error while obtaining machine id: " + k.stack));
            var G = u(U.toString());
            return E(S ? G : l(G));
          });
        });
      }
      Object.defineProperty(a, "__esModule", { value: !0 });
      var f = s(35), p = o(f);
      a.machineIdSync = h, a.machineId = d;
      var m = s(70), g = s(71), y = process, w = y.platform, v = { native: "%windir%\\System32", mixed: "%windir%\\sysnative\\cmd.exe /c %windir%\\System32" }, x = { darwin: "ioreg -rd1 -c IOPlatformExpertDevice", win32: v[c()] + "\\REG.exe QUERY HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid", linux: "( cat /var/lib/dbus/machine-id /etc/machine-id 2> /dev/null || hostname ) | head -n 1 || :", freebsd: "kenv -q smbios.system.uuid || sysctl -n kern.hostuuid" };
    }, function(n, a, s) {
      n.exports = { default: s(36), __esModule: !0 };
    }, function(n, a, s) {
      s(66), s(68), s(69), s(67), n.exports = s(6).Promise;
    }, function(n, a) {
      n.exports = function() {
      };
    }, function(n, a) {
      n.exports = function(s, o, c, l) {
        if (!(s instanceof o) || l !== void 0 && l in s)
          throw TypeError(c + ": incorrect invocation!");
        return s;
      };
    }, function(n, a, s) {
      var o = s(13), c = s(31), l = s(62);
      n.exports = function(u) {
        return function(h, d, f) {
          var p, m = o(h), g = c(m.length), y = l(f, g);
          if (u && d != d) {
            for (; g > y; )
              if (p = m[y++], p != p)
                return !0;
          } else
            for (; g > y; y++)
              if ((u || y in m) && m[y] === d)
                return u || y || 0;
          return !u && -1;
        };
      };
    }, function(n, m, s) {
      var o = s(7), c = s(44), l = s(43), u = s(3), h = s(31), d = s(64), f = {}, p = {}, m = n.exports = function(g, y, w, v, x) {
        var S, E, O, k, U = x ? function() {
          return g;
        } : d(g), j = o(w, v, y ? 2 : 1), G = 0;
        if (typeof U != "function")
          throw TypeError(g + " is not iterable!");
        if (l(U)) {
          for (S = h(g.length); S > G; G++)
            if (k = y ? j(u(E = g[G])[0], E[1]) : j(g[G]), k === f || k === p)
              return k;
        } else
          for (O = U.call(g); !(E = O.next()).done; )
            if (k = c(O, j, E.value, y), k === f || k === p)
              return k;
      };
      m.BREAK = f, m.RETURN = p;
    }, function(n, a) {
      n.exports = function(s, o, c) {
        var l = c === void 0;
        switch (o.length) {
          case 0:
            return l ? s() : s.call(c);
          case 1:
            return l ? s(o[0]) : s.call(c, o[0]);
          case 2:
            return l ? s(o[0], o[1]) : s.call(c, o[0], o[1]);
          case 3:
            return l ? s(o[0], o[1], o[2]) : s.call(c, o[0], o[1], o[2]);
          case 4:
            return l ? s(o[0], o[1], o[2], o[3]) : s.call(c, o[0], o[1], o[2], o[3]);
        }
        return s.apply(c, o);
      };
    }, function(n, a, s) {
      var o = s(11);
      n.exports = Object("z").propertyIsEnumerable(0) ? Object : function(c) {
        return o(c) == "String" ? c.split("") : Object(c);
      };
    }, function(n, a, s) {
      var o = s(10), c = s(1)("iterator"), l = Array.prototype;
      n.exports = function(u) {
        return u !== void 0 && (o.Array === u || l[c] === u);
      };
    }, function(n, a, s) {
      var o = s(3);
      n.exports = function(c, l, u, h) {
        try {
          return h ? l(o(u)[0], u[1]) : l(u);
        } catch (f) {
          var d = c.return;
          throw d !== void 0 && o(d.call(c)), f;
        }
      };
    }, function(n, a, s) {
      var o = s(49), c = s(17), l = s(18), u = {};
      s(5)(u, s(1)("iterator"), function() {
        return this;
      }), n.exports = function(h, d, f) {
        h.prototype = o(u, { next: c(1, f) }), l(h, d + " Iterator");
      };
    }, function(n, a, s) {
      var o = s(1)("iterator"), c = !1;
      try {
        var l = [7][o]();
        l.return = function() {
          c = !0;
        }, Array.from(l, function() {
          throw 2;
        });
      } catch {
      }
      n.exports = function(u, h) {
        if (!h && !c)
          return !1;
        var d = !1;
        try {
          var f = [7], p = f[o]();
          p.next = function() {
            return { done: d = !0 };
          }, f[o] = function() {
            return p;
          }, u(f);
        } catch {
        }
        return d;
      };
    }, function(n, a) {
      n.exports = function(s, o) {
        return { value: o, done: !!s };
      };
    }, function(n, a, s) {
      var o = s(2), c = s(30).set, l = o.MutationObserver || o.WebKitMutationObserver, u = o.process, h = o.Promise, d = s(11)(u) == "process";
      n.exports = function() {
        var f, p, m, g = function() {
          var x, S;
          for (d && (x = u.domain) && x.exit(); f; ) {
            S = f.fn, f = f.next;
            try {
              S();
            } catch (E) {
              throw f ? m() : p = void 0, E;
            }
          }
          p = void 0, x && x.enter();
        };
        if (d)
          m = function() {
            u.nextTick(g);
          };
        else if (l) {
          var y = !0, w = document.createTextNode("");
          new l(g).observe(w, { characterData: !0 }), m = function() {
            w.data = y = !y;
          };
        } else if (h && h.resolve) {
          var v = h.resolve();
          m = function() {
            v.then(g);
          };
        } else
          m = function() {
            c.call(o, g);
          };
        return function(x) {
          var S = { fn: x, next: void 0 };
          p && (p.next = S), f || (f = S, m()), p = S;
        };
      };
    }, function(n, a, s) {
      var o = s(3), c = s(50), l = s(22), u = s(19)("IE_PROTO"), h = function() {
      }, d = "prototype", f = function() {
        var p, m = s(16)("iframe"), g = l.length, y = ">";
        for (m.style.display = "none", s(25).appendChild(m), m.src = "javascript:", p = m.contentWindow.document, p.open(), p.write("<script>document.F=Object<\/script" + y), p.close(), f = p.F; g--; )
          delete f[d][l[g]];
        return f();
      };
      n.exports = Object.create || function(p, m) {
        var g;
        return p !== null ? (h[d] = o(p), g = new h(), h[d] = null, g[u] = p) : g = f(), m === void 0 ? g : c(g, m);
      };
    }, function(n, a, s) {
      var o = s(12), c = s(3), l = s(54);
      n.exports = s(4) ? Object.defineProperties : function(u, h) {
        c(u);
        for (var d, f = l(h), p = f.length, m = 0; p > m; )
          o.f(u, d = f[m++], h[d]);
        return u;
      };
    }, function(n, a, s) {
      var o = s(55), c = s(17), l = s(13), u = s(32), h = s(8), d = s(26), f = Object.getOwnPropertyDescriptor;
      a.f = s(4) ? f : function(p, m) {
        if (p = l(p), m = u(m, !0), d)
          try {
            return f(p, m);
          } catch {
          }
        if (h(p, m))
          return c(!o.f.call(p, m), p[m]);
      };
    }, function(n, a, s) {
      var o = s(8), c = s(63), l = s(19)("IE_PROTO"), u = Object.prototype;
      n.exports = Object.getPrototypeOf || function(h) {
        return h = c(h), o(h, l) ? h[l] : typeof h.constructor == "function" && h instanceof h.constructor ? h.constructor.prototype : h instanceof Object ? u : null;
      };
    }, function(n, a, s) {
      var o = s(8), c = s(13), l = s(39)(!1), u = s(19)("IE_PROTO");
      n.exports = function(h, d) {
        var f, p = c(h), m = 0, g = [];
        for (f in p)
          f != u && o(p, f) && g.push(f);
        for (; d.length > m; )
          o(p, f = d[m++]) && (~l(g, f) || g.push(f));
        return g;
      };
    }, function(n, a, s) {
      var o = s(53), c = s(22);
      n.exports = Object.keys || function(l) {
        return o(l, c);
      };
    }, function(n, a) {
      a.f = {}.propertyIsEnumerable;
    }, function(n, a, s) {
      var o = s(5);
      n.exports = function(c, l, u) {
        for (var h in l)
          u && c[h] ? c[h] = l[h] : o(c, h, l[h]);
        return c;
      };
    }, function(n, a, s) {
      n.exports = s(5);
    }, function(n, a, s) {
      var o = s(9), c = s(3), l = function(u, h) {
        if (c(u), !o(h) && h !== null)
          throw TypeError(h + ": can't set as prototype!");
      };
      n.exports = { set: Object.setPrototypeOf || ("__proto__" in {} ? function(u, h, d) {
        try {
          d = s(7)(Function.call, s(51).f(Object.prototype, "__proto__").set, 2), d(u, []), h = !(u instanceof Array);
        } catch {
          h = !0;
        }
        return function(f, p) {
          return l(f, p), h ? f.__proto__ = p : d(f, p), f;
        };
      }({}, !1) : void 0), check: l };
    }, function(n, a, s) {
      var o = s(2), c = s(6), l = s(12), u = s(4), h = s(1)("species");
      n.exports = function(d) {
        var f = typeof c[d] == "function" ? c[d] : o[d];
        u && f && !f[h] && l.f(f, h, { configurable: !0, get: function() {
          return this;
        } });
      };
    }, function(n, a, s) {
      var o = s(3), c = s(14), l = s(1)("species");
      n.exports = function(u, h) {
        var d, f = o(u).constructor;
        return f === void 0 || (d = o(f)[l]) == null ? h : c(d);
      };
    }, function(n, a, s) {
      var o = s(20), c = s(15);
      n.exports = function(l) {
        return function(u, h) {
          var d, f, p = String(c(u)), m = o(h), g = p.length;
          return m < 0 || m >= g ? l ? "" : void 0 : (d = p.charCodeAt(m), d < 55296 || d > 56319 || m + 1 === g || (f = p.charCodeAt(m + 1)) < 56320 || f > 57343 ? l ? p.charAt(m) : d : l ? p.slice(m, m + 2) : (d - 55296 << 10) + (f - 56320) + 65536);
        };
      };
    }, function(n, a, s) {
      var o = s(20), c = Math.max, l = Math.min;
      n.exports = function(u, h) {
        return u = o(u), u < 0 ? c(u + h, 0) : l(u, h);
      };
    }, function(n, a, s) {
      var o = s(15);
      n.exports = function(c) {
        return Object(o(c));
      };
    }, function(n, a, s) {
      var o = s(21), c = s(1)("iterator"), l = s(10);
      n.exports = s(6).getIteratorMethod = function(u) {
        if (u != null)
          return u[c] || u["@@iterator"] || l[o(u)];
      };
    }, function(n, a, s) {
      var o = s(37), c = s(47), l = s(10), u = s(13);
      n.exports = s(27)(Array, "Array", function(h, d) {
        this._t = u(h), this._i = 0, this._k = d;
      }, function() {
        var h = this._t, d = this._k, f = this._i++;
        return !h || f >= h.length ? (this._t = void 0, c(1)) : d == "keys" ? c(0, f) : d == "values" ? c(0, h[f]) : c(0, [f, h[f]]);
      }, "values"), l.Arguments = l.Array, o("keys"), o("values"), o("entries");
    }, function(n, a) {
    }, function(n, a, s) {
      var o, c, l, u = s(28), h = s(2), d = s(7), f = s(21), p = s(23), m = s(9), g = (s(3), s(14)), y = s(38), w = s(40), v = (s(58).set, s(60)), x = s(30).set, S = s(48)(), E = "Promise", O = h.TypeError, U = h.process, k = h[E], U = h.process, j = f(U) == "process", G = function() {
      }, Y = !!function() {
        try {
          var b = k.resolve(1), T = (b.constructor = {})[s(1)("species")] = function(C) {
            C(G, G);
          };
          return (j || typeof PromiseRejectionEvent == "function") && b.then(G) instanceof T;
        } catch {
        }
      }(), ce = function(b, T) {
        return b === T || b === k && T === l;
      }, le = function(b) {
        var T;
        return !(!m(b) || typeof (T = b.then) != "function") && T;
      }, ee = function(b) {
        return ce(k, b) ? new ye(b) : new c(b);
      }, ye = c = function(b) {
        var T, C;
        this.promise = new b(function($, Z) {
          if (T !== void 0 || C !== void 0)
            throw O("Bad Promise constructor");
          T = $, C = Z;
        }), this.resolve = g(T), this.reject = g(C);
      }, qe = function(b) {
        try {
          b();
        } catch (T) {
          return { error: T };
        }
      }, Oe = function(b, T) {
        if (!b._n) {
          b._n = !0;
          var C = b._c;
          S(function() {
            for (var $ = b._v, Z = b._s == 1, Pe = 0, Ge = function(Se) {
              var pe, Ut, ut = Z ? Se.ok : Se.fail, ht = Se.resolve, We = Se.reject, Lt = Se.domain;
              try {
                ut ? (Z || (b._h == 2 && ke(b), b._h = 1), ut === !0 ? pe = $ : (Lt && Lt.enter(), pe = ut($), Lt && Lt.exit()), pe === Se.promise ? We(O("Promise-chain cycle")) : (Ut = le(pe)) ? Ut.call(pe, ht, We) : ht(pe)) : We($);
              } catch (es) {
                We(es);
              }
            }; C.length > Pe; )
              Ge(C[Pe++]);
            b._c = [], b._n = !1, T && !b._h && ct(b);
          });
        }
      }, ct = function(b) {
        x.call(h, function() {
          var T, C, $, Z = b._v;
          if (te(b) && (T = qe(function() {
            j ? U.emit("unhandledRejection", Z, b) : (C = h.onunhandledrejection) ? C({ promise: b, reason: Z }) : ($ = h.console) && $.error && $.error("Unhandled promise rejection", Z);
          }), b._h = j || te(b) ? 2 : 1), b._a = void 0, T)
            throw T.error;
        });
      }, te = function(b) {
        if (b._h == 1)
          return !1;
        for (var T, C = b._a || b._c, $ = 0; C.length > $; )
          if (T = C[$++], T.fail || !te(T.promise))
            return !1;
        return !0;
      }, ke = function(b) {
        x.call(h, function() {
          var T;
          j ? U.emit("rejectionHandled", b) : (T = h.onrejectionhandled) && T({ promise: b, reason: b._v });
        });
      }, ie = function(b) {
        var T = this;
        T._d || (T._d = !0, T = T._w || T, T._v = b, T._s = 2, T._a || (T._a = T._c.slice()), Oe(T, !0));
      }, lt = function(b) {
        var T, C = this;
        if (!C._d) {
          C._d = !0, C = C._w || C;
          try {
            if (C === b)
              throw O("Promise can't be resolved itself");
            (T = le(b)) ? S(function() {
              var $ = { _w: C, _d: !1 };
              try {
                T.call(b, d(lt, $, 1), d(ie, $, 1));
              } catch (Z) {
                ie.call($, Z);
              }
            }) : (C._v = b, C._s = 1, Oe(C, !1));
          } catch ($) {
            ie.call({ _w: C, _d: !1 }, $);
          }
        }
      };
      Y || (k = function(b) {
        y(this, k, E, "_h"), g(b), o.call(this);
        try {
          b(d(lt, this, 1), d(ie, this, 1));
        } catch (T) {
          ie.call(this, T);
        }
      }, o = function(b) {
        this._c = [], this._a = void 0, this._s = 0, this._d = !1, this._v = void 0, this._h = 0, this._n = !1;
      }, o.prototype = s(56)(k.prototype, { then: function(b, T) {
        var C = ee(v(this, k));
        return C.ok = typeof b != "function" || b, C.fail = typeof T == "function" && T, C.domain = j ? U.domain : void 0, this._c.push(C), this._a && this._a.push(C), this._s && Oe(this, !1), C.promise;
      }, catch: function(b) {
        return this.then(void 0, b);
      } }), ye = function() {
        var b = new o();
        this.promise = b, this.resolve = d(lt, b, 1), this.reject = d(ie, b, 1);
      }), p(p.G + p.W + p.F * !Y, { Promise: k }), s(18)(k, E), s(59)(E), l = s(6)[E], p(p.S + p.F * !Y, E, { reject: function(b) {
        var T = ee(this), C = T.reject;
        return C(b), T.promise;
      } }), p(p.S + p.F * (u || !Y), E, { resolve: function(b) {
        if (b instanceof k && ce(b.constructor, this))
          return b;
        var T = ee(this), C = T.resolve;
        return C(b), T.promise;
      } }), p(p.S + p.F * !(Y && s(46)(function(b) {
        k.all(b).catch(G);
      })), E, { all: function(b) {
        var T = this, C = ee(T), $ = C.resolve, Z = C.reject, Pe = qe(function() {
          var Ge = [], Se = 0, pe = 1;
          w(b, !1, function(Ut) {
            var ut = Se++, ht = !1;
            Ge.push(void 0), pe++, T.resolve(Ut).then(function(We) {
              ht || (ht = !0, Ge[ut] = We, --pe || $(Ge));
            }, Z);
          }), --pe || $(Ge);
        });
        return Pe && Z(Pe.error), C.promise;
      }, race: function(b) {
        var T = this, C = ee(T), $ = C.reject, Z = qe(function() {
          w(b, !1, function(Pe) {
            T.resolve(Pe).then(C.resolve, $);
          });
        });
        return Z && $(Z.error), C.promise;
      } });
    }, function(n, a, s) {
      var o = s(61)(!0);
      s(27)(String, "String", function(c) {
        this._t = String(c), this._i = 0;
      }, function() {
        var c, l = this._t, u = this._i;
        return u >= l.length ? { value: void 0, done: !0 } : (c = o(l, u), this._i += c.length, { value: c, done: !1 });
      });
    }, function(n, a, s) {
      s(65);
      for (var o = s(2), c = s(5), l = s(10), u = s(1)("toStringTag"), h = ["NodeList", "DOMTokenList", "MediaList", "StyleSheetList", "CSSRuleList"], d = 0; d < 5; d++) {
        var f = h[d], p = o[f], m = p && p.prototype;
        m && !m[u] && c(m, u, f), l[f] = l.Array;
      }
    }, function(n, a) {
      n.exports = ci;
    }, function(n, a) {
      n.exports = _t;
    }]);
  });
})(cn);
var ds = cn.exports;
const ln = process.platform === "linux" ? "/mnt/raid1" : z.join(process.env.HOME || "", "Library/Application Support/icaffeos/data"), fs = process.platform === "linux" ? "/var/log/icaffeos.log" : z.join(process.env.HOME || "", "Library/Logs/icaffeos.log"), jt = z.join(ln, "backups");
async function ps(r) {
  try {
    await be.access(r);
  } catch {
    await be.mkdir(r, { recursive: !0 });
  }
}
class ms {
  constructor(e) {
    L(this, "checkInterval", null);
    L(this, "window", null);
    this.window = e;
  }
  startMonitoring(e = 6e4) {
    this.checkHealth(), this.checkInterval = setInterval(() => this.checkHealth(), e);
  }
  stopMonitoring() {
    this.checkInterval && clearInterval(this.checkInterval);
  }
  async checkHealth() {
    try {
      const e = await this.getDiskUsage(ln), t = await this.getSmartData("/dev/sda");
      this.window && !this.window.isDestroyed() && this.window.webContents.send("hardware:storage-health", {
        usage: e,
        smart: t,
        status: this.evaluateHealth(t)
      });
    } catch (e) {
      console.error("Disk Monitor Error:", e);
    }
  }
  async getDiskUsage(e) {
    try {
      const t = await be.statfs(e), i = t.blocks * t.bsize, n = t.bfree * t.bsize;
      return { total: i, free: n, used: i - n };
    } catch {
      return { total: 0, free: 0, used: 0 };
    }
  }
  getSmartData(e) {
    return new Promise((t) => {
      bt(`smartctl -a ${e} --json`, (i, n) => {
        var a, s, o, c;
        if (i) {
          t({
            temperature: { current: 35, limit: 60 },
            reallocated_sector_ct: 0,
            power_on_hours: 1200
          });
          return;
        }
        try {
          const l = JSON.parse(n);
          t({
            temperature: l.temperature,
            reallocated_sector_ct: ((o = (s = (a = l.ata_smart_attributes) == null ? void 0 : a.table.find((u) => u.id === 5)) == null ? void 0 : s.raw) == null ? void 0 : o.value) || 0,
            power_on_hours: ((c = l.power_on_time) == null ? void 0 : c.hours) || 0
          });
        } catch {
          t({});
        }
      });
    });
  }
  evaluateHealth(e) {
    var t;
    return ((t = e.temperature) == null ? void 0 : t.current) > 55 ? "warning" : e.reallocated_sector_ct > 10 ? "critical" : e.reallocated_sector_ct > 0 ? "warning" : "healthy";
  }
}
class gs {
  async createBackup(e, t) {
    await ps(jt);
    const n = `backup-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}`, a = z.join(jt, `${n}.wal`), s = z.join(jt, `${n}.tmp`), o = z.join(jt, `${n}.tar.gz`);
    try {
      await be.writeFile(a, "STARTED", "utf8");
      const c = F.createWriteStream(s), l = as(), u = JSON.stringify({
        meta: { date: (/* @__PURE__ */ new Date()).toISOString(), version: "1.0" },
        dexie: e ? JSON.parse(e) : {},
        postgres: t
      });
      await os(
        cs.from([u]),
        l,
        c
      );
      const h = await be.open(s, "r+");
      return await h.sync(), await h.close(), await be.rename(s, o), await be.unlink(a), o;
    } catch (c) {
      throw F.existsSync(s) && await be.unlink(s), F.existsSync(a) && await be.writeFile(a, `FAILED: ${c.message}`), c;
    }
  }
}
class ys {
  constructor(e, t = fs) {
    L(this, "watcher", null);
    L(this, "buffer", []);
    L(this, "flushInterval", null);
    L(this, "window", null);
    L(this, "logPath");
    this.window = e, this.logPath = t;
  }
  startStreaming() {
    if (!F.existsSync(this.logPath)) {
      console.log("Log file not found, skipping stream:", this.logPath);
      return;
    }
    try {
      let e = 0;
      try {
        e = F.statSync(this.logPath).size;
      } catch {
      }
      this.watcher = F.watch(this.logPath, (t) => {
        if (t === "change")
          try {
            const n = F.statSync(this.logPath).size;
            n > e ? (F.createReadStream(this.logPath, {
              start: e,
              end: n
            }).on("data", (s) => {
              this.buffer.push(s.toString());
            }), e = n) : n < e && (e = n);
          } catch {
          }
      });
    } catch (e) {
      console.warn("Log watcher failed to start:", e);
    }
    this.flushInterval = setInterval(() => this.flush(), 500);
  }
  stopStreaming() {
    this.watcher && this.watcher.close(), this.flushInterval && clearInterval(this.flushInterval), this.buffer = [];
  }
  flush() {
    if (this.buffer.length !== 0 && this.window && !this.window.isDestroyed()) {
      const e = this.buffer.join("");
      this.window.webContents.send("hardware:log-chunk", e), this.buffer = [];
    }
  }
}
function ws(r) {
  const e = new ms(r), t = new gs(), i = new ys(r);
  return Ur.handle("storage:get-disk-status", async () => ({ free: 100, total: 1e3, usage: 10 })), Ur.handle("storage:create-backup", async (n, { dexie: a, postgres: s }) => {
    try {
      console.log("Starting backup...");
      const o = await t.createBackup(a, s);
      return console.log("Backup created at:", o), { success: !0, path: o };
    } catch (o) {
      return console.error("Backup failed:", o), { success: !1, error: o.message };
    }
  }), { monitor: e, logger: i };
}
class vs {
  constructor(e) {
    L(this, "window");
    L(this, "checkInterval", null);
    L(this, "recoveryCount", 0);
    this.window = e;
  }
  start(e = 5e3) {
    this.checkInterval = setInterval(() => this.checkVisibility(), e);
  }
  stop() {
    this.checkInterval && clearInterval(this.checkInterval);
  }
  async checkVisibility() {
    if (!this.window.isDestroyed())
      try {
        let e = !1;
        this.window.isVisible() || (console.warn("⚠️ Watchdog: Window is hidden"), e = !0), this.window.isMinimized() && (console.warn("⚠️ Watchdog: Window is minimized"), e = !0);
        const t = this.window.getBounds();
        (t.width < 800 || t.height < 600) && (console.warn("⚠️ Watchdog: Window is too small"), e = !0), e && this.recover();
      } catch (e) {
        console.error("Watchdog Check Error:", e);
      }
  }
  recover() {
    this.recoveryCount++, console.log(`Instructing Recovery (Attempt ${this.recoveryCount})...`), this.window.isMinimized() && this.window.restore(), this.window.show(), this.window.focus(), Ur.emit("hardware:request-power-save", null, !0);
  }
}
class bs {
  constructor(e) {
    L(this, "window");
    L(this, "lastPingTime", Date.now());
    L(this, "checkInterval", null);
    L(this, "maxMissedPings", 3);
    // Allowing bit more grace
    L(this, "pingTimeout", 3e4);
    // 30s
    L(this, "restartCooldown", 0);
    this.window = e;
  }
  start() {
    this.checkInterval = setInterval(() => this.checkHealth(), 1e4);
  }
  recordPing() {
    this.lastPingTime = Date.now();
  }
  checkHealth() {
    const t = Date.now() - this.lastPingTime;
    t > this.pingTimeout * this.maxMissedPings && (console.error(`🚨 Renderer Unresponsive! Last ping: ${t}ms ago.`), this.triggerReload());
  }
  triggerReload() {
    if (Date.now() - this.restartCooldown < 6e4 * 2) {
      console.warn("Skipping watchdog reload due to cooldown");
      return;
    }
    console.log("🔄 Reloading Renderer..."), this.window.reload(), this.lastPingTime = Date.now(), this.restartCooldown = Date.now();
  }
}
class _s {
  constructor() {
    L(this, "crashTimes", []);
    L(this, "windowLimit", 6e4 * 10);
    // 10 minutes
    L(this, "maxCrashes", 3);
    rt.on("child-process-gone", (e, t) => {
      t.type === "GPU" && this.handleGPUCrash(t.reason);
    }), rt.on("render-process-gone", (e, t, i) => {
      console.error("Render Process Gone:", i.reason), i.reason !== "clean-exit" && i.reason !== "killed" && setTimeout(() => {
        t.isDestroyed() || t.reload();
      }, 1e3);
    });
  }
  handleGPUCrash(e) {
    console.error("💥 GPU Process Crash:", e);
    const t = Date.now();
    this.crashTimes = this.crashTimes.filter((i) => t - i < this.windowLimit), this.crashTimes.push(t), this.crashTimes.length >= this.maxCrashes && (console.error("🔥 Too many GPU crashes! Restarting with Software Rendering fallback..."), rt.relaunch({
      args: process.argv.slice(1).concat([
        "--disable-gpu",
        "--disable-software-rasterizer"
      ])
    }), rt.exit(0));
  }
}
function xs(r) {
  const e = new vs(r), t = new bs(r);
  return new _s(), e.start(), t.start(), {
    display: e,
    renderer: t,
    recordPing: () => t.recordPing()
  };
}
const Ts = "End-Of-Stream";
class Q extends Error {
  constructor() {
    super(Ts), this.name = "EndOfStreamError";
  }
}
class ks extends Error {
  constructor(e = "The operation was aborted") {
    super(e), this.name = "AbortError";
  }
}
class un {
  constructor() {
    this.endOfStream = !1, this.interrupted = !1, this.peekQueue = [];
  }
  async peek(e, t = !1) {
    const i = await this.read(e, t);
    return this.peekQueue.push(e.subarray(0, i)), i;
  }
  async read(e, t = !1) {
    if (e.length === 0)
      return 0;
    let i = this.readFromPeekBuffer(e);
    if (this.endOfStream || (i += await this.readRemainderFromStream(e.subarray(i), t)), i === 0 && !t)
      throw new Q();
    return i;
  }
  /**
   * Read chunk from stream
   * @param buffer - Target Uint8Array (or Buffer) to store data read from stream in
   * @returns Number of bytes read
   */
  readFromPeekBuffer(e) {
    let t = e.length, i = 0;
    for (; this.peekQueue.length > 0 && t > 0; ) {
      const n = this.peekQueue.pop();
      if (!n)
        throw new Error("peekData should be defined");
      const a = Math.min(n.length, t);
      e.set(n.subarray(0, a), i), i += a, t -= a, a < n.length && this.peekQueue.push(n.subarray(a));
    }
    return i;
  }
  async readRemainderFromStream(e, t) {
    let i = 0;
    for (; i < e.length && !this.endOfStream; ) {
      if (this.interrupted)
        throw new ks();
      const n = await this.readFromStream(e.subarray(i), t);
      if (n === 0)
        break;
      i += n;
    }
    if (!t && i < e.length)
      throw new Q();
    return i;
  }
}
class Ss extends un {
  constructor(e) {
    super(), this.reader = e;
  }
  async abort() {
    return this.close();
  }
  async close() {
    this.reader.releaseLock();
  }
}
class Es extends Ss {
  /**
   * Read from stream
   * @param buffer - Target Uint8Array (or Buffer) to store data read from stream in
   * @param mayBeLess - If true, may fill the buffer partially
   * @protected Bytes read
   */
  async readFromStream(e, t) {
    if (e.length === 0)
      return 0;
    const i = await this.reader.read(new Uint8Array(e.length), { min: t ? void 0 : e.length });
    return i.done && (this.endOfStream = i.done), i.value ? (e.set(i.value), i.value.length) : 0;
  }
}
class li extends un {
  constructor(e) {
    super(), this.reader = e, this.buffer = null;
  }
  /**
   * Copy chunk to target, and store the remainder in this.buffer
   */
  writeChunk(e, t) {
    const i = Math.min(t.length, e.length);
    return e.set(t.subarray(0, i)), i < t.length ? this.buffer = t.subarray(i) : this.buffer = null, i;
  }
  /**
   * Read from stream
   * @param buffer - Target Uint8Array (or Buffer) to store data read from stream in
   * @param mayBeLess - If true, may fill the buffer partially
   * @protected Bytes read
   */
  async readFromStream(e, t) {
    if (e.length === 0)
      return 0;
    let i = 0;
    for (this.buffer && (i += this.writeChunk(e, this.buffer)); i < e.length && !this.endOfStream; ) {
      const n = await this.reader.read();
      if (n.done) {
        this.endOfStream = !0;
        break;
      }
      n.value && (i += this.writeChunk(e.subarray(i), n.value));
    }
    if (!t && i === 0 && this.endOfStream)
      throw new Q();
    return i;
  }
  abort() {
    return this.interrupted = !0, this.reader.cancel();
  }
  async close() {
    await this.abort(), this.reader.releaseLock();
  }
}
function As(r) {
  try {
    const e = r.getReader({ mode: "byob" });
    return e instanceof ReadableStreamDefaultReader ? new li(e) : new Es(e);
  } catch (e) {
    if (e instanceof TypeError)
      return new li(r.getReader());
    throw e;
  }
}
class lr {
  /**
   * Constructor
   * @param options Tokenizer options
   * @protected
   */
  constructor(e) {
    this.numBuffer = new Uint8Array(8), this.position = 0, this.onClose = e == null ? void 0 : e.onClose, e != null && e.abortSignal && e.abortSignal.addEventListener("abort", () => {
      this.abort();
    });
  }
  /**
   * Read a token from the tokenizer-stream
   * @param token - The token to read
   * @param position - If provided, the desired position in the tokenizer-stream
   * @returns Promise with token data
   */
  async readToken(e, t = this.position) {
    const i = new Uint8Array(e.len);
    if (await this.readBuffer(i, { position: t }) < e.len)
      throw new Q();
    return e.get(i, 0);
  }
  /**
   * Peek a token from the tokenizer-stream.
   * @param token - Token to peek from the tokenizer-stream.
   * @param position - Offset where to begin reading within the file. If position is null, data will be read from the current file position.
   * @returns Promise with token data
   */
  async peekToken(e, t = this.position) {
    const i = new Uint8Array(e.len);
    if (await this.peekBuffer(i, { position: t }) < e.len)
      throw new Q();
    return e.get(i, 0);
  }
  /**
   * Read a numeric token from the stream
   * @param token - Numeric token
   * @returns Promise with number
   */
  async readNumber(e) {
    if (await this.readBuffer(this.numBuffer, { length: e.len }) < e.len)
      throw new Q();
    return e.get(this.numBuffer, 0);
  }
  /**
   * Read a numeric token from the stream
   * @param token - Numeric token
   * @returns Promise with number
   */
  async peekNumber(e) {
    if (await this.peekBuffer(this.numBuffer, { length: e.len }) < e.len)
      throw new Q();
    return e.get(this.numBuffer, 0);
  }
  /**
   * Ignore number of bytes, advances the pointer in under tokenizer-stream.
   * @param length - Number of bytes to ignore
   * @return resolves the number of bytes ignored, equals length if this available, otherwise the number of bytes available
   */
  async ignore(e) {
    if (this.fileInfo.size !== void 0) {
      const t = this.fileInfo.size - this.position;
      if (e > t)
        return this.position += t, t;
    }
    return this.position += e, e;
  }
  async close() {
    var e;
    await this.abort(), await ((e = this.onClose) == null ? void 0 : e.call(this));
  }
  normalizeOptions(e, t) {
    if (!this.supportsRandomAccess() && t && t.position !== void 0 && t.position < this.position)
      throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
    return {
      mayBeLess: !1,
      offset: 0,
      length: e.length,
      position: this.position,
      ...t
    };
  }
  abort() {
    return Promise.resolve();
  }
}
const Is = 256e3;
class Rs extends lr {
  /**
   * Constructor
   * @param streamReader stream-reader to read from
   * @param options Tokenizer options
   */
  constructor(e, t) {
    super(t), this.streamReader = e, this.fileInfo = (t == null ? void 0 : t.fileInfo) ?? {};
  }
  /**
   * Read buffer from tokenizer
   * @param uint8Array - Target Uint8Array to fill with data read from the tokenizer-stream
   * @param options - Read behaviour options
   * @returns Promise with number of bytes read
   */
  async readBuffer(e, t) {
    const i = this.normalizeOptions(e, t), n = i.position - this.position;
    if (n > 0)
      return await this.ignore(n), this.readBuffer(e, t);
    if (n < 0)
      throw new Error("`options.position` must be equal or greater than `tokenizer.position`");
    if (i.length === 0)
      return 0;
    const a = await this.streamReader.read(e.subarray(0, i.length), i.mayBeLess);
    if (this.position += a, (!t || !t.mayBeLess) && a < i.length)
      throw new Q();
    return a;
  }
  /**
   * Peek (read ahead) buffer from tokenizer
   * @param uint8Array - Uint8Array (or Buffer) to write data to
   * @param options - Read behaviour options
   * @returns Promise with number of bytes peeked
   */
  async peekBuffer(e, t) {
    const i = this.normalizeOptions(e, t);
    let n = 0;
    if (i.position) {
      const a = i.position - this.position;
      if (a > 0) {
        const s = new Uint8Array(i.length + a);
        return n = await this.peekBuffer(s, { mayBeLess: i.mayBeLess }), e.set(s.subarray(a)), n - a;
      }
      if (a < 0)
        throw new Error("Cannot peek from a negative offset in a stream");
    }
    if (i.length > 0) {
      try {
        n = await this.streamReader.peek(e.subarray(0, i.length), i.mayBeLess);
      } catch (a) {
        if (t != null && t.mayBeLess && a instanceof Q)
          return 0;
        throw a;
      }
      if (!i.mayBeLess && n < i.length)
        throw new Q();
    }
    return n;
  }
  async ignore(e) {
    const t = Math.min(Is, e), i = new Uint8Array(t);
    let n = 0;
    for (; n < e; ) {
      const a = e - n, s = await this.readBuffer(i, { length: Math.min(t, a) });
      if (s < 0)
        return s;
      n += s;
    }
    return n;
  }
  abort() {
    return this.streamReader.abort();
  }
  async close() {
    return this.streamReader.close();
  }
  supportsRandomAccess() {
    return !1;
  }
}
class Cs extends lr {
  /**
   * Construct BufferTokenizer
   * @param uint8Array - Uint8Array to tokenize
   * @param options Tokenizer options
   */
  constructor(e, t) {
    super(t), this.uint8Array = e, this.fileInfo = { ...(t == null ? void 0 : t.fileInfo) ?? {}, size: e.length };
  }
  /**
   * Read buffer from tokenizer
   * @param uint8Array - Uint8Array to tokenize
   * @param options - Read behaviour options
   * @returns {Promise<number>}
   */
  async readBuffer(e, t) {
    t != null && t.position && (this.position = t.position);
    const i = await this.peekBuffer(e, t);
    return this.position += i, i;
  }
  /**
   * Peek (read ahead) buffer from tokenizer
   * @param uint8Array
   * @param options - Read behaviour options
   * @returns {Promise<number>}
   */
  async peekBuffer(e, t) {
    const i = this.normalizeOptions(e, t), n = Math.min(this.uint8Array.length - i.position, i.length);
    if (!i.mayBeLess && n < i.length)
      throw new Q();
    return e.set(this.uint8Array.subarray(i.position, i.position + n)), n;
  }
  close() {
    return super.close();
  }
  supportsRandomAccess() {
    return !0;
  }
  setPosition(e) {
    this.position = e;
  }
}
class Os extends lr {
  /**
   * Construct BufferTokenizer
   * @param blob - Uint8Array to tokenize
   * @param options Tokenizer options
   */
  constructor(e, t) {
    super(t), this.blob = e, this.fileInfo = { ...(t == null ? void 0 : t.fileInfo) ?? {}, size: e.size, mimeType: e.type };
  }
  /**
   * Read buffer from tokenizer
   * @param uint8Array - Uint8Array to tokenize
   * @param options - Read behaviour options
   * @returns {Promise<number>}
   */
  async readBuffer(e, t) {
    t != null && t.position && (this.position = t.position);
    const i = await this.peekBuffer(e, t);
    return this.position += i, i;
  }
  /**
   * Peek (read ahead) buffer from tokenizer
   * @param buffer
   * @param options - Read behaviour options
   * @returns {Promise<number>}
   */
  async peekBuffer(e, t) {
    const i = this.normalizeOptions(e, t), n = Math.min(this.blob.size - i.position, i.length);
    if (!i.mayBeLess && n < i.length)
      throw new Q();
    const a = await this.blob.slice(i.position, i.position + n).arrayBuffer();
    return e.set(new Uint8Array(a)), n;
  }
  close() {
    return super.close();
  }
  supportsRandomAccess() {
    return !0;
  }
  setPosition(e) {
    this.position = e;
  }
}
function Ps(r, e) {
  const t = As(r), i = e ?? {}, n = i.onClose;
  return i.onClose = async () => {
    if (await t.close(), n)
      return n();
  }, new Rs(t, i);
}
function Lr(r, e) {
  return new Cs(r, e);
}
function Ds(r, e) {
  return new Os(r, e);
}
class Zr extends lr {
  /**
   * Create tokenizer from provided file path
   * @param sourceFilePath File path
   */
  static async fromFile(e) {
    const t = await ls(e, "r"), i = await t.stat();
    return new Zr(t, { fileInfo: { path: e, size: i.size } });
  }
  constructor(e, t) {
    super(t), this.fileHandle = e, this.fileInfo = t.fileInfo;
  }
  /**
   * Read buffer from file
   * @param uint8Array - Uint8Array to write result to
   * @param options - Read behaviour options
   * @returns Promise number of bytes read
   */
  async readBuffer(e, t) {
    const i = this.normalizeOptions(e, t);
    if (this.position = i.position, i.length === 0)
      return 0;
    const n = await this.fileHandle.read(e, 0, i.length, i.position);
    if (this.position += n.bytesRead, n.bytesRead < i.length && (!t || !t.mayBeLess))
      throw new Q();
    return n.bytesRead;
  }
  /**
   * Peek buffer from file
   * @param uint8Array - Uint8Array (or Buffer) to write data to
   * @param options - Read behaviour options
   * @returns Promise number of bytes read
   */
  async peekBuffer(e, t) {
    const i = this.normalizeOptions(e, t), n = await this.fileHandle.read(e, 0, i.length, i.position);
    if (!i.mayBeLess && n.bytesRead < i.length)
      throw new Q();
    return n.bytesRead;
  }
  async close() {
    return await this.fileHandle.close(), super.close();
  }
  setPosition(e) {
    this.position = e;
  }
  supportsRandomAccess() {
    return !0;
  }
}
const Us = Zr.fromFile;
var jr = { exports: {} }, Nt = { exports: {} }, yr, ui;
function Ls() {
  if (ui)
    return yr;
  ui = 1;
  var r = 1e3, e = r * 60, t = e * 60, i = t * 24, n = i * 7, a = i * 365.25;
  yr = function(u, h) {
    h = h || {};
    var d = typeof u;
    if (d === "string" && u.length > 0)
      return s(u);
    if (d === "number" && isFinite(u))
      return h.long ? c(u) : o(u);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(u)
    );
  };
  function s(u) {
    if (u = String(u), !(u.length > 100)) {
      var h = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        u
      );
      if (h) {
        var d = parseFloat(h[1]), f = (h[2] || "ms").toLowerCase();
        switch (f) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return d * a;
          case "weeks":
          case "week":
          case "w":
            return d * n;
          case "days":
          case "day":
          case "d":
            return d * i;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return d * t;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return d * e;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return d * r;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return d;
          default:
            return;
        }
      }
    }
  }
  function o(u) {
    var h = Math.abs(u);
    return h >= i ? Math.round(u / i) + "d" : h >= t ? Math.round(u / t) + "h" : h >= e ? Math.round(u / e) + "m" : h >= r ? Math.round(u / r) + "s" : u + "ms";
  }
  function c(u) {
    var h = Math.abs(u);
    return h >= i ? l(u, h, i, "day") : h >= t ? l(u, h, t, "hour") : h >= e ? l(u, h, e, "minute") : h >= r ? l(u, h, r, "second") : u + " ms";
  }
  function l(u, h, d, f) {
    var p = h >= d * 1.5;
    return Math.round(u / d) + " " + f + (p ? "s" : "");
  }
  return yr;
}
var wr, hi;
function hn() {
  if (hi)
    return wr;
  hi = 1;
  function r(e) {
    i.debug = i, i.default = i, i.coerce = l, i.disable = o, i.enable = a, i.enabled = c, i.humanize = Ls(), i.destroy = u, Object.keys(e).forEach((h) => {
      i[h] = e[h];
    }), i.names = [], i.skips = [], i.formatters = {};
    function t(h) {
      let d = 0;
      for (let f = 0; f < h.length; f++)
        d = (d << 5) - d + h.charCodeAt(f), d |= 0;
      return i.colors[Math.abs(d) % i.colors.length];
    }
    i.selectColor = t;
    function i(h) {
      let d, f = null, p, m;
      function g(...y) {
        if (!g.enabled)
          return;
        const w = g, v = Number(/* @__PURE__ */ new Date()), x = v - (d || v);
        w.diff = x, w.prev = d, w.curr = v, d = v, y[0] = i.coerce(y[0]), typeof y[0] != "string" && y.unshift("%O");
        let S = 0;
        y[0] = y[0].replace(/%([a-zA-Z%])/g, (O, k) => {
          if (O === "%%")
            return "%";
          S++;
          const U = i.formatters[k];
          if (typeof U == "function") {
            const j = y[S];
            O = U.call(w, j), y.splice(S, 1), S--;
          }
          return O;
        }), i.formatArgs.call(w, y), (w.log || i.log).apply(w, y);
      }
      return g.namespace = h, g.useColors = i.useColors(), g.color = i.selectColor(h), g.extend = n, g.destroy = i.destroy, Object.defineProperty(g, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => f !== null ? f : (p !== i.namespaces && (p = i.namespaces, m = i.enabled(h)), m),
        set: (y) => {
          f = y;
        }
      }), typeof i.init == "function" && i.init(g), g;
    }
    function n(h, d) {
      const f = i(this.namespace + (typeof d > "u" ? ":" : d) + h);
      return f.log = this.log, f;
    }
    function a(h) {
      i.save(h), i.namespaces = h, i.names = [], i.skips = [];
      const d = (typeof h == "string" ? h : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const f of d)
        f[0] === "-" ? i.skips.push(f.slice(1)) : i.names.push(f);
    }
    function s(h, d) {
      let f = 0, p = 0, m = -1, g = 0;
      for (; f < h.length; )
        if (p < d.length && (d[p] === h[f] || d[p] === "*"))
          d[p] === "*" ? (m = p, g = f, p++) : (f++, p++);
        else if (m !== -1)
          p = m + 1, g++, f = g;
        else
          return !1;
      for (; p < d.length && d[p] === "*"; )
        p++;
      return p === d.length;
    }
    function o() {
      const h = [
        ...i.names,
        ...i.skips.map((d) => "-" + d)
      ].join(",");
      return i.enable(""), h;
    }
    function c(h) {
      for (const d of i.skips)
        if (s(h, d))
          return !1;
      for (const d of i.names)
        if (s(h, d))
          return !0;
      return !1;
    }
    function l(h) {
      return h instanceof Error ? h.stack || h.message : h;
    }
    function u() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return i.enable(i.load()), i;
  }
  return wr = r, wr;
}
var di;
function js() {
  return di || (di = 1, function(r, e) {
    e.formatArgs = i, e.save = n, e.load = a, e.useColors = t, e.storage = s(), e.destroy = /* @__PURE__ */ (() => {
      let c = !1;
      return () => {
        c || (c = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })(), e.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function t() {
      if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
        return !0;
      if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
        return !1;
      let c;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (c = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(c[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function i(c) {
      if (c[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + c[0] + (this.useColors ? "%c " : " ") + "+" + r.exports.humanize(this.diff), !this.useColors)
        return;
      const l = "color: " + this.color;
      c.splice(1, 0, l, "color: inherit");
      let u = 0, h = 0;
      c[0].replace(/%[a-zA-Z%]/g, (d) => {
        d !== "%%" && (u++, d === "%c" && (h = u));
      }), c.splice(h, 0, l);
    }
    e.log = console.debug || console.log || (() => {
    });
    function n(c) {
      try {
        c ? e.storage.setItem("debug", c) : e.storage.removeItem("debug");
      } catch {
      }
    }
    function a() {
      let c;
      try {
        c = e.storage.getItem("debug") || e.storage.getItem("DEBUG");
      } catch {
      }
      return !c && typeof process < "u" && "env" in process && (c = process.env.DEBUG), c;
    }
    function s() {
      try {
        return localStorage;
      } catch {
      }
    }
    r.exports = hn()(e);
    const { formatters: o } = r.exports;
    o.j = function(c) {
      try {
        return JSON.stringify(c);
      } catch (l) {
        return "[UnexpectedJSONParseError]: " + l.message;
      }
    };
  }(Nt, Nt.exports)), Nt.exports;
}
var Bt = { exports: {} }, vr, fi;
function Ns() {
  return fi || (fi = 1, vr = (r, e = process.argv) => {
    const t = r.startsWith("-") ? "" : r.length === 1 ? "-" : "--", i = e.indexOf(t + r), n = e.indexOf("--");
    return i !== -1 && (n === -1 || i < n);
  }), vr;
}
var br, pi;
function Bs() {
  if (pi)
    return br;
  pi = 1;
  const r = an, e = sn, t = Ns(), { env: i } = process;
  let n;
  t("no-color") || t("no-colors") || t("color=false") || t("color=never") ? n = 0 : (t("color") || t("colors") || t("color=true") || t("color=always")) && (n = 1);
  function a() {
    if ("FORCE_COLOR" in i)
      return i.FORCE_COLOR === "true" ? 1 : i.FORCE_COLOR === "false" ? 0 : i.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(i.FORCE_COLOR, 10), 3);
  }
  function s(l) {
    return l === 0 ? !1 : {
      level: l,
      hasBasic: !0,
      has256: l >= 2,
      has16m: l >= 3
    };
  }
  function o(l, { streamIsTTY: u, sniffFlags: h = !0 } = {}) {
    const d = a();
    d !== void 0 && (n = d);
    const f = h ? n : d;
    if (f === 0)
      return 0;
    if (h) {
      if (t("color=16m") || t("color=full") || t("color=truecolor"))
        return 3;
      if (t("color=256"))
        return 2;
    }
    if (l && !u && f === void 0)
      return 0;
    const p = f || 0;
    if (i.TERM === "dumb")
      return p;
    if (process.platform === "win32") {
      const m = r.release().split(".");
      return Number(m[0]) >= 10 && Number(m[2]) >= 10586 ? Number(m[2]) >= 14931 ? 3 : 2 : 1;
    }
    if ("CI" in i)
      return ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE", "DRONE"].some((m) => m in i) || i.CI_NAME === "codeship" ? 1 : p;
    if ("TEAMCITY_VERSION" in i)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(i.TEAMCITY_VERSION) ? 1 : 0;
    if (i.COLORTERM === "truecolor")
      return 3;
    if ("TERM_PROGRAM" in i) {
      const m = Number.parseInt((i.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (i.TERM_PROGRAM) {
        case "iTerm.app":
          return m >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    return /-256(color)?$/i.test(i.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(i.TERM) || "COLORTERM" in i ? 1 : p;
  }
  function c(l, u = {}) {
    const h = o(l, {
      streamIsTTY: l && l.isTTY,
      ...u
    });
    return s(h);
  }
  return br = {
    supportsColor: c,
    stdout: c({ isTTY: e.isatty(1) }),
    stderr: c({ isTTY: e.isatty(2) })
  }, br;
}
var mi;
function $s() {
  return mi || (mi = 1, function(r, e) {
    const t = sn, i = us;
    e.init = u, e.log = o, e.formatArgs = a, e.save = c, e.load = l, e.useColors = n, e.destroy = i.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), e.colors = [6, 2, 3, 4, 5, 1];
    try {
      const d = Bs();
      d && (d.stderr || d).level >= 2 && (e.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ]);
    } catch {
    }
    e.inspectOpts = Object.keys(process.env).filter((d) => /^debug_/i.test(d)).reduce((d, f) => {
      const p = f.substring(6).toLowerCase().replace(/_([a-z])/g, (g, y) => y.toUpperCase());
      let m = process.env[f];
      return /^(yes|on|true|enabled)$/i.test(m) ? m = !0 : /^(no|off|false|disabled)$/i.test(m) ? m = !1 : m === "null" ? m = null : m = Number(m), d[p] = m, d;
    }, {});
    function n() {
      return "colors" in e.inspectOpts ? !!e.inspectOpts.colors : t.isatty(process.stderr.fd);
    }
    function a(d) {
      const { namespace: f, useColors: p } = this;
      if (p) {
        const m = this.color, g = "\x1B[3" + (m < 8 ? m : "8;5;" + m), y = `  ${g};1m${f} \x1B[0m`;
        d[0] = y + d[0].split(`
`).join(`
` + y), d.push(g + "m+" + r.exports.humanize(this.diff) + "\x1B[0m");
      } else
        d[0] = s() + f + " " + d[0];
    }
    function s() {
      return e.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function o(...d) {
      return process.stderr.write(i.formatWithOptions(e.inspectOpts, ...d) + `
`);
    }
    function c(d) {
      d ? process.env.DEBUG = d : delete process.env.DEBUG;
    }
    function l() {
      return process.env.DEBUG;
    }
    function u(d) {
      d.inspectOpts = {};
      const f = Object.keys(e.inspectOpts);
      for (let p = 0; p < f.length; p++)
        d.inspectOpts[f[p]] = e.inspectOpts[f[p]];
    }
    r.exports = hn()(e);
    const { formatters: h } = r.exports;
    h.o = function(d) {
      return this.inspectOpts.colors = this.useColors, i.inspect(d, this.inspectOpts).split(`
`).map((f) => f.trim()).join(" ");
    }, h.O = function(d) {
      return this.inspectOpts.colors = this.useColors, i.inspect(d, this.inspectOpts);
    };
  }(Bt, Bt.exports)), Bt.exports;
}
typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? jr.exports = js() : jr.exports = $s();
var Ms = jr.exports;
const at = /* @__PURE__ */ on(Ms);
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
var ur = function(r, e, t, i, n) {
  var a, s, o = n * 8 - i - 1, c = (1 << o) - 1, l = c >> 1, u = -7, h = t ? n - 1 : 0, d = t ? -1 : 1, f = r[e + h];
  for (h += d, a = f & (1 << -u) - 1, f >>= -u, u += o; u > 0; a = a * 256 + r[e + h], h += d, u -= 8)
    ;
  for (s = a & (1 << -u) - 1, a >>= -u, u += i; u > 0; s = s * 256 + r[e + h], h += d, u -= 8)
    ;
  if (a === 0)
    a = 1 - l;
  else {
    if (a === c)
      return s ? NaN : (f ? -1 : 1) * (1 / 0);
    s = s + Math.pow(2, i), a = a - l;
  }
  return (f ? -1 : 1) * s * Math.pow(2, a - i);
}, hr = function(r, e, t, i, n, a) {
  var s, o, c, l = a * 8 - n - 1, u = (1 << l) - 1, h = u >> 1, d = n === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, f = i ? 0 : a - 1, p = i ? 1 : -1, m = e < 0 || e === 0 && 1 / e < 0 ? 1 : 0;
  for (e = Math.abs(e), isNaN(e) || e === 1 / 0 ? (o = isNaN(e) ? 1 : 0, s = u) : (s = Math.floor(Math.log(e) / Math.LN2), e * (c = Math.pow(2, -s)) < 1 && (s--, c *= 2), s + h >= 1 ? e += d / c : e += d * Math.pow(2, 1 - h), e * c >= 2 && (s++, c /= 2), s + h >= u ? (o = 0, s = u) : s + h >= 1 ? (o = (e * c - 1) * Math.pow(2, n), s = s + h) : (o = e * Math.pow(2, h - 1) * Math.pow(2, n), s = 0)); n >= 8; r[t + f] = o & 255, f += p, o /= 256, n -= 8)
    ;
  for (s = s << n | o, l += n; l > 0; r[t + f] = s & 255, f += p, s /= 256, l -= 8)
    ;
  r[t + f - p] |= m * 128;
};
const dn = {
  128: "€",
  130: "‚",
  131: "ƒ",
  132: "„",
  133: "…",
  134: "†",
  135: "‡",
  136: "ˆ",
  137: "‰",
  138: "Š",
  139: "‹",
  140: "Œ",
  142: "Ž",
  145: "‘",
  146: "’",
  147: "“",
  148: "”",
  149: "•",
  150: "–",
  151: "—",
  152: "˜",
  153: "™",
  154: "š",
  155: "›",
  156: "œ",
  158: "ž",
  159: "Ÿ"
}, fn = {};
for (const [r, e] of Object.entries(dn))
  fn[e] = Number.parseInt(r, 10);
let $t, Mt;
function Fs() {
  if (!(typeof globalThis.TextDecoder > "u"))
    return $t ?? ($t = new globalThis.TextDecoder("utf-8"));
}
function zs() {
  if (!(typeof globalThis.TextEncoder > "u"))
    return Mt ?? (Mt = new globalThis.TextEncoder());
}
const ze = 32 * 1024;
function Ct(r, e = "utf-8") {
  switch (e.toLowerCase()) {
    case "utf-8":
    case "utf8": {
      const t = Fs();
      return t ? t.decode(r) : Gs(r);
    }
    case "utf-16le":
      return Ws(r);
    case "us-ascii":
    case "ascii":
      return Ks(r);
    case "latin1":
    case "iso-8859-1":
      return Vs(r);
    case "windows-1252":
      return Hs(r);
    default:
      throw new RangeError(`Encoding '${e}' not supported`);
  }
}
function qs(r = "", e = "utf-8") {
  switch (e.toLowerCase()) {
    case "utf-8":
    case "utf8": {
      const t = zs();
      return t ? t.encode(r) : Xs(r);
    }
    case "utf-16le":
      return Js(r);
    case "us-ascii":
    case "ascii":
      return Ys(r);
    case "latin1":
    case "iso-8859-1":
      return Zs(r);
    case "windows-1252":
      return Qs(r);
    default:
      throw new RangeError(`Encoding '${e}' not supported`);
  }
}
function Gs(r) {
  const e = [];
  let t = "", i = 0;
  for (; i < r.length; ) {
    const n = r[i++];
    if (n < 128)
      t += String.fromCharCode(n);
    else if (n < 224) {
      const a = r[i++] & 63;
      t += String.fromCharCode((n & 31) << 6 | a);
    } else if (n < 240) {
      const a = r[i++] & 63, s = r[i++] & 63;
      t += String.fromCharCode((n & 15) << 12 | a << 6 | s);
    } else {
      const a = r[i++] & 63, s = r[i++] & 63, o = r[i++] & 63;
      let c = (n & 7) << 18 | a << 12 | s << 6 | o;
      c -= 65536, t += String.fromCharCode(55296 + (c >> 10 & 1023), 56320 + (c & 1023));
    }
    t.length >= ze && (e.push(t), t = "");
  }
  return t && e.push(t), e.join("");
}
function Ws(r) {
  const e = r.length & -2;
  if (e === 0)
    return "";
  const t = [], i = ze;
  for (let n = 0; n < e; ) {
    const a = Math.min(i, e - n >> 1), s = new Array(a);
    for (let o = 0; o < a; o++, n += 2)
      s[o] = r[n] | r[n + 1] << 8;
    t.push(String.fromCharCode.apply(null, s));
  }
  return t.join("");
}
function Ks(r) {
  const e = [];
  for (let t = 0; t < r.length; t += ze) {
    const i = Math.min(r.length, t + ze), n = new Array(i - t);
    for (let a = t, s = 0; a < i; a++, s++)
      n[s] = r[a] & 127;
    e.push(String.fromCharCode.apply(null, n));
  }
  return e.join("");
}
function Vs(r) {
  const e = [];
  for (let t = 0; t < r.length; t += ze) {
    const i = Math.min(r.length, t + ze), n = new Array(i - t);
    for (let a = t, s = 0; a < i; a++, s++)
      n[s] = r[a];
    e.push(String.fromCharCode.apply(null, n));
  }
  return e.join("");
}
function Hs(r) {
  const e = [];
  let t = "";
  for (let i = 0; i < r.length; i++) {
    const n = r[i], a = n >= 128 && n <= 159 ? dn[n] : void 0;
    t += a ?? String.fromCharCode(n), t.length >= ze && (e.push(t), t = "");
  }
  return t && e.push(t), e.join("");
}
function Xs(r) {
  const e = [];
  for (let t = 0; t < r.length; t++) {
    let i = r.charCodeAt(t);
    if (i >= 55296 && i <= 56319 && t + 1 < r.length) {
      const n = r.charCodeAt(t + 1);
      n >= 56320 && n <= 57343 && (i = 65536 + (i - 55296 << 10) + (n - 56320), t++);
    }
    i < 128 ? e.push(i) : i < 2048 ? e.push(192 | i >> 6, 128 | i & 63) : i < 65536 ? e.push(224 | i >> 12, 128 | i >> 6 & 63, 128 | i & 63) : e.push(240 | i >> 18, 128 | i >> 12 & 63, 128 | i >> 6 & 63, 128 | i & 63);
  }
  return new Uint8Array(e);
}
function Js(r) {
  const e = new Uint8Array(r.length * 2);
  for (let t = 0; t < r.length; t++) {
    const i = r.charCodeAt(t), n = t * 2;
    e[n] = i & 255, e[n + 1] = i >>> 8;
  }
  return e;
}
function Ys(r) {
  const e = new Uint8Array(r.length);
  for (let t = 0; t < r.length; t++)
    e[t] = r.charCodeAt(t) & 127;
  return e;
}
function Zs(r) {
  const e = new Uint8Array(r.length);
  for (let t = 0; t < r.length; t++)
    e[t] = r.charCodeAt(t) & 255;
  return e;
}
function Qs(r) {
  const e = new Uint8Array(r.length);
  for (let t = 0; t < r.length; t++) {
    const i = r[t], n = i.charCodeAt(0);
    if (n <= 255) {
      e[t] = n;
      continue;
    }
    const a = fn[i];
    e[t] = a !== void 0 ? a : 63;
  }
  return e;
}
function P(r) {
  return new DataView(r.buffer, r.byteOffset);
}
const Fe = {
  len: 1,
  get(r, e) {
    return P(r).getUint8(e);
  },
  put(r, e, t) {
    return P(r).setUint8(e, t), e + 1;
  }
}, B = {
  len: 2,
  get(r, e) {
    return P(r).getUint16(e, !0);
  },
  put(r, e, t) {
    return P(r).setUint16(e, t, !0), e + 2;
  }
}, Ae = {
  len: 2,
  get(r, e) {
    return P(r).getUint16(e);
  },
  put(r, e, t) {
    return P(r).setUint16(e, t), e + 2;
  }
}, pn = {
  len: 3,
  get(r, e) {
    const t = P(r);
    return t.getUint8(e) + (t.getUint16(e + 1, !0) << 8);
  },
  put(r, e, t) {
    const i = P(r);
    return i.setUint8(e, t & 255), i.setUint16(e + 1, t >> 8, !0), e + 3;
  }
}, mn = {
  len: 3,
  get(r, e) {
    const t = P(r);
    return (t.getUint16(e) << 8) + t.getUint8(e + 2);
  },
  put(r, e, t) {
    const i = P(r);
    return i.setUint16(e, t >> 8), i.setUint8(e + 2, t & 255), e + 3;
  }
}, D = {
  len: 4,
  get(r, e) {
    return P(r).getUint32(e, !0);
  },
  put(r, e, t) {
    return P(r).setUint32(e, t, !0), e + 4;
  }
}, xt = {
  len: 4,
  get(r, e) {
    return P(r).getUint32(e);
  },
  put(r, e, t) {
    return P(r).setUint32(e, t), e + 4;
  }
}, Nr = {
  len: 1,
  get(r, e) {
    return P(r).getInt8(e);
  },
  put(r, e, t) {
    return P(r).setInt8(e, t), e + 1;
  }
}, ea = {
  len: 2,
  get(r, e) {
    return P(r).getInt16(e);
  },
  put(r, e, t) {
    return P(r).setInt16(e, t), e + 2;
  }
}, ta = {
  len: 2,
  get(r, e) {
    return P(r).getInt16(e, !0);
  },
  put(r, e, t) {
    return P(r).setInt16(e, t, !0), e + 2;
  }
}, ra = {
  len: 3,
  get(r, e) {
    const t = pn.get(r, e);
    return t > 8388607 ? t - 16777216 : t;
  },
  put(r, e, t) {
    const i = P(r);
    return i.setUint8(e, t & 255), i.setUint16(e + 1, t >> 8, !0), e + 3;
  }
}, ia = {
  len: 3,
  get(r, e) {
    const t = mn.get(r, e);
    return t > 8388607 ? t - 16777216 : t;
  },
  put(r, e, t) {
    const i = P(r);
    return i.setUint16(e, t >> 8), i.setUint8(e + 2, t & 255), e + 3;
  }
}, gn = {
  len: 4,
  get(r, e) {
    return P(r).getInt32(e);
  },
  put(r, e, t) {
    return P(r).setInt32(e, t), e + 4;
  }
}, na = {
  len: 4,
  get(r, e) {
    return P(r).getInt32(e, !0);
  },
  put(r, e, t) {
    return P(r).setInt32(e, t, !0), e + 4;
  }
}, yn = {
  len: 8,
  get(r, e) {
    return P(r).getBigUint64(e, !0);
  },
  put(r, e, t) {
    return P(r).setBigUint64(e, t, !0), e + 8;
  }
}, sa = {
  len: 8,
  get(r, e) {
    return P(r).getBigInt64(e, !0);
  },
  put(r, e, t) {
    return P(r).setBigInt64(e, t, !0), e + 8;
  }
}, aa = {
  len: 8,
  get(r, e) {
    return P(r).getBigUint64(e);
  },
  put(r, e, t) {
    return P(r).setBigUint64(e, t), e + 8;
  }
}, oa = {
  len: 8,
  get(r, e) {
    return P(r).getBigInt64(e);
  },
  put(r, e, t) {
    return P(r).setBigInt64(e, t), e + 8;
  }
}, ca = {
  len: 2,
  get(r, e) {
    return ur(r, e, !1, 10, this.len);
  },
  put(r, e, t) {
    return hr(r, t, e, !1, 10, this.len), e + this.len;
  }
}, la = {
  len: 2,
  get(r, e) {
    return ur(r, e, !0, 10, this.len);
  },
  put(r, e, t) {
    return hr(r, t, e, !0, 10, this.len), e + this.len;
  }
}, ua = {
  len: 4,
  get(r, e) {
    return P(r).getFloat32(e);
  },
  put(r, e, t) {
    return P(r).setFloat32(e, t), e + 4;
  }
}, ha = {
  len: 4,
  get(r, e) {
    return P(r).getFloat32(e, !0);
  },
  put(r, e, t) {
    return P(r).setFloat32(e, t, !0), e + 4;
  }
}, da = {
  len: 8,
  get(r, e) {
    return P(r).getFloat64(e);
  },
  put(r, e, t) {
    return P(r).setFloat64(e, t), e + 8;
  }
}, fa = {
  len: 8,
  get(r, e) {
    return P(r).getFloat64(e, !0);
  },
  put(r, e, t) {
    return P(r).setFloat64(e, t, !0), e + 8;
  }
}, pa = {
  len: 10,
  get(r, e) {
    return ur(r, e, !1, 63, this.len);
  },
  put(r, e, t) {
    return hr(r, t, e, !1, 63, this.len), e + this.len;
  }
}, ma = {
  len: 10,
  get(r, e) {
    return ur(r, e, !0, 63, this.len);
  },
  put(r, e, t) {
    return hr(r, t, e, !0, 63, this.len), e + this.len;
  }
};
class ga {
  /**
   * @param len number of bytes to ignore
   */
  constructor(e) {
    this.len = e;
  }
  // ToDo: don't read, but skip data
  get(e, t) {
  }
}
class wn {
  constructor(e) {
    this.len = e;
  }
  get(e, t) {
    return e.subarray(t, t + this.len);
  }
}
class H {
  constructor(e, t) {
    this.len = e, this.encoding = t;
  }
  get(e, t = 0) {
    const i = e.subarray(t, t + this.len);
    return Ct(i, this.encoding);
  }
}
class ya extends H {
  constructor(e) {
    super(e, "windows-1252");
  }
}
const Sh = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  AnsiStringType: ya,
  Float16_BE: ca,
  Float16_LE: la,
  Float32_BE: ua,
  Float32_LE: ha,
  Float64_BE: da,
  Float64_LE: fa,
  Float80_BE: pa,
  Float80_LE: ma,
  INT16_BE: ea,
  INT16_LE: ta,
  INT24_BE: ia,
  INT24_LE: ra,
  INT32_BE: gn,
  INT32_LE: na,
  INT64_BE: oa,
  INT64_LE: sa,
  INT8: Nr,
  IgnoreType: ga,
  StringType: H,
  UINT16_BE: Ae,
  UINT16_LE: B,
  UINT24_BE: mn,
  UINT24_LE: pn,
  UINT32_BE: xt,
  UINT32_LE: D,
  UINT64_BE: aa,
  UINT64_LE: yn,
  UINT8: Fe,
  Uint8ArrayType: wn
}, Symbol.toStringTag, { value: "Module" })), it = {
  LocalFileHeader: 67324752,
  DataDescriptor: 134695760,
  CentralFileHeader: 33639248,
  EndOfCentralDirectory: 101010256
}, gi = {
  get(r) {
    return {
      signature: D.get(r, 0),
      compressedSize: D.get(r, 8),
      uncompressedSize: D.get(r, 12)
    };
  },
  len: 16
}, wa = {
  get(r) {
    const e = B.get(r, 6);
    return {
      signature: D.get(r, 0),
      minVersion: B.get(r, 4),
      dataDescriptor: !!(e & 8),
      compressedMethod: B.get(r, 8),
      compressedSize: D.get(r, 18),
      uncompressedSize: D.get(r, 22),
      filenameLength: B.get(r, 26),
      extraFieldLength: B.get(r, 28),
      filename: null
    };
  },
  len: 30
}, va = {
  get(r) {
    return {
      signature: D.get(r, 0),
      nrOfThisDisk: B.get(r, 4),
      nrOfThisDiskWithTheStart: B.get(r, 6),
      nrOfEntriesOnThisDisk: B.get(r, 8),
      nrOfEntriesOfSize: B.get(r, 10),
      sizeOfCd: D.get(r, 12),
      offsetOfStartOfCd: D.get(r, 16),
      zipFileCommentLength: B.get(r, 20)
    };
  },
  len: 22
}, ba = {
  get(r) {
    const e = B.get(r, 8);
    return {
      signature: D.get(r, 0),
      minVersion: B.get(r, 6),
      dataDescriptor: !!(e & 8),
      compressedMethod: B.get(r, 10),
      compressedSize: D.get(r, 20),
      uncompressedSize: D.get(r, 24),
      filenameLength: B.get(r, 28),
      extraFieldLength: B.get(r, 30),
      fileCommentLength: B.get(r, 32),
      relativeOffsetOfLocalHeader: D.get(r, 42),
      filename: null
    };
  },
  len: 46
};
function vn(r) {
  const e = new Uint8Array(D.len);
  return D.put(e, 0, r), e;
}
const me = at("tokenizer:inflate"), _r = 256 * 1024, _a = vn(it.DataDescriptor), Ft = vn(it.EndOfCentralDirectory);
class Qr {
  constructor(e) {
    this.tokenizer = e, this.syncBuffer = new Uint8Array(_r);
  }
  async isZip() {
    return await this.peekSignature() === it.LocalFileHeader;
  }
  peekSignature() {
    return this.tokenizer.peekToken(D);
  }
  async findEndOfCentralDirectoryLocator() {
    const e = this.tokenizer, t = Math.min(16 * 1024, e.fileInfo.size), i = this.syncBuffer.subarray(0, t);
    await this.tokenizer.readBuffer(i, { position: e.fileInfo.size - t });
    for (let n = i.length - 4; n >= 0; n--)
      if (i[n] === Ft[0] && i[n + 1] === Ft[1] && i[n + 2] === Ft[2] && i[n + 3] === Ft[3])
        return e.fileInfo.size - t + n;
    return -1;
  }
  async readCentralDirectory() {
    if (!this.tokenizer.supportsRandomAccess()) {
      me("Cannot reading central-directory without random-read support");
      return;
    }
    me("Reading central-directory...");
    const e = this.tokenizer.position, t = await this.findEndOfCentralDirectoryLocator();
    if (t > 0) {
      me("Central-directory 32-bit signature found");
      const i = await this.tokenizer.readToken(va, t), n = [];
      this.tokenizer.setPosition(i.offsetOfStartOfCd);
      for (let a = 0; a < i.nrOfEntriesOfSize; ++a) {
        const s = await this.tokenizer.readToken(ba);
        if (s.signature !== it.CentralFileHeader)
          throw new Error("Expected Central-File-Header signature");
        s.filename = await this.tokenizer.readToken(new H(s.filenameLength, "utf-8")), await this.tokenizer.ignore(s.extraFieldLength), await this.tokenizer.ignore(s.fileCommentLength), n.push(s), me(`Add central-directory file-entry: n=${a + 1}/${n.length}: filename=${n[a].filename}`);
      }
      return this.tokenizer.setPosition(e), n;
    }
    this.tokenizer.setPosition(e);
  }
  async unzip(e) {
    const t = await this.readCentralDirectory();
    if (t)
      return this.iterateOverCentralDirectory(t, e);
    let i = !1;
    do {
      const n = await this.readLocalFileHeader();
      if (!n)
        break;
      const a = e(n);
      i = !!a.stop;
      let s;
      if (await this.tokenizer.ignore(n.extraFieldLength), n.dataDescriptor && n.compressedSize === 0) {
        const o = [];
        let c = _r;
        me("Compressed-file-size unknown, scanning for next data-descriptor-signature....");
        let l = -1;
        for (; l < 0 && c === _r; ) {
          c = await this.tokenizer.peekBuffer(this.syncBuffer, { mayBeLess: !0 }), l = xa(this.syncBuffer.subarray(0, c), _a);
          const u = l >= 0 ? l : c;
          if (a.handler) {
            const h = new Uint8Array(u);
            await this.tokenizer.readBuffer(h), o.push(h);
          } else
            await this.tokenizer.ignore(u);
        }
        me(`Found data-descriptor-signature at pos=${this.tokenizer.position}`), a.handler && await this.inflate(n, Ta(o), a.handler);
      } else
        a.handler ? (me(`Reading compressed-file-data: ${n.compressedSize} bytes`), s = new Uint8Array(n.compressedSize), await this.tokenizer.readBuffer(s), await this.inflate(n, s, a.handler)) : (me(`Ignoring compressed-file-data: ${n.compressedSize} bytes`), await this.tokenizer.ignore(n.compressedSize));
      if (me(`Reading data-descriptor at pos=${this.tokenizer.position}`), n.dataDescriptor && (await this.tokenizer.readToken(gi)).signature !== 134695760)
        throw new Error(`Expected data-descriptor-signature at position ${this.tokenizer.position - gi.len}`);
    } while (!i);
  }
  async iterateOverCentralDirectory(e, t) {
    for (const i of e) {
      const n = t(i);
      if (n.handler) {
        this.tokenizer.setPosition(i.relativeOffsetOfLocalHeader);
        const a = await this.readLocalFileHeader();
        if (a) {
          await this.tokenizer.ignore(a.extraFieldLength);
          const s = new Uint8Array(i.compressedSize);
          await this.tokenizer.readBuffer(s), await this.inflate(a, s, n.handler);
        }
      }
      if (n.stop)
        break;
    }
  }
  async inflate(e, t, i) {
    if (e.compressedMethod === 0)
      return i(t);
    if (e.compressedMethod !== 8)
      throw new Error(`Unsupported ZIP compression method: ${e.compressedMethod}`);
    me(`Decompress filename=${e.filename}, compressed-size=${t.length}`);
    const n = await Qr.decompressDeflateRaw(t);
    return i(n);
  }
  static async decompressDeflateRaw(e) {
    const t = new ReadableStream({
      start(a) {
        a.enqueue(e), a.close();
      }
    }), i = new DecompressionStream("deflate-raw"), n = t.pipeThrough(i);
    try {
      const s = await new Response(n).arrayBuffer();
      return new Uint8Array(s);
    } catch (a) {
      const s = a instanceof Error ? `Failed to deflate ZIP entry: ${a.message}` : "Unknown decompression error in ZIP entry";
      throw new TypeError(s);
    }
  }
  async readLocalFileHeader() {
    const e = await this.tokenizer.peekToken(D);
    if (e === it.LocalFileHeader) {
      const t = await this.tokenizer.readToken(wa);
      return t.filename = await this.tokenizer.readToken(new H(t.filenameLength, "utf-8")), t;
    }
    if (e === it.CentralFileHeader)
      return !1;
    throw e === 3759263696 ? new Error("Encrypted ZIP") : new Error("Unexpected signature");
  }
}
function xa(r, e) {
  const t = r.length, i = e.length;
  if (i > t)
    return -1;
  for (let n = 0; n <= t - i; n++) {
    let a = !0;
    for (let s = 0; s < i; s++)
      if (r[n + s] !== e[s]) {
        a = !1;
        break;
      }
    if (a)
      return n;
  }
  return -1;
}
function Ta(r) {
  const e = r.reduce((n, a) => n + a.length, 0), t = new Uint8Array(e);
  let i = 0;
  for (const n of r)
    t.set(n, i), i += n.length;
  return t;
}
class ka {
  constructor(e) {
    this.tokenizer = e;
  }
  inflate() {
    const e = this.tokenizer;
    return new ReadableStream({
      async pull(t) {
        const i = new Uint8Array(1024), n = await e.readBuffer(i, { mayBeLess: !0 });
        if (n === 0) {
          t.close();
          return;
        }
        t.enqueue(i.subarray(0, n));
      }
    }).pipeThrough(new DecompressionStream("gzip"));
  }
}
const Sa = Object.prototype.toString, Ea = "[object Uint8Array]";
function Aa(r, e, t) {
  return r ? r.constructor === e ? !0 : Sa.call(r) === t : !1;
}
function Ia(r) {
  return Aa(r, Uint8Array, Ea);
}
function Ra(r) {
  if (!Ia(r))
    throw new TypeError(`Expected \`Uint8Array\`, got \`${typeof r}\``);
}
new globalThis.TextDecoder("utf8");
new globalThis.TextEncoder();
const Ca = Array.from({ length: 256 }, (r, e) => e.toString(16).padStart(2, "0"));
function Eh(r) {
  Ra(r);
  let e = "";
  for (let t = 0; t < r.length; t++)
    e += Ca[r[t]];
  return e;
}
function Br(r) {
  const { byteLength: e } = r;
  if (e === 6)
    return r.getUint16(0) * 2 ** 32 + r.getUint32(2);
  if (e === 5)
    return r.getUint8(0) * 2 ** 32 + r.getUint32(1);
  if (e === 4)
    return r.getUint32(0);
  if (e === 3)
    return r.getUint8(0) * 2 ** 16 + r.getUint16(1);
  if (e === 2)
    return r.getUint16(0);
  if (e === 1)
    return r.getUint8(0);
}
function Oa(r, e) {
  if (e === "utf-16le") {
    const t = [];
    for (let i = 0; i < r.length; i++) {
      const n = r.charCodeAt(i);
      t.push(n & 255, n >> 8 & 255);
    }
    return t;
  }
  if (e === "utf-16be") {
    const t = [];
    for (let i = 0; i < r.length; i++) {
      const n = r.charCodeAt(i);
      t.push(n >> 8 & 255, n & 255);
    }
    return t;
  }
  return [...r].map((t) => t.charCodeAt(0));
}
function Pa(r, e = 0) {
  const t = Number.parseInt(new H(6).get(r, 148).replace(/\0.*$/, "").trim(), 8);
  if (Number.isNaN(t))
    return !1;
  let i = 8 * 32;
  for (let n = e; n < e + 148; n++)
    i += r[n];
  for (let n = e + 156; n < e + 512; n++)
    i += r[n];
  return t === i;
}
const Da = {
  get: (r, e) => r[e + 3] & 127 | r[e + 2] << 7 | r[e + 1] << 14 | r[e] << 21,
  len: 4
}, Ua = [
  "jpg",
  "png",
  "apng",
  "gif",
  "webp",
  "flif",
  "xcf",
  "cr2",
  "cr3",
  "orf",
  "arw",
  "dng",
  "nef",
  "rw2",
  "raf",
  "tif",
  "bmp",
  "icns",
  "jxr",
  "psd",
  "indd",
  "zip",
  "tar",
  "rar",
  "gz",
  "bz2",
  "7z",
  "dmg",
  "mp4",
  "mid",
  "mkv",
  "webm",
  "mov",
  "avi",
  "mpg",
  "mp2",
  "mp3",
  "m4a",
  "oga",
  "ogg",
  "ogv",
  "opus",
  "flac",
  "wav",
  "spx",
  "amr",
  "pdf",
  "epub",
  "elf",
  "macho",
  "exe",
  "swf",
  "rtf",
  "wasm",
  "woff",
  "woff2",
  "eot",
  "ttf",
  "otf",
  "ttc",
  "ico",
  "flv",
  "ps",
  "xz",
  "sqlite",
  "nes",
  "crx",
  "xpi",
  "cab",
  "deb",
  "ar",
  "rpm",
  "Z",
  "lz",
  "cfb",
  "mxf",
  "mts",
  "blend",
  "bpg",
  "docx",
  "pptx",
  "xlsx",
  "3gp",
  "3g2",
  "j2c",
  "jp2",
  "jpm",
  "jpx",
  "mj2",
  "aif",
  "qcp",
  "odt",
  "ods",
  "odp",
  "xml",
  "mobi",
  "heic",
  "cur",
  "ktx",
  "ape",
  "wv",
  "dcm",
  "ics",
  "glb",
  "pcap",
  "dsf",
  "lnk",
  "alias",
  "voc",
  "ac3",
  "m4v",
  "m4p",
  "m4b",
  "f4v",
  "f4p",
  "f4b",
  "f4a",
  "mie",
  "asf",
  "ogm",
  "ogx",
  "mpc",
  "arrow",
  "shp",
  "aac",
  "mp1",
  "it",
  "s3m",
  "xm",
  "skp",
  "avif",
  "eps",
  "lzh",
  "pgp",
  "asar",
  "stl",
  "chm",
  "3mf",
  "zst",
  "jxl",
  "vcf",
  "jls",
  "pst",
  "dwg",
  "parquet",
  "class",
  "arj",
  "cpio",
  "ace",
  "avro",
  "icc",
  "fbx",
  "vsdx",
  "vtt",
  "apk",
  "drc",
  "lz4",
  "potx",
  "xltx",
  "dotx",
  "xltm",
  "ott",
  "ots",
  "otp",
  "odg",
  "otg",
  "xlsm",
  "docm",
  "dotm",
  "potm",
  "pptm",
  "jar",
  "jmp",
  "rm",
  "sav",
  "ppsm",
  "ppsx",
  "tar.gz",
  "reg",
  "dat"
], La = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/flif",
  "image/x-xcf",
  "image/x-canon-cr2",
  "image/x-canon-cr3",
  "image/tiff",
  "image/bmp",
  "image/vnd.ms-photo",
  "image/vnd.adobe.photoshop",
  "application/x-indesign",
  "application/epub+zip",
  "application/x-xpinstall",
  "application/vnd.ms-powerpoint.slideshow.macroenabled.12",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
  "application/zip",
  "application/x-tar",
  "application/x-rar-compressed",
  "application/gzip",
  "application/x-bzip2",
  "application/x-7z-compressed",
  "application/x-apple-diskimage",
  "application/vnd.apache.arrow.file",
  "video/mp4",
  "audio/midi",
  "video/matroska",
  "video/webm",
  "video/quicktime",
  "video/vnd.avi",
  "audio/wav",
  "audio/qcelp",
  "audio/x-ms-asf",
  "video/x-ms-asf",
  "application/vnd.ms-asf",
  "video/mpeg",
  "video/3gpp",
  "audio/mpeg",
  "audio/mp4",
  // RFC 4337
  "video/ogg",
  "audio/ogg",
  "audio/ogg; codecs=opus",
  "application/ogg",
  "audio/flac",
  "audio/ape",
  "audio/wavpack",
  "audio/amr",
  "application/pdf",
  "application/x-elf",
  "application/x-mach-binary",
  "application/x-msdownload",
  "application/x-shockwave-flash",
  "application/rtf",
  "application/wasm",
  "font/woff",
  "font/woff2",
  "application/vnd.ms-fontobject",
  "font/ttf",
  "font/otf",
  "font/collection",
  "image/x-icon",
  "video/x-flv",
  "application/postscript",
  "application/eps",
  "application/x-xz",
  "application/x-sqlite3",
  "application/x-nintendo-nes-rom",
  "application/x-google-chrome-extension",
  "application/vnd.ms-cab-compressed",
  "application/x-deb",
  "application/x-unix-archive",
  "application/x-rpm",
  "application/x-compress",
  "application/x-lzip",
  "application/x-cfb",
  "application/x-mie",
  "application/mxf",
  "video/mp2t",
  "application/x-blender",
  "image/bpg",
  "image/j2c",
  "image/jp2",
  "image/jpx",
  "image/jpm",
  "image/mj2",
  "audio/aiff",
  "application/xml",
  "application/x-mobipocket-ebook",
  "image/heif",
  "image/heif-sequence",
  "image/heic",
  "image/heic-sequence",
  "image/icns",
  "image/ktx",
  "application/dicom",
  "audio/x-musepack",
  "text/calendar",
  "text/vcard",
  "text/vtt",
  "model/gltf-binary",
  "application/vnd.tcpdump.pcap",
  "audio/x-dsf",
  // Non-standard
  "application/x.ms.shortcut",
  // Invented by us
  "application/x.apple.alias",
  // Invented by us
  "audio/x-voc",
  "audio/vnd.dolby.dd-raw",
  "audio/x-m4a",
  "image/apng",
  "image/x-olympus-orf",
  "image/x-sony-arw",
  "image/x-adobe-dng",
  "image/x-nikon-nef",
  "image/x-panasonic-rw2",
  "image/x-fujifilm-raf",
  "video/x-m4v",
  "video/3gpp2",
  "application/x-esri-shape",
  "audio/aac",
  "audio/x-it",
  "audio/x-s3m",
  "audio/x-xm",
  "video/MP1S",
  "video/MP2P",
  "application/vnd.sketchup.skp",
  "image/avif",
  "application/x-lzh-compressed",
  "application/pgp-encrypted",
  "application/x-asar",
  "model/stl",
  "application/vnd.ms-htmlhelp",
  "model/3mf",
  "image/jxl",
  "application/zstd",
  "image/jls",
  "application/vnd.ms-outlook",
  "image/vnd.dwg",
  "application/vnd.apache.parquet",
  "application/java-vm",
  "application/x-arj",
  "application/x-cpio",
  "application/x-ace-compressed",
  "application/avro",
  "application/vnd.iccprofile",
  "application/x.autodesk.fbx",
  // Invented by us
  "application/vnd.visio",
  "application/vnd.android.package-archive",
  "application/vnd.google.draco",
  // Invented by us
  "application/x-lz4",
  // Invented by us
  "application/vnd.openxmlformats-officedocument.presentationml.template",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
  "application/vnd.ms-excel.template.macroenabled.12",
  "application/vnd.oasis.opendocument.text-template",
  "application/vnd.oasis.opendocument.spreadsheet-template",
  "application/vnd.oasis.opendocument.presentation-template",
  "application/vnd.oasis.opendocument.graphics",
  "application/vnd.oasis.opendocument.graphics-template",
  "application/vnd.ms-excel.sheet.macroenabled.12",
  "application/vnd.ms-word.document.macroenabled.12",
  "application/vnd.ms-word.template.macroenabled.12",
  "application/vnd.ms-powerpoint.template.macroenabled.12",
  "application/vnd.ms-powerpoint.presentation.macroenabled.12",
  "application/java-archive",
  "application/vnd.rn-realmedia",
  "application/x-spss-sav",
  "application/x-ms-regedit",
  "application/x-ft-windows-registry-hive",
  "application/x-jmp-data"
], xr = 4100;
async function bn(r, e) {
  return new ja(e).fromBuffer(r);
}
function Tr(r) {
  switch (r = r.toLowerCase(), r) {
    case "application/epub+zip":
      return {
        ext: "epub",
        mime: r
      };
    case "application/vnd.oasis.opendocument.text":
      return {
        ext: "odt",
        mime: r
      };
    case "application/vnd.oasis.opendocument.text-template":
      return {
        ext: "ott",
        mime: r
      };
    case "application/vnd.oasis.opendocument.spreadsheet":
      return {
        ext: "ods",
        mime: r
      };
    case "application/vnd.oasis.opendocument.spreadsheet-template":
      return {
        ext: "ots",
        mime: r
      };
    case "application/vnd.oasis.opendocument.presentation":
      return {
        ext: "odp",
        mime: r
      };
    case "application/vnd.oasis.opendocument.presentation-template":
      return {
        ext: "otp",
        mime: r
      };
    case "application/vnd.oasis.opendocument.graphics":
      return {
        ext: "odg",
        mime: r
      };
    case "application/vnd.oasis.opendocument.graphics-template":
      return {
        ext: "otg",
        mime: r
      };
    case "application/vnd.openxmlformats-officedocument.presentationml.slideshow":
      return {
        ext: "ppsx",
        mime: r
      };
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return {
        ext: "xlsx",
        mime: r
      };
    case "application/vnd.ms-excel.sheet.macroenabled":
      return {
        ext: "xlsm",
        mime: "application/vnd.ms-excel.sheet.macroenabled.12"
      };
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.template":
      return {
        ext: "xltx",
        mime: r
      };
    case "application/vnd.ms-excel.template.macroenabled":
      return {
        ext: "xltm",
        mime: "application/vnd.ms-excel.template.macroenabled.12"
      };
    case "application/vnd.ms-powerpoint.slideshow.macroenabled":
      return {
        ext: "ppsm",
        mime: "application/vnd.ms-powerpoint.slideshow.macroenabled.12"
      };
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return {
        ext: "docx",
        mime: r
      };
    case "application/vnd.ms-word.document.macroenabled":
      return {
        ext: "docm",
        mime: "application/vnd.ms-word.document.macroenabled.12"
      };
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.template":
      return {
        ext: "dotx",
        mime: r
      };
    case "application/vnd.ms-word.template.macroenabledtemplate":
      return {
        ext: "dotm",
        mime: "application/vnd.ms-word.template.macroenabled.12"
      };
    case "application/vnd.openxmlformats-officedocument.presentationml.template":
      return {
        ext: "potx",
        mime: r
      };
    case "application/vnd.ms-powerpoint.template.macroenabled":
      return {
        ext: "potm",
        mime: "application/vnd.ms-powerpoint.template.macroenabled.12"
      };
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      return {
        ext: "pptx",
        mime: r
      };
    case "application/vnd.ms-powerpoint.presentation.macroenabled":
      return {
        ext: "pptm",
        mime: "application/vnd.ms-powerpoint.presentation.macroenabled.12"
      };
    case "application/vnd.ms-visio.drawing":
      return {
        ext: "vsdx",
        mime: "application/vnd.visio"
      };
    case "application/vnd.ms-package.3dmanufacturing-3dmodel+xml":
      return {
        ext: "3mf",
        mime: "model/3mf"
      };
  }
}
function ge(r, e, t) {
  t = {
    offset: 0,
    ...t
  };
  for (const [i, n] of e.entries())
    if (t.mask) {
      if (n !== (t.mask[i] & r[i + t.offset]))
        return !1;
    } else if (n !== r[i + t.offset])
      return !1;
  return !0;
}
class ja {
  constructor(e) {
    // Detections with a high degree of certainty in identifying the correct file type
    L(this, "detectConfident", async (e) => {
      if (this.buffer = new Uint8Array(xr), e.fileInfo.size === void 0 && (e.fileInfo.size = Number.MAX_SAFE_INTEGER), this.tokenizer = e, await e.peekBuffer(this.buffer, { length: 32, mayBeLess: !0 }), this.check([66, 77]))
        return {
          ext: "bmp",
          mime: "image/bmp"
        };
      if (this.check([11, 119]))
        return {
          ext: "ac3",
          mime: "audio/vnd.dolby.dd-raw"
        };
      if (this.check([120, 1]))
        return {
          ext: "dmg",
          mime: "application/x-apple-diskimage"
        };
      if (this.check([77, 90]))
        return {
          ext: "exe",
          mime: "application/x-msdownload"
        };
      if (this.check([37, 33]))
        return await e.peekBuffer(this.buffer, { length: 24, mayBeLess: !0 }), this.checkString("PS-Adobe-", { offset: 2 }) && this.checkString(" EPSF-", { offset: 14 }) ? {
          ext: "eps",
          mime: "application/eps"
        } : {
          ext: "ps",
          mime: "application/postscript"
        };
      if (this.check([31, 160]) || this.check([31, 157]))
        return {
          ext: "Z",
          mime: "application/x-compress"
        };
      if (this.check([199, 113]))
        return {
          ext: "cpio",
          mime: "application/x-cpio"
        };
      if (this.check([96, 234]))
        return {
          ext: "arj",
          mime: "application/x-arj"
        };
      if (this.check([239, 187, 191]))
        return this.tokenizer.ignore(3), this.detectConfident(e);
      if (this.check([71, 73, 70]))
        return {
          ext: "gif",
          mime: "image/gif"
        };
      if (this.check([73, 73, 188]))
        return {
          ext: "jxr",
          mime: "image/vnd.ms-photo"
        };
      if (this.check([31, 139, 8])) {
        const i = new ka(e).inflate();
        let n = !0;
        try {
          let a;
          try {
            a = await this.fromStream(i);
          } catch {
            n = !1;
          }
          if (a && a.ext === "tar")
            return {
              ext: "tar.gz",
              mime: "application/gzip"
            };
        } finally {
          n && await i.cancel();
        }
        return {
          ext: "gz",
          mime: "application/gzip"
        };
      }
      if (this.check([66, 90, 104]))
        return {
          ext: "bz2",
          mime: "application/x-bzip2"
        };
      if (this.checkString("ID3")) {
        await e.ignore(6);
        const t = await e.readToken(Da);
        return e.position + t > e.fileInfo.size ? {
          ext: "mp3",
          mime: "audio/mpeg"
        } : (await e.ignore(t), this.fromTokenizer(e));
      }
      if (this.checkString("MP+"))
        return {
          ext: "mpc",
          mime: "audio/x-musepack"
        };
      if ((this.buffer[0] === 67 || this.buffer[0] === 70) && this.check([87, 83], { offset: 1 }))
        return {
          ext: "swf",
          mime: "application/x-shockwave-flash"
        };
      if (this.check([255, 216, 255]))
        return this.check([247], { offset: 3 }) ? {
          ext: "jls",
          mime: "image/jls"
        } : {
          ext: "jpg",
          mime: "image/jpeg"
        };
      if (this.check([79, 98, 106, 1]))
        return {
          ext: "avro",
          mime: "application/avro"
        };
      if (this.checkString("FLIF"))
        return {
          ext: "flif",
          mime: "image/flif"
        };
      if (this.checkString("8BPS"))
        return {
          ext: "psd",
          mime: "image/vnd.adobe.photoshop"
        };
      if (this.checkString("MPCK"))
        return {
          ext: "mpc",
          mime: "audio/x-musepack"
        };
      if (this.checkString("FORM"))
        return {
          ext: "aif",
          mime: "audio/aiff"
        };
      if (this.checkString("icns", { offset: 0 }))
        return {
          ext: "icns",
          mime: "image/icns"
        };
      if (this.check([80, 75, 3, 4])) {
        let t;
        return await new Qr(e).unzip((i) => {
          switch (i.filename) {
            case "META-INF/mozilla.rsa":
              return t = {
                ext: "xpi",
                mime: "application/x-xpinstall"
              }, {
                stop: !0
              };
            case "META-INF/MANIFEST.MF":
              return t = {
                ext: "jar",
                mime: "application/java-archive"
              }, {
                stop: !0
              };
            case "mimetype":
              return {
                async handler(n) {
                  const a = new TextDecoder("utf-8").decode(n).trim();
                  t = Tr(a);
                },
                stop: !0
              };
            case "[Content_Types].xml":
              return {
                async handler(n) {
                  let a = new TextDecoder("utf-8").decode(n);
                  const s = a.indexOf('.main+xml"');
                  if (s === -1) {
                    const o = "application/vnd.ms-package.3dmanufacturing-3dmodel+xml";
                    a.includes(`ContentType="${o}"`) && (t = Tr(o));
                  } else {
                    a = a.slice(0, Math.max(0, s));
                    const o = a.lastIndexOf('"'), c = a.slice(Math.max(0, o + 1));
                    t = Tr(c);
                  }
                },
                stop: !0
              };
            default:
              return /classes\d*\.dex/.test(i.filename) ? (t = {
                ext: "apk",
                mime: "application/vnd.android.package-archive"
              }, { stop: !0 }) : {};
          }
        }).catch((i) => {
          if (!(i instanceof Q))
            throw i;
        }), t ?? {
          ext: "zip",
          mime: "application/zip"
        };
      }
      if (this.checkString("OggS")) {
        await e.ignore(28);
        const t = new Uint8Array(8);
        return await e.readBuffer(t), ge(t, [79, 112, 117, 115, 72, 101, 97, 100]) ? {
          ext: "opus",
          mime: "audio/ogg; codecs=opus"
        } : ge(t, [128, 116, 104, 101, 111, 114, 97]) ? {
          ext: "ogv",
          mime: "video/ogg"
        } : ge(t, [1, 118, 105, 100, 101, 111, 0]) ? {
          ext: "ogm",
          mime: "video/ogg"
        } : ge(t, [127, 70, 76, 65, 67]) ? {
          ext: "oga",
          mime: "audio/ogg"
        } : ge(t, [83, 112, 101, 101, 120, 32, 32]) ? {
          ext: "spx",
          mime: "audio/ogg"
        } : ge(t, [1, 118, 111, 114, 98, 105, 115]) ? {
          ext: "ogg",
          mime: "audio/ogg"
        } : {
          ext: "ogx",
          mime: "application/ogg"
        };
      }
      if (this.check([80, 75]) && (this.buffer[2] === 3 || this.buffer[2] === 5 || this.buffer[2] === 7) && (this.buffer[3] === 4 || this.buffer[3] === 6 || this.buffer[3] === 8))
        return {
          ext: "zip",
          mime: "application/zip"
        };
      if (this.checkString("MThd"))
        return {
          ext: "mid",
          mime: "audio/midi"
        };
      if (this.checkString("wOFF") && (this.check([0, 1, 0, 0], { offset: 4 }) || this.checkString("OTTO", { offset: 4 })))
        return {
          ext: "woff",
          mime: "font/woff"
        };
      if (this.checkString("wOF2") && (this.check([0, 1, 0, 0], { offset: 4 }) || this.checkString("OTTO", { offset: 4 })))
        return {
          ext: "woff2",
          mime: "font/woff2"
        };
      if (this.check([212, 195, 178, 161]) || this.check([161, 178, 195, 212]))
        return {
          ext: "pcap",
          mime: "application/vnd.tcpdump.pcap"
        };
      if (this.checkString("DSD "))
        return {
          ext: "dsf",
          mime: "audio/x-dsf"
          // Non-standard
        };
      if (this.checkString("LZIP"))
        return {
          ext: "lz",
          mime: "application/x-lzip"
        };
      if (this.checkString("fLaC"))
        return {
          ext: "flac",
          mime: "audio/flac"
        };
      if (this.check([66, 80, 71, 251]))
        return {
          ext: "bpg",
          mime: "image/bpg"
        };
      if (this.checkString("wvpk"))
        return {
          ext: "wv",
          mime: "audio/wavpack"
        };
      if (this.checkString("%PDF"))
        return {
          ext: "pdf",
          mime: "application/pdf"
        };
      if (this.check([0, 97, 115, 109]))
        return {
          ext: "wasm",
          mime: "application/wasm"
        };
      if (this.check([73, 73])) {
        const t = await this.readTiffHeader(!1);
        if (t)
          return t;
      }
      if (this.check([77, 77])) {
        const t = await this.readTiffHeader(!0);
        if (t)
          return t;
      }
      if (this.checkString("MAC "))
        return {
          ext: "ape",
          mime: "audio/ape"
        };
      if (this.check([26, 69, 223, 163])) {
        async function t() {
          const o = await e.peekNumber(Fe);
          let c = 128, l = 0;
          for (; !(o & c) && c !== 0; )
            ++l, c >>= 1;
          const u = new Uint8Array(l + 1);
          return await e.readBuffer(u), u;
        }
        async function i() {
          const o = await t(), c = await t();
          c[0] ^= 128 >> c.length - 1;
          const l = Math.min(6, c.length), u = new DataView(o.buffer), h = new DataView(c.buffer, c.length - l, l);
          return {
            id: Br(u),
            len: Br(h)
          };
        }
        async function n(o) {
          for (; o > 0; ) {
            const c = await i();
            if (c.id === 17026)
              return (await e.readToken(new H(c.len))).replaceAll(/\00.*$/g, "");
            await e.ignore(c.len), --o;
          }
        }
        const a = await i();
        switch (await n(a.len)) {
          case "webm":
            return {
              ext: "webm",
              mime: "video/webm"
            };
          case "matroska":
            return {
              ext: "mkv",
              mime: "video/matroska"
            };
          default:
            return;
        }
      }
      if (this.checkString("SQLi"))
        return {
          ext: "sqlite",
          mime: "application/x-sqlite3"
        };
      if (this.check([78, 69, 83, 26]))
        return {
          ext: "nes",
          mime: "application/x-nintendo-nes-rom"
        };
      if (this.checkString("Cr24"))
        return {
          ext: "crx",
          mime: "application/x-google-chrome-extension"
        };
      if (this.checkString("MSCF") || this.checkString("ISc("))
        return {
          ext: "cab",
          mime: "application/vnd.ms-cab-compressed"
        };
      if (this.check([237, 171, 238, 219]))
        return {
          ext: "rpm",
          mime: "application/x-rpm"
        };
      if (this.check([197, 208, 211, 198]))
        return {
          ext: "eps",
          mime: "application/eps"
        };
      if (this.check([40, 181, 47, 253]))
        return {
          ext: "zst",
          mime: "application/zstd"
        };
      if (this.check([127, 69, 76, 70]))
        return {
          ext: "elf",
          mime: "application/x-elf"
        };
      if (this.check([33, 66, 68, 78]))
        return {
          ext: "pst",
          mime: "application/vnd.ms-outlook"
        };
      if (this.checkString("PAR1") || this.checkString("PARE"))
        return {
          ext: "parquet",
          mime: "application/vnd.apache.parquet"
        };
      if (this.checkString("ttcf"))
        return {
          ext: "ttc",
          mime: "font/collection"
        };
      if (this.check([254, 237, 250, 206]) || this.check([254, 237, 250, 207]) || this.check([206, 250, 237, 254]) || this.check([207, 250, 237, 254]))
        return {
          ext: "macho",
          mime: "application/x-mach-binary"
        };
      if (this.check([4, 34, 77, 24]))
        return {
          ext: "lz4",
          mime: "application/x-lz4"
          // Invented by us
        };
      if (this.checkString("regf"))
        return {
          ext: "dat",
          mime: "application/x-ft-windows-registry-hive"
        };
      if (this.checkString("$FL2") || this.checkString("$FL3"))
        return {
          ext: "sav",
          mime: "application/x-spss-sav"
        };
      if (this.check([79, 84, 84, 79, 0]))
        return {
          ext: "otf",
          mime: "font/otf"
        };
      if (this.checkString("#!AMR"))
        return {
          ext: "amr",
          mime: "audio/amr"
        };
      if (this.checkString("{\\rtf"))
        return {
          ext: "rtf",
          mime: "application/rtf"
        };
      if (this.check([70, 76, 86, 1]))
        return {
          ext: "flv",
          mime: "video/x-flv"
        };
      if (this.checkString("IMPM"))
        return {
          ext: "it",
          mime: "audio/x-it"
        };
      if (this.checkString("-lh0-", { offset: 2 }) || this.checkString("-lh1-", { offset: 2 }) || this.checkString("-lh2-", { offset: 2 }) || this.checkString("-lh3-", { offset: 2 }) || this.checkString("-lh4-", { offset: 2 }) || this.checkString("-lh5-", { offset: 2 }) || this.checkString("-lh6-", { offset: 2 }) || this.checkString("-lh7-", { offset: 2 }) || this.checkString("-lzs-", { offset: 2 }) || this.checkString("-lz4-", { offset: 2 }) || this.checkString("-lz5-", { offset: 2 }) || this.checkString("-lhd-", { offset: 2 }))
        return {
          ext: "lzh",
          mime: "application/x-lzh-compressed"
        };
      if (this.check([0, 0, 1, 186])) {
        if (this.check([33], { offset: 4, mask: [241] }))
          return {
            ext: "mpg",
            // May also be .ps, .mpeg
            mime: "video/MP1S"
          };
        if (this.check([68], { offset: 4, mask: [196] }))
          return {
            ext: "mpg",
            // May also be .mpg, .m2p, .vob or .sub
            mime: "video/MP2P"
          };
      }
      if (this.checkString("ITSF"))
        return {
          ext: "chm",
          mime: "application/vnd.ms-htmlhelp"
        };
      if (this.check([202, 254, 186, 190])) {
        const t = xt.get(this.buffer, 4), i = Ae.get(this.buffer, 6);
        if (t > 0 && t <= 30)
          return {
            ext: "macho",
            mime: "application/x-mach-binary"
          };
        if (i > 30)
          return {
            ext: "class",
            mime: "application/java-vm"
          };
      }
      if (this.checkString(".RMF"))
        return {
          ext: "rm",
          mime: "application/vnd.rn-realmedia"
        };
      if (this.checkString("DRACO"))
        return {
          ext: "drc",
          mime: "application/vnd.google.draco"
          // Invented by us
        };
      if (this.check([253, 55, 122, 88, 90, 0]))
        return {
          ext: "xz",
          mime: "application/x-xz"
        };
      if (this.checkString("<?xml "))
        return {
          ext: "xml",
          mime: "application/xml"
        };
      if (this.check([55, 122, 188, 175, 39, 28]))
        return {
          ext: "7z",
          mime: "application/x-7z-compressed"
        };
      if (this.check([82, 97, 114, 33, 26, 7]) && (this.buffer[6] === 0 || this.buffer[6] === 1))
        return {
          ext: "rar",
          mime: "application/x-rar-compressed"
        };
      if (this.checkString("solid "))
        return {
          ext: "stl",
          mime: "model/stl"
        };
      if (this.checkString("AC")) {
        const t = new H(4, "latin1").get(this.buffer, 2);
        if (t.match("^d*") && t >= 1e3 && t <= 1050)
          return {
            ext: "dwg",
            mime: "image/vnd.dwg"
          };
      }
      if (this.checkString("070707"))
        return {
          ext: "cpio",
          mime: "application/x-cpio"
        };
      if (this.checkString("BLENDER"))
        return {
          ext: "blend",
          mime: "application/x-blender"
        };
      if (this.checkString("!<arch>"))
        return await e.ignore(8), await e.readToken(new H(13, "ascii")) === "debian-binary" ? {
          ext: "deb",
          mime: "application/x-deb"
        } : {
          ext: "ar",
          mime: "application/x-unix-archive"
        };
      if (this.checkString("WEBVTT") && // One of LF, CR, tab, space, or end of file must follow "WEBVTT" per the spec (see `fixture/fixture-vtt-*.vtt` for examples). Note that `\0` is technically the null character (there is no such thing as an EOF character). However, checking for `\0` gives us the same result as checking for the end of the stream.
      [`
`, "\r", "	", " ", "\0"].some((t) => this.checkString(t, { offset: 6 })))
        return {
          ext: "vtt",
          mime: "text/vtt"
        };
      if (this.check([137, 80, 78, 71, 13, 10, 26, 10])) {
        await e.ignore(8);
        async function t() {
          return {
            length: await e.readToken(gn),
            type: await e.readToken(new H(4, "latin1"))
          };
        }
        do {
          const i = await t();
          if (i.length < 0)
            return;
          switch (i.type) {
            case "IDAT":
              return {
                ext: "png",
                mime: "image/png"
              };
            case "acTL":
              return {
                ext: "apng",
                mime: "image/apng"
              };
            default:
              await e.ignore(i.length + 4);
          }
        } while (e.position + 8 < e.fileInfo.size);
        return {
          ext: "png",
          mime: "image/png"
        };
      }
      if (this.check([65, 82, 82, 79, 87, 49, 0, 0]))
        return {
          ext: "arrow",
          mime: "application/vnd.apache.arrow.file"
        };
      if (this.check([103, 108, 84, 70, 2, 0, 0, 0]))
        return {
          ext: "glb",
          mime: "model/gltf-binary"
        };
      if (this.check([102, 114, 101, 101], { offset: 4 }) || this.check([109, 100, 97, 116], { offset: 4 }) || this.check([109, 111, 111, 118], { offset: 4 }) || this.check([119, 105, 100, 101], { offset: 4 }))
        return {
          ext: "mov",
          mime: "video/quicktime"
        };
      if (this.check([73, 73, 82, 79, 8, 0, 0, 0, 24]))
        return {
          ext: "orf",
          mime: "image/x-olympus-orf"
        };
      if (this.checkString("gimp xcf "))
        return {
          ext: "xcf",
          mime: "image/x-xcf"
        };
      if (this.checkString("ftyp", { offset: 4 }) && this.buffer[8] & 96) {
        const t = new H(4, "latin1").get(this.buffer, 8).replace("\0", " ").trim();
        switch (t) {
          case "avif":
          case "avis":
            return { ext: "avif", mime: "image/avif" };
          case "mif1":
            return { ext: "heic", mime: "image/heif" };
          case "msf1":
            return { ext: "heic", mime: "image/heif-sequence" };
          case "heic":
          case "heix":
            return { ext: "heic", mime: "image/heic" };
          case "hevc":
          case "hevx":
            return { ext: "heic", mime: "image/heic-sequence" };
          case "qt":
            return { ext: "mov", mime: "video/quicktime" };
          case "M4V":
          case "M4VH":
          case "M4VP":
            return { ext: "m4v", mime: "video/x-m4v" };
          case "M4P":
            return { ext: "m4p", mime: "video/mp4" };
          case "M4B":
            return { ext: "m4b", mime: "audio/mp4" };
          case "M4A":
            return { ext: "m4a", mime: "audio/x-m4a" };
          case "F4V":
            return { ext: "f4v", mime: "video/mp4" };
          case "F4P":
            return { ext: "f4p", mime: "video/mp4" };
          case "F4A":
            return { ext: "f4a", mime: "audio/mp4" };
          case "F4B":
            return { ext: "f4b", mime: "audio/mp4" };
          case "crx":
            return { ext: "cr3", mime: "image/x-canon-cr3" };
          default:
            return t.startsWith("3g") ? t.startsWith("3g2") ? { ext: "3g2", mime: "video/3gpp2" } : { ext: "3gp", mime: "video/3gpp" } : { ext: "mp4", mime: "video/mp4" };
        }
      }
      if (this.checkString(`REGEDIT4\r
`))
        return {
          ext: "reg",
          mime: "application/x-ms-regedit"
        };
      if (this.check([82, 73, 70, 70])) {
        if (this.checkString("WEBP", { offset: 8 }))
          return {
            ext: "webp",
            mime: "image/webp"
          };
        if (this.check([65, 86, 73], { offset: 8 }))
          return {
            ext: "avi",
            mime: "video/vnd.avi"
          };
        if (this.check([87, 65, 86, 69], { offset: 8 }))
          return {
            ext: "wav",
            mime: "audio/wav"
          };
        if (this.check([81, 76, 67, 77], { offset: 8 }))
          return {
            ext: "qcp",
            mime: "audio/qcelp"
          };
      }
      if (this.check([73, 73, 85, 0, 24, 0, 0, 0, 136, 231, 116, 216]))
        return {
          ext: "rw2",
          mime: "image/x-panasonic-rw2"
        };
      if (this.check([48, 38, 178, 117, 142, 102, 207, 17, 166, 217])) {
        async function t() {
          const i = new Uint8Array(16);
          return await e.readBuffer(i), {
            id: i,
            size: Number(await e.readToken(yn))
          };
        }
        for (await e.ignore(30); e.position + 24 < e.fileInfo.size; ) {
          const i = await t();
          let n = i.size - 24;
          if (ge(i.id, [145, 7, 220, 183, 183, 169, 207, 17, 142, 230, 0, 192, 12, 32, 83, 101])) {
            const a = new Uint8Array(16);
            if (n -= await e.readBuffer(a), ge(a, [64, 158, 105, 248, 77, 91, 207, 17, 168, 253, 0, 128, 95, 92, 68, 43]))
              return {
                ext: "asf",
                mime: "audio/x-ms-asf"
              };
            if (ge(a, [192, 239, 25, 188, 77, 91, 207, 17, 168, 253, 0, 128, 95, 92, 68, 43]))
              return {
                ext: "asf",
                mime: "video/x-ms-asf"
              };
            break;
          }
          await e.ignore(n);
        }
        return {
          ext: "asf",
          mime: "application/vnd.ms-asf"
        };
      }
      if (this.check([171, 75, 84, 88, 32, 49, 49, 187, 13, 10, 26, 10]))
        return {
          ext: "ktx",
          mime: "image/ktx"
        };
      if ((this.check([126, 16, 4]) || this.check([126, 24, 4])) && this.check([48, 77, 73, 69], { offset: 4 }))
        return {
          ext: "mie",
          mime: "application/x-mie"
        };
      if (this.check([39, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], { offset: 2 }))
        return {
          ext: "shp",
          mime: "application/x-esri-shape"
        };
      if (this.check([255, 79, 255, 81]))
        return {
          ext: "j2c",
          mime: "image/j2c"
        };
      if (this.check([0, 0, 0, 12, 106, 80, 32, 32, 13, 10, 135, 10]))
        switch (await e.ignore(20), await e.readToken(new H(4, "ascii"))) {
          case "jp2 ":
            return {
              ext: "jp2",
              mime: "image/jp2"
            };
          case "jpx ":
            return {
              ext: "jpx",
              mime: "image/jpx"
            };
          case "jpm ":
            return {
              ext: "jpm",
              mime: "image/jpm"
            };
          case "mjp2":
            return {
              ext: "mj2",
              mime: "image/mj2"
            };
          default:
            return;
        }
      if (this.check([255, 10]) || this.check([0, 0, 0, 12, 74, 88, 76, 32, 13, 10, 135, 10]))
        return {
          ext: "jxl",
          mime: "image/jxl"
        };
      if (this.check([254, 255]))
        return this.checkString("<?xml ", { offset: 2, encoding: "utf-16be" }) ? {
          ext: "xml",
          mime: "application/xml"
        } : void 0;
      if (this.check([208, 207, 17, 224, 161, 177, 26, 225]))
        return {
          ext: "cfb",
          mime: "application/x-cfb"
        };
      if (await e.peekBuffer(this.buffer, { length: Math.min(256, e.fileInfo.size), mayBeLess: !0 }), this.check([97, 99, 115, 112], { offset: 36 }))
        return {
          ext: "icc",
          mime: "application/vnd.iccprofile"
        };
      if (this.checkString("**ACE", { offset: 7 }) && this.checkString("**", { offset: 12 }))
        return {
          ext: "ace",
          mime: "application/x-ace-compressed"
        };
      if (this.checkString("BEGIN:")) {
        if (this.checkString("VCARD", { offset: 6 }))
          return {
            ext: "vcf",
            mime: "text/vcard"
          };
        if (this.checkString("VCALENDAR", { offset: 6 }))
          return {
            ext: "ics",
            mime: "text/calendar"
          };
      }
      if (this.checkString("FUJIFILMCCD-RAW"))
        return {
          ext: "raf",
          mime: "image/x-fujifilm-raf"
        };
      if (this.checkString("Extended Module:"))
        return {
          ext: "xm",
          mime: "audio/x-xm"
        };
      if (this.checkString("Creative Voice File"))
        return {
          ext: "voc",
          mime: "audio/x-voc"
        };
      if (this.check([4, 0, 0, 0]) && this.buffer.length >= 16) {
        const t = new DataView(this.buffer.buffer).getUint32(12, !0);
        if (t > 12 && this.buffer.length >= t + 16)
          try {
            const i = new TextDecoder().decode(this.buffer.subarray(16, t + 16));
            if (JSON.parse(i).files)
              return {
                ext: "asar",
                mime: "application/x-asar"
              };
          } catch {
          }
      }
      if (this.check([6, 14, 43, 52, 2, 5, 1, 1, 13, 1, 2, 1, 1, 2]))
        return {
          ext: "mxf",
          mime: "application/mxf"
        };
      if (this.checkString("SCRM", { offset: 44 }))
        return {
          ext: "s3m",
          mime: "audio/x-s3m"
        };
      if (this.check([71]) && this.check([71], { offset: 188 }))
        return {
          ext: "mts",
          mime: "video/mp2t"
        };
      if (this.check([71], { offset: 4 }) && this.check([71], { offset: 196 }))
        return {
          ext: "mts",
          mime: "video/mp2t"
        };
      if (this.check([66, 79, 79, 75, 77, 79, 66, 73], { offset: 60 }))
        return {
          ext: "mobi",
          mime: "application/x-mobipocket-ebook"
        };
      if (this.check([68, 73, 67, 77], { offset: 128 }))
        return {
          ext: "dcm",
          mime: "application/dicom"
        };
      if (this.check([76, 0, 0, 0, 1, 20, 2, 0, 0, 0, 0, 0, 192, 0, 0, 0, 0, 0, 0, 70]))
        return {
          ext: "lnk",
          mime: "application/x.ms.shortcut"
          // Invented by us
        };
      if (this.check([98, 111, 111, 107, 0, 0, 0, 0, 109, 97, 114, 107, 0, 0, 0, 0]))
        return {
          ext: "alias",
          mime: "application/x.apple.alias"
          // Invented by us
        };
      if (this.checkString("Kaydara FBX Binary  \0"))
        return {
          ext: "fbx",
          mime: "application/x.autodesk.fbx"
          // Invented by us
        };
      if (this.check([76, 80], { offset: 34 }) && (this.check([0, 0, 1], { offset: 8 }) || this.check([1, 0, 2], { offset: 8 }) || this.check([2, 0, 2], { offset: 8 })))
        return {
          ext: "eot",
          mime: "application/vnd.ms-fontobject"
        };
      if (this.check([6, 6, 237, 245, 216, 29, 70, 229, 189, 49, 239, 231, 254, 116, 183, 29]))
        return {
          ext: "indd",
          mime: "application/x-indesign"
        };
      if (this.check([255, 255, 0, 0, 7, 0, 0, 0, 4, 0, 0, 0, 1, 0, 1, 0]) || this.check([0, 0, 255, 255, 0, 0, 0, 7, 0, 0, 0, 4, 0, 1, 0, 1]))
        return {
          ext: "jmp",
          mime: "application/x-jmp-data"
        };
      if (await e.peekBuffer(this.buffer, { length: Math.min(512, e.fileInfo.size), mayBeLess: !0 }), this.checkString("ustar", { offset: 257 }) && (this.checkString("\0", { offset: 262 }) || this.checkString(" ", { offset: 262 })) || this.check([0, 0, 0, 0, 0, 0], { offset: 257 }) && Pa(this.buffer))
        return {
          ext: "tar",
          mime: "application/x-tar"
        };
      if (this.check([255, 254])) {
        const t = "utf-16le";
        return this.checkString("<?xml ", { offset: 2, encoding: t }) ? {
          ext: "xml",
          mime: "application/xml"
        } : this.check([255, 14], { offset: 2 }) && this.checkString("SketchUp Model", { offset: 4, encoding: t }) ? {
          ext: "skp",
          mime: "application/vnd.sketchup.skp"
        } : this.checkString(`Windows Registry Editor Version 5.00\r
`, { offset: 2, encoding: t }) ? {
          ext: "reg",
          mime: "application/x-ms-regedit"
        } : void 0;
      }
      if (this.checkString("-----BEGIN PGP MESSAGE-----"))
        return {
          ext: "pgp",
          mime: "application/pgp-encrypted"
        };
    });
    // Detections with limited supporting data, resulting in a higher likelihood of false positives
    L(this, "detectImprecise", async (e) => {
      if (this.buffer = new Uint8Array(xr), await e.peekBuffer(this.buffer, { length: Math.min(8, e.fileInfo.size), mayBeLess: !0 }), this.check([0, 0, 1, 186]) || this.check([0, 0, 1, 179]))
        return {
          ext: "mpg",
          mime: "video/mpeg"
        };
      if (this.check([0, 1, 0, 0, 0]))
        return {
          ext: "ttf",
          mime: "font/ttf"
        };
      if (this.check([0, 0, 1, 0]))
        return {
          ext: "ico",
          mime: "image/x-icon"
        };
      if (this.check([0, 0, 2, 0]))
        return {
          ext: "cur",
          mime: "image/x-icon"
        };
      if (await e.peekBuffer(this.buffer, { length: Math.min(2 + this.options.mpegOffsetTolerance, e.fileInfo.size), mayBeLess: !0 }), this.buffer.length >= 2 + this.options.mpegOffsetTolerance)
        for (let t = 0; t <= this.options.mpegOffsetTolerance; ++t) {
          const i = this.scanMpeg(t);
          if (i)
            return i;
        }
    });
    this.options = {
      mpegOffsetTolerance: 0,
      ...e
    }, this.detectors = [
      ...(e == null ? void 0 : e.customDetectors) ?? [],
      { id: "core", detect: this.detectConfident },
      { id: "core.imprecise", detect: this.detectImprecise }
    ], this.tokenizerOptions = {
      abortSignal: e == null ? void 0 : e.signal
    };
  }
  async fromTokenizer(e) {
    const t = e.position;
    for (const i of this.detectors) {
      const n = await i.detect(e);
      if (n)
        return n;
      if (t !== e.position)
        return;
    }
  }
  async fromBuffer(e) {
    if (!(e instanceof Uint8Array || e instanceof ArrayBuffer))
      throw new TypeError(`Expected the \`input\` argument to be of type \`Uint8Array\` or \`ArrayBuffer\`, got \`${typeof e}\``);
    const t = e instanceof Uint8Array ? e : new Uint8Array(e);
    if ((t == null ? void 0 : t.length) > 1)
      return this.fromTokenizer(Lr(t, this.tokenizerOptions));
  }
  async fromBlob(e) {
    const t = Ds(e, this.tokenizerOptions);
    try {
      return await this.fromTokenizer(t);
    } finally {
      await t.close();
    }
  }
  async fromStream(e) {
    const t = Ps(e, this.tokenizerOptions);
    try {
      return await this.fromTokenizer(t);
    } finally {
      await t.close();
    }
  }
  async toDetectionStream(e, t) {
    const { sampleSize: i = xr } = t;
    let n, a;
    const s = e.getReader({ mode: "byob" });
    try {
      const { value: l, done: u } = await s.read(new Uint8Array(i));
      if (a = l, !u && l)
        try {
          n = await this.fromBuffer(l.subarray(0, i));
        } catch (h) {
          if (!(h instanceof Q))
            throw h;
          n = void 0;
        }
      a = l;
    } finally {
      s.releaseLock();
    }
    const o = new TransformStream({
      async start(l) {
        l.enqueue(a);
      },
      transform(l, u) {
        u.enqueue(l);
      }
    }), c = e.pipeThrough(o);
    return c.fileType = n, c;
  }
  check(e, t) {
    return ge(this.buffer, e, t);
  }
  checkString(e, t) {
    return this.check(Oa(e, t == null ? void 0 : t.encoding), t);
  }
  async readTiffTag(e) {
    const t = await this.tokenizer.readToken(e ? Ae : B);
    switch (this.tokenizer.ignore(10), t) {
      case 50341:
        return {
          ext: "arw",
          mime: "image/x-sony-arw"
        };
      case 50706:
        return {
          ext: "dng",
          mime: "image/x-adobe-dng"
        };
    }
  }
  async readTiffIFD(e) {
    const t = await this.tokenizer.readToken(e ? Ae : B);
    for (let i = 0; i < t; ++i) {
      const n = await this.readTiffTag(e);
      if (n)
        return n;
    }
  }
  async readTiffHeader(e) {
    const t = (e ? Ae : B).get(this.buffer, 2), i = (e ? xt : D).get(this.buffer, 4);
    if (t === 42) {
      if (i >= 6) {
        if (this.checkString("CR", { offset: 8 }))
          return {
            ext: "cr2",
            mime: "image/x-canon-cr2"
          };
        if (i >= 8) {
          const a = (e ? Ae : B).get(this.buffer, 8), s = (e ? Ae : B).get(this.buffer, 10);
          if (a === 28 && s === 254 || a === 31 && s === 11)
            return {
              ext: "nef",
              mime: "image/x-nikon-nef"
            };
        }
      }
      return await this.tokenizer.ignore(i), await this.readTiffIFD(e) ?? {
        ext: "tif",
        mime: "image/tiff"
      };
    }
    if (t === 43)
      return {
        ext: "tif",
        mime: "image/tiff"
      };
  }
  /**
  	Scan check MPEG 1 or 2 Layer 3 header, or 'layer 0' for ADTS (MPEG sync-word 0xFFE).
  
  	@param offset - Offset to scan for sync-preamble.
  	@returns {{ext: string, mime: string}}
  	*/
  scanMpeg(e) {
    if (this.check([255, 224], { offset: e, mask: [255, 224] })) {
      if (this.check([16], { offset: e + 1, mask: [22] }))
        return this.check([8], { offset: e + 1, mask: [8] }) ? {
          ext: "aac",
          mime: "audio/aac"
        } : {
          ext: "aac",
          mime: "audio/aac"
        };
      if (this.check([2], { offset: e + 1, mask: [6] }))
        return {
          ext: "mp3",
          mime: "audio/mpeg"
        };
      if (this.check([4], { offset: e + 1, mask: [6] }))
        return {
          ext: "mp2",
          mime: "audio/mpeg"
        };
      if (this.check([6], { offset: e + 1, mask: [6] }))
        return {
          ext: "mp1",
          mime: "audio/mpeg"
        };
    }
  }
}
new Set(Ua);
new Set(La);
var ei = {};
/*!
 * content-type
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
var yi = /; *([!#$%&'*+.^_`|~0-9A-Za-z-]+) *= *("(?:[\u000b\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u000b\u0020-\u00ff])*"|[!#$%&'*+.^_`|~0-9A-Za-z-]+) */g, Na = /^[\u000b\u0020-\u007e\u0080-\u00ff]+$/, _n = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/, Ba = /\\([\u000b\u0020-\u00ff])/g, $a = /([\\"])/g, xn = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
ei.format = Ma;
ei.parse = Fa;
function Ma(r) {
  if (!r || typeof r != "object")
    throw new TypeError("argument obj is required");
  var e = r.parameters, t = r.type;
  if (!t || !xn.test(t))
    throw new TypeError("invalid type");
  var i = t;
  if (e && typeof e == "object")
    for (var n, a = Object.keys(e).sort(), s = 0; s < a.length; s++) {
      if (n = a[s], !_n.test(n))
        throw new TypeError("invalid parameter name");
      i += "; " + n + "=" + qa(e[n]);
    }
  return i;
}
function Fa(r) {
  if (!r)
    throw new TypeError("argument string is required");
  var e = typeof r == "object" ? za(r) : r;
  if (typeof e != "string")
    throw new TypeError("argument string is required to be a string");
  var t = e.indexOf(";"), i = t !== -1 ? e.slice(0, t).trim() : e.trim();
  if (!xn.test(i))
    throw new TypeError("invalid media type");
  var n = new Ga(i.toLowerCase());
  if (t !== -1) {
    var a, s, o;
    for (yi.lastIndex = t; s = yi.exec(e); ) {
      if (s.index !== t)
        throw new TypeError("invalid parameter format");
      t += s[0].length, a = s[1].toLowerCase(), o = s[2], o.charCodeAt(0) === 34 && (o = o.slice(1, -1), o.indexOf("\\") !== -1 && (o = o.replace(Ba, "$1"))), n.parameters[a] = o;
    }
    if (t !== e.length)
      throw new TypeError("invalid parameter format");
  }
  return n;
}
function za(r) {
  var e;
  if (typeof r.getHeader == "function" ? e = r.getHeader("content-type") : typeof r.headers == "object" && (e = r.headers && r.headers["content-type"]), typeof e != "string")
    throw new TypeError("content-type header is missing from object");
  return e;
}
function qa(r) {
  var e = String(r);
  if (_n.test(e))
    return e;
  if (e.length > 0 && !Na.test(e))
    throw new TypeError("invalid parameter value");
  return '"' + e.replace($a, "\\$1") + '"';
}
function Ga(r) {
  this.parameters = /* @__PURE__ */ Object.create(null), this.type = r;
}
/*!
 * media-typer
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * MIT Licensed
 */
var Wa = /^ *([A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126})\/([A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}) *$/, Ka = Va;
function Va(r) {
  if (!r)
    throw new TypeError("argument string is required");
  if (typeof r != "string")
    throw new TypeError("argument string is required to be a string");
  var e = Wa.exec(r.toLowerCase());
  if (!e)
    throw new TypeError("invalid media type");
  var t = e[1], i = e[2], n, a = i.lastIndexOf("+");
  return a !== -1 && (n = i.substr(a + 1), i = i.substr(0, a)), new Ha(t, i, n);
}
function Ha(r, e, t) {
  this.type = r, this.subtype = e, this.suffix = t;
}
const Ah = {
  10: "shot",
  20: "scene",
  30: "track",
  40: "part",
  50: "album",
  60: "edition",
  70: "collection"
}, we = {
  video: 1,
  audio: 2,
  complex: 3,
  logo: 4,
  subtitle: 17,
  button: 18,
  control: 32
}, Xa = {
  [we.video]: "video",
  [we.audio]: "audio",
  [we.complex]: "complex",
  [we.logo]: "logo",
  [we.subtitle]: "subtitle",
  [we.button]: "button",
  [we.control]: "control"
}, Ot = (r) => class extends Error {
  constructor(t) {
    super(t), this.name = r;
  }
};
class Tn extends Ot("CouldNotDetermineFileTypeError") {
}
class kn extends Ot("UnsupportedFileTypeError") {
}
class Ja extends Ot("UnexpectedFileContentError") {
  constructor(e, t) {
    super(t), this.fileType = e;
  }
  // Override toString to include file type information.
  toString() {
    return `${this.name} (FileType: ${this.fileType}): ${this.message}`;
  }
}
class ti extends Ot("FieldDecodingError") {
}
class Sn extends Ot("InternalParserError") {
}
const Ya = (r) => class extends Ja {
  constructor(e) {
    super(r, e);
  }
};
function mt(r, e, t) {
  return (r[e] & 1 << t) !== 0;
}
function wi(r, e) {
  const t = r.length;
  if (e === "utf-16le") {
    for (let i = 0; i + 1 < t; i += 2)
      if (r[i] === 0 && r[i + 1] === 0)
        return i;
    return t;
  }
  for (let i = 0; i < t; i++)
    if (r[i] === 0)
      return i;
  return t;
}
function Za(r) {
  const e = r.indexOf("\0");
  return e === -1 ? r : r.substring(0, e);
}
function Qa(r) {
  const e = r.length;
  if (e & 1)
    throw new ti("Buffer length must be even");
  for (let t = 0; t < e; t += 2) {
    const i = r[t];
    r[t] = r[t + 1], r[t + 1] = i;
  }
  return r;
}
function $r(r, e) {
  if (r[0] === 255 && r[1] === 254)
    return $r(r.subarray(2), e);
  if (e === "utf-16le" && r[0] === 254 && r[1] === 255) {
    if (r.length & 1)
      throw new ti("Expected even number of octets for 16-bit unicode string");
    return $r(Qa(r), e);
  }
  return new H(r.length, e).get(r, 0);
}
function Rh(r) {
  return r = r.replace(/^\x00+/g, ""), r = r.replace(/\x00+$/g, ""), r;
}
function En(r, e, t, i) {
  const n = e + ~~(t / 8), a = t % 8;
  let s = r[n];
  s &= 255 >> a;
  const o = 8 - a, c = i - o;
  return c < 0 ? s >>= 8 - a - i : c > 0 && (s <<= c, s |= En(r, e, t + o, c)), s;
}
function Ch(r, e, t) {
  return En(r, e, t, 1) === 1;
}
function eo(r) {
  const e = [];
  for (let t = 0, i = r.length; t < i; t++) {
    const n = Number(r.charCodeAt(t)).toString(16);
    e.push(n.length === 1 ? `0${n}` : n);
  }
  return e.join(" ");
}
function to(r) {
  return 10 * Math.log10(r);
}
function ro(r) {
  return 10 ** (r / 10);
}
function io(r) {
  const e = r.split(" ").map((t) => t.trim().toLowerCase());
  if (e.length >= 1) {
    const t = Number.parseFloat(e[0]);
    return e.length === 2 && e[1] === "db" ? {
      dB: t,
      ratio: ro(t)
    } : {
      dB: to(t),
      ratio: t
    };
  }
}
function Oh(r) {
  if (r.length === 0)
    throw new Error("decodeUintBE: empty Uint8Array");
  const e = new DataView(r.buffer, r.byteOffset, r.byteLength);
  return Br(e);
}
const Ph = {
  0: "Other",
  1: "32x32 pixels 'file icon' (PNG only)",
  2: "Other file icon",
  3: "Cover (front)",
  4: "Cover (back)",
  5: "Leaflet page",
  6: "Media (e.g. label side of CD)",
  7: "Lead artist/lead performer/soloist",
  8: "Artist/performer",
  9: "Conductor",
  10: "Band/Orchestra",
  11: "Composer",
  12: "Lyricist/text writer",
  13: "Recording Location",
  14: "During recording",
  15: "During performance",
  16: "Movie/video screen capture",
  17: "A bright coloured fish",
  18: "Illustration",
  19: "Band/artist logotype",
  20: "Publisher/Studio logotype"
}, An = {
  lyrics: 1
}, In = {
  notSynchronized: 0,
  milliseconds: 2
}, no = {
  get: (r, e) => r[e + 3] & 127 | r[e + 2] << 7 | r[e + 1] << 14 | r[e] << 21,
  len: 4
}, Dh = {
  len: 10,
  get: (r, e) => ({
    // ID3v2/file identifier   "ID3"
    fileIdentifier: new H(3, "ascii").get(r, e),
    // ID3v2 versionIndex
    version: {
      major: Nr.get(r, e + 3),
      revision: Nr.get(r, e + 4)
    },
    // ID3v2 flags
    flags: {
      // Unsynchronisation
      unsynchronisation: mt(r, e + 5, 7),
      // Extended header
      isExtendedHeader: mt(r, e + 5, 6),
      // Experimental indicator
      expIndicator: mt(r, e + 5, 5),
      footer: mt(r, e + 5, 4)
    },
    size: no.get(r, e + 6)
  })
}, Uh = {
  len: 10,
  get: (r, e) => ({
    // Extended header size
    size: xt.get(r, e),
    // Extended Flags
    extendedFlags: Ae.get(r, e + 4),
    // Size of padding
    sizeOfPadding: xt.get(r, e + 6),
    // CRC data present
    crcDataPresent: mt(r, e + 4, 31)
  })
}, so = {
  len: 1,
  get: (r, e) => {
    switch (r[e]) {
      case 0:
        return { encoding: "latin1" };
      case 1:
        return { encoding: "utf-16le", bom: !0 };
      case 2:
        return { encoding: "utf-16le", bom: !1 };
      case 3:
        return { encoding: "utf8", bom: !1 };
      default:
        return { encoding: "utf8", bom: !1 };
    }
  }
}, ao = {
  len: 4,
  get: (r, e) => ({
    encoding: so.get(r, e),
    language: new H(3, "latin1").get(r, e + 1)
  })
}, Lh = {
  len: 6,
  get: (r, e) => {
    const t = ao.get(r, e);
    return {
      encoding: t.encoding,
      language: t.language,
      timeStampFormat: Fe.get(r, e + 4),
      contentType: Fe.get(r, e + 5)
    };
  }
}, _ = {
  multiple: !1
}, ir = {
  year: _,
  track: _,
  disk: _,
  title: _,
  artist: _,
  artists: { multiple: !0, unique: !0 },
  albumartist: _,
  albumartists: { multiple: !0, unique: !0 },
  album: _,
  date: _,
  originaldate: _,
  originalyear: _,
  releasedate: _,
  comment: { multiple: !0, unique: !1 },
  genre: { multiple: !0, unique: !0 },
  picture: { multiple: !0, unique: !0 },
  composer: { multiple: !0, unique: !0 },
  lyrics: { multiple: !0, unique: !1 },
  albumsort: { multiple: !1, unique: !0 },
  titlesort: { multiple: !1, unique: !0 },
  work: { multiple: !1, unique: !0 },
  artistsort: { multiple: !1, unique: !0 },
  albumartistsort: { multiple: !1, unique: !0 },
  composersort: { multiple: !1, unique: !0 },
  lyricist: { multiple: !0, unique: !0 },
  writer: { multiple: !0, unique: !0 },
  conductor: { multiple: !0, unique: !0 },
  remixer: { multiple: !0, unique: !0 },
  arranger: { multiple: !0, unique: !0 },
  engineer: { multiple: !0, unique: !0 },
  producer: { multiple: !0, unique: !0 },
  technician: { multiple: !0, unique: !0 },
  djmixer: { multiple: !0, unique: !0 },
  mixer: { multiple: !0, unique: !0 },
  label: { multiple: !0, unique: !0 },
  grouping: _,
  subtitle: { multiple: !0 },
  discsubtitle: _,
  totaltracks: _,
  totaldiscs: _,
  compilation: _,
  rating: { multiple: !0 },
  bpm: _,
  mood: _,
  media: _,
  catalognumber: { multiple: !0, unique: !0 },
  tvShow: _,
  tvShowSort: _,
  tvSeason: _,
  tvEpisode: _,
  tvEpisodeId: _,
  tvNetwork: _,
  podcast: _,
  podcasturl: _,
  releasestatus: _,
  releasetype: { multiple: !0 },
  releasecountry: _,
  script: _,
  language: _,
  copyright: _,
  license: _,
  encodedby: _,
  encodersettings: _,
  gapless: _,
  barcode: _,
  isrc: { multiple: !0 },
  asin: _,
  musicbrainz_recordingid: _,
  musicbrainz_trackid: _,
  musicbrainz_albumid: _,
  musicbrainz_artistid: { multiple: !0 },
  musicbrainz_albumartistid: { multiple: !0 },
  musicbrainz_releasegroupid: _,
  musicbrainz_workid: _,
  musicbrainz_trmid: _,
  musicbrainz_discid: _,
  acoustid_id: _,
  acoustid_fingerprint: _,
  musicip_puid: _,
  musicip_fingerprint: _,
  website: _,
  "performer:instrument": { multiple: !0, unique: !0 },
  averageLevel: _,
  peakLevel: _,
  notes: { multiple: !0, unique: !1 },
  key: _,
  originalalbum: _,
  originalartist: _,
  discogs_artist_id: { multiple: !0, unique: !0 },
  discogs_release_id: _,
  discogs_label_id: _,
  discogs_master_release_id: _,
  discogs_votes: _,
  discogs_rating: _,
  replaygain_track_peak: _,
  replaygain_track_gain: _,
  replaygain_album_peak: _,
  replaygain_album_gain: _,
  replaygain_track_minmax: _,
  replaygain_album_minmax: _,
  replaygain_undo: _,
  description: { multiple: !0 },
  longDescription: _,
  category: { multiple: !0 },
  hdVideo: _,
  keywords: { multiple: !0 },
  movement: _,
  movementIndex: _,
  movementTotal: _,
  podcastId: _,
  showMovement: _,
  stik: _,
  playCounter: _
};
function oo(r) {
  return ir[r] && !ir[r].multiple;
}
function co(r) {
  return !ir[r].multiple || ir[r].unique || !1;
}
class oe {
  static toIntOrNull(e) {
    const t = Number.parseInt(e, 10);
    return Number.isNaN(t) ? null : t;
  }
  // TODO: a string of 1of1 would fail to be converted
  // converts 1/10 to no : 1, of : 10
  // or 1 to no : 1, of : 0
  static normalizeTrack(e) {
    const t = e.toString().split("/");
    return {
      no: Number.parseInt(t[0], 10) || null,
      of: Number.parseInt(t[1], 10) || null
    };
  }
  constructor(e, t) {
    this.tagTypes = e, this.tagMap = t;
  }
  /**
   * Process and set common tags
   * write common tags to
   * @param tag Native tag
   * @param warnings Register warnings
   * @return common name
   */
  mapGenericTag(e, t) {
    e = { id: e.id, value: e.value }, this.postMap(e, t);
    const i = this.getCommonName(e.id);
    return i ? { id: i, value: e.value } : null;
  }
  /**
   * Convert native tag key to common tag key
   * @param tag Native header tag
   * @return common tag name (alias)
   */
  getCommonName(e) {
    return this.tagMap[e];
  }
  /**
   * Handle post mapping exceptions / correction
   * @param tag Tag e.g. {"©alb", "Buena Vista Social Club")
   * @param warnings Used to register warnings
   */
  postMap(e, t) {
  }
}
oe.maxRatingScore = 1;
const lo = {
  title: "title",
  artist: "artist",
  album: "album",
  year: "year",
  comment: "comment",
  track: "track",
  genre: "genre"
};
class uo extends oe {
  constructor() {
    super(["ID3v1"], lo);
  }
}
class Pt extends oe {
  constructor(e, t) {
    const i = {};
    for (const n of Object.keys(t))
      i[n.toUpperCase()] = t[n];
    super(e, i);
  }
  /**
   * @tag  Native header tag
   * @return common tag name (alias)
   */
  getCommonName(e) {
    return this.tagMap[e.toUpperCase()];
  }
}
const ho = {
  // id3v2.3
  TIT2: "title",
  TPE1: "artist",
  "TXXX:Artists": "artists",
  TPE2: "albumartist",
  TALB: "album",
  TDRV: "date",
  // [ 'date', 'year' ] ToDo: improve 'year' mapping
  /**
   * Original release year
   */
  TORY: "originalyear",
  TPOS: "disk",
  TCON: "genre",
  APIC: "picture",
  TCOM: "composer",
  USLT: "lyrics",
  TSOA: "albumsort",
  TSOT: "titlesort",
  TOAL: "originalalbum",
  TSOP: "artistsort",
  TSO2: "albumartistsort",
  TSOC: "composersort",
  TEXT: "lyricist",
  "TXXX:Writer": "writer",
  TPE3: "conductor",
  // 'IPLS:instrument': 'performer:instrument', // ToDo
  TPE4: "remixer",
  "IPLS:arranger": "arranger",
  "IPLS:engineer": "engineer",
  "IPLS:producer": "producer",
  "IPLS:DJ-mix": "djmixer",
  "IPLS:mix": "mixer",
  TPUB: "label",
  TIT1: "grouping",
  TIT3: "subtitle",
  TRCK: "track",
  TCMP: "compilation",
  POPM: "rating",
  TBPM: "bpm",
  TMED: "media",
  "TXXX:CATALOGNUMBER": "catalognumber",
  "TXXX:MusicBrainz Album Status": "releasestatus",
  "TXXX:MusicBrainz Album Type": "releasetype",
  /**
   * Release country as documented: https://picard.musicbrainz.org/docs/mappings/#cite_note-0
   */
  "TXXX:MusicBrainz Album Release Country": "releasecountry",
  /**
   * Release country as implemented // ToDo: report
   */
  "TXXX:RELEASECOUNTRY": "releasecountry",
  "TXXX:SCRIPT": "script",
  TLAN: "language",
  TCOP: "copyright",
  WCOP: "license",
  TENC: "encodedby",
  TSSE: "encodersettings",
  "TXXX:BARCODE": "barcode",
  "TXXX:ISRC": "isrc",
  TSRC: "isrc",
  "TXXX:ASIN": "asin",
  "TXXX:originalyear": "originalyear",
  "UFID:http://musicbrainz.org": "musicbrainz_recordingid",
  "TXXX:MusicBrainz Release Track Id": "musicbrainz_trackid",
  "TXXX:MusicBrainz Album Id": "musicbrainz_albumid",
  "TXXX:MusicBrainz Artist Id": "musicbrainz_artistid",
  "TXXX:MusicBrainz Album Artist Id": "musicbrainz_albumartistid",
  "TXXX:MusicBrainz Release Group Id": "musicbrainz_releasegroupid",
  "TXXX:MusicBrainz Work Id": "musicbrainz_workid",
  "TXXX:MusicBrainz TRM Id": "musicbrainz_trmid",
  "TXXX:MusicBrainz Disc Id": "musicbrainz_discid",
  "TXXX:ACOUSTID_ID": "acoustid_id",
  "TXXX:Acoustid Id": "acoustid_id",
  "TXXX:Acoustid Fingerprint": "acoustid_fingerprint",
  "TXXX:MusicIP PUID": "musicip_puid",
  "TXXX:MusicMagic Fingerprint": "musicip_fingerprint",
  WOAR: "website",
  // id3v2.4
  // ToDo: In same sequence as defined at http://id3.org/id3v2.4.0-frames
  TDRC: "date",
  // date YYYY-MM-DD
  TYER: "year",
  TDOR: "originaldate",
  // 'TMCL:instrument': 'performer:instrument',
  "TIPL:arranger": "arranger",
  "TIPL:engineer": "engineer",
  "TIPL:producer": "producer",
  "TIPL:DJ-mix": "djmixer",
  "TIPL:mix": "mixer",
  TMOO: "mood",
  // additional mappings:
  SYLT: "lyrics",
  TSST: "discsubtitle",
  TKEY: "key",
  COMM: "comment",
  TOPE: "originalartist",
  // Windows Media Player
  "PRIV:AverageLevel": "averageLevel",
  "PRIV:PeakLevel": "peakLevel",
  // Discogs
  "TXXX:DISCOGS_ARTIST_ID": "discogs_artist_id",
  "TXXX:DISCOGS_ARTISTS": "artists",
  "TXXX:DISCOGS_ARTIST_NAME": "artists",
  "TXXX:DISCOGS_ALBUM_ARTISTS": "albumartist",
  "TXXX:DISCOGS_CATALOG": "catalognumber",
  "TXXX:DISCOGS_COUNTRY": "releasecountry",
  "TXXX:DISCOGS_DATE": "originaldate",
  "TXXX:DISCOGS_LABEL": "label",
  "TXXX:DISCOGS_LABEL_ID": "discogs_label_id",
  "TXXX:DISCOGS_MASTER_RELEASE_ID": "discogs_master_release_id",
  "TXXX:DISCOGS_RATING": "discogs_rating",
  "TXXX:DISCOGS_RELEASED": "date",
  "TXXX:DISCOGS_RELEASE_ID": "discogs_release_id",
  "TXXX:DISCOGS_VOTES": "discogs_votes",
  "TXXX:CATALOGID": "catalognumber",
  "TXXX:STYLE": "genre",
  "TXXX:REPLAYGAIN_TRACK_PEAK": "replaygain_track_peak",
  "TXXX:REPLAYGAIN_TRACK_GAIN": "replaygain_track_gain",
  "TXXX:REPLAYGAIN_ALBUM_PEAK": "replaygain_album_peak",
  "TXXX:REPLAYGAIN_ALBUM_GAIN": "replaygain_album_gain",
  "TXXX:MP3GAIN_MINMAX": "replaygain_track_minmax",
  "TXXX:MP3GAIN_ALBUM_MINMAX": "replaygain_album_minmax",
  "TXXX:MP3GAIN_UNDO": "replaygain_undo",
  MVNM: "movement",
  MVIN: "movementIndex",
  PCST: "podcast",
  TCAT: "category",
  TDES: "description",
  TDRL: "releasedate",
  TGID: "podcastId",
  TKWD: "keywords",
  WFED: "podcasturl",
  GRP1: "grouping",
  PCNT: "playCounter"
};
class ri extends Pt {
  static toRating(e) {
    return {
      source: e.email,
      rating: e.rating > 0 ? (e.rating - 1) / 254 * oe.maxRatingScore : void 0
    };
  }
  constructor() {
    super(["ID3v2.3", "ID3v2.4"], ho);
  }
  /**
   * Handle post mapping exceptions / correction
   * @param tag to post map
   * @param warnings Wil be used to register (collect) warnings
   */
  postMap(e, t) {
    switch (e.id) {
      case "UFID":
        {
          const i = e.value;
          i.owner_identifier === "http://musicbrainz.org" && (e.id += `:${i.owner_identifier}`, e.value = $r(i.identifier, "latin1"));
        }
        break;
      case "PRIV":
        {
          const i = e.value;
          switch (i.owner_identifier) {
            case "AverageLevel":
            case "PeakValue":
              e.id += `:${i.owner_identifier}`, e.value = i.data.length === 4 ? D.get(i.data, 0) : null, e.value === null && t.addWarning("Failed to parse PRIV:PeakValue");
              break;
            default:
              t.addWarning(`Unknown PRIV owner-identifier: ${i.data}`);
          }
        }
        break;
      case "POPM":
        e.value = ri.toRating(e.value);
        break;
    }
  }
}
const fo = {
  Title: "title",
  Author: "artist",
  "WM/AlbumArtist": "albumartist",
  "WM/AlbumTitle": "album",
  "WM/Year": "date",
  // changed to 'year' to 'date' based on Picard mappings; ToDo: check me
  "WM/OriginalReleaseTime": "originaldate",
  "WM/OriginalReleaseYear": "originalyear",
  Description: "comment",
  "WM/TrackNumber": "track",
  "WM/PartOfSet": "disk",
  "WM/Genre": "genre",
  "WM/Composer": "composer",
  "WM/Lyrics": "lyrics",
  "WM/AlbumSortOrder": "albumsort",
  "WM/TitleSortOrder": "titlesort",
  "WM/ArtistSortOrder": "artistsort",
  "WM/AlbumArtistSortOrder": "albumartistsort",
  "WM/ComposerSortOrder": "composersort",
  "WM/Writer": "lyricist",
  "WM/Conductor": "conductor",
  "WM/ModifiedBy": "remixer",
  "WM/Engineer": "engineer",
  "WM/Producer": "producer",
  "WM/DJMixer": "djmixer",
  "WM/Mixer": "mixer",
  "WM/Publisher": "label",
  "WM/ContentGroupDescription": "grouping",
  "WM/SubTitle": "subtitle",
  "WM/SetSubTitle": "discsubtitle",
  // 'WM/PartOfSet': 'totaldiscs',
  "WM/IsCompilation": "compilation",
  "WM/SharedUserRating": "rating",
  "WM/BeatsPerMinute": "bpm",
  "WM/Mood": "mood",
  "WM/Media": "media",
  "WM/CatalogNo": "catalognumber",
  "MusicBrainz/Album Status": "releasestatus",
  "MusicBrainz/Album Type": "releasetype",
  "MusicBrainz/Album Release Country": "releasecountry",
  "WM/Script": "script",
  "WM/Language": "language",
  Copyright: "copyright",
  LICENSE: "license",
  "WM/EncodedBy": "encodedby",
  "WM/EncodingSettings": "encodersettings",
  "WM/Barcode": "barcode",
  "WM/ISRC": "isrc",
  "MusicBrainz/Track Id": "musicbrainz_recordingid",
  "MusicBrainz/Release Track Id": "musicbrainz_trackid",
  "MusicBrainz/Album Id": "musicbrainz_albumid",
  "MusicBrainz/Artist Id": "musicbrainz_artistid",
  "MusicBrainz/Album Artist Id": "musicbrainz_albumartistid",
  "MusicBrainz/Release Group Id": "musicbrainz_releasegroupid",
  "MusicBrainz/Work Id": "musicbrainz_workid",
  "MusicBrainz/TRM Id": "musicbrainz_trmid",
  "MusicBrainz/Disc Id": "musicbrainz_discid",
  "Acoustid/Id": "acoustid_id",
  "Acoustid/Fingerprint": "acoustid_fingerprint",
  "MusicIP/PUID": "musicip_puid",
  "WM/ARTISTS": "artists",
  "WM/InitialKey": "key",
  ASIN: "asin",
  "WM/Work": "work",
  "WM/AuthorURL": "website",
  "WM/Picture": "picture"
};
class ii extends oe {
  static toRating(e) {
    return {
      rating: Number.parseFloat(e + 1) / 5
    };
  }
  constructor() {
    super(["asf"], fo);
  }
  postMap(e) {
    switch (e.id) {
      case "WM/SharedUserRating": {
        const t = e.id.split(":");
        e.value = ii.toRating(e.value), e.id = t[0];
        break;
      }
    }
  }
}
const po = {
  TT2: "title",
  TP1: "artist",
  TP2: "albumartist",
  TAL: "album",
  TYE: "year",
  COM: "comment",
  TRK: "track",
  TPA: "disk",
  TCO: "genre",
  PIC: "picture",
  TCM: "composer",
  TOR: "originaldate",
  TOT: "originalalbum",
  TXT: "lyricist",
  TP3: "conductor",
  TPB: "label",
  TT1: "grouping",
  TT3: "subtitle",
  TLA: "language",
  TCR: "copyright",
  WCP: "license",
  TEN: "encodedby",
  TSS: "encodersettings",
  WAR: "website",
  PCS: "podcast",
  TCP: "compilation",
  TDR: "date",
  TS2: "albumartistsort",
  TSA: "albumsort",
  TSC: "composersort",
  TSP: "artistsort",
  TST: "titlesort",
  WFD: "podcasturl",
  TBP: "bpm",
  GP1: "grouping"
};
class mo extends Pt {
  constructor() {
    super(["ID3v2.2"], po);
  }
}
const go = {
  Title: "title",
  Artist: "artist",
  Artists: "artists",
  "Album Artist": "albumartist",
  Album: "album",
  Year: "date",
  Originalyear: "originalyear",
  Originaldate: "originaldate",
  Releasedate: "releasedate",
  Comment: "comment",
  Track: "track",
  Disc: "disk",
  DISCNUMBER: "disk",
  // ToDo: backwards compatibility', valid tag?
  Genre: "genre",
  "Cover Art (Front)": "picture",
  "Cover Art (Back)": "picture",
  Composer: "composer",
  Lyrics: "lyrics",
  ALBUMSORT: "albumsort",
  TITLESORT: "titlesort",
  WORK: "work",
  ARTISTSORT: "artistsort",
  ALBUMARTISTSORT: "albumartistsort",
  COMPOSERSORT: "composersort",
  Lyricist: "lyricist",
  Writer: "writer",
  Conductor: "conductor",
  // 'Performer=artist (instrument)': 'performer:instrument',
  MixArtist: "remixer",
  Arranger: "arranger",
  Engineer: "engineer",
  Producer: "producer",
  DJMixer: "djmixer",
  Mixer: "mixer",
  Label: "label",
  Grouping: "grouping",
  Subtitle: "subtitle",
  DiscSubtitle: "discsubtitle",
  Compilation: "compilation",
  BPM: "bpm",
  Mood: "mood",
  Media: "media",
  CatalogNumber: "catalognumber",
  MUSICBRAINZ_ALBUMSTATUS: "releasestatus",
  MUSICBRAINZ_ALBUMTYPE: "releasetype",
  RELEASECOUNTRY: "releasecountry",
  Script: "script",
  Language: "language",
  Copyright: "copyright",
  LICENSE: "license",
  EncodedBy: "encodedby",
  EncoderSettings: "encodersettings",
  Barcode: "barcode",
  ISRC: "isrc",
  ASIN: "asin",
  musicbrainz_trackid: "musicbrainz_recordingid",
  musicbrainz_releasetrackid: "musicbrainz_trackid",
  MUSICBRAINZ_ALBUMID: "musicbrainz_albumid",
  MUSICBRAINZ_ARTISTID: "musicbrainz_artistid",
  MUSICBRAINZ_ALBUMARTISTID: "musicbrainz_albumartistid",
  MUSICBRAINZ_RELEASEGROUPID: "musicbrainz_releasegroupid",
  MUSICBRAINZ_WORKID: "musicbrainz_workid",
  MUSICBRAINZ_TRMID: "musicbrainz_trmid",
  MUSICBRAINZ_DISCID: "musicbrainz_discid",
  Acoustid_Id: "acoustid_id",
  ACOUSTID_FINGERPRINT: "acoustid_fingerprint",
  MUSICIP_PUID: "musicip_puid",
  Weblink: "website",
  REPLAYGAIN_TRACK_GAIN: "replaygain_track_gain",
  REPLAYGAIN_TRACK_PEAK: "replaygain_track_peak",
  MP3GAIN_MINMAX: "replaygain_track_minmax",
  MP3GAIN_UNDO: "replaygain_undo"
};
class yo extends Pt {
  constructor() {
    super(["APEv2"], go);
  }
}
const wo = {
  "©nam": "title",
  "©ART": "artist",
  aART: "albumartist",
  /**
   * ToDo: Album artist seems to be stored here while Picard documentation says: aART
   */
  "----:com.apple.iTunes:Band": "albumartist",
  "©alb": "album",
  "©day": "date",
  "©cmt": "comment",
  "©com": "comment",
  trkn: "track",
  disk: "disk",
  "©gen": "genre",
  covr: "picture",
  "©wrt": "composer",
  "©lyr": "lyrics",
  soal: "albumsort",
  sonm: "titlesort",
  soar: "artistsort",
  soaa: "albumartistsort",
  soco: "composersort",
  "----:com.apple.iTunes:LYRICIST": "lyricist",
  "----:com.apple.iTunes:CONDUCTOR": "conductor",
  "----:com.apple.iTunes:REMIXER": "remixer",
  "----:com.apple.iTunes:ENGINEER": "engineer",
  "----:com.apple.iTunes:PRODUCER": "producer",
  "----:com.apple.iTunes:DJMIXER": "djmixer",
  "----:com.apple.iTunes:MIXER": "mixer",
  "----:com.apple.iTunes:LABEL": "label",
  "©grp": "grouping",
  "----:com.apple.iTunes:SUBTITLE": "subtitle",
  "----:com.apple.iTunes:DISCSUBTITLE": "discsubtitle",
  cpil: "compilation",
  tmpo: "bpm",
  "----:com.apple.iTunes:MOOD": "mood",
  "----:com.apple.iTunes:MEDIA": "media",
  "----:com.apple.iTunes:CATALOGNUMBER": "catalognumber",
  tvsh: "tvShow",
  tvsn: "tvSeason",
  tves: "tvEpisode",
  sosn: "tvShowSort",
  tven: "tvEpisodeId",
  tvnn: "tvNetwork",
  pcst: "podcast",
  purl: "podcasturl",
  "----:com.apple.iTunes:MusicBrainz Album Status": "releasestatus",
  "----:com.apple.iTunes:MusicBrainz Album Type": "releasetype",
  "----:com.apple.iTunes:MusicBrainz Album Release Country": "releasecountry",
  "----:com.apple.iTunes:SCRIPT": "script",
  "----:com.apple.iTunes:LANGUAGE": "language",
  cprt: "copyright",
  "©cpy": "copyright",
  "----:com.apple.iTunes:LICENSE": "license",
  "©too": "encodedby",
  pgap: "gapless",
  "----:com.apple.iTunes:BARCODE": "barcode",
  "----:com.apple.iTunes:ISRC": "isrc",
  "----:com.apple.iTunes:ASIN": "asin",
  "----:com.apple.iTunes:NOTES": "comment",
  "----:com.apple.iTunes:MusicBrainz Track Id": "musicbrainz_recordingid",
  "----:com.apple.iTunes:MusicBrainz Release Track Id": "musicbrainz_trackid",
  "----:com.apple.iTunes:MusicBrainz Album Id": "musicbrainz_albumid",
  "----:com.apple.iTunes:MusicBrainz Artist Id": "musicbrainz_artistid",
  "----:com.apple.iTunes:MusicBrainz Album Artist Id": "musicbrainz_albumartistid",
  "----:com.apple.iTunes:MusicBrainz Release Group Id": "musicbrainz_releasegroupid",
  "----:com.apple.iTunes:MusicBrainz Work Id": "musicbrainz_workid",
  "----:com.apple.iTunes:MusicBrainz TRM Id": "musicbrainz_trmid",
  "----:com.apple.iTunes:MusicBrainz Disc Id": "musicbrainz_discid",
  "----:com.apple.iTunes:Acoustid Id": "acoustid_id",
  "----:com.apple.iTunes:Acoustid Fingerprint": "acoustid_fingerprint",
  "----:com.apple.iTunes:MusicIP PUID": "musicip_puid",
  "----:com.apple.iTunes:fingerprint": "musicip_fingerprint",
  "----:com.apple.iTunes:replaygain_track_gain": "replaygain_track_gain",
  "----:com.apple.iTunes:replaygain_track_peak": "replaygain_track_peak",
  "----:com.apple.iTunes:replaygain_album_gain": "replaygain_album_gain",
  "----:com.apple.iTunes:replaygain_album_peak": "replaygain_album_peak",
  "----:com.apple.iTunes:replaygain_track_minmax": "replaygain_track_minmax",
  "----:com.apple.iTunes:replaygain_album_minmax": "replaygain_album_minmax",
  "----:com.apple.iTunes:replaygain_undo": "replaygain_undo",
  // Additional mappings:
  gnre: "genre",
  // ToDo: check mapping
  "----:com.apple.iTunes:ALBUMARTISTSORT": "albumartistsort",
  "----:com.apple.iTunes:ARTISTS": "artists",
  "----:com.apple.iTunes:ORIGINALDATE": "originaldate",
  "----:com.apple.iTunes:ORIGINALYEAR": "originalyear",
  "----:com.apple.iTunes:RELEASEDATE": "releasedate",
  // '----:com.apple.iTunes:PERFORMER': 'performer'
  desc: "description",
  ldes: "longDescription",
  "©mvn": "movement",
  "©mvi": "movementIndex",
  "©mvc": "movementTotal",
  "©wrk": "work",
  catg: "category",
  egid: "podcastId",
  hdvd: "hdVideo",
  keyw: "keywords",
  shwm: "showMovement",
  stik: "stik",
  rate: "rating"
}, vo = "iTunes";
class vi extends Pt {
  constructor() {
    super([vo], wo);
  }
  postMap(e, t) {
    switch (e.id) {
      case "rate":
        e.value = {
          source: void 0,
          rating: Number.parseFloat(e.value) / 100
        };
        break;
    }
  }
}
const bo = {
  TITLE: "title",
  ARTIST: "artist",
  ARTISTS: "artists",
  ALBUMARTIST: "albumartist",
  "ALBUM ARTIST": "albumartist",
  ALBUM: "album",
  DATE: "date",
  ORIGINALDATE: "originaldate",
  ORIGINALYEAR: "originalyear",
  RELEASEDATE: "releasedate",
  COMMENT: "comment",
  TRACKNUMBER: "track",
  DISCNUMBER: "disk",
  GENRE: "genre",
  METADATA_BLOCK_PICTURE: "picture",
  COMPOSER: "composer",
  LYRICS: "lyrics",
  ALBUMSORT: "albumsort",
  TITLESORT: "titlesort",
  WORK: "work",
  ARTISTSORT: "artistsort",
  ALBUMARTISTSORT: "albumartistsort",
  COMPOSERSORT: "composersort",
  LYRICIST: "lyricist",
  WRITER: "writer",
  CONDUCTOR: "conductor",
  // 'PERFORMER=artist (instrument)': 'performer:instrument', // ToDo
  REMIXER: "remixer",
  ARRANGER: "arranger",
  ENGINEER: "engineer",
  PRODUCER: "producer",
  DJMIXER: "djmixer",
  MIXER: "mixer",
  LABEL: "label",
  GROUPING: "grouping",
  SUBTITLE: "subtitle",
  DISCSUBTITLE: "discsubtitle",
  TRACKTOTAL: "totaltracks",
  DISCTOTAL: "totaldiscs",
  COMPILATION: "compilation",
  RATING: "rating",
  BPM: "bpm",
  KEY: "key",
  MOOD: "mood",
  MEDIA: "media",
  CATALOGNUMBER: "catalognumber",
  RELEASESTATUS: "releasestatus",
  RELEASETYPE: "releasetype",
  RELEASECOUNTRY: "releasecountry",
  SCRIPT: "script",
  LANGUAGE: "language",
  COPYRIGHT: "copyright",
  LICENSE: "license",
  ENCODEDBY: "encodedby",
  ENCODERSETTINGS: "encodersettings",
  BARCODE: "barcode",
  ISRC: "isrc",
  ASIN: "asin",
  MUSICBRAINZ_TRACKID: "musicbrainz_recordingid",
  MUSICBRAINZ_RELEASETRACKID: "musicbrainz_trackid",
  MUSICBRAINZ_ALBUMID: "musicbrainz_albumid",
  MUSICBRAINZ_ARTISTID: "musicbrainz_artistid",
  MUSICBRAINZ_ALBUMARTISTID: "musicbrainz_albumartistid",
  MUSICBRAINZ_RELEASEGROUPID: "musicbrainz_releasegroupid",
  MUSICBRAINZ_WORKID: "musicbrainz_workid",
  MUSICBRAINZ_TRMID: "musicbrainz_trmid",
  MUSICBRAINZ_DISCID: "musicbrainz_discid",
  ACOUSTID_ID: "acoustid_id",
  ACOUSTID_ID_FINGERPRINT: "acoustid_fingerprint",
  MUSICIP_PUID: "musicip_puid",
  // 'FINGERPRINT=MusicMagic Fingerprint {fingerprint}': 'musicip_fingerprint', // ToDo
  WEBSITE: "website",
  NOTES: "notes",
  TOTALTRACKS: "totaltracks",
  TOTALDISCS: "totaldiscs",
  // Discogs
  DISCOGS_ARTIST_ID: "discogs_artist_id",
  DISCOGS_ARTISTS: "artists",
  DISCOGS_ARTIST_NAME: "artists",
  DISCOGS_ALBUM_ARTISTS: "albumartist",
  DISCOGS_CATALOG: "catalognumber",
  DISCOGS_COUNTRY: "releasecountry",
  DISCOGS_DATE: "originaldate",
  DISCOGS_LABEL: "label",
  DISCOGS_LABEL_ID: "discogs_label_id",
  DISCOGS_MASTER_RELEASE_ID: "discogs_master_release_id",
  DISCOGS_RATING: "discogs_rating",
  DISCOGS_RELEASED: "date",
  DISCOGS_RELEASE_ID: "discogs_release_id",
  DISCOGS_VOTES: "discogs_votes",
  CATALOGID: "catalognumber",
  STYLE: "genre",
  //
  REPLAYGAIN_TRACK_GAIN: "replaygain_track_gain",
  REPLAYGAIN_TRACK_PEAK: "replaygain_track_peak",
  REPLAYGAIN_ALBUM_GAIN: "replaygain_album_gain",
  REPLAYGAIN_ALBUM_PEAK: "replaygain_album_peak",
  // To Sure if these (REPLAYGAIN_MINMAX, REPLAYGAIN_ALBUM_MINMAX & REPLAYGAIN_UNDO) are used for Vorbis:
  REPLAYGAIN_MINMAX: "replaygain_track_minmax",
  REPLAYGAIN_ALBUM_MINMAX: "replaygain_album_minmax",
  REPLAYGAIN_UNDO: "replaygain_undo"
};
class nr extends oe {
  static toRating(e, t, i) {
    return {
      source: e ? e.toLowerCase() : void 0,
      rating: Number.parseFloat(t) / i * oe.maxRatingScore
    };
  }
  constructor() {
    super(["vorbis"], bo);
  }
  postMap(e) {
    if (e.id === "RATING")
      e.value = nr.toRating(void 0, e.value, 100);
    else if (e.id.indexOf("RATING:") === 0) {
      const t = e.id.split(":");
      e.value = nr.toRating(t[1], e.value, 1), e.id = t[0];
    }
  }
}
const _o = {
  IART: "artist",
  // Artist
  ICRD: "date",
  // DateCreated
  INAM: "title",
  // Title
  TITL: "title",
  IPRD: "album",
  // Product
  ITRK: "track",
  IPRT: "track",
  // Additional tag for track index
  COMM: "comment",
  // Comments
  ICMT: "comment",
  // Country
  ICNT: "releasecountry",
  GNRE: "genre",
  // Genre
  IWRI: "writer",
  // WrittenBy
  RATE: "rating",
  YEAR: "year",
  ISFT: "encodedby",
  // Software
  CODE: "encodedby",
  // EncodedBy
  TURL: "website",
  // URL,
  IGNR: "genre",
  // Genre
  IENG: "engineer",
  // Engineer
  ITCH: "technician",
  // Technician
  IMED: "media",
  // Original Media
  IRPD: "album"
  // Product, where the file was intended for
};
class xo extends oe {
  constructor() {
    super(["exif"], _o);
  }
}
const To = {
  "segment:title": "title",
  "album:ARTIST": "albumartist",
  "album:ARTISTSORT": "albumartistsort",
  "album:TITLE": "album",
  "album:DATE_RECORDED": "originaldate",
  "album:DATE_RELEASED": "releasedate",
  "album:PART_NUMBER": "disk",
  "album:TOTAL_PARTS": "totaltracks",
  "track:ARTIST": "artist",
  "track:ARTISTSORT": "artistsort",
  "track:TITLE": "title",
  "track:PART_NUMBER": "track",
  "track:MUSICBRAINZ_TRACKID": "musicbrainz_recordingid",
  "track:MUSICBRAINZ_ALBUMID": "musicbrainz_albumid",
  "track:MUSICBRAINZ_ARTISTID": "musicbrainz_artistid",
  "track:PUBLISHER": "label",
  "track:GENRE": "genre",
  "track:ENCODER": "encodedby",
  "track:ENCODER_OPTIONS": "encodersettings",
  "edition:TOTAL_PARTS": "totaldiscs",
  picture: "picture"
};
class ko extends Pt {
  constructor() {
    super(["matroska"], To);
  }
}
const So = {
  NAME: "title",
  AUTH: "artist",
  "(c) ": "copyright",
  ANNO: "comment"
};
class Eo extends oe {
  constructor() {
    super(["AIFF"], So);
  }
}
class Ao {
  constructor() {
    this.tagMappers = {}, [
      new uo(),
      new mo(),
      new ri(),
      new vi(),
      new vi(),
      new nr(),
      new yo(),
      new ii(),
      new xo(),
      new ko(),
      new Eo()
    ].forEach((e) => {
      this.registerTagMapper(e);
    });
  }
  /**
   * Convert native to generic (common) tags
   * @param tagType Originating tag format
   * @param tag     Native tag to map to a generic tag id
   * @param warnings
   * @return Generic tag result (output of this function)
   */
  mapTag(e, t, i) {
    if (this.tagMappers[e])
      return this.tagMappers[e].mapGenericTag(t, i);
    throw new Sn(`No generic tag mapper defined for tag-format: ${e}`);
  }
  registerTagMapper(e) {
    for (const t of e.tagTypes)
      this.tagMappers[t] = e;
  }
}
const Mr = /\[(\d{2}):(\d{2})\.(\d{2,3})]/;
function Io(r) {
  return Mr.test(r) ? Co(r) : Ro(r);
}
function Ro(r) {
  return {
    contentType: An.lyrics,
    timeStampFormat: In.notSynchronized,
    text: r.trim(),
    syncText: []
  };
}
function Co(r) {
  const e = r.split(`
`), t = [];
  for (const i of e) {
    const n = i.match(Mr);
    if (n) {
      const a = Number.parseInt(n[1], 10), s = Number.parseInt(n[2], 10), o = n[3].length === 3 ? Number.parseInt(n[3], 10) : Number.parseInt(n[3], 10) * 10, c = (a * 60 + s) * 1e3 + o, l = i.replace(Mr, "").trim();
      t.push({ timestamp: c, text: l });
    }
  }
  return {
    contentType: An.lyrics,
    timeStampFormat: In.milliseconds,
    text: t.map((i) => i.text).join(`
`),
    syncText: t
  };
}
const De = at("music-metadata:collector"), Oo = ["matroska", "APEv2", "vorbis", "ID3v2.4", "ID3v2.3", "ID3v2.2", "exif", "asf", "iTunes", "AIFF", "ID3v1"];
class Po {
  constructor(e) {
    this.format = {
      tagTypes: [],
      trackInfo: []
    }, this.native = {}, this.common = {
      track: { no: null, of: null },
      disk: { no: null, of: null },
      movementIndex: { no: null, of: null }
    }, this.quality = {
      warnings: []
    }, this.commonOrigin = {}, this.originPriority = {}, this.tagMapper = new Ao(), this.opts = e;
    let t = 1;
    for (const i of Oo)
      this.originPriority[i] = t++;
    this.originPriority.artificial = 500, this.originPriority.id3v1 = 600;
  }
  /**
   * @returns {boolean} true if one or more tags have been found
   */
  hasAny() {
    return Object.keys(this.native).length > 0;
  }
  addStreamInfo(e) {
    De(`streamInfo: type=${e.type ? Xa[e.type] : "?"}, codec=${e.codecName}`), this.format.trackInfo.push(e);
  }
  setFormat(e, t) {
    var i;
    De(`format: ${e} = ${t}`), this.format[e] = t, (i = this.opts) != null && i.observer && this.opts.observer({ metadata: this, tag: { type: "format", id: e, value: t } });
  }
  setAudioOnly() {
    this.setFormat("hasAudio", !0), this.setFormat("hasVideo", !1);
  }
  async addTag(e, t, i) {
    De(`tag ${e}.${t} = ${i}`), this.native[e] || (this.format.tagTypes.push(e), this.native[e] = []), this.native[e].push({ id: t, value: i }), await this.toCommon(e, t, i);
  }
  addWarning(e) {
    this.quality.warnings.push({ message: e });
  }
  async postMap(e, t) {
    switch (t.id) {
      case "artist":
        return this.handleSingularArtistTag(e, t, "artist", "artists");
      case "albumartist":
        return this.handleSingularArtistTag(e, t, "albumartist", "albumartists");
      case "artists":
        return this.handlePluralArtistTag(e, t, "artist", "artists");
      case "albumartists":
        return this.handlePluralArtistTag(e, t, "albumartist", "albumartists");
      case "picture":
        return this.postFixPicture(t.value).then((i) => {
          i !== null && (t.value = i, this.setGenericTag(e, t));
        });
      case "totaltracks":
        this.common.track.of = oe.toIntOrNull(t.value);
        return;
      case "totaldiscs":
        this.common.disk.of = oe.toIntOrNull(t.value);
        return;
      case "movementTotal":
        this.common.movementIndex.of = oe.toIntOrNull(t.value);
        return;
      case "track":
      case "disk":
      case "movementIndex": {
        const i = this.common[t.id].of;
        this.common[t.id] = oe.normalizeTrack(t.value), this.common[t.id].of = i ?? this.common[t.id].of;
        return;
      }
      case "bpm":
      case "year":
      case "originalyear":
        t.value = Number.parseInt(t.value, 10);
        break;
      case "date": {
        const i = Number.parseInt(t.value.substr(0, 4), 10);
        Number.isNaN(i) || (this.common.year = i);
        break;
      }
      case "discogs_label_id":
      case "discogs_release_id":
      case "discogs_master_release_id":
      case "discogs_artist_id":
      case "discogs_votes":
        t.value = typeof t.value == "string" ? Number.parseInt(t.value, 10) : t.value;
        break;
      case "replaygain_track_gain":
      case "replaygain_track_peak":
      case "replaygain_album_gain":
      case "replaygain_album_peak":
        t.value = io(t.value);
        break;
      case "replaygain_track_minmax":
        t.value = t.value.split(",").map((i) => Number.parseInt(i, 10));
        break;
      case "replaygain_undo": {
        const i = t.value.split(",").map((n) => Number.parseInt(n, 10));
        t.value = {
          leftChannel: i[0],
          rightChannel: i[1]
        };
        break;
      }
      case "gapless":
      case "compilation":
      case "podcast":
      case "showMovement":
        t.value = t.value === "1" || t.value === 1;
        break;
      case "isrc": {
        const i = this.common[t.id];
        if (i && i.indexOf(t.value) !== -1)
          return;
        break;
      }
      case "comment":
        typeof t.value == "string" && (t.value = { text: t.value }), t.value.descriptor === "iTunPGAP" && this.setGenericTag(e, { id: "gapless", value: t.value.text === "1" });
        break;
      case "lyrics":
        typeof t.value == "string" && (t.value = Io(t.value));
        break;
    }
    t.value !== null && this.setGenericTag(e, t);
  }
  /**
   * Convert native tags to common tags
   * @returns {IAudioMetadata} Native + common tags
   */
  toCommonMetadata() {
    return {
      format: this.format,
      native: this.native,
      quality: this.quality,
      common: this.common
    };
  }
  /**
   * Handle singular artist tags (artist, albumartist) and cross-populate to plural form
   */
  handleSingularArtistTag(e, t, i, n) {
    if (this.commonOrigin[i] === this.originPriority[e])
      return this.postMap("artificial", { id: n, value: t.value });
    this.common[n] || this.setGenericTag("artificial", { id: n, value: t.value }), this.setGenericTag(e, t);
  }
  /**
   * Handle plural artist tags (artists, albumartists) and cross-populate to singular form
   */
  handlePluralArtistTag(e, t, i, n) {
    if ((!this.common[i] || this.commonOrigin[i] === this.originPriority.artificial) && (!this.common[n] || this.common[n].indexOf(t.value) === -1)) {
      const a = (this.common[n] || []).concat([t.value]), s = Do(a);
      this.setGenericTag("artificial", { id: i, value: s });
    }
    this.setGenericTag(e, t);
  }
  /**
   * Fix some common issues with picture object
   * @param picture Picture
   */
  async postFixPicture(e) {
    if (e.data && e.data.length > 0) {
      if (!e.format) {
        const t = await bn(Uint8Array.from(e.data));
        if (t)
          e.format = t.mime;
        else
          return null;
      }
      switch (e.format = e.format.toLocaleLowerCase(), e.format) {
        case "image/jpg":
          e.format = "image/jpeg";
      }
      return e;
    }
    return this.addWarning("Empty picture tag found"), null;
  }
  /**
   * Convert native tag to common tags
   */
  async toCommon(e, t, i) {
    const n = { id: t, value: i }, a = this.tagMapper.mapTag(e, n, this);
    a && await this.postMap(e, a);
  }
  /**
   * Set generic tag
   */
  setGenericTag(e, t) {
    var a;
    De(`common.${t.id} = ${t.value}`);
    const i = this.commonOrigin[t.id] || 1e3, n = this.originPriority[e];
    if (oo(t.id))
      if (n <= i)
        this.common[t.id] = t.value, this.commonOrigin[t.id] = n;
      else
        return De(`Ignore native tag (singleton): ${e}.${t.id} = ${t.value}`);
    else if (n === i)
      !co(t.id) || this.common[t.id].indexOf(t.value) === -1 ? this.common[t.id].push(t.value) : De(`Ignore duplicate value: ${e}.${t.id} = ${t.value}`);
    else if (n < i)
      this.common[t.id] = [t.value], this.commonOrigin[t.id] = n;
    else
      return De(`Ignore native tag (list): ${e}.${t.id} = ${t.value}`);
    (a = this.opts) != null && a.observer && this.opts.observer({ metadata: this, tag: { type: "common", id: t.id, value: t.value } });
  }
}
function Do(r) {
  return r.length > 2 ? `${r.slice(0, r.length - 1).join(", ")} & ${r[r.length - 1]}` : r.join(" & ");
}
const Uo = {
  parserType: "mpeg",
  extensions: [".mp2", ".mp3", ".m2a", ".aac", "aacp"],
  mimeTypes: ["audio/mpeg", "audio/mp3", "audio/aacs", "audio/aacp"],
  async load() {
    return (await import("./MpegParser-DgQwszCF.js")).MpegParser;
  }
}, Lo = {
  parserType: "apev2",
  extensions: [".ape"],
  mimeTypes: ["audio/ape", "audio/monkeys-audio"],
  async load() {
    return (await Promise.resolve().then(() => Qo)).APEv2Parser;
  }
}, jo = {
  parserType: "asf",
  extensions: [".asf"],
  mimeTypes: ["audio/ms-wma", "video/ms-wmv", "audio/ms-asf", "video/ms-asf", "application/vnd.ms-asf"],
  async load() {
    return (await import("./AsfParser-BV2nZKjI.js")).AsfParser;
  }
}, No = {
  parserType: "dsdiff",
  extensions: [".dff"],
  mimeTypes: ["audio/dsf", "audio/dsd"],
  async load() {
    return (await import("./DsdiffParser-Eb73ulLr.js")).DsdiffParser;
  }
}, Bo = {
  parserType: "aiff",
  extensions: [".aif", "aiff", "aifc"],
  mimeTypes: ["audio/aiff", "audio/aif", "audio/aifc", "application/aiff"],
  async load() {
    return (await import("./AiffParser-CLJ9i_nc.js")).AIFFParser;
  }
}, $o = {
  parserType: "dsf",
  extensions: [".dsf"],
  mimeTypes: ["audio/dsf"],
  async load() {
    return (await import("./DsfParser-D00D7H1H.js")).DsfParser;
  }
}, Mo = {
  parserType: "flac",
  extensions: [".flac"],
  mimeTypes: ["audio/flac"],
  async load() {
    return (await import("./FlacParser-EYoVkqbf.js").then((r) => r.d)).FlacParser;
  }
}, Fo = {
  parserType: "matroska",
  extensions: [".mka", ".mkv", ".mk3d", ".mks", "webm"],
  mimeTypes: ["audio/matroska", "video/matroska", "audio/webm", "video/webm"],
  async load() {
    return (await import("./MatroskaParser-NMfqbAvz.js")).MatroskaParser;
  }
}, zo = {
  parserType: "mp4",
  extensions: [".mp4", ".m4a", ".m4b", ".m4pa", "m4v", "m4r", "3gp", ".mov", ".movie", ".qt"],
  mimeTypes: ["audio/mp4", "audio/m4a", "video/m4v", "video/mp4", "video/quicktime"],
  async load() {
    return (await import("./MP4Parser-C9g9jA_1.js")).MP4Parser;
  }
}, qo = {
  parserType: "musepack",
  extensions: [".mpc"],
  mimeTypes: ["audio/musepack"],
  async load() {
    return (await import("./MusepackParser-DFiOa1vr.js")).MusepackParser;
  }
}, Go = {
  parserType: "ogg",
  extensions: [".ogg", ".ogv", ".oga", ".ogm", ".ogx", ".opus", ".spx"],
  mimeTypes: ["audio/ogg", "audio/opus", "audio/speex", "video/ogg"],
  // RFC 7845, RFC 6716, RFC 5574
  async load() {
    return (await import("./OggParser-B6rmnM9E.js")).OggParser;
  }
}, Wo = {
  parserType: "wavpack",
  extensions: [".wv", ".wvp"],
  mimeTypes: ["audio/wavpack"],
  async load() {
    return (await import("./WavPackParser-D3L27s6h.js")).WavPackParser;
  }
}, Ko = {
  parserType: "riff",
  extensions: [".wav", "wave", ".bwf"],
  mimeTypes: ["audio/vnd.wave", "audio/wav", "audio/wave"],
  async load() {
    return (await import("./WaveParser-Ch0XNKWW.js")).WaveParser;
  }
}, Ue = at("music-metadata:parser:factory");
function Vo(r) {
  const e = ei.parse(r), t = Ka(e.type);
  return {
    type: t.type,
    subtype: t.subtype,
    suffix: t.suffix,
    parameters: e.parameters
  };
}
class Ho {
  constructor() {
    this.parsers = [], [
      Mo,
      Uo,
      Lo,
      zo,
      Fo,
      Ko,
      Go,
      jo,
      Bo,
      Wo,
      qo,
      $o,
      No
    ].forEach((e) => {
      this.registerParser(e);
    });
  }
  registerParser(e) {
    this.parsers.push(e);
  }
  async parse(e, t, i) {
    if (e.supportsRandomAccess() ? (Ue("tokenizer supports random-access, scanning for appending headers"), await ic(e, i)) : Ue("tokenizer does not support random-access, cannot scan for appending headers"), !t) {
      const o = new Uint8Array(4100);
      if (e.fileInfo.mimeType && (t = this.findLoaderForContentType(e.fileInfo.mimeType)), !t && e.fileInfo.path && (t = this.findLoaderForExtension(e.fileInfo.path)), !t) {
        Ue("Guess parser on content..."), await e.peekBuffer(o, { mayBeLess: !0 });
        const c = await bn(o, { mpegOffsetTolerance: 10 });
        if (!c || !c.mime)
          throw new Tn("Failed to determine audio format");
        if (Ue(`Guessed file type is mime=${c.mime}, extension=${c.ext}`), t = this.findLoaderForContentType(c.mime), !t)
          throw new kn(`Guessed MIME-type not supported: ${c.mime}`);
      }
    }
    Ue(`Loading ${t.parserType} parser...`);
    const n = new Po(i), a = await t.load(), s = new a(n, e, i ?? {});
    return Ue(`Parser ${t.parserType} loaded`), await s.parse(), n.format.trackInfo && (n.format.hasAudio === void 0 && n.setFormat("hasAudio", !!n.format.trackInfo.find((o) => o.type === we.audio)), n.format.hasVideo === void 0 && n.setFormat("hasVideo", !!n.format.trackInfo.find((o) => o.type === we.video))), n.toCommonMetadata();
  }
  /**
   * @param filePath - Path, filename or extension to audio file
   * @return Parser submodule name
   */
  findLoaderForExtension(e) {
    if (!e)
      return;
    const t = Xo(e).toLocaleLowerCase() || e;
    return this.parsers.find((i) => i.extensions.indexOf(t) !== -1);
  }
  findLoaderForContentType(e) {
    let t;
    if (!e)
      return;
    try {
      t = Vo(e);
    } catch {
      Ue(`Invalid HTTP Content-Type header value: ${e}`);
      return;
    }
    const i = t.subtype.indexOf("x-") === 0 ? t.subtype.substring(2) : t.subtype;
    return this.parsers.find((n) => n.mimeTypes.find((a) => a.indexOf(`${t.type}/${i}`) !== -1));
  }
  getSupportedMimeTypes() {
    const e = /* @__PURE__ */ new Set();
    return this.parsers.forEach((t) => {
      t.mimeTypes.forEach((i) => {
        e.add(i), e.add(i.replace("/", "/x-"));
      });
    }), Array.from(e);
  }
}
function Xo(r) {
  const e = r.lastIndexOf(".");
  return e === -1 ? "" : r.substring(e);
}
class Rn {
  /**
   * Initialize parser with output (metadata), input (tokenizer) & parsing options (options).
   * @param {INativeMetadataCollector} metadata Output
   * @param {ITokenizer} tokenizer Input
   * @param {IOptions} options Parsing options
   */
  constructor(e, t, i) {
    this.metadata = e, this.tokenizer = t, this.options = i;
  }
}
const Jo = /^[\x21-\x7e©][\x20-\x7e\x00()]{3}/, Cn = {
  len: 4,
  get: (r, e) => {
    const t = Ct(r.subarray(e, e + Cn.len), "latin1");
    if (!t.match(Jo))
      throw new ti(`FourCC contains invalid characters: ${eo(t)} "${t}"`);
    return t;
  },
  put: (r, e, t) => {
    const i = qs(t, "latin1");
    if (i.length !== 4)
      throw new Sn("Invalid length");
    return r.set(i, e), e + 4;
  }
}, zt = {
  text_utf8: 0,
  binary: 1,
  external_info: 2,
  reserved: 3
}, bi = {
  len: 52,
  get: (r, e) => ({
    // should equal 'MAC '
    ID: Cn.get(r, e),
    // versionIndex number * 1000 (3.81 = 3810) (remember that 4-byte alignment causes this to take 4-bytes)
    version: D.get(r, e + 4) / 1e3,
    // the number of descriptor bytes (allows later expansion of this header)
    descriptorBytes: D.get(r, e + 8),
    // the number of header APE_HEADER bytes
    headerBytes: D.get(r, e + 12),
    // the number of header APE_HEADER bytes
    seekTableBytes: D.get(r, e + 16),
    // the number of header data bytes (from original file)
    headerDataBytes: D.get(r, e + 20),
    // the number of bytes of APE frame data
    apeFrameDataBytes: D.get(r, e + 24),
    // the high order number of APE frame data bytes
    apeFrameDataBytesHigh: D.get(r, e + 28),
    // the terminating data of the file (not including tag data)
    terminatingDataBytes: D.get(r, e + 32),
    // the MD5 hash of the file (see notes for usage... it's a little tricky)
    fileMD5: new wn(16).get(r, e + 36)
  })
}, Yo = {
  len: 24,
  get: (r, e) => ({
    // the compression level (see defines I.E. COMPRESSION_LEVEL_FAST)
    compressionLevel: B.get(r, e),
    // any format flags (for future use)
    formatFlags: B.get(r, e + 2),
    // the number of audio blocks in one frame
    blocksPerFrame: D.get(r, e + 4),
    // the number of audio blocks in the final frame
    finalFrameBlocks: D.get(r, e + 8),
    // the total number of frames
    totalFrames: D.get(r, e + 12),
    // the bits per sample (typically 16)
    bitsPerSample: B.get(r, e + 16),
    // the number of channels (1 or 2)
    channel: B.get(r, e + 18),
    // the sample rate (typically 44100)
    sampleRate: D.get(r, e + 20)
  })
}, ne = {
  len: 32,
  get: (r, e) => ({
    // should equal 'APETAGEX'
    ID: new H(8, "ascii").get(r, e),
    // equals CURRENT_APE_TAG_VERSION
    version: D.get(r, e + 8),
    // the complete size of the tag, including this footer (excludes header)
    size: D.get(r, e + 12),
    // the number of fields in the tag
    fields: D.get(r, e + 16),
    // reserved for later use (must be zero),
    flags: On(D.get(r, e + 20))
  })
}, kr = {
  len: 8,
  get: (r, e) => ({
    // Length of assigned value in bytes
    size: D.get(r, e),
    // reserved for later use (must be zero),
    flags: On(D.get(r, e + 4))
  })
};
function On(r) {
  return {
    containsHeader: qt(r, 31),
    containsFooter: qt(r, 30),
    isHeader: qt(r, 29),
    readOnly: qt(r, 0),
    dataType: (r & 6) >> 1
  };
}
function qt(r, e) {
  return (r & 1 << e) !== 0;
}
const Ee = at("music-metadata:parser:APEv2"), _i = "APEv2", xi = "APETAGEX";
class tr extends Ya("APEv2") {
}
function Zo(r, e, t) {
  return new Ce(r, e, t).tryParseApeHeader();
}
class Ce extends Rn {
  constructor() {
    super(...arguments), this.ape = {};
  }
  /**
   * Calculate the media file duration
   * @param ah ApeHeader
   * @return {number} duration in seconds
   */
  static calculateDuration(e) {
    let t = e.totalFrames > 1 ? e.blocksPerFrame * (e.totalFrames - 1) : 0;
    return t += e.finalFrameBlocks, t / e.sampleRate;
  }
  /**
   * Calculates the APEv1 / APEv2 first field offset
   * @param tokenizer
   * @param offset
   */
  static async findApeFooterOffset(e, t) {
    const i = new Uint8Array(ne.len), n = e.position;
    if (t <= ne.len) {
      Ee(`Offset is too small to read APE footer: offset=${t}`);
      return;
    }
    if (t > ne.len) {
      await e.readBuffer(i, { position: t - ne.len }), e.setPosition(n);
      const a = ne.get(i, 0);
      if (a.ID === "APETAGEX")
        return a.flags.isHeader ? Ee(`APE Header found at offset=${t - ne.len}`) : (Ee(`APE Footer found at offset=${t - ne.len}`), t -= a.size), { footer: a, offset: t };
    }
  }
  static parseTagFooter(e, t, i) {
    const n = ne.get(t, t.length - ne.len);
    if (n.ID !== xi)
      throw new tr("Unexpected APEv2 Footer ID preamble value");
    return Lr(t), new Ce(e, Lr(t), i).parseTags(n);
  }
  /**
   * Parse APEv1 / APEv2 header if header signature found
   */
  async tryParseApeHeader() {
    if (this.tokenizer.fileInfo.size && this.tokenizer.fileInfo.size - this.tokenizer.position < ne.len) {
      Ee("No APEv2 header found, end-of-file reached");
      return;
    }
    const e = await this.tokenizer.peekToken(ne);
    if (e.ID === xi)
      return await this.tokenizer.ignore(ne.len), this.parseTags(e);
    if (Ee(`APEv2 header not found at offset=${this.tokenizer.position}`), this.tokenizer.fileInfo.size) {
      const t = this.tokenizer.fileInfo.size - this.tokenizer.position, i = new Uint8Array(t);
      return await this.tokenizer.readBuffer(i), Ce.parseTagFooter(this.metadata, i, this.options);
    }
  }
  async parse() {
    const e = await this.tokenizer.readToken(bi);
    if (e.ID !== "MAC ")
      throw new tr("Unexpected descriptor ID");
    this.ape.descriptor = e;
    const t = e.descriptorBytes - bi.len, i = await (t > 0 ? this.parseDescriptorExpansion(t) : this.parseHeader());
    return this.metadata.setAudioOnly(), await this.tokenizer.ignore(i.forwardBytes), this.tryParseApeHeader();
  }
  async parseTags(e) {
    const t = new Uint8Array(256);
    let i = e.size - ne.len;
    Ee(`Parse APE tags at offset=${this.tokenizer.position}, size=${i}`);
    for (let n = 0; n < e.fields; n++) {
      if (i < kr.len) {
        this.metadata.addWarning(`APEv2 Tag-header: ${e.fields - n} items remaining, but no more tag data to read.`);
        break;
      }
      const a = await this.tokenizer.readToken(kr);
      i -= kr.len + a.size, await this.tokenizer.peekBuffer(t, { length: Math.min(t.length, i) });
      let s = wi(t);
      const o = await this.tokenizer.readToken(new H(s, "ascii"));
      switch (await this.tokenizer.ignore(1), i -= o.length + 1, a.flags.dataType) {
        case zt.text_utf8: {
          const l = (await this.tokenizer.readToken(new H(a.size, "utf8"))).split(/\x00/g);
          await Promise.all(l.map((u) => this.metadata.addTag(_i, o, u)));
          break;
        }
        case zt.binary:
          if (this.options.skipCovers)
            await this.tokenizer.ignore(a.size);
          else {
            const c = new Uint8Array(a.size);
            await this.tokenizer.readBuffer(c), s = wi(c);
            const l = Ct(c.subarray(0, s), "utf-8"), u = c.subarray(s + 1);
            await this.metadata.addTag(_i, o, {
              description: l,
              data: u
            });
          }
          break;
        case zt.external_info:
          Ee(`Ignore external info ${o}`), await this.tokenizer.ignore(a.size);
          break;
        case zt.reserved:
          Ee(`Ignore external info ${o}`), this.metadata.addWarning(`APEv2 header declares a reserved datatype for "${o}"`), await this.tokenizer.ignore(a.size);
          break;
      }
    }
  }
  async parseDescriptorExpansion(e) {
    return await this.tokenizer.ignore(e), this.parseHeader();
  }
  async parseHeader() {
    const e = await this.tokenizer.readToken(Yo);
    if (this.metadata.setFormat("lossless", !0), this.metadata.setFormat("container", "Monkey's Audio"), this.metadata.setFormat("bitsPerSample", e.bitsPerSample), this.metadata.setFormat("sampleRate", e.sampleRate), this.metadata.setFormat("numberOfChannels", e.channel), this.metadata.setFormat("duration", Ce.calculateDuration(e)), !this.ape.descriptor)
      throw new tr("Missing APE descriptor");
    return {
      forwardBytes: this.ape.descriptor.seekTableBytes + this.ape.descriptor.headerDataBytes + this.ape.descriptor.apeFrameDataBytes + this.ape.descriptor.terminatingDataBytes
    };
  }
}
const Qo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  APEv2Parser: Ce,
  ApeContentError: tr,
  tryParseApeHeader: Zo
}, Symbol.toStringTag, { value: "Module" })), Gt = at("music-metadata:parser:ID3v1"), Ti = [
  "Blues",
  "Classic Rock",
  "Country",
  "Dance",
  "Disco",
  "Funk",
  "Grunge",
  "Hip-Hop",
  "Jazz",
  "Metal",
  "New Age",
  "Oldies",
  "Other",
  "Pop",
  "R&B",
  "Rap",
  "Reggae",
  "Rock",
  "Techno",
  "Industrial",
  "Alternative",
  "Ska",
  "Death Metal",
  "Pranks",
  "Soundtrack",
  "Euro-Techno",
  "Ambient",
  "Trip-Hop",
  "Vocal",
  "Jazz+Funk",
  "Fusion",
  "Trance",
  "Classical",
  "Instrumental",
  "Acid",
  "House",
  "Game",
  "Sound Clip",
  "Gospel",
  "Noise",
  "Alt. Rock",
  "Bass",
  "Soul",
  "Punk",
  "Space",
  "Meditative",
  "Instrumental Pop",
  "Instrumental Rock",
  "Ethnic",
  "Gothic",
  "Darkwave",
  "Techno-Industrial",
  "Electronic",
  "Pop-Folk",
  "Eurodance",
  "Dream",
  "Southern Rock",
  "Comedy",
  "Cult",
  "Gangsta Rap",
  "Top 40",
  "Christian Rap",
  "Pop/Funk",
  "Jungle",
  "Native American",
  "Cabaret",
  "New Wave",
  "Psychedelic",
  "Rave",
  "Showtunes",
  "Trailer",
  "Lo-Fi",
  "Tribal",
  "Acid Punk",
  "Acid Jazz",
  "Polka",
  "Retro",
  "Musical",
  "Rock & Roll",
  "Hard Rock",
  "Folk",
  "Folk/Rock",
  "National Folk",
  "Swing",
  "Fast-Fusion",
  "Bebob",
  "Latin",
  "Revival",
  "Celtic",
  "Bluegrass",
  "Avantgarde",
  "Gothic Rock",
  "Progressive Rock",
  "Psychedelic Rock",
  "Symphonic Rock",
  "Slow Rock",
  "Big Band",
  "Chorus",
  "Easy Listening",
  "Acoustic",
  "Humour",
  "Speech",
  "Chanson",
  "Opera",
  "Chamber Music",
  "Sonata",
  "Symphony",
  "Booty Bass",
  "Primus",
  "Porn Groove",
  "Satire",
  "Slow Jam",
  "Club",
  "Tango",
  "Samba",
  "Folklore",
  "Ballad",
  "Power Ballad",
  "Rhythmic Soul",
  "Freestyle",
  "Duet",
  "Punk Rock",
  "Drum Solo",
  "A Cappella",
  "Euro-House",
  "Dance Hall",
  "Goa",
  "Drum & Bass",
  "Club-House",
  "Hardcore",
  "Terror",
  "Indie",
  "BritPop",
  "Negerpunk",
  "Polsk Punk",
  "Beat",
  "Christian Gangsta Rap",
  "Heavy Metal",
  "Black Metal",
  "Crossover",
  "Contemporary Christian",
  "Christian Rock",
  "Merengue",
  "Salsa",
  "Thrash Metal",
  "Anime",
  "JPop",
  "Synthpop",
  "Abstract",
  "Art Rock",
  "Baroque",
  "Bhangra",
  "Big Beat",
  "Breakbeat",
  "Chillout",
  "Downtempo",
  "Dub",
  "EBM",
  "Eclectic",
  "Electro",
  "Electroclash",
  "Emo",
  "Experimental",
  "Garage",
  "Global",
  "IDM",
  "Illbient",
  "Industro-Goth",
  "Jam Band",
  "Krautrock",
  "Leftfield",
  "Lounge",
  "Math Rock",
  "New Romantic",
  "Nu-Breakz",
  "Post-Punk",
  "Post-Rock",
  "Psytrance",
  "Shoegaze",
  "Space Rock",
  "Trop Rock",
  "World Music",
  "Neoclassical",
  "Audiobook",
  "Audio Theatre",
  "Neue Deutsche Welle",
  "Podcast",
  "Indie Rock",
  "G-Funk",
  "Dubstep",
  "Garage Rock",
  "Psybient"
], Wt = {
  len: 128,
  /**
   * @param buf Buffer possibly holding the 128 bytes ID3v1.1 metadata header
   * @param off Offset in buffer in bytes
   * @returns ID3v1.1 header if first 3 bytes equals 'TAG', otherwise null is returned
   */
  get: (r, e) => {
    const t = new Ke(3).get(r, e);
    return t === "TAG" ? {
      header: t,
      title: new Ke(30).get(r, e + 3),
      artist: new Ke(30).get(r, e + 33),
      album: new Ke(30).get(r, e + 63),
      year: new Ke(4).get(r, e + 93),
      comment: new Ke(28).get(r, e + 97),
      // ID3v1.1 separator for track
      zeroByte: Fe.get(r, e + 127),
      // track: ID3v1.1 field added by Michael Mutschler
      track: Fe.get(r, e + 126),
      genre: Fe.get(r, e + 127)
    } : null;
  }
};
class Ke {
  constructor(e) {
    this.len = e, this.stringType = new H(e, "latin1");
  }
  get(e, t) {
    let i = this.stringType.get(e, t);
    return i = Za(i), i = i.trim(), i.length > 0 ? i : void 0;
  }
}
class Pn extends Rn {
  constructor(e, t, i) {
    super(e, t, i), this.apeHeader = i.apeHeader;
  }
  static getGenre(e) {
    if (e < Ti.length)
      return Ti[e];
  }
  async parse() {
    if (!this.tokenizer.fileInfo.size) {
      Gt("Skip checking for ID3v1 because the file-size is unknown");
      return;
    }
    this.apeHeader && (this.tokenizer.ignore(this.apeHeader.offset - this.tokenizer.position), await new Ce(this.metadata, this.tokenizer, this.options).parseTags(this.apeHeader.footer));
    const e = this.tokenizer.fileInfo.size - Wt.len;
    if (this.tokenizer.position > e) {
      Gt("Already consumed the last 128 bytes");
      return;
    }
    const t = await this.tokenizer.readToken(Wt, e);
    if (t) {
      Gt("ID3v1 header found at: pos=%s", this.tokenizer.fileInfo.size - Wt.len);
      const i = ["title", "artist", "album", "comment", "track", "year"];
      for (const a of i)
        t[a] && t[a] !== "" && await this.addTag(a, t[a]);
      const n = Pn.getGenre(t.genre);
      n && await this.addTag("genre", n);
    } else
      Gt("ID3v1 header not found at: pos=%s", this.tokenizer.fileInfo.size - Wt.len);
  }
  async addTag(e, t) {
    await this.metadata.addTag("ID3v1", e, t);
  }
}
async function ec(r) {
  if (r.fileInfo.size >= 128) {
    const e = new Uint8Array(3), t = r.position;
    return await r.readBuffer(e, { position: r.fileInfo.size - 128 }), r.setPosition(t), Ct(e, "latin1") === "TAG";
  }
  return !1;
}
const tc = "LYRICS200";
async function rc(r) {
  const e = r.fileInfo.size;
  if (e >= 143) {
    const t = new Uint8Array(15), i = r.position;
    await r.readBuffer(t, { position: e - 143 }), r.setPosition(i);
    const n = Ct(t, "latin1");
    if (n.substring(6) === tc)
      return Number.parseInt(n.substring(0, 6), 10) + 15;
  }
  return 0;
}
async function ic(r, e = {}) {
  let t = r.fileInfo.size;
  if (await ec(r)) {
    t -= 128;
    const i = await rc(r);
    t -= i;
  }
  e.apeHeader = await Ce.findApeFooterOffset(r, t);
}
const ki = at("music-metadata:parser");
async function nc(r, e = {}) {
  ki(`parseFile: ${r}`);
  const t = await Us(r), i = new Ho();
  try {
    const n = i.findLoaderForExtension(r);
    n || ki("Parser could not be determined by file extension");
    try {
      return await i.parse(t, n, e);
    } catch (a) {
      throw (a instanceof Tn || a instanceof kn) && (a.message += `: ${r}`), a;
    }
  } finally {
    await t.close();
  }
}
class sc {
  constructor() {
    L(this, "cacheDir");
    this.cacheDir = z.join(rt.getPath("userData"), "cover_cache"), F.existsSync(this.cacheDir) || F.mkdirSync(this.cacheDir, { recursive: !0 });
  }
  async scanDirectory(e) {
    var n;
    const t = [];
    if (!F.existsSync(e))
      return console.warn(`Directory not found: ${e}`), [];
    const i = await this.getFilesRecursively(e);
    for (const a of i)
      try {
        const s = await nc(a), o = await this.cacheCoverArt(s, a), c = z.basename(a, z.extname(a)), l = s.common.title || c, u = s.common.artist || "Unknown Artist", h = s.common.album || "Unknown Album", d = _t.createHash("md5").update(`${l}-${u}-${s.format.duration}`).digest("hex");
        t.push({
          filePath: a,
          title: l,
          artist: u,
          album: h,
          genre: ((n = s.common.genre) == null ? void 0 : n[0]) || "Uncategorized",
          year: s.common.year || null,
          duration: s.format.duration || 0,
          format: s.format.container || "mp3",
          coverPath: o,
          hash: d
        });
      } catch (s) {
        console.warn(`Failed to parse ${a}:`, (s == null ? void 0 : s.message) || s);
      }
    return t;
  }
  async getFilesRecursively(e) {
    const t = await F.promises.readdir(e, { withFileTypes: !0 }), i = await Promise.all(t.map((n) => {
      const a = z.resolve(e, n.name);
      return n.isDirectory() ? this.getFilesRecursively(a) : a;
    }));
    return Array.prototype.concat(...i).filter((n) => /\.(mp3|wav|flac|m4a|aac)$/i.test(n));
  }
  async cacheCoverArt(e, t) {
    var o;
    const i = (o = e.common.picture) == null ? void 0 : o[0];
    if (!i)
      return;
    const a = `${_t.createHash("md5").update(t).digest("hex")}.jpg`, s = z.join(this.cacheDir, a);
    return F.existsSync(s) || await F.promises.writeFile(s, i.data), `file://${s}`;
  }
}
function dr(r, e) {
  var t = {};
  for (var i in r)
    Object.prototype.hasOwnProperty.call(r, i) && e.indexOf(i) < 0 && (t[i] = r[i]);
  if (r != null && typeof Object.getOwnPropertySymbols == "function")
    for (var n = 0, i = Object.getOwnPropertySymbols(r); n < i.length; n++)
      e.indexOf(i[n]) < 0 && Object.prototype.propertyIsEnumerable.call(r, i[n]) && (t[i[n]] = r[i[n]]);
  return t;
}
function ac(r, e, t, i) {
  function n(a) {
    return a instanceof t ? a : new t(function(s) {
      s(a);
    });
  }
  return new (t || (t = Promise))(function(a, s) {
    function o(u) {
      try {
        l(i.next(u));
      } catch (h) {
        s(h);
      }
    }
    function c(u) {
      try {
        l(i.throw(u));
      } catch (h) {
        s(h);
      }
    }
    function l(u) {
      u.done ? a(u.value) : n(u.value).then(o, c);
    }
    l((i = i.apply(r, e || [])).next());
  });
}
const oc = (r) => r ? (...e) => r(...e) : (...e) => fetch(...e);
class ni extends Error {
  constructor(e, t = "FunctionsError", i) {
    super(e), this.name = t, this.context = i;
  }
}
class cc extends ni {
  constructor(e) {
    super("Failed to send a request to the Edge Function", "FunctionsFetchError", e);
  }
}
class Si extends ni {
  constructor(e) {
    super("Relay Error invoking the Edge Function", "FunctionsRelayError", e);
  }
}
class Ei extends ni {
  constructor(e) {
    super("Edge Function returned a non-2xx status code", "FunctionsHttpError", e);
  }
}
var Fr;
(function(r) {
  r.Any = "any", r.ApNortheast1 = "ap-northeast-1", r.ApNortheast2 = "ap-northeast-2", r.ApSouth1 = "ap-south-1", r.ApSoutheast1 = "ap-southeast-1", r.ApSoutheast2 = "ap-southeast-2", r.CaCentral1 = "ca-central-1", r.EuCentral1 = "eu-central-1", r.EuWest1 = "eu-west-1", r.EuWest2 = "eu-west-2", r.EuWest3 = "eu-west-3", r.SaEast1 = "sa-east-1", r.UsEast1 = "us-east-1", r.UsWest1 = "us-west-1", r.UsWest2 = "us-west-2";
})(Fr || (Fr = {}));
class lc {
  /**
   * Creates a new Functions client bound to an Edge Functions URL.
   *
   * @example
   * ```ts
   * import { FunctionsClient, FunctionRegion } from '@supabase/functions-js'
   *
   * const functions = new FunctionsClient('https://xyzcompany.supabase.co/functions/v1', {
   *   headers: { apikey: 'public-anon-key' },
   *   region: FunctionRegion.UsEast1,
   * })
   * ```
   */
  constructor(e, { headers: t = {}, customFetch: i, region: n = Fr.Any } = {}) {
    this.url = e, this.headers = t, this.region = n, this.fetch = oc(i);
  }
  /**
   * Updates the authorization header
   * @param token - the new jwt token sent in the authorisation header
   * @example
   * ```ts
   * functions.setAuth(session.access_token)
   * ```
   */
  setAuth(e) {
    this.headers.Authorization = `Bearer ${e}`;
  }
  /**
   * Invokes a function
   * @param functionName - The name of the Function to invoke.
   * @param options - Options for invoking the Function.
   * @example
   * ```ts
   * const { data, error } = await functions.invoke('hello-world', {
   *   body: { name: 'Ada' },
   * })
   * ```
   */
  invoke(e) {
    return ac(this, arguments, void 0, function* (t, i = {}) {
      var n;
      let a, s;
      try {
        const { headers: o, method: c, body: l, signal: u, timeout: h } = i;
        let d = {}, { region: f } = i;
        f || (f = this.region);
        const p = new URL(`${this.url}/${t}`);
        f && f !== "any" && (d["x-region"] = f, p.searchParams.set("forceFunctionRegion", f));
        let m;
        l && (o && !Object.prototype.hasOwnProperty.call(o, "Content-Type") || !o) ? typeof Blob < "u" && l instanceof Blob || l instanceof ArrayBuffer ? (d["Content-Type"] = "application/octet-stream", m = l) : typeof l == "string" ? (d["Content-Type"] = "text/plain", m = l) : typeof FormData < "u" && l instanceof FormData ? m = l : (d["Content-Type"] = "application/json", m = JSON.stringify(l)) : l && typeof l != "string" && !(typeof Blob < "u" && l instanceof Blob) && !(l instanceof ArrayBuffer) && !(typeof FormData < "u" && l instanceof FormData) ? m = JSON.stringify(l) : m = l;
        let g = u;
        h && (s = new AbortController(), a = setTimeout(() => s.abort(), h), u ? (g = s.signal, u.addEventListener("abort", () => s.abort())) : g = s.signal);
        const y = yield this.fetch(p.toString(), {
          method: c || "POST",
          // headers priority is (high to low):
          // 1. invoke-level headers
          // 2. client-level headers
          // 3. default Content-Type header
          headers: Object.assign(Object.assign(Object.assign({}, d), this.headers), o),
          body: m,
          signal: g
        }).catch((S) => {
          throw new cc(S);
        }), w = y.headers.get("x-relay-error");
        if (w && w === "true")
          throw new Si(y);
        if (!y.ok)
          throw new Ei(y);
        let v = ((n = y.headers.get("Content-Type")) !== null && n !== void 0 ? n : "text/plain").split(";")[0].trim(), x;
        return v === "application/json" ? x = yield y.json() : v === "application/octet-stream" || v === "application/pdf" ? x = yield y.blob() : v === "text/event-stream" ? x = y : v === "multipart/form-data" ? x = yield y.formData() : x = yield y.text(), { data: x, error: null, response: y };
      } catch (o) {
        return {
          data: null,
          error: o,
          response: o instanceof Ei || o instanceof Si ? o.context : void 0
        };
      } finally {
        a && clearTimeout(a);
      }
    });
  }
}
var uc = class extends Error {
  /**
  * @example
  * ```ts
  * import PostgrestError from '@supabase/postgrest-js'
  *
  * throw new PostgrestError({
  *   message: 'Row level security prevented the request',
  *   details: 'RLS denied the insert',
  *   hint: 'Check your policies',
  *   code: 'PGRST301',
  * })
  * ```
  */
  constructor(r) {
    super(r.message), this.name = "PostgrestError", this.details = r.details, this.hint = r.hint, this.code = r.code;
  }
}, hc = class {
  /**
  * Creates a builder configured for a specific PostgREST request.
  *
  * @example
  * ```ts
  * import PostgrestQueryBuilder from '@supabase/postgrest-js'
  *
  * const builder = new PostgrestQueryBuilder(
  *   new URL('https://xyzcompany.supabase.co/rest/v1/users'),
  *   { headers: new Headers({ apikey: 'public-anon-key' }) }
  * )
  * ```
  */
  constructor(r) {
    var e, t, i;
    this.shouldThrowOnError = !1, this.method = r.method, this.url = r.url, this.headers = new Headers(r.headers), this.schema = r.schema, this.body = r.body, this.shouldThrowOnError = (e = r.shouldThrowOnError) !== null && e !== void 0 ? e : !1, this.signal = r.signal, this.isMaybeSingle = (t = r.isMaybeSingle) !== null && t !== void 0 ? t : !1, this.urlLengthLimit = (i = r.urlLengthLimit) !== null && i !== void 0 ? i : 8e3, r.fetch ? this.fetch = r.fetch : this.fetch = fetch;
  }
  /**
  * If there's an error with the query, throwOnError will reject the promise by
  * throwing the error instead of returning it as part of a successful response.
  *
  * {@link https://github.com/supabase/supabase-js/issues/92}
  */
  throwOnError() {
    return this.shouldThrowOnError = !0, this;
  }
  /**
  * Set an HTTP header for the request.
  */
  setHeader(r, e) {
    return this.headers = new Headers(this.headers), this.headers.set(r, e), this;
  }
  then(r, e) {
    var t = this;
    this.schema === void 0 || (["GET", "HEAD"].includes(this.method) ? this.headers.set("Accept-Profile", this.schema) : this.headers.set("Content-Profile", this.schema)), this.method !== "GET" && this.method !== "HEAD" && this.headers.set("Content-Type", "application/json");
    const i = this.fetch;
    let n = i(this.url.toString(), {
      method: this.method,
      headers: this.headers,
      body: JSON.stringify(this.body),
      signal: this.signal
    }).then(async (a) => {
      let s = null, o = null, c = null, l = a.status, u = a.statusText;
      if (a.ok) {
        var h, d;
        if (t.method !== "HEAD") {
          var f;
          const y = await a.text();
          y === "" || (t.headers.get("Accept") === "text/csv" || t.headers.get("Accept") && (!((f = t.headers.get("Accept")) === null || f === void 0) && f.includes("application/vnd.pgrst.plan+text")) ? o = y : o = JSON.parse(y));
        }
        const m = (h = t.headers.get("Prefer")) === null || h === void 0 ? void 0 : h.match(/count=(exact|planned|estimated)/), g = (d = a.headers.get("content-range")) === null || d === void 0 ? void 0 : d.split("/");
        m && g && g.length > 1 && (c = parseInt(g[1])), t.isMaybeSingle && t.method === "GET" && Array.isArray(o) && (o.length > 1 ? (s = {
          code: "PGRST116",
          details: `Results contain ${o.length} rows, application/vnd.pgrst.object+json requires 1 row`,
          hint: null,
          message: "JSON object requested, multiple (or no) rows returned"
        }, o = null, c = null, l = 406, u = "Not Acceptable") : o.length === 1 ? o = o[0] : o = null);
      } else {
        var p;
        const m = await a.text();
        try {
          s = JSON.parse(m), Array.isArray(s) && a.status === 404 && (o = [], s = null, l = 200, u = "OK");
        } catch {
          a.status === 404 && m === "" ? (l = 204, u = "No Content") : s = { message: m };
        }
        if (s && t.isMaybeSingle && (!(s == null || (p = s.details) === null || p === void 0) && p.includes("0 rows")) && (s = null, l = 200, u = "OK"), s && t.shouldThrowOnError)
          throw new uc(s);
      }
      return {
        error: s,
        data: o,
        count: c,
        status: l,
        statusText: u
      };
    });
    return this.shouldThrowOnError || (n = n.catch((a) => {
      var s;
      let o = "", c = "", l = "";
      const u = a == null ? void 0 : a.cause;
      if (u) {
        var h, d, f, p;
        const y = (h = u == null ? void 0 : u.message) !== null && h !== void 0 ? h : "", w = (d = u == null ? void 0 : u.code) !== null && d !== void 0 ? d : "";
        o = `${(f = a == null ? void 0 : a.name) !== null && f !== void 0 ? f : "FetchError"}: ${a == null ? void 0 : a.message}`, o += `

Caused by: ${(p = u == null ? void 0 : u.name) !== null && p !== void 0 ? p : "Error"}: ${y}`, w && (o += ` (${w})`), u != null && u.stack && (o += `
${u.stack}`);
      } else {
        var m;
        o = (m = a == null ? void 0 : a.stack) !== null && m !== void 0 ? m : "";
      }
      const g = this.url.toString().length;
      return (a == null ? void 0 : a.name) === "AbortError" || (a == null ? void 0 : a.code) === "ABORT_ERR" ? (l = "", c = "Request was aborted (timeout or manual cancellation)", g > this.urlLengthLimit && (c += `. Note: Your request URL is ${g} characters, which may exceed server limits. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [many IDs])), consider using an RPC function to pass values server-side.`)) : ((u == null ? void 0 : u.name) === "HeadersOverflowError" || (u == null ? void 0 : u.code) === "UND_ERR_HEADERS_OVERFLOW") && (l = "", c = "HTTP headers exceeded server limits (typically 16KB)", g > this.urlLengthLimit && (c += `. Your request URL is ${g} characters. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [200+ IDs])), consider using an RPC function instead.`)), {
        error: {
          message: `${(s = a == null ? void 0 : a.name) !== null && s !== void 0 ? s : "FetchError"}: ${a == null ? void 0 : a.message}`,
          details: o,
          hint: c,
          code: l
        },
        data: null,
        count: null,
        status: 0,
        statusText: ""
      };
    })), n.then(r, e);
  }
  /**
  * Override the type of the returned `data`.
  *
  * @typeParam NewResult - The new result type to override with
  * @deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead
  */
  returns() {
    return this;
  }
  /**
  * Override the type of the returned `data` field in the response.
  *
  * @typeParam NewResult - The new type to cast the response data to
  * @typeParam Options - Optional type configuration (defaults to { merge: true })
  * @typeParam Options.merge - When true, merges the new type with existing return type. When false, replaces the existing types entirely (defaults to true)
  * @example
  * ```typescript
  * // Merge with existing types (default behavior)
  * const query = supabase
  *   .from('users')
  *   .select()
  *   .overrideTypes<{ custom_field: string }>()
  *
  * // Replace existing types completely
  * const replaceQuery = supabase
  *   .from('users')
  *   .select()
  *   .overrideTypes<{ id: number; name: string }, { merge: false }>()
  * ```
  * @returns A PostgrestBuilder instance with the new type
  */
  overrideTypes() {
    return this;
  }
}, dc = class extends hc {
  /**
  * Perform a SELECT on the query result.
  *
  * By default, `.insert()`, `.update()`, `.upsert()`, and `.delete()` do not
  * return modified rows. By calling this method, modified rows are returned in
  * `data`.
  *
  * @param columns - The columns to retrieve, separated by commas
  */
  select(r) {
    let e = !1;
    const t = (r ?? "*").split("").map((i) => /\s/.test(i) && !e ? "" : (i === '"' && (e = !e), i)).join("");
    return this.url.searchParams.set("select", t), this.headers.append("Prefer", "return=representation"), this;
  }
  /**
  * Order the query result by `column`.
  *
  * You can call this method multiple times to order by multiple columns.
  *
  * You can order referenced tables, but it only affects the ordering of the
  * parent table if you use `!inner` in the query.
  *
  * @param column - The column to order by
  * @param options - Named parameters
  * @param options.ascending - If `true`, the result will be in ascending order
  * @param options.nullsFirst - If `true`, `null`s appear first. If `false`,
  * `null`s appear last.
  * @param options.referencedTable - Set this to order a referenced table by
  * its columns
  * @param options.foreignTable - Deprecated, use `options.referencedTable`
  * instead
  */
  order(r, { ascending: e = !0, nullsFirst: t, foreignTable: i, referencedTable: n = i } = {}) {
    const a = n ? `${n}.order` : "order", s = this.url.searchParams.get(a);
    return this.url.searchParams.set(a, `${s ? `${s},` : ""}${r}.${e ? "asc" : "desc"}${t === void 0 ? "" : t ? ".nullsfirst" : ".nullslast"}`), this;
  }
  /**
  * Limit the query result by `count`.
  *
  * @param count - The maximum number of rows to return
  * @param options - Named parameters
  * @param options.referencedTable - Set this to limit rows of referenced
  * tables instead of the parent table
  * @param options.foreignTable - Deprecated, use `options.referencedTable`
  * instead
  */
  limit(r, { foreignTable: e, referencedTable: t = e } = {}) {
    const i = typeof t > "u" ? "limit" : `${t}.limit`;
    return this.url.searchParams.set(i, `${r}`), this;
  }
  /**
  * Limit the query result by starting at an offset `from` and ending at the offset `to`.
  * Only records within this range are returned.
  * This respects the query order and if there is no order clause the range could behave unexpectedly.
  * The `from` and `to` values are 0-based and inclusive: `range(1, 3)` will include the second, third
  * and fourth rows of the query.
  *
  * @param from - The starting index from which to limit the result
  * @param to - The last index to which to limit the result
  * @param options - Named parameters
  * @param options.referencedTable - Set this to limit rows of referenced
  * tables instead of the parent table
  * @param options.foreignTable - Deprecated, use `options.referencedTable`
  * instead
  */
  range(r, e, { foreignTable: t, referencedTable: i = t } = {}) {
    const n = typeof i > "u" ? "offset" : `${i}.offset`, a = typeof i > "u" ? "limit" : `${i}.limit`;
    return this.url.searchParams.set(n, `${r}`), this.url.searchParams.set(a, `${e - r + 1}`), this;
  }
  /**
  * Set the AbortSignal for the fetch request.
  *
  * @param signal - The AbortSignal to use for the fetch request
  */
  abortSignal(r) {
    return this.signal = r, this;
  }
  /**
  * Return `data` as a single object instead of an array of objects.
  *
  * Query result must be one row (e.g. using `.limit(1)`), otherwise this
  * returns an error.
  */
  single() {
    return this.headers.set("Accept", "application/vnd.pgrst.object+json"), this;
  }
  /**
  * Return `data` as a single object instead of an array of objects.
  *
  * Query result must be zero or one row (e.g. using `.limit(1)`), otherwise
  * this returns an error.
  */
  maybeSingle() {
    return this.method === "GET" ? this.headers.set("Accept", "application/json") : this.headers.set("Accept", "application/vnd.pgrst.object+json"), this.isMaybeSingle = !0, this;
  }
  /**
  * Return `data` as a string in CSV format.
  */
  csv() {
    return this.headers.set("Accept", "text/csv"), this;
  }
  /**
  * Return `data` as an object in [GeoJSON](https://geojson.org) format.
  */
  geojson() {
    return this.headers.set("Accept", "application/geo+json"), this;
  }
  /**
  * Return `data` as the EXPLAIN plan for the query.
  *
  * You need to enable the
  * [db_plan_enabled](https://supabase.com/docs/guides/database/debugging-performance#enabling-explain)
  * setting before using this method.
  *
  * @param options - Named parameters
  *
  * @param options.analyze - If `true`, the query will be executed and the
  * actual run time will be returned
  *
  * @param options.verbose - If `true`, the query identifier will be returned
  * and `data` will include the output columns of the query
  *
  * @param options.settings - If `true`, include information on configuration
  * parameters that affect query planning
  *
  * @param options.buffers - If `true`, include information on buffer usage
  *
  * @param options.wal - If `true`, include information on WAL record generation
  *
  * @param options.format - The format of the output, can be `"text"` (default)
  * or `"json"`
  */
  explain({ analyze: r = !1, verbose: e = !1, settings: t = !1, buffers: i = !1, wal: n = !1, format: a = "text" } = {}) {
    var s;
    const o = [
      r ? "analyze" : null,
      e ? "verbose" : null,
      t ? "settings" : null,
      i ? "buffers" : null,
      n ? "wal" : null
    ].filter(Boolean).join("|"), c = (s = this.headers.get("Accept")) !== null && s !== void 0 ? s : "application/json";
    return this.headers.set("Accept", `application/vnd.pgrst.plan+${a}; for="${c}"; options=${o};`), a === "json" ? this : this;
  }
  /**
  * Rollback the query.
  *
  * `data` will still be returned, but the query is not committed.
  */
  rollback() {
    return this.headers.append("Prefer", "tx=rollback"), this;
  }
  /**
  * Override the type of the returned `data`.
  *
  * @typeParam NewResult - The new result type to override with
  * @deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead
  */
  returns() {
    return this;
  }
  /**
  * Set the maximum number of rows that can be affected by the query.
  * Only available in PostgREST v13+ and only works with PATCH and DELETE methods.
  *
  * @param value - The maximum number of rows that can be affected
  */
  maxAffected(r) {
    return this.headers.append("Prefer", "handling=strict"), this.headers.append("Prefer", `max-affected=${r}`), this;
  }
};
const Ai = /* @__PURE__ */ new RegExp("[,()]");
var Qe = class extends dc {
  /**
  * Match only rows where `column` is equal to `value`.
  *
  * To check if the value of `column` is NULL, you should use `.is()` instead.
  *
  * @param column - The column to filter on
  * @param value - The value to filter with
  */
  eq(r, e) {
    return this.url.searchParams.append(r, `eq.${e}`), this;
  }
  /**
  * Match only rows where `column` is not equal to `value`.
  *
  * @param column - The column to filter on
  * @param value - The value to filter with
  */
  neq(r, e) {
    return this.url.searchParams.append(r, `neq.${e}`), this;
  }
  /**
  * Match only rows where `column` is greater than `value`.
  *
  * @param column - The column to filter on
  * @param value - The value to filter with
  */
  gt(r, e) {
    return this.url.searchParams.append(r, `gt.${e}`), this;
  }
  /**
  * Match only rows where `column` is greater than or equal to `value`.
  *
  * @param column - The column to filter on
  * @param value - The value to filter with
  */
  gte(r, e) {
    return this.url.searchParams.append(r, `gte.${e}`), this;
  }
  /**
  * Match only rows where `column` is less than `value`.
  *
  * @param column - The column to filter on
  * @param value - The value to filter with
  */
  lt(r, e) {
    return this.url.searchParams.append(r, `lt.${e}`), this;
  }
  /**
  * Match only rows where `column` is less than or equal to `value`.
  *
  * @param column - The column to filter on
  * @param value - The value to filter with
  */
  lte(r, e) {
    return this.url.searchParams.append(r, `lte.${e}`), this;
  }
  /**
  * Match only rows where `column` matches `pattern` case-sensitively.
  *
  * @param column - The column to filter on
  * @param pattern - The pattern to match with
  */
  like(r, e) {
    return this.url.searchParams.append(r, `like.${e}`), this;
  }
  /**
  * Match only rows where `column` matches all of `patterns` case-sensitively.
  *
  * @param column - The column to filter on
  * @param patterns - The patterns to match with
  */
  likeAllOf(r, e) {
    return this.url.searchParams.append(r, `like(all).{${e.join(",")}}`), this;
  }
  /**
  * Match only rows where `column` matches any of `patterns` case-sensitively.
  *
  * @param column - The column to filter on
  * @param patterns - The patterns to match with
  */
  likeAnyOf(r, e) {
    return this.url.searchParams.append(r, `like(any).{${e.join(",")}}`), this;
  }
  /**
  * Match only rows where `column` matches `pattern` case-insensitively.
  *
  * @param column - The column to filter on
  * @param pattern - The pattern to match with
  */
  ilike(r, e) {
    return this.url.searchParams.append(r, `ilike.${e}`), this;
  }
  /**
  * Match only rows where `column` matches all of `patterns` case-insensitively.
  *
  * @param column - The column to filter on
  * @param patterns - The patterns to match with
  */
  ilikeAllOf(r, e) {
    return this.url.searchParams.append(r, `ilike(all).{${e.join(",")}}`), this;
  }
  /**
  * Match only rows where `column` matches any of `patterns` case-insensitively.
  *
  * @param column - The column to filter on
  * @param patterns - The patterns to match with
  */
  ilikeAnyOf(r, e) {
    return this.url.searchParams.append(r, `ilike(any).{${e.join(",")}}`), this;
  }
  /**
  * Match only rows where `column` matches the PostgreSQL regex `pattern`
  * case-sensitively (using the `~` operator).
  *
  * @param column - The column to filter on
  * @param pattern - The PostgreSQL regular expression pattern to match with
  */
  regexMatch(r, e) {
    return this.url.searchParams.append(r, `match.${e}`), this;
  }
  /**
  * Match only rows where `column` matches the PostgreSQL regex `pattern`
  * case-insensitively (using the `~*` operator).
  *
  * @param column - The column to filter on
  * @param pattern - The PostgreSQL regular expression pattern to match with
  */
  regexIMatch(r, e) {
    return this.url.searchParams.append(r, `imatch.${e}`), this;
  }
  /**
  * Match only rows where `column` IS `value`.
  *
  * For non-boolean columns, this is only relevant for checking if the value of
  * `column` is NULL by setting `value` to `null`.
  *
  * For boolean columns, you can also set `value` to `true` or `false` and it
  * will behave the same way as `.eq()`.
  *
  * @param column - The column to filter on
  * @param value - The value to filter with
  */
  is(r, e) {
    return this.url.searchParams.append(r, `is.${e}`), this;
  }
  /**
  * Match only rows where `column` IS DISTINCT FROM `value`.
  *
  * Unlike `.neq()`, this treats `NULL` as a comparable value. Two `NULL` values
  * are considered equal (not distinct), and comparing `NULL` with any non-NULL
  * value returns true (distinct).
  *
  * @param column - The column to filter on
  * @param value - The value to filter with
  */
  isDistinct(r, e) {
    return this.url.searchParams.append(r, `isdistinct.${e}`), this;
  }
  /**
  * Match only rows where `column` is included in the `values` array.
  *
  * @param column - The column to filter on
  * @param values - The values array to filter with
  */
  in(r, e) {
    const t = Array.from(new Set(e)).map((i) => typeof i == "string" && Ai.test(i) ? `"${i}"` : `${i}`).join(",");
    return this.url.searchParams.append(r, `in.(${t})`), this;
  }
  /**
  * Match only rows where `column` is NOT included in the `values` array.
  *
  * @param column - The column to filter on
  * @param values - The values array to filter with
  */
  notIn(r, e) {
    const t = Array.from(new Set(e)).map((i) => typeof i == "string" && Ai.test(i) ? `"${i}"` : `${i}`).join(",");
    return this.url.searchParams.append(r, `not.in.(${t})`), this;
  }
  /**
  * Only relevant for jsonb, array, and range columns. Match only rows where
  * `column` contains every element appearing in `value`.
  *
  * @param column - The jsonb, array, or range column to filter on
  * @param value - The jsonb, array, or range value to filter with
  */
  contains(r, e) {
    return typeof e == "string" ? this.url.searchParams.append(r, `cs.${e}`) : Array.isArray(e) ? this.url.searchParams.append(r, `cs.{${e.join(",")}}`) : this.url.searchParams.append(r, `cs.${JSON.stringify(e)}`), this;
  }
  /**
  * Only relevant for jsonb, array, and range columns. Match only rows where
  * every element appearing in `column` is contained by `value`.
  *
  * @param column - The jsonb, array, or range column to filter on
  * @param value - The jsonb, array, or range value to filter with
  */
  containedBy(r, e) {
    return typeof e == "string" ? this.url.searchParams.append(r, `cd.${e}`) : Array.isArray(e) ? this.url.searchParams.append(r, `cd.{${e.join(",")}}`) : this.url.searchParams.append(r, `cd.${JSON.stringify(e)}`), this;
  }
  /**
  * Only relevant for range columns. Match only rows where every element in
  * `column` is greater than any element in `range`.
  *
  * @param column - The range column to filter on
  * @param range - The range to filter with
  */
  rangeGt(r, e) {
    return this.url.searchParams.append(r, `sr.${e}`), this;
  }
  /**
  * Only relevant for range columns. Match only rows where every element in
  * `column` is either contained in `range` or greater than any element in
  * `range`.
  *
  * @param column - The range column to filter on
  * @param range - The range to filter with
  */
  rangeGte(r, e) {
    return this.url.searchParams.append(r, `nxl.${e}`), this;
  }
  /**
  * Only relevant for range columns. Match only rows where every element in
  * `column` is less than any element in `range`.
  *
  * @param column - The range column to filter on
  * @param range - The range to filter with
  */
  rangeLt(r, e) {
    return this.url.searchParams.append(r, `sl.${e}`), this;
  }
  /**
  * Only relevant for range columns. Match only rows where every element in
  * `column` is either contained in `range` or less than any element in
  * `range`.
  *
  * @param column - The range column to filter on
  * @param range - The range to filter with
  */
  rangeLte(r, e) {
    return this.url.searchParams.append(r, `nxr.${e}`), this;
  }
  /**
  * Only relevant for range columns. Match only rows where `column` is
  * mutually exclusive to `range` and there can be no element between the two
  * ranges.
  *
  * @param column - The range column to filter on
  * @param range - The range to filter with
  */
  rangeAdjacent(r, e) {
    return this.url.searchParams.append(r, `adj.${e}`), this;
  }
  /**
  * Only relevant for array and range columns. Match only rows where
  * `column` and `value` have an element in common.
  *
  * @param column - The array or range column to filter on
  * @param value - The array or range value to filter with
  */
  overlaps(r, e) {
    return typeof e == "string" ? this.url.searchParams.append(r, `ov.${e}`) : this.url.searchParams.append(r, `ov.{${e.join(",")}}`), this;
  }
  /**
  * Only relevant for text and tsvector columns. Match only rows where
  * `column` matches the query string in `query`.
  *
  * @param column - The text or tsvector column to filter on
  * @param query - The query text to match with
  * @param options - Named parameters
  * @param options.config - The text search configuration to use
  * @param options.type - Change how the `query` text is interpreted
  */
  textSearch(r, e, { config: t, type: i } = {}) {
    let n = "";
    i === "plain" ? n = "pl" : i === "phrase" ? n = "ph" : i === "websearch" && (n = "w");
    const a = t === void 0 ? "" : `(${t})`;
    return this.url.searchParams.append(r, `${n}fts${a}.${e}`), this;
  }
  /**
  * Match only rows where each column in `query` keys is equal to its
  * associated value. Shorthand for multiple `.eq()`s.
  *
  * @param query - The object to filter with, with column names as keys mapped
  * to their filter values
  */
  match(r) {
    return Object.entries(r).forEach(([e, t]) => {
      this.url.searchParams.append(e, `eq.${t}`);
    }), this;
  }
  /**
  * Match only rows which doesn't satisfy the filter.
  *
  * Unlike most filters, `opearator` and `value` are used as-is and need to
  * follow [PostgREST
  * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
  * to make sure they are properly sanitized.
  *
  * @param column - The column to filter on
  * @param operator - The operator to be negated to filter with, following
  * PostgREST syntax
  * @param value - The value to filter with, following PostgREST syntax
  */
  not(r, e, t) {
    return this.url.searchParams.append(r, `not.${e}.${t}`), this;
  }
  /**
  * Match only rows which satisfy at least one of the filters.
  *
  * Unlike most filters, `filters` is used as-is and needs to follow [PostgREST
  * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
  * to make sure it's properly sanitized.
  *
  * It's currently not possible to do an `.or()` filter across multiple tables.
  *
  * @param filters - The filters to use, following PostgREST syntax
  * @param options - Named parameters
  * @param options.referencedTable - Set this to filter on referenced tables
  * instead of the parent table
  * @param options.foreignTable - Deprecated, use `referencedTable` instead
  */
  or(r, { foreignTable: e, referencedTable: t = e } = {}) {
    const i = t ? `${t}.or` : "or";
    return this.url.searchParams.append(i, `(${r})`), this;
  }
  /**
  * Match only rows which satisfy the filter. This is an escape hatch - you
  * should use the specific filter methods wherever possible.
  *
  * Unlike most filters, `opearator` and `value` are used as-is and need to
  * follow [PostgREST
  * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
  * to make sure they are properly sanitized.
  *
  * @param column - The column to filter on
  * @param operator - The operator to filter with, following PostgREST syntax
  * @param value - The value to filter with, following PostgREST syntax
  */
  filter(r, e, t) {
    return this.url.searchParams.append(r, `${e}.${t}`), this;
  }
}, fc = class {
  /**
  * Creates a query builder scoped to a Postgres table or view.
  *
  * @example
  * ```ts
  * import PostgrestQueryBuilder from '@supabase/postgrest-js'
  *
  * const query = new PostgrestQueryBuilder(
  *   new URL('https://xyzcompany.supabase.co/rest/v1/users'),
  *   { headers: { apikey: 'public-anon-key' } }
  * )
  * ```
  */
  constructor(r, { headers: e = {}, schema: t, fetch: i, urlLengthLimit: n = 8e3 }) {
    this.url = r, this.headers = new Headers(e), this.schema = t, this.fetch = i, this.urlLengthLimit = n;
  }
  /**
  * Clone URL and headers to prevent shared state between operations.
  */
  cloneRequestState() {
    return {
      url: new URL(this.url.toString()),
      headers: new Headers(this.headers)
    };
  }
  /**
  * Perform a SELECT query on the table or view.
  *
  * @param columns - The columns to retrieve, separated by commas. Columns can be renamed when returned with `customName:columnName`
  *
  * @param options - Named parameters
  *
  * @param options.head - When set to `true`, `data` will not be returned.
  * Useful if you only need the count.
  *
  * @param options.count - Count algorithm to use to count rows in the table or view.
  *
  * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
  * hood.
  *
  * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
  * statistics under the hood.
  *
  * `"estimated"`: Uses exact count for low numbers and planned count for high
  * numbers.
  *
  * @remarks
  * When using `count` with `.range()` or `.limit()`, the returned `count` is the total number of rows
  * that match your filters, not the number of rows in the current page. Use this to build pagination UI.
  */
  select(r, e) {
    const { head: t = !1, count: i } = e ?? {}, n = t ? "HEAD" : "GET";
    let a = !1;
    const s = (r ?? "*").split("").map((l) => /\s/.test(l) && !a ? "" : (l === '"' && (a = !a), l)).join(""), { url: o, headers: c } = this.cloneRequestState();
    return o.searchParams.set("select", s), i && c.append("Prefer", `count=${i}`), new Qe({
      method: n,
      url: o,
      headers: c,
      schema: this.schema,
      fetch: this.fetch,
      urlLengthLimit: this.urlLengthLimit
    });
  }
  /**
  * Perform an INSERT into the table or view.
  *
  * By default, inserted rows are not returned. To return it, chain the call
  * with `.select()`.
  *
  * @param values - The values to insert. Pass an object to insert a single row
  * or an array to insert multiple rows.
  *
  * @param options - Named parameters
  *
  * @param options.count - Count algorithm to use to count inserted rows.
  *
  * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
  * hood.
  *
  * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
  * statistics under the hood.
  *
  * `"estimated"`: Uses exact count for low numbers and planned count for high
  * numbers.
  *
  * @param options.defaultToNull - Make missing fields default to `null`.
  * Otherwise, use the default value for the column. Only applies for bulk
  * inserts.
  */
  insert(r, { count: e, defaultToNull: t = !0 } = {}) {
    var i;
    const n = "POST", { url: a, headers: s } = this.cloneRequestState();
    if (e && s.append("Prefer", `count=${e}`), t || s.append("Prefer", "missing=default"), Array.isArray(r)) {
      const o = r.reduce((c, l) => c.concat(Object.keys(l)), []);
      if (o.length > 0) {
        const c = [...new Set(o)].map((l) => `"${l}"`);
        a.searchParams.set("columns", c.join(","));
      }
    }
    return new Qe({
      method: n,
      url: a,
      headers: s,
      schema: this.schema,
      body: r,
      fetch: (i = this.fetch) !== null && i !== void 0 ? i : fetch,
      urlLengthLimit: this.urlLengthLimit
    });
  }
  /**
  * Perform an UPSERT on the table or view. Depending on the column(s) passed
  * to `onConflict`, `.upsert()` allows you to perform the equivalent of
  * `.insert()` if a row with the corresponding `onConflict` columns doesn't
  * exist, or if it does exist, perform an alternative action depending on
  * `ignoreDuplicates`.
  *
  * By default, upserted rows are not returned. To return it, chain the call
  * with `.select()`.
  *
  * @param values - The values to upsert with. Pass an object to upsert a
  * single row or an array to upsert multiple rows.
  *
  * @param options - Named parameters
  *
  * @param options.onConflict - Comma-separated UNIQUE column(s) to specify how
  * duplicate rows are determined. Two rows are duplicates if all the
  * `onConflict` columns are equal.
  *
  * @param options.ignoreDuplicates - If `true`, duplicate rows are ignored. If
  * `false`, duplicate rows are merged with existing rows.
  *
  * @param options.count - Count algorithm to use to count upserted rows.
  *
  * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
  * hood.
  *
  * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
  * statistics under the hood.
  *
  * `"estimated"`: Uses exact count for low numbers and planned count for high
  * numbers.
  *
  * @param options.defaultToNull - Make missing fields default to `null`.
  * Otherwise, use the default value for the column. This only applies when
  * inserting new rows, not when merging with existing rows under
  * `ignoreDuplicates: false`. This also only applies when doing bulk upserts.
  *
  * @example Upsert a single row using a unique key
  * ```ts
  * // Upserting a single row, overwriting based on the 'username' unique column
  * const { data, error } = await supabase
  *   .from('users')
  *   .upsert({ username: 'supabot' }, { onConflict: 'username' })
  *
  * // Example response:
  * // {
  * //   data: [
  * //     { id: 4, message: 'bar', username: 'supabot' }
  * //   ],
  * //   error: null
  * // }
  * ```
  *
  * @example Upsert with conflict resolution and exact row counting
  * ```ts
  * // Upserting and returning exact count
  * const { data, error, count } = await supabase
  *   .from('users')
  *   .upsert(
  *     {
  *       id: 3,
  *       message: 'foo',
  *       username: 'supabot'
  *     },
  *     {
  *       onConflict: 'username',
  *       count: 'exact'
  *     }
  *   )
  *
  * // Example response:
  * // {
  * //   data: [
  * //     {
  * //       id: 42,
  * //       handle: "saoirse",
  * //       display_name: "Saoirse"
  * //     }
  * //   ],
  * //   count: 1,
  * //   error: null
  * // }
  * ```
  */
  upsert(r, { onConflict: e, ignoreDuplicates: t = !1, count: i, defaultToNull: n = !0 } = {}) {
    var a;
    const s = "POST", { url: o, headers: c } = this.cloneRequestState();
    if (c.append("Prefer", `resolution=${t ? "ignore" : "merge"}-duplicates`), e !== void 0 && o.searchParams.set("on_conflict", e), i && c.append("Prefer", `count=${i}`), n || c.append("Prefer", "missing=default"), Array.isArray(r)) {
      const l = r.reduce((u, h) => u.concat(Object.keys(h)), []);
      if (l.length > 0) {
        const u = [...new Set(l)].map((h) => `"${h}"`);
        o.searchParams.set("columns", u.join(","));
      }
    }
    return new Qe({
      method: s,
      url: o,
      headers: c,
      schema: this.schema,
      body: r,
      fetch: (a = this.fetch) !== null && a !== void 0 ? a : fetch,
      urlLengthLimit: this.urlLengthLimit
    });
  }
  /**
  * Perform an UPDATE on the table or view.
  *
  * By default, updated rows are not returned. To return it, chain the call
  * with `.select()` after filters.
  *
  * @param values - The values to update with
  *
  * @param options - Named parameters
  *
  * @param options.count - Count algorithm to use to count updated rows.
  *
  * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
  * hood.
  *
  * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
  * statistics under the hood.
  *
  * `"estimated"`: Uses exact count for low numbers and planned count for high
  * numbers.
  */
  update(r, { count: e } = {}) {
    var t;
    const i = "PATCH", { url: n, headers: a } = this.cloneRequestState();
    return e && a.append("Prefer", `count=${e}`), new Qe({
      method: i,
      url: n,
      headers: a,
      schema: this.schema,
      body: r,
      fetch: (t = this.fetch) !== null && t !== void 0 ? t : fetch,
      urlLengthLimit: this.urlLengthLimit
    });
  }
  /**
  * Perform a DELETE on the table or view.
  *
  * By default, deleted rows are not returned. To return it, chain the call
  * with `.select()` after filters.
  *
  * @param options - Named parameters
  *
  * @param options.count - Count algorithm to use to count deleted rows.
  *
  * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
  * hood.
  *
  * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
  * statistics under the hood.
  *
  * `"estimated"`: Uses exact count for low numbers and planned count for high
  * numbers.
  */
  delete({ count: r } = {}) {
    var e;
    const t = "DELETE", { url: i, headers: n } = this.cloneRequestState();
    return r && n.append("Prefer", `count=${r}`), new Qe({
      method: t,
      url: i,
      headers: n,
      schema: this.schema,
      fetch: (e = this.fetch) !== null && e !== void 0 ? e : fetch,
      urlLengthLimit: this.urlLengthLimit
    });
  }
};
function Tt(r) {
  "@babel/helpers - typeof";
  return Tt = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
    return typeof e;
  } : function(e) {
    return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, Tt(r);
}
function pc(r, e) {
  if (Tt(r) != "object" || !r)
    return r;
  var t = r[Symbol.toPrimitive];
  if (t !== void 0) {
    var i = t.call(r, e);
    if (Tt(i) != "object")
      return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(r);
}
function mc(r) {
  var e = pc(r, "string");
  return Tt(e) == "symbol" ? e : e + "";
}
function gc(r, e, t) {
  return (e = mc(e)) in r ? Object.defineProperty(r, e, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : r[e] = t, r;
}
function Ii(r, e) {
  var t = Object.keys(r);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(r);
    e && (i = i.filter(function(n) {
      return Object.getOwnPropertyDescriptor(r, n).enumerable;
    })), t.push.apply(t, i);
  }
  return t;
}
function Kt(r) {
  for (var e = 1; e < arguments.length; e++) {
    var t = arguments[e] != null ? arguments[e] : {};
    e % 2 ? Ii(Object(t), !0).forEach(function(i) {
      gc(r, i, t[i]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(r, Object.getOwnPropertyDescriptors(t)) : Ii(Object(t)).forEach(function(i) {
      Object.defineProperty(r, i, Object.getOwnPropertyDescriptor(t, i));
    });
  }
  return r;
}
var yc = class Dn {
  /**
  * Creates a PostgREST client.
  *
  * @param url - URL of the PostgREST endpoint
  * @param options - Named parameters
  * @param options.headers - Custom headers
  * @param options.schema - Postgres schema to switch to
  * @param options.fetch - Custom fetch
  * @param options.timeout - Optional timeout in milliseconds for all requests. When set, requests will automatically abort after this duration to prevent indefinite hangs.
  * @param options.urlLengthLimit - Maximum URL length in characters before warnings/errors are triggered. Defaults to 8000.
  * @example
  * ```ts
  * import PostgrestClient from '@supabase/postgrest-js'
  *
  * const postgrest = new PostgrestClient('https://xyzcompany.supabase.co/rest/v1', {
  *   headers: { apikey: 'public-anon-key' },
  *   schema: 'public',
  *   timeout: 30000, // 30 second timeout
  * })
  * ```
  */
  constructor(e, { headers: t = {}, schema: i, fetch: n, timeout: a, urlLengthLimit: s = 8e3 } = {}) {
    this.url = e, this.headers = new Headers(t), this.schemaName = i, this.urlLengthLimit = s;
    const o = n ?? globalThis.fetch;
    a !== void 0 && a > 0 ? this.fetch = (c, l) => {
      const u = new AbortController(), h = setTimeout(() => u.abort(), a), d = l == null ? void 0 : l.signal;
      if (d) {
        if (d.aborted)
          return clearTimeout(h), o(c, l);
        const f = () => {
          clearTimeout(h), u.abort();
        };
        return d.addEventListener("abort", f, { once: !0 }), o(c, Kt(Kt({}, l), {}, { signal: u.signal })).finally(() => {
          clearTimeout(h), d.removeEventListener("abort", f);
        });
      }
      return o(c, Kt(Kt({}, l), {}, { signal: u.signal })).finally(() => clearTimeout(h));
    } : this.fetch = o;
  }
  /**
  * Perform a query on a table or a view.
  *
  * @param relation - The table or view name to query
  */
  from(e) {
    if (!e || typeof e != "string" || e.trim() === "")
      throw new Error("Invalid relation name: relation must be a non-empty string.");
    return new fc(new URL(`${this.url}/${e}`), {
      headers: new Headers(this.headers),
      schema: this.schemaName,
      fetch: this.fetch,
      urlLengthLimit: this.urlLengthLimit
    });
  }
  /**
  * Select a schema to query or perform an function (rpc) call.
  *
  * The schema needs to be on the list of exposed schemas inside Supabase.
  *
  * @param schema - The schema to query
  */
  schema(e) {
    return new Dn(this.url, {
      headers: this.headers,
      schema: e,
      fetch: this.fetch,
      urlLengthLimit: this.urlLengthLimit
    });
  }
  /**
  * Perform a function call.
  *
  * @param fn - The function name to call
  * @param args - The arguments to pass to the function call
  * @param options - Named parameters
  * @param options.head - When set to `true`, `data` will not be returned.
  * Useful if you only need the count.
  * @param options.get - When set to `true`, the function will be called with
  * read-only access mode.
  * @param options.count - Count algorithm to use to count rows returned by the
  * function. Only applicable for [set-returning
  * functions](https://www.postgresql.org/docs/current/functions-srf.html).
  *
  * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
  * hood.
  *
  * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
  * statistics under the hood.
  *
  * `"estimated"`: Uses exact count for low numbers and planned count for high
  * numbers.
  *
  * @example
  * ```ts
  * // For cross-schema functions where type inference fails, use overrideTypes:
  * const { data } = await supabase
  *   .schema('schema_b')
  *   .rpc('function_a', {})
  *   .overrideTypes<{ id: string; user_id: string }[]>()
  * ```
  */
  rpc(e, t = {}, { head: i = !1, get: n = !1, count: a } = {}) {
    var s;
    let o;
    const c = new URL(`${this.url}/rpc/${e}`);
    let l;
    const u = (f) => f !== null && typeof f == "object" && (!Array.isArray(f) || f.some(u)), h = i && Object.values(t).some(u);
    h ? (o = "POST", l = t) : i || n ? (o = i ? "HEAD" : "GET", Object.entries(t).filter(([f, p]) => p !== void 0).map(([f, p]) => [f, Array.isArray(p) ? `{${p.join(",")}}` : `${p}`]).forEach(([f, p]) => {
      c.searchParams.append(f, p);
    })) : (o = "POST", l = t);
    const d = new Headers(this.headers);
    return h ? d.set("Prefer", a ? `count=${a},return=minimal` : "return=minimal") : a && d.set("Prefer", `count=${a}`), new Qe({
      method: o,
      url: c,
      headers: d,
      schema: this.schemaName,
      body: l,
      fetch: (s = this.fetch) !== null && s !== void 0 ? s : fetch,
      urlLengthLimit: this.urlLengthLimit
    });
  }
};
class wc {
  /**
   * Static-only utility – prevent instantiation.
   */
  constructor() {
  }
  static detectEnvironment() {
    var e;
    if (typeof WebSocket < "u")
      return { type: "native", constructor: WebSocket };
    if (typeof globalThis < "u" && typeof globalThis.WebSocket < "u")
      return { type: "native", constructor: globalThis.WebSocket };
    if (typeof global < "u" && typeof global.WebSocket < "u")
      return { type: "native", constructor: global.WebSocket };
    if (typeof globalThis < "u" && typeof globalThis.WebSocketPair < "u" && typeof globalThis.WebSocket > "u")
      return {
        type: "cloudflare",
        error: "Cloudflare Workers detected. WebSocket clients are not supported in Cloudflare Workers.",
        workaround: "Use Cloudflare Workers WebSocket API for server-side WebSocket handling, or deploy to a different runtime."
      };
    if (typeof globalThis < "u" && globalThis.EdgeRuntime || typeof navigator < "u" && (!((e = navigator.userAgent) === null || e === void 0) && e.includes("Vercel-Edge")))
      return {
        type: "unsupported",
        error: "Edge runtime detected (Vercel Edge/Netlify Edge). WebSockets are not supported in edge functions.",
        workaround: "Use serverless functions or a different deployment target for WebSocket functionality."
      };
    const t = globalThis.process;
    if (t) {
      const i = t.versions;
      if (i && i.node) {
        const n = i.node, a = parseInt(n.replace(/^v/, "").split(".")[0]);
        return a >= 22 ? typeof globalThis.WebSocket < "u" ? { type: "native", constructor: globalThis.WebSocket } : {
          type: "unsupported",
          error: `Node.js ${a} detected but native WebSocket not found.`,
          workaround: "Provide a WebSocket implementation via the transport option."
        } : {
          type: "unsupported",
          error: `Node.js ${a} detected without native WebSocket support.`,
          workaround: `For Node.js < 22, install "ws" package and provide it via the transport option:
import ws from "ws"
new RealtimeClient(url, { transport: ws })`
        };
      }
    }
    return {
      type: "unsupported",
      error: "Unknown JavaScript runtime without WebSocket support.",
      workaround: "Ensure you're running in a supported environment (browser, Node.js, Deno) or provide a custom WebSocket implementation."
    };
  }
  /**
   * Returns the best available WebSocket constructor for the current runtime.
   *
   * @example
   * ```ts
   * const WS = WebSocketFactory.getWebSocketConstructor()
   * const socket = new WS('wss://realtime.supabase.co/socket')
   * ```
   */
  static getWebSocketConstructor() {
    const e = this.detectEnvironment();
    if (e.constructor)
      return e.constructor;
    let t = e.error || "WebSocket not supported in this environment.";
    throw e.workaround && (t += `

Suggested solution: ${e.workaround}`), new Error(t);
  }
  /**
   * Creates a WebSocket using the detected constructor.
   *
   * @example
   * ```ts
   * const socket = WebSocketFactory.createWebSocket('wss://realtime.supabase.co/socket')
   * ```
   */
  static createWebSocket(e, t) {
    const i = this.getWebSocketConstructor();
    return new i(e, t);
  }
  /**
   * Detects whether the runtime can establish WebSocket connections.
   *
   * @example
   * ```ts
   * if (!WebSocketFactory.isWebSocketSupported()) {
   *   console.warn('Falling back to long polling')
   * }
   * ```
   */
  static isWebSocketSupported() {
    try {
      const e = this.detectEnvironment();
      return e.type === "native" || e.type === "ws";
    } catch {
      return !1;
    }
  }
}
const vc = "2.95.3", bc = `realtime-js/${vc}`, _c = "1.0.0", Un = "2.0.0", Ri = Un, zr = 1e4, xc = 1e3, Tc = 100;
var Ie;
(function(r) {
  r[r.connecting = 0] = "connecting", r[r.open = 1] = "open", r[r.closing = 2] = "closing", r[r.closed = 3] = "closed";
})(Ie || (Ie = {}));
var K;
(function(r) {
  r.closed = "closed", r.errored = "errored", r.joined = "joined", r.joining = "joining", r.leaving = "leaving";
})(K || (K = {}));
var de;
(function(r) {
  r.close = "phx_close", r.error = "phx_error", r.join = "phx_join", r.reply = "phx_reply", r.leave = "phx_leave", r.access_token = "access_token";
})(de || (de = {}));
var qr;
(function(r) {
  r.websocket = "websocket";
})(qr || (qr = {}));
var Be;
(function(r) {
  r.Connecting = "connecting", r.Open = "open", r.Closing = "closing", r.Closed = "closed";
})(Be || (Be = {}));
class kc {
  constructor(e) {
    this.HEADER_LENGTH = 1, this.USER_BROADCAST_PUSH_META_LENGTH = 6, this.KINDS = { userBroadcastPush: 3, userBroadcast: 4 }, this.BINARY_ENCODING = 0, this.JSON_ENCODING = 1, this.BROADCAST_EVENT = "broadcast", this.allowedMetadataKeys = [], this.allowedMetadataKeys = e ?? [];
  }
  encode(e, t) {
    if (e.event === this.BROADCAST_EVENT && !(e.payload instanceof ArrayBuffer) && typeof e.payload.event == "string")
      return t(this._binaryEncodeUserBroadcastPush(e));
    let i = [e.join_ref, e.ref, e.topic, e.event, e.payload];
    return t(JSON.stringify(i));
  }
  _binaryEncodeUserBroadcastPush(e) {
    var t;
    return this._isArrayBuffer((t = e.payload) === null || t === void 0 ? void 0 : t.payload) ? this._encodeBinaryUserBroadcastPush(e) : this._encodeJsonUserBroadcastPush(e);
  }
  _encodeBinaryUserBroadcastPush(e) {
    var t, i;
    const n = (i = (t = e.payload) === null || t === void 0 ? void 0 : t.payload) !== null && i !== void 0 ? i : new ArrayBuffer(0);
    return this._encodeUserBroadcastPush(e, this.BINARY_ENCODING, n);
  }
  _encodeJsonUserBroadcastPush(e) {
    var t, i;
    const n = (i = (t = e.payload) === null || t === void 0 ? void 0 : t.payload) !== null && i !== void 0 ? i : {}, s = new TextEncoder().encode(JSON.stringify(n)).buffer;
    return this._encodeUserBroadcastPush(e, this.JSON_ENCODING, s);
  }
  _encodeUserBroadcastPush(e, t, i) {
    var n, a;
    const s = e.topic, o = (n = e.ref) !== null && n !== void 0 ? n : "", c = (a = e.join_ref) !== null && a !== void 0 ? a : "", l = e.payload.event, u = this.allowedMetadataKeys ? this._pick(e.payload, this.allowedMetadataKeys) : {}, h = Object.keys(u).length === 0 ? "" : JSON.stringify(u);
    if (c.length > 255)
      throw new Error(`joinRef length ${c.length} exceeds maximum of 255`);
    if (o.length > 255)
      throw new Error(`ref length ${o.length} exceeds maximum of 255`);
    if (s.length > 255)
      throw new Error(`topic length ${s.length} exceeds maximum of 255`);
    if (l.length > 255)
      throw new Error(`userEvent length ${l.length} exceeds maximum of 255`);
    if (h.length > 255)
      throw new Error(`metadata length ${h.length} exceeds maximum of 255`);
    const d = this.USER_BROADCAST_PUSH_META_LENGTH + c.length + o.length + s.length + l.length + h.length, f = new ArrayBuffer(this.HEADER_LENGTH + d);
    let p = new DataView(f), m = 0;
    p.setUint8(m++, this.KINDS.userBroadcastPush), p.setUint8(m++, c.length), p.setUint8(m++, o.length), p.setUint8(m++, s.length), p.setUint8(m++, l.length), p.setUint8(m++, h.length), p.setUint8(m++, t), Array.from(c, (y) => p.setUint8(m++, y.charCodeAt(0))), Array.from(o, (y) => p.setUint8(m++, y.charCodeAt(0))), Array.from(s, (y) => p.setUint8(m++, y.charCodeAt(0))), Array.from(l, (y) => p.setUint8(m++, y.charCodeAt(0))), Array.from(h, (y) => p.setUint8(m++, y.charCodeAt(0)));
    var g = new Uint8Array(f.byteLength + i.byteLength);
    return g.set(new Uint8Array(f), 0), g.set(new Uint8Array(i), f.byteLength), g.buffer;
  }
  decode(e, t) {
    if (this._isArrayBuffer(e)) {
      let i = this._binaryDecode(e);
      return t(i);
    }
    if (typeof e == "string") {
      const i = JSON.parse(e), [n, a, s, o, c] = i;
      return t({ join_ref: n, ref: a, topic: s, event: o, payload: c });
    }
    return t({});
  }
  _binaryDecode(e) {
    const t = new DataView(e), i = t.getUint8(0), n = new TextDecoder();
    switch (i) {
      case this.KINDS.userBroadcast:
        return this._decodeUserBroadcast(e, t, n);
    }
  }
  _decodeUserBroadcast(e, t, i) {
    const n = t.getUint8(1), a = t.getUint8(2), s = t.getUint8(3), o = t.getUint8(4);
    let c = this.HEADER_LENGTH + 4;
    const l = i.decode(e.slice(c, c + n));
    c = c + n;
    const u = i.decode(e.slice(c, c + a));
    c = c + a;
    const h = i.decode(e.slice(c, c + s));
    c = c + s;
    const d = e.slice(c, e.byteLength), f = o === this.JSON_ENCODING ? JSON.parse(i.decode(d)) : d, p = {
      type: this.BROADCAST_EVENT,
      event: u,
      payload: f
    };
    return s > 0 && (p.meta = JSON.parse(h)), { join_ref: null, ref: null, topic: l, event: this.BROADCAST_EVENT, payload: p };
  }
  _isArrayBuffer(e) {
    var t;
    return e instanceof ArrayBuffer || ((t = e == null ? void 0 : e.constructor) === null || t === void 0 ? void 0 : t.name) === "ArrayBuffer";
  }
  _pick(e, t) {
    return !e || typeof e != "object" ? {} : Object.fromEntries(Object.entries(e).filter(([i]) => t.includes(i)));
  }
}
class Ln {
  constructor(e, t) {
    this.callback = e, this.timerCalc = t, this.timer = void 0, this.tries = 0, this.callback = e, this.timerCalc = t;
  }
  reset() {
    this.tries = 0, clearTimeout(this.timer), this.timer = void 0;
  }
  // Cancels any previous scheduleTimeout and schedules callback
  scheduleTimeout() {
    clearTimeout(this.timer), this.timer = setTimeout(() => {
      this.tries = this.tries + 1, this.callback();
    }, this.timerCalc(this.tries + 1));
  }
}
var N;
(function(r) {
  r.abstime = "abstime", r.bool = "bool", r.date = "date", r.daterange = "daterange", r.float4 = "float4", r.float8 = "float8", r.int2 = "int2", r.int4 = "int4", r.int4range = "int4range", r.int8 = "int8", r.int8range = "int8range", r.json = "json", r.jsonb = "jsonb", r.money = "money", r.numeric = "numeric", r.oid = "oid", r.reltime = "reltime", r.text = "text", r.time = "time", r.timestamp = "timestamp", r.timestamptz = "timestamptz", r.timetz = "timetz", r.tsrange = "tsrange", r.tstzrange = "tstzrange";
})(N || (N = {}));
const Ci = (r, e, t = {}) => {
  var i;
  const n = (i = t.skipTypes) !== null && i !== void 0 ? i : [];
  return e ? Object.keys(e).reduce((a, s) => (a[s] = Sc(s, r, e, n), a), {}) : {};
}, Sc = (r, e, t, i) => {
  const n = e.find((o) => o.name === r), a = n == null ? void 0 : n.type, s = t[r];
  return a && !i.includes(a) ? jn(a, s) : Gr(s);
}, jn = (r, e) => {
  if (r.charAt(0) === "_") {
    const t = r.slice(1, r.length);
    return Rc(e, t);
  }
  switch (r) {
    case N.bool:
      return Ec(e);
    case N.float4:
    case N.float8:
    case N.int2:
    case N.int4:
    case N.int8:
    case N.numeric:
    case N.oid:
      return Ac(e);
    case N.json:
    case N.jsonb:
      return Ic(e);
    case N.timestamp:
      return Cc(e);
    case N.abstime:
    case N.date:
    case N.daterange:
    case N.int4range:
    case N.int8range:
    case N.money:
    case N.reltime:
    case N.text:
    case N.time:
    case N.timestamptz:
    case N.timetz:
    case N.tsrange:
    case N.tstzrange:
      return Gr(e);
    default:
      return Gr(e);
  }
}, Gr = (r) => r, Ec = (r) => {
  switch (r) {
    case "t":
      return !0;
    case "f":
      return !1;
    default:
      return r;
  }
}, Ac = (r) => {
  if (typeof r == "string") {
    const e = parseFloat(r);
    if (!Number.isNaN(e))
      return e;
  }
  return r;
}, Ic = (r) => {
  if (typeof r == "string")
    try {
      return JSON.parse(r);
    } catch {
      return r;
    }
  return r;
}, Rc = (r, e) => {
  if (typeof r != "string")
    return r;
  const t = r.length - 1, i = r[t];
  if (r[0] === "{" && i === "}") {
    let a;
    const s = r.slice(1, t);
    try {
      a = JSON.parse("[" + s + "]");
    } catch {
      a = s ? s.split(",") : [];
    }
    return a.map((o) => jn(e, o));
  }
  return r;
}, Cc = (r) => typeof r == "string" ? r.replace(" ", "T") : r, Nn = (r) => {
  const e = new URL(r);
  return e.protocol = e.protocol.replace(/^ws/i, "http"), e.pathname = e.pathname.replace(/\/+$/, "").replace(/\/socket\/websocket$/i, "").replace(/\/socket$/i, "").replace(/\/websocket$/i, ""), e.pathname === "" || e.pathname === "/" ? e.pathname = "/api/broadcast" : e.pathname = e.pathname + "/api/broadcast", e.href;
};
class Sr {
  /**
   * Initializes the Push
   *
   * @param channel The Channel
   * @param event The event, for example `"phx_join"`
   * @param payload The payload, for example `{user_id: 123}`
   * @param timeout The push timeout in milliseconds
   */
  constructor(e, t, i = {}, n = zr) {
    this.channel = e, this.event = t, this.payload = i, this.timeout = n, this.sent = !1, this.timeoutTimer = void 0, this.ref = "", this.receivedResp = null, this.recHooks = [], this.refEvent = null;
  }
  resend(e) {
    this.timeout = e, this._cancelRefEvent(), this.ref = "", this.refEvent = null, this.receivedResp = null, this.sent = !1, this.send();
  }
  send() {
    this._hasReceived("timeout") || (this.startTimeout(), this.sent = !0, this.channel.socket.push({
      topic: this.channel.topic,
      event: this.event,
      payload: this.payload,
      ref: this.ref,
      join_ref: this.channel._joinRef()
    }));
  }
  updatePayload(e) {
    this.payload = Object.assign(Object.assign({}, this.payload), e);
  }
  receive(e, t) {
    var i;
    return this._hasReceived(e) && t((i = this.receivedResp) === null || i === void 0 ? void 0 : i.response), this.recHooks.push({ status: e, callback: t }), this;
  }
  startTimeout() {
    if (this.timeoutTimer)
      return;
    this.ref = this.channel.socket._makeRef(), this.refEvent = this.channel._replyEventName(this.ref);
    const e = (t) => {
      this._cancelRefEvent(), this._cancelTimeout(), this.receivedResp = t, this._matchReceive(t);
    };
    this.channel._on(this.refEvent, {}, e), this.timeoutTimer = setTimeout(() => {
      this.trigger("timeout", {});
    }, this.timeout);
  }
  trigger(e, t) {
    this.refEvent && this.channel._trigger(this.refEvent, { status: e, response: t });
  }
  destroy() {
    this._cancelRefEvent(), this._cancelTimeout();
  }
  _cancelRefEvent() {
    this.refEvent && this.channel._off(this.refEvent, {});
  }
  _cancelTimeout() {
    clearTimeout(this.timeoutTimer), this.timeoutTimer = void 0;
  }
  _matchReceive({ status: e, response: t }) {
    this.recHooks.filter((i) => i.status === e).forEach((i) => i.callback(t));
  }
  _hasReceived(e) {
    return this.receivedResp && this.receivedResp.status === e;
  }
}
var Oi;
(function(r) {
  r.SYNC = "sync", r.JOIN = "join", r.LEAVE = "leave";
})(Oi || (Oi = {}));
class yt {
  /**
   * Creates a Presence helper that keeps the local presence state in sync with the server.
   *
   * @param channel - The realtime channel to bind to.
   * @param opts - Optional custom event names, e.g. `{ events: { state: 'state', diff: 'diff' } }`.
   *
   * @example
   * ```ts
   * const presence = new RealtimePresence(channel)
   *
   * channel.on('presence', ({ event, key }) => {
   *   console.log(`Presence ${event} on ${key}`)
   * })
   * ```
   */
  constructor(e, t) {
    this.channel = e, this.state = {}, this.pendingDiffs = [], this.joinRef = null, this.enabled = !1, this.caller = {
      onJoin: () => {
      },
      onLeave: () => {
      },
      onSync: () => {
      }
    };
    const i = (t == null ? void 0 : t.events) || {
      state: "presence_state",
      diff: "presence_diff"
    };
    this.channel._on(i.state, {}, (n) => {
      const { onJoin: a, onLeave: s, onSync: o } = this.caller;
      this.joinRef = this.channel._joinRef(), this.state = yt.syncState(this.state, n, a, s), this.pendingDiffs.forEach((c) => {
        this.state = yt.syncDiff(this.state, c, a, s);
      }), this.pendingDiffs = [], o();
    }), this.channel._on(i.diff, {}, (n) => {
      const { onJoin: a, onLeave: s, onSync: o } = this.caller;
      this.inPendingSyncState() ? this.pendingDiffs.push(n) : (this.state = yt.syncDiff(this.state, n, a, s), o());
    }), this.onJoin((n, a, s) => {
      this.channel._trigger("presence", {
        event: "join",
        key: n,
        currentPresences: a,
        newPresences: s
      });
    }), this.onLeave((n, a, s) => {
      this.channel._trigger("presence", {
        event: "leave",
        key: n,
        currentPresences: a,
        leftPresences: s
      });
    }), this.onSync(() => {
      this.channel._trigger("presence", { event: "sync" });
    });
  }
  /**
   * Used to sync the list of presences on the server with the
   * client's state.
   *
   * An optional `onJoin` and `onLeave` callback can be provided to
   * react to changes in the client's local presences across
   * disconnects and reconnects with the server.
   *
   * @internal
   */
  static syncState(e, t, i, n) {
    const a = this.cloneDeep(e), s = this.transformState(t), o = {}, c = {};
    return this.map(a, (l, u) => {
      s[l] || (c[l] = u);
    }), this.map(s, (l, u) => {
      const h = a[l];
      if (h) {
        const d = u.map((g) => g.presence_ref), f = h.map((g) => g.presence_ref), p = u.filter((g) => f.indexOf(g.presence_ref) < 0), m = h.filter((g) => d.indexOf(g.presence_ref) < 0);
        p.length > 0 && (o[l] = p), m.length > 0 && (c[l] = m);
      } else
        o[l] = u;
    }), this.syncDiff(a, { joins: o, leaves: c }, i, n);
  }
  /**
   * Used to sync a diff of presence join and leave events from the
   * server, as they happen.
   *
   * Like `syncState`, `syncDiff` accepts optional `onJoin` and
   * `onLeave` callbacks to react to a user joining or leaving from a
   * device.
   *
   * @internal
   */
  static syncDiff(e, t, i, n) {
    const { joins: a, leaves: s } = {
      joins: this.transformState(t.joins),
      leaves: this.transformState(t.leaves)
    };
    return i || (i = () => {
    }), n || (n = () => {
    }), this.map(a, (o, c) => {
      var l;
      const u = (l = e[o]) !== null && l !== void 0 ? l : [];
      if (e[o] = this.cloneDeep(c), u.length > 0) {
        const h = e[o].map((f) => f.presence_ref), d = u.filter((f) => h.indexOf(f.presence_ref) < 0);
        e[o].unshift(...d);
      }
      i(o, u, c);
    }), this.map(s, (o, c) => {
      let l = e[o];
      if (!l)
        return;
      const u = c.map((h) => h.presence_ref);
      l = l.filter((h) => u.indexOf(h.presence_ref) < 0), e[o] = l, n(o, l, c), l.length === 0 && delete e[o];
    }), e;
  }
  /** @internal */
  static map(e, t) {
    return Object.getOwnPropertyNames(e).map((i) => t(i, e[i]));
  }
  /**
   * Remove 'metas' key
   * Change 'phx_ref' to 'presence_ref'
   * Remove 'phx_ref' and 'phx_ref_prev'
   *
   * @example
   * // returns {
   *  abc123: [
   *    { presence_ref: '2', user_id: 1 },
   *    { presence_ref: '3', user_id: 2 }
   *  ]
   * }
   * RealtimePresence.transformState({
   *  abc123: {
   *    metas: [
   *      { phx_ref: '2', phx_ref_prev: '1' user_id: 1 },
   *      { phx_ref: '3', user_id: 2 }
   *    ]
   *  }
   * })
   *
   * @internal
   */
  static transformState(e) {
    return e = this.cloneDeep(e), Object.getOwnPropertyNames(e).reduce((t, i) => {
      const n = e[i];
      return "metas" in n ? t[i] = n.metas.map((a) => (a.presence_ref = a.phx_ref, delete a.phx_ref, delete a.phx_ref_prev, a)) : t[i] = n, t;
    }, {});
  }
  /** @internal */
  static cloneDeep(e) {
    return JSON.parse(JSON.stringify(e));
  }
  /** @internal */
  onJoin(e) {
    this.caller.onJoin = e;
  }
  /** @internal */
  onLeave(e) {
    this.caller.onLeave = e;
  }
  /** @internal */
  onSync(e) {
    this.caller.onSync = e;
  }
  /** @internal */
  inPendingSyncState() {
    return !this.joinRef || this.joinRef !== this.channel._joinRef();
  }
}
var Pi;
(function(r) {
  r.ALL = "*", r.INSERT = "INSERT", r.UPDATE = "UPDATE", r.DELETE = "DELETE";
})(Pi || (Pi = {}));
var wt;
(function(r) {
  r.BROADCAST = "broadcast", r.PRESENCE = "presence", r.POSTGRES_CHANGES = "postgres_changes", r.SYSTEM = "system";
})(wt || (wt = {}));
var ve;
(function(r) {
  r.SUBSCRIBED = "SUBSCRIBED", r.TIMED_OUT = "TIMED_OUT", r.CLOSED = "CLOSED", r.CHANNEL_ERROR = "CHANNEL_ERROR";
})(ve || (ve = {}));
class nt {
  /**
   * Creates a channel that can broadcast messages, sync presence, and listen to Postgres changes.
   *
   * The topic determines which realtime stream you are subscribing to. Config options let you
   * enable acknowledgement for broadcasts, presence tracking, or private channels.
   *
   * @example
   * ```ts
   * import RealtimeClient from '@supabase/realtime-js'
   *
   * const client = new RealtimeClient('https://xyzcompany.supabase.co/realtime/v1', {
   *   params: { apikey: 'public-anon-key' },
   * })
   * const channel = new RealtimeChannel('realtime:public:messages', { config: {} }, client)
   * ```
   */
  constructor(e, t = { config: {} }, i) {
    var n, a;
    if (this.topic = e, this.params = t, this.socket = i, this.bindings = {}, this.state = K.closed, this.joinedOnce = !1, this.pushBuffer = [], this.subTopic = e.replace(/^realtime:/i, ""), this.params.config = Object.assign({
      broadcast: { ack: !1, self: !1 },
      presence: { key: "", enabled: !1 },
      private: !1
    }, t.config), this.timeout = this.socket.timeout, this.joinPush = new Sr(this, de.join, this.params, this.timeout), this.rejoinTimer = new Ln(() => this._rejoinUntilConnected(), this.socket.reconnectAfterMs), this.joinPush.receive("ok", () => {
      this.state = K.joined, this.rejoinTimer.reset(), this.pushBuffer.forEach((s) => s.send()), this.pushBuffer = [];
    }), this._onClose(() => {
      this.rejoinTimer.reset(), this.socket.log("channel", `close ${this.topic} ${this._joinRef()}`), this.state = K.closed, this.socket._remove(this);
    }), this._onError((s) => {
      this._isLeaving() || this._isClosed() || (this.socket.log("channel", `error ${this.topic}`, s), this.state = K.errored, this.rejoinTimer.scheduleTimeout());
    }), this.joinPush.receive("timeout", () => {
      this._isJoining() && (this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout), this.state = K.errored, this.rejoinTimer.scheduleTimeout());
    }), this.joinPush.receive("error", (s) => {
      this._isLeaving() || this._isClosed() || (this.socket.log("channel", `error ${this.topic}`, s), this.state = K.errored, this.rejoinTimer.scheduleTimeout());
    }), this._on(de.reply, {}, (s, o) => {
      this._trigger(this._replyEventName(o), s);
    }), this.presence = new yt(this), this.broadcastEndpointURL = Nn(this.socket.endPoint), this.private = this.params.config.private || !1, !this.private && (!((a = (n = this.params.config) === null || n === void 0 ? void 0 : n.broadcast) === null || a === void 0) && a.replay))
      throw `tried to use replay on public channel '${this.topic}'. It must be a private channel.`;
  }
  /** Subscribe registers your client with the server */
  subscribe(e, t = this.timeout) {
    var i, n, a;
    if (this.socket.isConnected() || this.socket.connect(), this.state == K.closed) {
      const { config: { broadcast: s, presence: o, private: c } } = this.params, l = (n = (i = this.bindings.postgres_changes) === null || i === void 0 ? void 0 : i.map((f) => f.filter)) !== null && n !== void 0 ? n : [], u = !!this.bindings[wt.PRESENCE] && this.bindings[wt.PRESENCE].length > 0 || ((a = this.params.config.presence) === null || a === void 0 ? void 0 : a.enabled) === !0, h = {}, d = {
        broadcast: s,
        presence: Object.assign(Object.assign({}, o), { enabled: u }),
        postgres_changes: l,
        private: c
      };
      this.socket.accessTokenValue && (h.access_token = this.socket.accessTokenValue), this._onError((f) => e == null ? void 0 : e(ve.CHANNEL_ERROR, f)), this._onClose(() => e == null ? void 0 : e(ve.CLOSED)), this.updateJoinPayload(Object.assign({ config: d }, h)), this.joinedOnce = !0, this._rejoin(t), this.joinPush.receive("ok", async ({ postgres_changes: f }) => {
        var p;
        if (this.socket._isManualToken() || this.socket.setAuth(), f === void 0) {
          e == null || e(ve.SUBSCRIBED);
          return;
        } else {
          const m = this.bindings.postgres_changes, g = (p = m == null ? void 0 : m.length) !== null && p !== void 0 ? p : 0, y = [];
          for (let w = 0; w < g; w++) {
            const v = m[w], { filter: { event: x, schema: S, table: E, filter: O } } = v, k = f && f[w];
            if (k && k.event === x && nt.isFilterValueEqual(k.schema, S) && nt.isFilterValueEqual(k.table, E) && nt.isFilterValueEqual(k.filter, O))
              y.push(Object.assign(Object.assign({}, v), { id: k.id }));
            else {
              this.unsubscribe(), this.state = K.errored, e == null || e(ve.CHANNEL_ERROR, new Error("mismatch between server and client bindings for postgres changes"));
              return;
            }
          }
          this.bindings.postgres_changes = y, e && e(ve.SUBSCRIBED);
          return;
        }
      }).receive("error", (f) => {
        this.state = K.errored, e == null || e(ve.CHANNEL_ERROR, new Error(JSON.stringify(Object.values(f).join(", ") || "error")));
      }).receive("timeout", () => {
        e == null || e(ve.TIMED_OUT);
      });
    }
    return this;
  }
  /**
   * Returns the current presence state for this channel.
   *
   * The shape is a map keyed by presence key (for example a user id) where each entry contains the
   * tracked metadata for that user.
   */
  presenceState() {
    return this.presence.state;
  }
  /**
   * Sends the supplied payload to the presence tracker so other subscribers can see that this
   * client is online. Use `untrack` to stop broadcasting presence for the same key.
   */
  async track(e, t = {}) {
    return await this.send({
      type: "presence",
      event: "track",
      payload: e
    }, t.timeout || this.timeout);
  }
  /**
   * Removes the current presence state for this client.
   */
  async untrack(e = {}) {
    return await this.send({
      type: "presence",
      event: "untrack"
    }, e);
  }
  on(e, t, i) {
    return this.state === K.joined && e === wt.PRESENCE && (this.socket.log("channel", `resubscribe to ${this.topic} due to change in presence callbacks on joined channel`), this.unsubscribe().then(async () => await this.subscribe())), this._on(e, t, i);
  }
  /**
   * Sends a broadcast message explicitly via REST API.
   *
   * This method always uses the REST API endpoint regardless of WebSocket connection state.
   * Useful when you want to guarantee REST delivery or when gradually migrating from implicit REST fallback.
   *
   * @param event The name of the broadcast event
   * @param payload Payload to be sent (required)
   * @param opts Options including timeout
   * @returns Promise resolving to object with success status, and error details if failed
   */
  async httpSend(e, t, i = {}) {
    var n;
    if (t == null)
      return Promise.reject("Payload is required for httpSend()");
    const a = {
      apikey: this.socket.apiKey ? this.socket.apiKey : "",
      "Content-Type": "application/json"
    };
    this.socket.accessTokenValue && (a.Authorization = `Bearer ${this.socket.accessTokenValue}`);
    const s = {
      method: "POST",
      headers: a,
      body: JSON.stringify({
        messages: [
          {
            topic: this.subTopic,
            event: e,
            payload: t,
            private: this.private
          }
        ]
      })
    }, o = await this._fetchWithTimeout(this.broadcastEndpointURL, s, (n = i.timeout) !== null && n !== void 0 ? n : this.timeout);
    if (o.status === 202)
      return { success: !0 };
    let c = o.statusText;
    try {
      const l = await o.json();
      c = l.error || l.message || c;
    } catch {
    }
    return Promise.reject(new Error(c));
  }
  /**
   * Sends a message into the channel.
   *
   * @param args Arguments to send to channel
   * @param args.type The type of event to send
   * @param args.event The name of the event being sent
   * @param args.payload Payload to be sent
   * @param opts Options to be used during the send process
   */
  async send(e, t = {}) {
    var i, n;
    if (!this._canPush() && e.type === "broadcast") {
      console.warn("Realtime send() is automatically falling back to REST API. This behavior will be deprecated in the future. Please use httpSend() explicitly for REST delivery.");
      const { event: a, payload: s } = e, o = {
        apikey: this.socket.apiKey ? this.socket.apiKey : "",
        "Content-Type": "application/json"
      };
      this.socket.accessTokenValue && (o.Authorization = `Bearer ${this.socket.accessTokenValue}`);
      const c = {
        method: "POST",
        headers: o,
        body: JSON.stringify({
          messages: [
            {
              topic: this.subTopic,
              event: a,
              payload: s,
              private: this.private
            }
          ]
        })
      };
      try {
        const l = await this._fetchWithTimeout(this.broadcastEndpointURL, c, (i = t.timeout) !== null && i !== void 0 ? i : this.timeout);
        return await ((n = l.body) === null || n === void 0 ? void 0 : n.cancel()), l.ok ? "ok" : "error";
      } catch (l) {
        return l.name === "AbortError" ? "timed out" : "error";
      }
    } else
      return new Promise((a) => {
        var s, o, c;
        const l = this._push(e.type, e, t.timeout || this.timeout);
        e.type === "broadcast" && !(!((c = (o = (s = this.params) === null || s === void 0 ? void 0 : s.config) === null || o === void 0 ? void 0 : o.broadcast) === null || c === void 0) && c.ack) && a("ok"), l.receive("ok", () => a("ok")), l.receive("error", () => a("error")), l.receive("timeout", () => a("timed out"));
      });
  }
  /**
   * Updates the payload that will be sent the next time the channel joins (reconnects).
   * Useful for rotating access tokens or updating config without re-creating the channel.
   */
  updateJoinPayload(e) {
    this.joinPush.updatePayload(e);
  }
  /**
   * Leaves the channel.
   *
   * Unsubscribes from server events, and instructs channel to terminate on server.
   * Triggers onClose() hooks.
   *
   * To receive leave acknowledgements, use the a `receive` hook to bind to the server ack, ie:
   * channel.unsubscribe().receive("ok", () => alert("left!") )
   */
  unsubscribe(e = this.timeout) {
    this.state = K.leaving;
    const t = () => {
      this.socket.log("channel", `leave ${this.topic}`), this._trigger(de.close, "leave", this._joinRef());
    };
    this.joinPush.destroy();
    let i = null;
    return new Promise((n) => {
      i = new Sr(this, de.leave, {}, e), i.receive("ok", () => {
        t(), n("ok");
      }).receive("timeout", () => {
        t(), n("timed out");
      }).receive("error", () => {
        n("error");
      }), i.send(), this._canPush() || i.trigger("ok", {});
    }).finally(() => {
      i == null || i.destroy();
    });
  }
  /**
   * Teardown the channel.
   *
   * Destroys and stops related timers.
   */
  teardown() {
    this.pushBuffer.forEach((e) => e.destroy()), this.pushBuffer = [], this.rejoinTimer.reset(), this.joinPush.destroy(), this.state = K.closed, this.bindings = {};
  }
  /** @internal */
  async _fetchWithTimeout(e, t, i) {
    const n = new AbortController(), a = setTimeout(() => n.abort(), i), s = await this.socket.fetch(e, Object.assign(Object.assign({}, t), { signal: n.signal }));
    return clearTimeout(a), s;
  }
  /** @internal */
  _push(e, t, i = this.timeout) {
    if (!this.joinedOnce)
      throw `tried to push '${e}' to '${this.topic}' before joining. Use channel.subscribe() before pushing events`;
    let n = new Sr(this, e, t, i);
    return this._canPush() ? n.send() : this._addToPushBuffer(n), n;
  }
  /** @internal */
  _addToPushBuffer(e) {
    if (e.startTimeout(), this.pushBuffer.push(e), this.pushBuffer.length > Tc) {
      const t = this.pushBuffer.shift();
      t && (t.destroy(), this.socket.log("channel", `discarded push due to buffer overflow: ${t.event}`, t.payload));
    }
  }
  /**
   * Overridable message hook
   *
   * Receives all events for specialized message handling before dispatching to the channel callbacks.
   * Must return the payload, modified or unmodified.
   *
   * @internal
   */
  _onMessage(e, t, i) {
    return t;
  }
  /** @internal */
  _isMember(e) {
    return this.topic === e;
  }
  /** @internal */
  _joinRef() {
    return this.joinPush.ref;
  }
  /** @internal */
  _trigger(e, t, i) {
    var n, a;
    const s = e.toLocaleLowerCase(), { close: o, error: c, leave: l, join: u } = de;
    if (i && [o, c, l, u].indexOf(s) >= 0 && i !== this._joinRef())
      return;
    let d = this._onMessage(s, t, i);
    if (t && !d)
      throw "channel onMessage callbacks must return the payload, modified or unmodified";
    ["insert", "update", "delete"].includes(s) ? (n = this.bindings.postgres_changes) === null || n === void 0 || n.filter((f) => {
      var p, m, g;
      return ((p = f.filter) === null || p === void 0 ? void 0 : p.event) === "*" || ((g = (m = f.filter) === null || m === void 0 ? void 0 : m.event) === null || g === void 0 ? void 0 : g.toLocaleLowerCase()) === s;
    }).map((f) => f.callback(d, i)) : (a = this.bindings[s]) === null || a === void 0 || a.filter((f) => {
      var p, m, g, y, w, v;
      if (["broadcast", "presence", "postgres_changes"].includes(s))
        if ("id" in f) {
          const x = f.id, S = (p = f.filter) === null || p === void 0 ? void 0 : p.event;
          return x && ((m = t.ids) === null || m === void 0 ? void 0 : m.includes(x)) && (S === "*" || (S == null ? void 0 : S.toLocaleLowerCase()) === ((g = t.data) === null || g === void 0 ? void 0 : g.type.toLocaleLowerCase()));
        } else {
          const x = (w = (y = f == null ? void 0 : f.filter) === null || y === void 0 ? void 0 : y.event) === null || w === void 0 ? void 0 : w.toLocaleLowerCase();
          return x === "*" || x === ((v = t == null ? void 0 : t.event) === null || v === void 0 ? void 0 : v.toLocaleLowerCase());
        }
      else
        return f.type.toLocaleLowerCase() === s;
    }).map((f) => {
      if (typeof d == "object" && "ids" in d) {
        const p = d.data, { schema: m, table: g, commit_timestamp: y, type: w, errors: v } = p;
        d = Object.assign(Object.assign({}, {
          schema: m,
          table: g,
          commit_timestamp: y,
          eventType: w,
          new: {},
          old: {},
          errors: v
        }), this._getPayloadRecords(p));
      }
      f.callback(d, i);
    });
  }
  /** @internal */
  _isClosed() {
    return this.state === K.closed;
  }
  /** @internal */
  _isJoined() {
    return this.state === K.joined;
  }
  /** @internal */
  _isJoining() {
    return this.state === K.joining;
  }
  /** @internal */
  _isLeaving() {
    return this.state === K.leaving;
  }
  /** @internal */
  _replyEventName(e) {
    return `chan_reply_${e}`;
  }
  /** @internal */
  _on(e, t, i) {
    const n = e.toLocaleLowerCase(), a = {
      type: n,
      filter: t,
      callback: i
    };
    return this.bindings[n] ? this.bindings[n].push(a) : this.bindings[n] = [a], this;
  }
  /** @internal */
  _off(e, t) {
    const i = e.toLocaleLowerCase();
    return this.bindings[i] && (this.bindings[i] = this.bindings[i].filter((n) => {
      var a;
      return !(((a = n.type) === null || a === void 0 ? void 0 : a.toLocaleLowerCase()) === i && nt.isEqual(n.filter, t));
    })), this;
  }
  /** @internal */
  static isEqual(e, t) {
    if (Object.keys(e).length !== Object.keys(t).length)
      return !1;
    for (const i in e)
      if (e[i] !== t[i])
        return !1;
    return !0;
  }
  /**
   * Compares two optional filter values for equality.
   * Treats undefined, null, and empty string as equivalent empty values.
   * @internal
   */
  static isFilterValueEqual(e, t) {
    return (e ?? void 0) === (t ?? void 0);
  }
  /** @internal */
  _rejoinUntilConnected() {
    this.rejoinTimer.scheduleTimeout(), this.socket.isConnected() && this._rejoin();
  }
  /**
   * Registers a callback that will be executed when the channel closes.
   *
   * @internal
   */
  _onClose(e) {
    this._on(de.close, {}, e);
  }
  /**
   * Registers a callback that will be executed when the channel encounteres an error.
   *
   * @internal
   */
  _onError(e) {
    this._on(de.error, {}, (t) => e(t));
  }
  /**
   * Returns `true` if the socket is connected and the channel has been joined.
   *
   * @internal
   */
  _canPush() {
    return this.socket.isConnected() && this._isJoined();
  }
  /** @internal */
  _rejoin(e = this.timeout) {
    this._isLeaving() || (this.socket._leaveOpenTopic(this.topic), this.state = K.joining, this.joinPush.resend(e));
  }
  /** @internal */
  _getPayloadRecords(e) {
    const t = {
      new: {},
      old: {}
    };
    return (e.type === "INSERT" || e.type === "UPDATE") && (t.new = Ci(e.columns, e.record)), (e.type === "UPDATE" || e.type === "DELETE") && (t.old = Ci(e.columns, e.old_record)), t;
  }
}
const Er = () => {
}, Vt = {
  HEARTBEAT_INTERVAL: 25e3,
  RECONNECT_DELAY: 10,
  HEARTBEAT_TIMEOUT_FALLBACK: 100
}, Oc = [1e3, 2e3, 5e3, 1e4], Pc = 1e4, Dc = `
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;
class Uc {
  /**
   * Initializes the Socket.
   *
   * @param endPoint The string WebSocket endpoint, ie, "ws://example.com/socket", "wss://example.com", "/socket" (inherited host & protocol)
   * @param httpEndpoint The string HTTP endpoint, ie, "https://example.com", "/" (inherited host & protocol)
   * @param options.transport The Websocket Transport, for example WebSocket. This can be a custom implementation
   * @param options.timeout The default timeout in milliseconds to trigger push timeouts.
   * @param options.params The optional params to pass when connecting.
   * @param options.headers Deprecated: headers cannot be set on websocket connections and this option will be removed in the future.
   * @param options.heartbeatIntervalMs The millisec interval to send a heartbeat message.
   * @param options.heartbeatCallback The optional function to handle heartbeat status and latency.
   * @param options.logger The optional function for specialized logging, ie: logger: (kind, msg, data) => { console.log(`${kind}: ${msg}`, data) }
   * @param options.logLevel Sets the log level for Realtime
   * @param options.encode The function to encode outgoing messages. Defaults to JSON: (payload, callback) => callback(JSON.stringify(payload))
   * @param options.decode The function to decode incoming messages. Defaults to Serializer's decode.
   * @param options.reconnectAfterMs he optional function that returns the millsec reconnect interval. Defaults to stepped backoff off.
   * @param options.worker Use Web Worker to set a side flow. Defaults to false.
   * @param options.workerUrl The URL of the worker script. Defaults to https://realtime.supabase.com/worker.js that includes a heartbeat event call to keep the connection alive.
   * @param options.vsn The protocol version to use when connecting. Supported versions are "1.0.0" and "2.0.0". Defaults to "2.0.0".
   * @example
   * ```ts
   * import RealtimeClient from '@supabase/realtime-js'
   *
   * const client = new RealtimeClient('https://xyzcompany.supabase.co/realtime/v1', {
   *   params: { apikey: 'public-anon-key' },
   * })
   * client.connect()
   * ```
   */
  constructor(e, t) {
    var i;
    if (this.accessTokenValue = null, this.apiKey = null, this._manuallySetToken = !1, this.channels = new Array(), this.endPoint = "", this.httpEndpoint = "", this.headers = {}, this.params = {}, this.timeout = zr, this.transport = null, this.heartbeatIntervalMs = Vt.HEARTBEAT_INTERVAL, this.heartbeatTimer = void 0, this.pendingHeartbeatRef = null, this.heartbeatCallback = Er, this.ref = 0, this.reconnectTimer = null, this.vsn = Ri, this.logger = Er, this.conn = null, this.sendBuffer = [], this.serializer = new kc(), this.stateChangeCallbacks = {
      open: [],
      close: [],
      error: [],
      message: []
    }, this.accessToken = null, this._connectionState = "disconnected", this._wasManualDisconnect = !1, this._authPromise = null, this._heartbeatSentAt = null, this._resolveFetch = (n) => n ? (...a) => n(...a) : (...a) => fetch(...a), !(!((i = t == null ? void 0 : t.params) === null || i === void 0) && i.apikey))
      throw new Error("API key is required to connect to Realtime");
    this.apiKey = t.params.apikey, this.endPoint = `${e}/${qr.websocket}`, this.httpEndpoint = Nn(e), this._initializeOptions(t), this._setupReconnectionTimer(), this.fetch = this._resolveFetch(t == null ? void 0 : t.fetch);
  }
  /**
   * Connects the socket, unless already connected.
   */
  connect() {
    if (!(this.isConnecting() || this.isDisconnecting() || this.conn !== null && this.isConnected())) {
      if (this._setConnectionState("connecting"), this.accessToken && !this._authPromise && this._setAuthSafely("connect"), this.transport)
        this.conn = new this.transport(this.endpointURL());
      else
        try {
          this.conn = wc.createWebSocket(this.endpointURL());
        } catch (e) {
          this._setConnectionState("disconnected");
          const t = e.message;
          throw t.includes("Node.js") ? new Error(`${t}

To use Realtime in Node.js, you need to provide a WebSocket implementation:

Option 1: Use Node.js 22+ which has native WebSocket support
Option 2: Install and provide the "ws" package:

  npm install ws

  import ws from "ws"
  const client = new RealtimeClient(url, {
    ...options,
    transport: ws
  })`) : new Error(`WebSocket not available: ${t}`);
        }
      this._setupConnectionHandlers();
    }
  }
  /**
   * Returns the URL of the websocket.
   * @returns string The URL of the websocket.
   */
  endpointURL() {
    return this._appendParams(this.endPoint, Object.assign({}, this.params, { vsn: this.vsn }));
  }
  /**
   * Disconnects the socket.
   *
   * @param code A numeric status code to send on disconnect.
   * @param reason A custom reason for the disconnect.
   */
  disconnect(e, t) {
    if (!this.isDisconnecting())
      if (this._setConnectionState("disconnecting", !0), this.conn) {
        const i = setTimeout(() => {
          this._setConnectionState("disconnected");
        }, 100);
        this.conn.onclose = () => {
          clearTimeout(i), this._setConnectionState("disconnected");
        }, typeof this.conn.close == "function" && (e ? this.conn.close(e, t ?? "") : this.conn.close()), this._teardownConnection();
      } else
        this._setConnectionState("disconnected");
  }
  /**
   * Returns all created channels
   */
  getChannels() {
    return this.channels;
  }
  /**
   * Unsubscribes and removes a single channel
   * @param channel A RealtimeChannel instance
   */
  async removeChannel(e) {
    const t = await e.unsubscribe();
    return t === "ok" && this._remove(e), this.channels.length === 0 && this.disconnect(), t;
  }
  /**
   * Unsubscribes and removes all channels
   */
  async removeAllChannels() {
    const e = await Promise.all(this.channels.map((t) => t.unsubscribe()));
    return this.channels = [], this.disconnect(), e;
  }
  /**
   * Logs the message.
   *
   * For customized logging, `this.logger` can be overridden.
   */
  log(e, t, i) {
    this.logger(e, t, i);
  }
  /**
   * Returns the current state of the socket.
   */
  connectionState() {
    switch (this.conn && this.conn.readyState) {
      case Ie.connecting:
        return Be.Connecting;
      case Ie.open:
        return Be.Open;
      case Ie.closing:
        return Be.Closing;
      default:
        return Be.Closed;
    }
  }
  /**
   * Returns `true` is the connection is open.
   */
  isConnected() {
    return this.connectionState() === Be.Open;
  }
  /**
   * Returns `true` if the connection is currently connecting.
   */
  isConnecting() {
    return this._connectionState === "connecting";
  }
  /**
   * Returns `true` if the connection is currently disconnecting.
   */
  isDisconnecting() {
    return this._connectionState === "disconnecting";
  }
  /**
   * Creates (or reuses) a {@link RealtimeChannel} for the provided topic.
   *
   * Topics are automatically prefixed with `realtime:` to match the Realtime service.
   * If a channel with the same topic already exists it will be returned instead of creating
   * a duplicate connection.
   */
  channel(e, t = { config: {} }) {
    const i = `realtime:${e}`, n = this.getChannels().find((a) => a.topic === i);
    if (n)
      return n;
    {
      const a = new nt(`realtime:${e}`, t, this);
      return this.channels.push(a), a;
    }
  }
  /**
   * Push out a message if the socket is connected.
   *
   * If the socket is not connected, the message gets enqueued within a local buffer, and sent out when a connection is next established.
   */
  push(e) {
    const { topic: t, event: i, payload: n, ref: a } = e, s = () => {
      this.encode(e, (o) => {
        var c;
        (c = this.conn) === null || c === void 0 || c.send(o);
      });
    };
    this.log("push", `${t} ${i} (${a})`, n), this.isConnected() ? s() : this.sendBuffer.push(s);
  }
  /**
   * Sets the JWT access token used for channel subscription authorization and Realtime RLS.
   *
   * If param is null it will use the `accessToken` callback function or the token set on the client.
   *
   * On callback used, it will set the value of the token internal to the client.
   *
   * When a token is explicitly provided, it will be preserved across channel operations
   * (including removeChannel and resubscribe). The `accessToken` callback will not be
   * invoked until `setAuth()` is called without arguments.
   *
   * @param token A JWT string to override the token set on the client.
   *
   * @example
   * // Use a manual token (preserved across resubscribes, ignores accessToken callback)
   * client.realtime.setAuth('my-custom-jwt')
   *
   * // Switch back to using the accessToken callback
   * client.realtime.setAuth()
   */
  async setAuth(e = null) {
    this._authPromise = this._performAuth(e);
    try {
      await this._authPromise;
    } finally {
      this._authPromise = null;
    }
  }
  /**
   * Returns true if the current access token was explicitly set via setAuth(token),
   * false if it was obtained via the accessToken callback.
   * @internal
   */
  _isManualToken() {
    return this._manuallySetToken;
  }
  /**
   * Sends a heartbeat message if the socket is connected.
   */
  async sendHeartbeat() {
    var e;
    if (!this.isConnected()) {
      try {
        this.heartbeatCallback("disconnected");
      } catch (t) {
        this.log("error", "error in heartbeat callback", t);
      }
      return;
    }
    if (this.pendingHeartbeatRef) {
      this.pendingHeartbeatRef = null, this._heartbeatSentAt = null, this.log("transport", "heartbeat timeout. Attempting to re-establish connection");
      try {
        this.heartbeatCallback("timeout");
      } catch (t) {
        this.log("error", "error in heartbeat callback", t);
      }
      this._wasManualDisconnect = !1, (e = this.conn) === null || e === void 0 || e.close(xc, "heartbeat timeout"), setTimeout(() => {
        var t;
        this.isConnected() || (t = this.reconnectTimer) === null || t === void 0 || t.scheduleTimeout();
      }, Vt.HEARTBEAT_TIMEOUT_FALLBACK);
      return;
    }
    this._heartbeatSentAt = Date.now(), this.pendingHeartbeatRef = this._makeRef(), this.push({
      topic: "phoenix",
      event: "heartbeat",
      payload: {},
      ref: this.pendingHeartbeatRef
    });
    try {
      this.heartbeatCallback("sent");
    } catch (t) {
      this.log("error", "error in heartbeat callback", t);
    }
    this._setAuthSafely("heartbeat");
  }
  /**
   * Sets a callback that receives lifecycle events for internal heartbeat messages.
   * Useful for instrumenting connection health (e.g. sent/ok/timeout/disconnected).
   */
  onHeartbeat(e) {
    this.heartbeatCallback = e;
  }
  /**
   * Flushes send buffer
   */
  flushSendBuffer() {
    this.isConnected() && this.sendBuffer.length > 0 && (this.sendBuffer.forEach((e) => e()), this.sendBuffer = []);
  }
  /**
   * Return the next message ref, accounting for overflows
   *
   * @internal
   */
  _makeRef() {
    let e = this.ref + 1;
    return e === this.ref ? this.ref = 0 : this.ref = e, this.ref.toString();
  }
  /**
   * Unsubscribe from channels with the specified topic.
   *
   * @internal
   */
  _leaveOpenTopic(e) {
    let t = this.channels.find((i) => i.topic === e && (i._isJoined() || i._isJoining()));
    t && (this.log("transport", `leaving duplicate topic "${e}"`), t.unsubscribe());
  }
  /**
   * Removes a subscription from the socket.
   *
   * @param channel An open subscription.
   *
   * @internal
   */
  _remove(e) {
    this.channels = this.channels.filter((t) => t.topic !== e.topic);
  }
  /** @internal */
  _onConnMessage(e) {
    this.decode(e.data, (t) => {
      if (t.topic === "phoenix" && t.event === "phx_reply" && t.ref && t.ref === this.pendingHeartbeatRef) {
        const l = this._heartbeatSentAt ? Date.now() - this._heartbeatSentAt : void 0;
        try {
          this.heartbeatCallback(t.payload.status === "ok" ? "ok" : "error", l);
        } catch (u) {
          this.log("error", "error in heartbeat callback", u);
        }
        this._heartbeatSentAt = null, this.pendingHeartbeatRef = null;
      }
      const { topic: i, event: n, payload: a, ref: s } = t, o = s ? `(${s})` : "", c = a.status || "";
      this.log("receive", `${c} ${i} ${n} ${o}`.trim(), a), this.channels.filter((l) => l._isMember(i)).forEach((l) => l._trigger(n, a, s)), this._triggerStateCallbacks("message", t);
    });
  }
  /**
   * Clear specific timer
   * @internal
   */
  _clearTimer(e) {
    var t;
    e === "heartbeat" && this.heartbeatTimer ? (clearInterval(this.heartbeatTimer), this.heartbeatTimer = void 0) : e === "reconnect" && ((t = this.reconnectTimer) === null || t === void 0 || t.reset());
  }
  /**
   * Clear all timers
   * @internal
   */
  _clearAllTimers() {
    this._clearTimer("heartbeat"), this._clearTimer("reconnect");
  }
  /**
   * Setup connection handlers for WebSocket events
   * @internal
   */
  _setupConnectionHandlers() {
    this.conn && ("binaryType" in this.conn && (this.conn.binaryType = "arraybuffer"), this.conn.onopen = () => this._onConnOpen(), this.conn.onerror = (e) => this._onConnError(e), this.conn.onmessage = (e) => this._onConnMessage(e), this.conn.onclose = (e) => this._onConnClose(e), this.conn.readyState === Ie.open && this._onConnOpen());
  }
  /**
   * Teardown connection and cleanup resources
   * @internal
   */
  _teardownConnection() {
    if (this.conn) {
      if (this.conn.readyState === Ie.open || this.conn.readyState === Ie.connecting)
        try {
          this.conn.close();
        } catch (e) {
          this.log("error", "Error closing connection", e);
        }
      this.conn.onopen = null, this.conn.onerror = null, this.conn.onmessage = null, this.conn.onclose = null, this.conn = null;
    }
    this._clearAllTimers(), this._terminateWorker(), this.channels.forEach((e) => e.teardown());
  }
  /** @internal */
  _onConnOpen() {
    this._setConnectionState("connected"), this.log("transport", `connected to ${this.endpointURL()}`), (this._authPromise || (this.accessToken && !this.accessTokenValue ? this.setAuth() : Promise.resolve())).then(() => {
      this.flushSendBuffer();
    }).catch((t) => {
      this.log("error", "error waiting for auth on connect", t), this.flushSendBuffer();
    }), this._clearTimer("reconnect"), this.worker ? this.workerRef || this._startWorkerHeartbeat() : this._startHeartbeat(), this._triggerStateCallbacks("open");
  }
  /** @internal */
  _startHeartbeat() {
    this.heartbeatTimer && clearInterval(this.heartbeatTimer), this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), this.heartbeatIntervalMs);
  }
  /** @internal */
  _startWorkerHeartbeat() {
    this.workerUrl ? this.log("worker", `starting worker for from ${this.workerUrl}`) : this.log("worker", "starting default worker");
    const e = this._workerObjectUrl(this.workerUrl);
    this.workerRef = new Worker(e), this.workerRef.onerror = (t) => {
      this.log("worker", "worker error", t.message), this._terminateWorker();
    }, this.workerRef.onmessage = (t) => {
      t.data.event === "keepAlive" && this.sendHeartbeat();
    }, this.workerRef.postMessage({
      event: "start",
      interval: this.heartbeatIntervalMs
    });
  }
  /**
   * Terminate the Web Worker and clear the reference
   * @internal
   */
  _terminateWorker() {
    this.workerRef && (this.log("worker", "terminating worker"), this.workerRef.terminate(), this.workerRef = void 0);
  }
  /** @internal */
  _onConnClose(e) {
    var t;
    this._setConnectionState("disconnected"), this.log("transport", "close", e), this._triggerChanError(), this._clearTimer("heartbeat"), this._wasManualDisconnect || (t = this.reconnectTimer) === null || t === void 0 || t.scheduleTimeout(), this._triggerStateCallbacks("close", e);
  }
  /** @internal */
  _onConnError(e) {
    this._setConnectionState("disconnected"), this.log("transport", `${e}`), this._triggerChanError(), this._triggerStateCallbacks("error", e);
    try {
      this.heartbeatCallback("error");
    } catch (t) {
      this.log("error", "error in heartbeat callback", t);
    }
  }
  /** @internal */
  _triggerChanError() {
    this.channels.forEach((e) => e._trigger(de.error));
  }
  /** @internal */
  _appendParams(e, t) {
    if (Object.keys(t).length === 0)
      return e;
    const i = e.match(/\?/) ? "&" : "?", n = new URLSearchParams(t);
    return `${e}${i}${n}`;
  }
  _workerObjectUrl(e) {
    let t;
    if (e)
      t = e;
    else {
      const i = new Blob([Dc], { type: "application/javascript" });
      t = URL.createObjectURL(i);
    }
    return t;
  }
  /**
   * Set connection state with proper state management
   * @internal
   */
  _setConnectionState(e, t = !1) {
    this._connectionState = e, e === "connecting" ? this._wasManualDisconnect = !1 : e === "disconnecting" && (this._wasManualDisconnect = t);
  }
  /**
   * Perform the actual auth operation
   * @internal
   */
  async _performAuth(e = null) {
    let t, i = !1;
    if (e)
      t = e, i = !0;
    else if (this.accessToken)
      try {
        t = await this.accessToken();
      } catch (n) {
        this.log("error", "Error fetching access token from callback", n), t = this.accessTokenValue;
      }
    else
      t = this.accessTokenValue;
    i ? this._manuallySetToken = !0 : this.accessToken && (this._manuallySetToken = !1), this.accessTokenValue != t && (this.accessTokenValue = t, this.channels.forEach((n) => {
      const a = {
        access_token: t,
        version: bc
      };
      t && n.updateJoinPayload(a), n.joinedOnce && n._isJoined() && n._push(de.access_token, {
        access_token: t
      });
    }));
  }
  /**
   * Wait for any in-flight auth operations to complete
   * @internal
   */
  async _waitForAuthIfNeeded() {
    this._authPromise && await this._authPromise;
  }
  /**
   * Safely call setAuth with standardized error handling
   * @internal
   */
  _setAuthSafely(e = "general") {
    this._isManualToken() || this.setAuth().catch((t) => {
      this.log("error", `Error setting auth in ${e}`, t);
    });
  }
  /**
   * Trigger state change callbacks with proper error handling
   * @internal
   */
  _triggerStateCallbacks(e, t) {
    try {
      this.stateChangeCallbacks[e].forEach((i) => {
        try {
          i(t);
        } catch (n) {
          this.log("error", `error in ${e} callback`, n);
        }
      });
    } catch (i) {
      this.log("error", `error triggering ${e} callbacks`, i);
    }
  }
  /**
   * Setup reconnection timer with proper configuration
   * @internal
   */
  _setupReconnectionTimer() {
    this.reconnectTimer = new Ln(async () => {
      setTimeout(async () => {
        await this._waitForAuthIfNeeded(), this.isConnected() || this.connect();
      }, Vt.RECONNECT_DELAY);
    }, this.reconnectAfterMs);
  }
  /**
   * Initialize client options with defaults
   * @internal
   */
  _initializeOptions(e) {
    var t, i, n, a, s, o, c, l, u, h, d, f;
    switch (this.transport = (t = e == null ? void 0 : e.transport) !== null && t !== void 0 ? t : null, this.timeout = (i = e == null ? void 0 : e.timeout) !== null && i !== void 0 ? i : zr, this.heartbeatIntervalMs = (n = e == null ? void 0 : e.heartbeatIntervalMs) !== null && n !== void 0 ? n : Vt.HEARTBEAT_INTERVAL, this.worker = (a = e == null ? void 0 : e.worker) !== null && a !== void 0 ? a : !1, this.accessToken = (s = e == null ? void 0 : e.accessToken) !== null && s !== void 0 ? s : null, this.heartbeatCallback = (o = e == null ? void 0 : e.heartbeatCallback) !== null && o !== void 0 ? o : Er, this.vsn = (c = e == null ? void 0 : e.vsn) !== null && c !== void 0 ? c : Ri, e != null && e.params && (this.params = e.params), e != null && e.logger && (this.logger = e.logger), (e != null && e.logLevel || e != null && e.log_level) && (this.logLevel = e.logLevel || e.log_level, this.params = Object.assign(Object.assign({}, this.params), { log_level: this.logLevel })), this.reconnectAfterMs = (l = e == null ? void 0 : e.reconnectAfterMs) !== null && l !== void 0 ? l : (p) => Oc[p - 1] || Pc, this.vsn) {
      case _c:
        this.encode = (u = e == null ? void 0 : e.encode) !== null && u !== void 0 ? u : (p, m) => m(JSON.stringify(p)), this.decode = (h = e == null ? void 0 : e.decode) !== null && h !== void 0 ? h : (p, m) => m(JSON.parse(p));
        break;
      case Un:
        this.encode = (d = e == null ? void 0 : e.encode) !== null && d !== void 0 ? d : this.serializer.encode.bind(this.serializer), this.decode = (f = e == null ? void 0 : e.decode) !== null && f !== void 0 ? f : this.serializer.decode.bind(this.serializer);
        break;
      default:
        throw new Error(`Unsupported serializer version: ${this.vsn}`);
    }
    if (this.worker) {
      if (typeof window < "u" && !window.Worker)
        throw new Error("Web Worker is not supported");
      this.workerUrl = e == null ? void 0 : e.workerUrl;
    }
  }
}
var kt = class extends Error {
  constructor(r, e) {
    var t;
    super(r), this.name = "IcebergError", this.status = e.status, this.icebergType = e.icebergType, this.icebergCode = e.icebergCode, this.details = e.details, this.isCommitStateUnknown = e.icebergType === "CommitStateUnknownException" || [500, 502, 504].includes(e.status) && ((t = e.icebergType) == null ? void 0 : t.includes("CommitState")) === !0;
  }
  /**
   * Returns true if the error is a 404 Not Found error.
   */
  isNotFound() {
    return this.status === 404;
  }
  /**
   * Returns true if the error is a 409 Conflict error.
   */
  isConflict() {
    return this.status === 409;
  }
  /**
   * Returns true if the error is a 419 Authentication Timeout error.
   */
  isAuthenticationTimeout() {
    return this.status === 419;
  }
};
function Lc(r, e, t) {
  const i = new URL(e, r);
  if (t)
    for (const [n, a] of Object.entries(t))
      a !== void 0 && i.searchParams.set(n, a);
  return i.toString();
}
async function jc(r) {
  return !r || r.type === "none" ? {} : r.type === "bearer" ? { Authorization: `Bearer ${r.token}` } : r.type === "header" ? { [r.name]: r.value } : r.type === "custom" ? await r.getHeaders() : {};
}
function Nc(r) {
  const e = r.fetchImpl ?? globalThis.fetch;
  return {
    async request({
      method: t,
      path: i,
      query: n,
      body: a,
      headers: s
    }) {
      const o = Lc(r.baseUrl, i, n), c = await jc(r.auth), l = await e(o, {
        method: t,
        headers: {
          ...a ? { "Content-Type": "application/json" } : {},
          ...c,
          ...s
        },
        body: a ? JSON.stringify(a) : void 0
      }), u = await l.text(), h = (l.headers.get("content-type") || "").includes("application/json"), d = h && u ? JSON.parse(u) : u;
      if (!l.ok) {
        const f = h ? d : void 0, p = f == null ? void 0 : f.error;
        throw new kt(
          (p == null ? void 0 : p.message) ?? `Request failed with status ${l.status}`,
          {
            status: l.status,
            icebergType: p == null ? void 0 : p.type,
            icebergCode: p == null ? void 0 : p.code,
            details: f
          }
        );
      }
      return { status: l.status, headers: l.headers, data: d };
    }
  };
}
function Ht(r) {
  return r.join("");
}
var Bc = class {
  constructor(r, e = "") {
    this.client = r, this.prefix = e;
  }
  async listNamespaces(r) {
    const e = r ? { parent: Ht(r.namespace) } : void 0;
    return (await this.client.request({
      method: "GET",
      path: `${this.prefix}/namespaces`,
      query: e
    })).data.namespaces.map((i) => ({ namespace: i }));
  }
  async createNamespace(r, e) {
    const t = {
      namespace: r.namespace,
      properties: e == null ? void 0 : e.properties
    };
    return (await this.client.request({
      method: "POST",
      path: `${this.prefix}/namespaces`,
      body: t
    })).data;
  }
  async dropNamespace(r) {
    await this.client.request({
      method: "DELETE",
      path: `${this.prefix}/namespaces/${Ht(r.namespace)}`
    });
  }
  async loadNamespaceMetadata(r) {
    return {
      properties: (await this.client.request({
        method: "GET",
        path: `${this.prefix}/namespaces/${Ht(r.namespace)}`
      })).data.properties
    };
  }
  async namespaceExists(r) {
    try {
      return await this.client.request({
        method: "HEAD",
        path: `${this.prefix}/namespaces/${Ht(r.namespace)}`
      }), !0;
    } catch (e) {
      if (e instanceof kt && e.status === 404)
        return !1;
      throw e;
    }
  }
  async createNamespaceIfNotExists(r, e) {
    try {
      return await this.createNamespace(r, e);
    } catch (t) {
      if (t instanceof kt && t.status === 409)
        return;
      throw t;
    }
  }
};
function Ve(r) {
  return r.join("");
}
var $c = class {
  constructor(r, e = "", t) {
    this.client = r, this.prefix = e, this.accessDelegation = t;
  }
  async listTables(r) {
    return (await this.client.request({
      method: "GET",
      path: `${this.prefix}/namespaces/${Ve(r.namespace)}/tables`
    })).data.identifiers;
  }
  async createTable(r, e) {
    const t = {};
    return this.accessDelegation && (t["X-Iceberg-Access-Delegation"] = this.accessDelegation), (await this.client.request({
      method: "POST",
      path: `${this.prefix}/namespaces/${Ve(r.namespace)}/tables`,
      body: e,
      headers: t
    })).data.metadata;
  }
  async updateTable(r, e) {
    const t = await this.client.request({
      method: "POST",
      path: `${this.prefix}/namespaces/${Ve(r.namespace)}/tables/${r.name}`,
      body: e
    });
    return {
      "metadata-location": t.data["metadata-location"],
      metadata: t.data.metadata
    };
  }
  async dropTable(r, e) {
    await this.client.request({
      method: "DELETE",
      path: `${this.prefix}/namespaces/${Ve(r.namespace)}/tables/${r.name}`,
      query: { purgeRequested: String((e == null ? void 0 : e.purge) ?? !1) }
    });
  }
  async loadTable(r) {
    const e = {};
    return this.accessDelegation && (e["X-Iceberg-Access-Delegation"] = this.accessDelegation), (await this.client.request({
      method: "GET",
      path: `${this.prefix}/namespaces/${Ve(r.namespace)}/tables/${r.name}`,
      headers: e
    })).data.metadata;
  }
  async tableExists(r) {
    const e = {};
    this.accessDelegation && (e["X-Iceberg-Access-Delegation"] = this.accessDelegation);
    try {
      return await this.client.request({
        method: "HEAD",
        path: `${this.prefix}/namespaces/${Ve(r.namespace)}/tables/${r.name}`,
        headers: e
      }), !0;
    } catch (t) {
      if (t instanceof kt && t.status === 404)
        return !1;
      throw t;
    }
  }
  async createTableIfNotExists(r, e) {
    try {
      return await this.createTable(r, e);
    } catch (t) {
      if (t instanceof kt && t.status === 409)
        return await this.loadTable({ namespace: r.namespace, name: e.name });
      throw t;
    }
  }
}, Mc = class {
  /**
   * Creates a new Iceberg REST Catalog client.
   *
   * @param options - Configuration options for the catalog client
   */
  constructor(r) {
    var i;
    let e = "v1";
    r.catalogName && (e += `/${r.catalogName}`);
    const t = r.baseUrl.endsWith("/") ? r.baseUrl : `${r.baseUrl}/`;
    this.client = Nc({
      baseUrl: t,
      auth: r.auth,
      fetchImpl: r.fetch
    }), this.accessDelegation = (i = r.accessDelegation) == null ? void 0 : i.join(","), this.namespaceOps = new Bc(this.client, e), this.tableOps = new $c(this.client, e, this.accessDelegation);
  }
  /**
   * Lists all namespaces in the catalog.
   *
   * @param parent - Optional parent namespace to list children under
   * @returns Array of namespace identifiers
   *
   * @example
   * ```typescript
   * // List all top-level namespaces
   * const namespaces = await catalog.listNamespaces();
   *
   * // List namespaces under a parent
   * const children = await catalog.listNamespaces({ namespace: ['analytics'] });
   * ```
   */
  async listNamespaces(r) {
    return this.namespaceOps.listNamespaces(r);
  }
  /**
   * Creates a new namespace in the catalog.
   *
   * @param id - Namespace identifier to create
   * @param metadata - Optional metadata properties for the namespace
   * @returns Response containing the created namespace and its properties
   *
   * @example
   * ```typescript
   * const response = await catalog.createNamespace(
   *   { namespace: ['analytics'] },
   *   { properties: { owner: 'data-team' } }
   * );
   * console.log(response.namespace); // ['analytics']
   * console.log(response.properties); // { owner: 'data-team', ... }
   * ```
   */
  async createNamespace(r, e) {
    return this.namespaceOps.createNamespace(r, e);
  }
  /**
   * Drops a namespace from the catalog.
   *
   * The namespace must be empty (contain no tables) before it can be dropped.
   *
   * @param id - Namespace identifier to drop
   *
   * @example
   * ```typescript
   * await catalog.dropNamespace({ namespace: ['analytics'] });
   * ```
   */
  async dropNamespace(r) {
    await this.namespaceOps.dropNamespace(r);
  }
  /**
   * Loads metadata for a namespace.
   *
   * @param id - Namespace identifier to load
   * @returns Namespace metadata including properties
   *
   * @example
   * ```typescript
   * const metadata = await catalog.loadNamespaceMetadata({ namespace: ['analytics'] });
   * console.log(metadata.properties);
   * ```
   */
  async loadNamespaceMetadata(r) {
    return this.namespaceOps.loadNamespaceMetadata(r);
  }
  /**
   * Lists all tables in a namespace.
   *
   * @param namespace - Namespace identifier to list tables from
   * @returns Array of table identifiers
   *
   * @example
   * ```typescript
   * const tables = await catalog.listTables({ namespace: ['analytics'] });
   * console.log(tables); // [{ namespace: ['analytics'], name: 'events' }, ...]
   * ```
   */
  async listTables(r) {
    return this.tableOps.listTables(r);
  }
  /**
   * Creates a new table in the catalog.
   *
   * @param namespace - Namespace to create the table in
   * @param request - Table creation request including name, schema, partition spec, etc.
   * @returns Table metadata for the created table
   *
   * @example
   * ```typescript
   * const metadata = await catalog.createTable(
   *   { namespace: ['analytics'] },
   *   {
   *     name: 'events',
   *     schema: {
   *       type: 'struct',
   *       fields: [
   *         { id: 1, name: 'id', type: 'long', required: true },
   *         { id: 2, name: 'timestamp', type: 'timestamp', required: true }
   *       ],
   *       'schema-id': 0
   *     },
   *     'partition-spec': {
   *       'spec-id': 0,
   *       fields: [
   *         { source_id: 2, field_id: 1000, name: 'ts_day', transform: 'day' }
   *       ]
   *     }
   *   }
   * );
   * ```
   */
  async createTable(r, e) {
    return this.tableOps.createTable(r, e);
  }
  /**
   * Updates an existing table's metadata.
   *
   * Can update the schema, partition spec, or properties of a table.
   *
   * @param id - Table identifier to update
   * @param request - Update request with fields to modify
   * @returns Response containing the metadata location and updated table metadata
   *
   * @example
   * ```typescript
   * const response = await catalog.updateTable(
   *   { namespace: ['analytics'], name: 'events' },
   *   {
   *     properties: { 'read.split.target-size': '134217728' }
   *   }
   * );
   * console.log(response['metadata-location']); // s3://...
   * console.log(response.metadata); // TableMetadata object
   * ```
   */
  async updateTable(r, e) {
    return this.tableOps.updateTable(r, e);
  }
  /**
   * Drops a table from the catalog.
   *
   * @param id - Table identifier to drop
   *
   * @example
   * ```typescript
   * await catalog.dropTable({ namespace: ['analytics'], name: 'events' });
   * ```
   */
  async dropTable(r, e) {
    await this.tableOps.dropTable(r, e);
  }
  /**
   * Loads metadata for a table.
   *
   * @param id - Table identifier to load
   * @returns Table metadata including schema, partition spec, location, etc.
   *
   * @example
   * ```typescript
   * const metadata = await catalog.loadTable({ namespace: ['analytics'], name: 'events' });
   * console.log(metadata.schema);
   * console.log(metadata.location);
   * ```
   */
  async loadTable(r) {
    return this.tableOps.loadTable(r);
  }
  /**
   * Checks if a namespace exists in the catalog.
   *
   * @param id - Namespace identifier to check
   * @returns True if the namespace exists, false otherwise
   *
   * @example
   * ```typescript
   * const exists = await catalog.namespaceExists({ namespace: ['analytics'] });
   * console.log(exists); // true or false
   * ```
   */
  async namespaceExists(r) {
    return this.namespaceOps.namespaceExists(r);
  }
  /**
   * Checks if a table exists in the catalog.
   *
   * @param id - Table identifier to check
   * @returns True if the table exists, false otherwise
   *
   * @example
   * ```typescript
   * const exists = await catalog.tableExists({ namespace: ['analytics'], name: 'events' });
   * console.log(exists); // true or false
   * ```
   */
  async tableExists(r) {
    return this.tableOps.tableExists(r);
  }
  /**
   * Creates a namespace if it does not exist.
   *
   * If the namespace already exists, returns void. If created, returns the response.
   *
   * @param id - Namespace identifier to create
   * @param metadata - Optional metadata properties for the namespace
   * @returns Response containing the created namespace and its properties, or void if it already exists
   *
   * @example
   * ```typescript
   * const response = await catalog.createNamespaceIfNotExists(
   *   { namespace: ['analytics'] },
   *   { properties: { owner: 'data-team' } }
   * );
   * if (response) {
   *   console.log('Created:', response.namespace);
   * } else {
   *   console.log('Already exists');
   * }
   * ```
   */
  async createNamespaceIfNotExists(r, e) {
    return this.namespaceOps.createNamespaceIfNotExists(r, e);
  }
  /**
   * Creates a table if it does not exist.
   *
   * If the table already exists, returns its metadata instead.
   *
   * @param namespace - Namespace to create the table in
   * @param request - Table creation request including name, schema, partition spec, etc.
   * @returns Table metadata for the created or existing table
   *
   * @example
   * ```typescript
   * const metadata = await catalog.createTableIfNotExists(
   *   { namespace: ['analytics'] },
   *   {
   *     name: 'events',
   *     schema: {
   *       type: 'struct',
   *       fields: [
   *         { id: 1, name: 'id', type: 'long', required: true },
   *         { id: 2, name: 'timestamp', type: 'timestamp', required: true }
   *       ],
   *       'schema-id': 0
   *     }
   *   }
   * );
   * ```
   */
  async createTableIfNotExists(r, e) {
    return this.tableOps.createTableIfNotExists(r, e);
  }
}, fr = class extends Error {
  constructor(r, e = "storage", t, i) {
    super(r), this.__isStorageError = !0, this.namespace = e, this.name = e === "vectors" ? "StorageVectorsError" : "StorageError", this.status = t, this.statusCode = i;
  }
};
function pr(r) {
  return typeof r == "object" && r !== null && "__isStorageError" in r;
}
var Xt = class extends fr {
  constructor(r, e, t, i = "storage") {
    super(r, i, e, t), this.name = i === "vectors" ? "StorageVectorsApiError" : "StorageApiError", this.status = e, this.statusCode = t;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      statusCode: this.statusCode
    };
  }
}, Bn = class extends fr {
  constructor(r, e, t = "storage") {
    super(r, t), this.name = t === "vectors" ? "StorageVectorsUnknownError" : "StorageUnknownError", this.originalError = e;
  }
};
const Fc = (r) => r ? (...e) => r(...e) : (...e) => fetch(...e), zc = (r) => {
  if (typeof r != "object" || r === null)
    return !1;
  const e = Object.getPrototypeOf(r);
  return (e === null || e === Object.prototype || Object.getPrototypeOf(e) === null) && !(Symbol.toStringTag in r) && !(Symbol.iterator in r);
}, Wr = (r) => {
  if (Array.isArray(r))
    return r.map((t) => Wr(t));
  if (typeof r == "function" || r !== Object(r))
    return r;
  const e = {};
  return Object.entries(r).forEach(([t, i]) => {
    const n = t.replace(/([-_][a-z])/gi, (a) => a.toUpperCase().replace(/[-_]/g, ""));
    e[n] = Wr(i);
  }), e;
}, qc = (r) => !r || typeof r != "string" || r.length === 0 || r.length > 100 || r.trim() !== r || r.includes("/") || r.includes("\\") ? !1 : /^[\w!.\*'() &$@=;:+,?-]+$/.test(r);
function St(r) {
  "@babel/helpers - typeof";
  return St = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
    return typeof e;
  } : function(e) {
    return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, St(r);
}
function Gc(r, e) {
  if (St(r) != "object" || !r)
    return r;
  var t = r[Symbol.toPrimitive];
  if (t !== void 0) {
    var i = t.call(r, e);
    if (St(i) != "object")
      return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(r);
}
function Wc(r) {
  var e = Gc(r, "string");
  return St(e) == "symbol" ? e : e + "";
}
function Kc(r, e, t) {
  return (e = Wc(e)) in r ? Object.defineProperty(r, e, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : r[e] = t, r;
}
function Di(r, e) {
  var t = Object.keys(r);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(r);
    e && (i = i.filter(function(n) {
      return Object.getOwnPropertyDescriptor(r, n).enumerable;
    })), t.push.apply(t, i);
  }
  return t;
}
function R(r) {
  for (var e = 1; e < arguments.length; e++) {
    var t = arguments[e] != null ? arguments[e] : {};
    e % 2 ? Di(Object(t), !0).forEach(function(i) {
      Kc(r, i, t[i]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(r, Object.getOwnPropertyDescriptors(t)) : Di(Object(t)).forEach(function(i) {
      Object.defineProperty(r, i, Object.getOwnPropertyDescriptor(t, i));
    });
  }
  return r;
}
const Ui = (r) => {
  var e;
  return r.msg || r.message || r.error_description || (typeof r.error == "string" ? r.error : (e = r.error) === null || e === void 0 ? void 0 : e.message) || JSON.stringify(r);
}, Vc = async (r, e, t, i) => {
  if (r && typeof r == "object" && "status" in r && "ok" in r && typeof r.status == "number" && !(t != null && t.noResolveJson)) {
    const n = r, a = n.status || 500;
    if (typeof n.json == "function")
      n.json().then((s) => {
        const o = (s == null ? void 0 : s.statusCode) || (s == null ? void 0 : s.code) || a + "";
        e(new Xt(Ui(s), a, o, i));
      }).catch(() => {
        if (i === "vectors") {
          const s = a + "";
          e(new Xt(n.statusText || `HTTP ${a} error`, a, s, i));
        } else {
          const s = a + "";
          e(new Xt(n.statusText || `HTTP ${a} error`, a, s, i));
        }
      });
    else {
      const s = a + "";
      e(new Xt(n.statusText || `HTTP ${a} error`, a, s, i));
    }
  } else
    e(new Bn(Ui(r), r, i));
}, Hc = (r, e, t, i) => {
  const n = {
    method: r,
    headers: (e == null ? void 0 : e.headers) || {}
  };
  return r === "GET" || r === "HEAD" || !i ? R(R({}, n), t) : (zc(i) ? (n.headers = R({ "Content-Type": "application/json" }, e == null ? void 0 : e.headers), n.body = JSON.stringify(i)) : n.body = i, e != null && e.duplex && (n.duplex = e.duplex), R(R({}, n), t));
};
async function dt(r, e, t, i, n, a, s) {
  return new Promise((o, c) => {
    r(t, Hc(e, i, n, a)).then((l) => {
      if (!l.ok)
        throw l;
      if (i != null && i.noResolveJson)
        return l;
      if (s === "vectors") {
        const u = l.headers.get("content-type");
        if (l.headers.get("content-length") === "0" || l.status === 204)
          return {};
        if (!u || !u.includes("application/json"))
          return {};
      }
      return l.json();
    }).then((l) => o(l)).catch((l) => Vc(l, c, i, s));
  });
}
function $n(r = "storage") {
  return {
    get: async (e, t, i, n) => dt(e, "GET", t, i, n, void 0, r),
    post: async (e, t, i, n, a) => dt(e, "POST", t, n, a, i, r),
    put: async (e, t, i, n, a) => dt(e, "PUT", t, n, a, i, r),
    head: async (e, t, i, n) => dt(e, "HEAD", t, R(R({}, i), {}, { noResolveJson: !0 }), n, void 0, r),
    remove: async (e, t, i, n, a) => dt(e, "DELETE", t, n, a, i, r)
  };
}
const Xc = $n("storage"), { get: Et, post: he, put: Kr, head: Jc, remove: si } = Xc, ae = $n("vectors");
var ot = class {
  /**
  * Creates a new BaseApiClient instance
  * @param url - Base URL for API requests
  * @param headers - Default headers for API requests
  * @param fetch - Optional custom fetch implementation
  * @param namespace - Error namespace ('storage' or 'vectors')
  */
  constructor(r, e = {}, t, i = "storage") {
    this.shouldThrowOnError = !1, this.url = r, this.headers = e, this.fetch = Fc(t), this.namespace = i;
  }
  /**
  * Enable throwing errors instead of returning them.
  * When enabled, errors are thrown instead of returned in { data, error } format.
  *
  * @returns this - For method chaining
  */
  throwOnError() {
    return this.shouldThrowOnError = !0, this;
  }
  /**
  * Handles API operation with standardized error handling
  * Eliminates repetitive try-catch blocks across all API methods
  *
  * This wrapper:
  * 1. Executes the operation
  * 2. Returns { data, error: null } on success
  * 3. Returns { data: null, error } on failure (if shouldThrowOnError is false)
  * 4. Throws error on failure (if shouldThrowOnError is true)
  *
  * @typeParam T - The expected data type from the operation
  * @param operation - Async function that performs the API call
  * @returns Promise with { data, error } tuple
  *
  * @example
  * ```typescript
  * async listBuckets() {
  *   return this.handleOperation(async () => {
  *     return await get(this.fetch, `${this.url}/bucket`, {
  *       headers: this.headers,
  *     })
  *   })
  * }
  * ```
  */
  async handleOperation(r) {
    var e = this;
    try {
      return {
        data: await r(),
        error: null
      };
    } catch (t) {
      if (e.shouldThrowOnError)
        throw t;
      if (pr(t))
        return {
          data: null,
          error: t
        };
      throw t;
    }
  }
}, Yc = class {
  constructor(r, e) {
    this.downloadFn = r, this.shouldThrowOnError = e;
  }
  then(r, e) {
    return this.execute().then(r, e);
  }
  async execute() {
    var r = this;
    try {
      return {
        data: (await r.downloadFn()).body,
        error: null
      };
    } catch (e) {
      if (r.shouldThrowOnError)
        throw e;
      if (pr(e))
        return {
          data: null,
          error: e
        };
      throw e;
    }
  }
};
let Mn;
Mn = Symbol.toStringTag;
var Zc = class {
  constructor(r, e) {
    this.downloadFn = r, this.shouldThrowOnError = e, this[Mn] = "BlobDownloadBuilder", this.promise = null;
  }
  asStream() {
    return new Yc(this.downloadFn, this.shouldThrowOnError);
  }
  then(r, e) {
    return this.getPromise().then(r, e);
  }
  catch(r) {
    return this.getPromise().catch(r);
  }
  finally(r) {
    return this.getPromise().finally(r);
  }
  getPromise() {
    return this.promise || (this.promise = this.execute()), this.promise;
  }
  async execute() {
    var r = this;
    try {
      return {
        data: await (await r.downloadFn()).blob(),
        error: null
      };
    } catch (e) {
      if (r.shouldThrowOnError)
        throw e;
      if (pr(e))
        return {
          data: null,
          error: e
        };
      throw e;
    }
  }
};
const Qc = {
  limit: 100,
  offset: 0,
  sortBy: {
    column: "name",
    order: "asc"
  }
}, Li = {
  cacheControl: "3600",
  contentType: "text/plain;charset=UTF-8",
  upsert: !1
};
var el = class extends ot {
  constructor(r, e = {}, t, i) {
    super(r, e, i, "storage"), this.bucketId = t;
  }
  /**
  * Uploads a file to an existing bucket or replaces an existing file at the specified path with a new one.
  *
  * @param method HTTP method.
  * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
  * @param fileBody The body of the file to be stored in the bucket.
  */
  async uploadOrUpdate(r, e, t, i) {
    var n = this;
    return n.handleOperation(async () => {
      let a;
      const s = R(R({}, Li), i);
      let o = R(R({}, n.headers), r === "POST" && { "x-upsert": String(s.upsert) });
      const c = s.metadata;
      typeof Blob < "u" && t instanceof Blob ? (a = new FormData(), a.append("cacheControl", s.cacheControl), c && a.append("metadata", n.encodeMetadata(c)), a.append("", t)) : typeof FormData < "u" && t instanceof FormData ? (a = t, a.has("cacheControl") || a.append("cacheControl", s.cacheControl), c && !a.has("metadata") && a.append("metadata", n.encodeMetadata(c))) : (a = t, o["cache-control"] = `max-age=${s.cacheControl}`, o["content-type"] = s.contentType, c && (o["x-metadata"] = n.toBase64(n.encodeMetadata(c))), (typeof ReadableStream < "u" && a instanceof ReadableStream || a && typeof a == "object" && "pipe" in a && typeof a.pipe == "function") && !s.duplex && (s.duplex = "half")), i != null && i.headers && (o = R(R({}, o), i.headers));
      const l = n._removeEmptyFolders(e), u = n._getFinalPath(l), h = await (r == "PUT" ? Kr : he)(n.fetch, `${n.url}/object/${u}`, a, R({ headers: o }, s != null && s.duplex ? { duplex: s.duplex } : {}));
      return {
        path: l,
        id: h.Id,
        fullPath: h.Key
      };
    });
  }
  /**
  * Uploads a file to an existing bucket.
  *
  * @category File Buckets
  * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
  * @param fileBody The body of the file to be stored in the bucket.
  * @param fileOptions Optional file upload options including cacheControl, contentType, upsert, and metadata.
  * @returns Promise with response containing file path, id, and fullPath or error
  *
  * @example Upload file
  * ```js
  * const avatarFile = event.target.files[0]
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .upload('public/avatar1.png', avatarFile, {
  *     cacheControl: '3600',
  *     upsert: false
  *   })
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "path": "public/avatar1.png",
  *     "fullPath": "avatars/public/avatar1.png"
  *   },
  *   "error": null
  * }
  * ```
  *
  * @example Upload file using `ArrayBuffer` from base64 file data
  * ```js
  * import { decode } from 'base64-arraybuffer'
  *
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .upload('public/avatar1.png', decode('base64FileData'), {
  *     contentType: 'image/png'
  *   })
  * ```
  */
  async upload(r, e, t) {
    return this.uploadOrUpdate("POST", r, e, t);
  }
  /**
  * Upload a file with a token generated from `createSignedUploadUrl`.
  *
  * @category File Buckets
  * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
  * @param token The token generated from `createSignedUploadUrl`
  * @param fileBody The body of the file to be stored in the bucket.
  * @param fileOptions HTTP headers (cacheControl, contentType, etc.).
  * **Note:** The `upsert` option has no effect here. To enable upsert behavior,
  * pass `{ upsert: true }` when calling `createSignedUploadUrl()` instead.
  * @returns Promise with response containing file path and fullPath or error
  *
  * @example Upload to a signed URL
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .uploadToSignedUrl('folder/cat.jpg', 'token-from-createSignedUploadUrl', file)
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "path": "folder/cat.jpg",
  *     "fullPath": "avatars/folder/cat.jpg"
  *   },
  *   "error": null
  * }
  * ```
  */
  async uploadToSignedUrl(r, e, t, i) {
    var n = this;
    const a = n._removeEmptyFolders(r), s = n._getFinalPath(a), o = new URL(n.url + `/object/upload/sign/${s}`);
    return o.searchParams.set("token", e), n.handleOperation(async () => {
      let c;
      const l = R({ upsert: Li.upsert }, i), u = R(R({}, n.headers), { "x-upsert": String(l.upsert) });
      return typeof Blob < "u" && t instanceof Blob ? (c = new FormData(), c.append("cacheControl", l.cacheControl), c.append("", t)) : typeof FormData < "u" && t instanceof FormData ? (c = t, c.append("cacheControl", l.cacheControl)) : (c = t, u["cache-control"] = `max-age=${l.cacheControl}`, u["content-type"] = l.contentType), {
        path: a,
        fullPath: (await Kr(n.fetch, o.toString(), c, { headers: u })).Key
      };
    });
  }
  /**
  * Creates a signed upload URL.
  * Signed upload URLs can be used to upload files to the bucket without further authentication.
  * They are valid for 2 hours.
  *
  * @category File Buckets
  * @param path The file path, including the current file name. For example `folder/image.png`.
  * @param options.upsert If set to true, allows the file to be overwritten if it already exists.
  * @returns Promise with response containing signed upload URL, token, and path or error
  *
  * @example Create Signed Upload URL
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .createSignedUploadUrl('folder/cat.jpg')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "signedUrl": "https://example.supabase.co/storage/v1/object/upload/sign/avatars/folder/cat.jpg?token=<TOKEN>",
  *     "path": "folder/cat.jpg",
  *     "token": "<TOKEN>"
  *   },
  *   "error": null
  * }
  * ```
  */
  async createSignedUploadUrl(r, e) {
    var t = this;
    return t.handleOperation(async () => {
      let i = t._getFinalPath(r);
      const n = R({}, t.headers);
      e != null && e.upsert && (n["x-upsert"] = "true");
      const a = await he(t.fetch, `${t.url}/object/upload/sign/${i}`, {}, { headers: n }), s = new URL(t.url + a.url), o = s.searchParams.get("token");
      if (!o)
        throw new fr("No token returned by API");
      return {
        signedUrl: s.toString(),
        path: r,
        token: o
      };
    });
  }
  /**
  * Replaces an existing file at the specified path with a new one.
  *
  * @category File Buckets
  * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to update.
  * @param fileBody The body of the file to be stored in the bucket.
  * @param fileOptions Optional file upload options including cacheControl, contentType, upsert, and metadata.
  * @returns Promise with response containing file path, id, and fullPath or error
  *
  * @example Update file
  * ```js
  * const avatarFile = event.target.files[0]
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .update('public/avatar1.png', avatarFile, {
  *     cacheControl: '3600',
  *     upsert: true
  *   })
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "path": "public/avatar1.png",
  *     "fullPath": "avatars/public/avatar1.png"
  *   },
  *   "error": null
  * }
  * ```
  *
  * @example Update file using `ArrayBuffer` from base64 file data
  * ```js
  * import {decode} from 'base64-arraybuffer'
  *
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .update('public/avatar1.png', decode('base64FileData'), {
  *     contentType: 'image/png'
  *   })
  * ```
  */
  async update(r, e, t) {
    return this.uploadOrUpdate("PUT", r, e, t);
  }
  /**
  * Moves an existing file to a new path in the same bucket.
  *
  * @category File Buckets
  * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
  * @param toPath The new file path, including the new file name. For example `folder/image-new.png`.
  * @param options The destination options.
  * @returns Promise with response containing success message or error
  *
  * @example Move file
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .move('public/avatar1.png', 'private/avatar2.png')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "message": "Successfully moved"
  *   },
  *   "error": null
  * }
  * ```
  */
  async move(r, e, t) {
    var i = this;
    return i.handleOperation(async () => await he(i.fetch, `${i.url}/object/move`, {
      bucketId: i.bucketId,
      sourceKey: r,
      destinationKey: e,
      destinationBucket: t == null ? void 0 : t.destinationBucket
    }, { headers: i.headers }));
  }
  /**
  * Copies an existing file to a new path in the same bucket.
  *
  * @category File Buckets
  * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
  * @param toPath The new file path, including the new file name. For example `folder/image-copy.png`.
  * @param options The destination options.
  * @returns Promise with response containing copied file path or error
  *
  * @example Copy file
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .copy('public/avatar1.png', 'private/avatar2.png')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "path": "avatars/private/avatar2.png"
  *   },
  *   "error": null
  * }
  * ```
  */
  async copy(r, e, t) {
    var i = this;
    return i.handleOperation(async () => ({ path: (await he(i.fetch, `${i.url}/object/copy`, {
      bucketId: i.bucketId,
      sourceKey: r,
      destinationKey: e,
      destinationBucket: t == null ? void 0 : t.destinationBucket
    }, { headers: i.headers })).Key }));
  }
  /**
  * Creates a signed URL. Use a signed URL to share a file for a fixed amount of time.
  *
  * @category File Buckets
  * @param path The file path, including the current file name. For example `folder/image.png`.
  * @param expiresIn The number of seconds until the signed URL expires. For example, `60` for a URL which is valid for one minute.
  * @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
  * @param options.transform Transform the asset before serving it to the client.
  * @returns Promise with response containing signed URL or error
  *
  * @example Create Signed URL
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .createSignedUrl('folder/avatar1.png', 60)
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar1.png?token=<TOKEN>"
  *   },
  *   "error": null
  * }
  * ```
  *
  * @example Create a signed URL for an asset with transformations
  * ```js
  * const { data } = await supabase
  *   .storage
  *   .from('avatars')
  *   .createSignedUrl('folder/avatar1.png', 60, {
  *     transform: {
  *       width: 100,
  *       height: 100,
  *     }
  *   })
  * ```
  *
  * @example Create a signed URL which triggers the download of the asset
  * ```js
  * const { data } = await supabase
  *   .storage
  *   .from('avatars')
  *   .createSignedUrl('folder/avatar1.png', 60, {
  *     download: true,
  *   })
  * ```
  */
  async createSignedUrl(r, e, t) {
    var i = this;
    return i.handleOperation(async () => {
      let n = i._getFinalPath(r), a = await he(i.fetch, `${i.url}/object/sign/${n}`, R({ expiresIn: e }, t != null && t.transform ? { transform: t.transform } : {}), { headers: i.headers });
      const s = t != null && t.download ? `&download=${t.download === !0 ? "" : t.download}` : "";
      return { signedUrl: encodeURI(`${i.url}${a.signedURL}${s}`) };
    });
  }
  /**
  * Creates multiple signed URLs. Use a signed URL to share a file for a fixed amount of time.
  *
  * @category File Buckets
  * @param paths The file paths to be downloaded, including the current file names. For example `['folder/image.png', 'folder2/image2.png']`.
  * @param expiresIn The number of seconds until the signed URLs expire. For example, `60` for URLs which are valid for one minute.
  * @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
  * @returns Promise with response containing array of objects with signedUrl, path, and error or error
  *
  * @example Create Signed URLs
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .createSignedUrls(['folder/avatar1.png', 'folder/avatar2.png'], 60)
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": [
  *     {
  *       "error": null,
  *       "path": "folder/avatar1.png",
  *       "signedURL": "/object/sign/avatars/folder/avatar1.png?token=<TOKEN>",
  *       "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar1.png?token=<TOKEN>"
  *     },
  *     {
  *       "error": null,
  *       "path": "folder/avatar2.png",
  *       "signedURL": "/object/sign/avatars/folder/avatar2.png?token=<TOKEN>",
  *       "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar2.png?token=<TOKEN>"
  *     }
  *   ],
  *   "error": null
  * }
  * ```
  */
  async createSignedUrls(r, e, t) {
    var i = this;
    return i.handleOperation(async () => {
      const n = await he(i.fetch, `${i.url}/object/sign/${i.bucketId}`, {
        expiresIn: e,
        paths: r
      }, { headers: i.headers }), a = t != null && t.download ? `&download=${t.download === !0 ? "" : t.download}` : "";
      return n.map((s) => R(R({}, s), {}, { signedUrl: s.signedURL ? encodeURI(`${i.url}${s.signedURL}${a}`) : null }));
    });
  }
  /**
  * Downloads a file from a private bucket. For public buckets, make a request to the URL returned from `getPublicUrl` instead.
  *
  * @category File Buckets
  * @param path The full path and file name of the file to be downloaded. For example `folder/image.png`.
  * @param options.transform Transform the asset before serving it to the client.
  * @param parameters Additional fetch parameters like signal for cancellation. Supports standard fetch options including cache control.
  * @returns BlobDownloadBuilder instance for downloading the file
  *
  * @example Download file
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .download('folder/avatar1.png')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": <BLOB>,
  *   "error": null
  * }
  * ```
  *
  * @example Download file with transformations
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .download('folder/avatar1.png', {
  *     transform: {
  *       width: 100,
  *       height: 100,
  *       quality: 80
  *     }
  *   })
  * ```
  *
  * @example Download with cache control (useful in Edge Functions)
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .download('folder/avatar1.png', {}, { cache: 'no-store' })
  * ```
  *
  * @example Download with abort signal
  * ```js
  * const controller = new AbortController()
  * setTimeout(() => controller.abort(), 5000)
  *
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .download('folder/avatar1.png', {}, { signal: controller.signal })
  * ```
  */
  download(r, e, t) {
    const i = typeof (e == null ? void 0 : e.transform) < "u" ? "render/image/authenticated" : "object", n = this.transformOptsToQueryString((e == null ? void 0 : e.transform) || {}), a = n ? `?${n}` : "", s = this._getFinalPath(r), o = () => Et(this.fetch, `${this.url}/${i}/${s}${a}`, {
      headers: this.headers,
      noResolveJson: !0
    }, t);
    return new Zc(o, this.shouldThrowOnError);
  }
  /**
  * Retrieves the details of an existing file.
  *
  * @category File Buckets
  * @param path The file path, including the file name. For example `folder/image.png`.
  * @returns Promise with response containing file metadata or error
  *
  * @example Get file info
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .info('folder/avatar1.png')
  * ```
  */
  async info(r) {
    var e = this;
    const t = e._getFinalPath(r);
    return e.handleOperation(async () => Wr(await Et(e.fetch, `${e.url}/object/info/${t}`, { headers: e.headers })));
  }
  /**
  * Checks the existence of a file.
  *
  * @category File Buckets
  * @param path The file path, including the file name. For example `folder/image.png`.
  * @returns Promise with response containing boolean indicating file existence or error
  *
  * @example Check file existence
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .exists('folder/avatar1.png')
  * ```
  */
  async exists(r) {
    var e = this;
    const t = e._getFinalPath(r);
    try {
      return await Jc(e.fetch, `${e.url}/object/${t}`, { headers: e.headers }), {
        data: !0,
        error: null
      };
    } catch (i) {
      if (e.shouldThrowOnError)
        throw i;
      if (pr(i) && i instanceof Bn) {
        const n = i.originalError;
        if ([400, 404].includes(n == null ? void 0 : n.status))
          return {
            data: !1,
            error: i
          };
      }
      throw i;
    }
  }
  /**
  * A simple convenience function to get the URL for an asset in a public bucket. If you do not want to use this function, you can construct the public URL by concatenating the bucket URL with the path to the asset.
  * This function does not verify if the bucket is public. If a public URL is created for a bucket which is not public, you will not be able to download the asset.
  *
  * @category File Buckets
  * @param path The path and name of the file to generate the public URL for. For example `folder/image.png`.
  * @param options.download Triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
  * @param options.transform Transform the asset before serving it to the client.
  * @returns Object with public URL
  *
  * @example Returns the URL for an asset in a public bucket
  * ```js
  * const { data } = supabase
  *   .storage
  *   .from('public-bucket')
  *   .getPublicUrl('folder/avatar1.png')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "publicUrl": "https://example.supabase.co/storage/v1/object/public/public-bucket/folder/avatar1.png"
  *   }
  * }
  * ```
  *
  * @example Returns the URL for an asset in a public bucket with transformations
  * ```js
  * const { data } = supabase
  *   .storage
  *   .from('public-bucket')
  *   .getPublicUrl('folder/avatar1.png', {
  *     transform: {
  *       width: 100,
  *       height: 100,
  *     }
  *   })
  * ```
  *
  * @example Returns the URL which triggers the download of an asset in a public bucket
  * ```js
  * const { data } = supabase
  *   .storage
  *   .from('public-bucket')
  *   .getPublicUrl('folder/avatar1.png', {
  *     download: true,
  *   })
  * ```
  */
  getPublicUrl(r, e) {
    const t = this._getFinalPath(r), i = [], n = e != null && e.download ? `download=${e.download === !0 ? "" : e.download}` : "";
    n !== "" && i.push(n);
    const a = typeof (e == null ? void 0 : e.transform) < "u" ? "render/image" : "object", s = this.transformOptsToQueryString((e == null ? void 0 : e.transform) || {});
    s !== "" && i.push(s);
    let o = i.join("&");
    return o !== "" && (o = `?${o}`), { data: { publicUrl: encodeURI(`${this.url}/${a}/public/${t}${o}`) } };
  }
  /**
  * Deletes files within the same bucket
  *
  * @category File Buckets
  * @param paths An array of files to delete, including the path and file name. For example [`'folder/image.png'`].
  * @returns Promise with response containing array of deleted file objects or error
  *
  * @example Delete file
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .remove(['folder/avatar1.png'])
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": [],
  *   "error": null
  * }
  * ```
  */
  async remove(r) {
    var e = this;
    return e.handleOperation(async () => await si(e.fetch, `${e.url}/object/${e.bucketId}`, { prefixes: r }, { headers: e.headers }));
  }
  /**
  * Get file metadata
  * @param id the file id to retrieve metadata
  */
  /**
  * Update file metadata
  * @param id the file id to update metadata
  * @param meta the new file metadata
  */
  /**
  * Lists all the files and folders within a path of the bucket.
  *
  * @category File Buckets
  * @param path The folder path.
  * @param options Search options including limit (defaults to 100), offset, sortBy, and search
  * @param parameters Optional fetch parameters including signal for cancellation
  * @returns Promise with response containing array of files or error
  *
  * @example List files in a bucket
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .list('folder', {
  *     limit: 100,
  *     offset: 0,
  *     sortBy: { column: 'name', order: 'asc' },
  *   })
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": [
  *     {
  *       "name": "avatar1.png",
  *       "id": "e668cf7f-821b-4a2f-9dce-7dfa5dd1cfd2",
  *       "updated_at": "2024-05-22T23:06:05.580Z",
  *       "created_at": "2024-05-22T23:04:34.443Z",
  *       "last_accessed_at": "2024-05-22T23:04:34.443Z",
  *       "metadata": {
  *         "eTag": "\"c5e8c553235d9af30ef4f6e280790b92\"",
  *         "size": 32175,
  *         "mimetype": "image/png",
  *         "cacheControl": "max-age=3600",
  *         "lastModified": "2024-05-22T23:06:05.574Z",
  *         "contentLength": 32175,
  *         "httpStatusCode": 200
  *       }
  *     }
  *   ],
  *   "error": null
  * }
  * ```
  *
  * @example Search files in a bucket
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .list('folder', {
  *     limit: 100,
  *     offset: 0,
  *     sortBy: { column: 'name', order: 'asc' },
  *     search: 'jon'
  *   })
  * ```
  */
  async list(r, e, t) {
    var i = this;
    return i.handleOperation(async () => {
      const n = R(R(R({}, Qc), e), {}, { prefix: r || "" });
      return await he(i.fetch, `${i.url}/object/list/${i.bucketId}`, n, { headers: i.headers }, t);
    });
  }
  /**
  * @experimental this method signature might change in the future
  *
  * @category File Buckets
  * @param options search options
  * @param parameters
  */
  async listV2(r, e) {
    var t = this;
    return t.handleOperation(async () => {
      const i = R({}, r);
      return await he(t.fetch, `${t.url}/object/list-v2/${t.bucketId}`, i, { headers: t.headers }, e);
    });
  }
  encodeMetadata(r) {
    return JSON.stringify(r);
  }
  toBase64(r) {
    return typeof Buffer < "u" ? Buffer.from(r).toString("base64") : btoa(r);
  }
  _getFinalPath(r) {
    return `${this.bucketId}/${r.replace(/^\/+/, "")}`;
  }
  _removeEmptyFolders(r) {
    return r.replace(/^\/|\/$/g, "").replace(/\/+/g, "/");
  }
  transformOptsToQueryString(r) {
    const e = [];
    return r.width && e.push(`width=${r.width}`), r.height && e.push(`height=${r.height}`), r.resize && e.push(`resize=${r.resize}`), r.format && e.push(`format=${r.format}`), r.quality && e.push(`quality=${r.quality}`), e.join("&");
  }
};
const tl = "2.95.3", Dt = { "X-Client-Info": `storage-js/${tl}` };
var rl = class extends ot {
  constructor(r, e = {}, t, i) {
    const n = new URL(r);
    i != null && i.useNewHostname && /supabase\.(co|in|red)$/.test(n.hostname) && !n.hostname.includes("storage.supabase.") && (n.hostname = n.hostname.replace("supabase.", "storage.supabase."));
    const a = n.href.replace(/\/$/, ""), s = R(R({}, Dt), e);
    super(a, s, t, "storage");
  }
  /**
  * Retrieves the details of all Storage buckets within an existing project.
  *
  * @category File Buckets
  * @param options Query parameters for listing buckets
  * @param options.limit Maximum number of buckets to return
  * @param options.offset Number of buckets to skip
  * @param options.sortColumn Column to sort by ('id', 'name', 'created_at', 'updated_at')
  * @param options.sortOrder Sort order ('asc' or 'desc')
  * @param options.search Search term to filter bucket names
  * @returns Promise with response containing array of buckets or error
  *
  * @example List buckets
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .listBuckets()
  * ```
  *
  * @example List buckets with options
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .listBuckets({
  *     limit: 10,
  *     offset: 0,
  *     sortColumn: 'created_at',
  *     sortOrder: 'desc',
  *     search: 'prod'
  *   })
  * ```
  */
  async listBuckets(r) {
    var e = this;
    return e.handleOperation(async () => {
      const t = e.listBucketOptionsToQueryString(r);
      return await Et(e.fetch, `${e.url}/bucket${t}`, { headers: e.headers });
    });
  }
  /**
  * Retrieves the details of an existing Storage bucket.
  *
  * @category File Buckets
  * @param id The unique identifier of the bucket you would like to retrieve.
  * @returns Promise with response containing bucket details or error
  *
  * @example Get bucket
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .getBucket('avatars')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "id": "avatars",
  *     "name": "avatars",
  *     "owner": "",
  *     "public": false,
  *     "file_size_limit": 1024,
  *     "allowed_mime_types": [
  *       "image/png"
  *     ],
  *     "created_at": "2024-05-22T22:26:05.100Z",
  *     "updated_at": "2024-05-22T22:26:05.100Z"
  *   },
  *   "error": null
  * }
  * ```
  */
  async getBucket(r) {
    var e = this;
    return e.handleOperation(async () => await Et(e.fetch, `${e.url}/bucket/${r}`, { headers: e.headers }));
  }
  /**
  * Creates a new Storage bucket
  *
  * @category File Buckets
  * @param id A unique identifier for the bucket you are creating.
  * @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations. By default, buckets are private.
  * @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
  * The global file size limit takes precedence over this value.
  * The default value is null, which doesn't set a per bucket file size limit.
  * @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
  * The default value is null, which allows files with all mime types to be uploaded.
  * Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
  * @param options.type (private-beta) specifies the bucket type. see `BucketType` for more details.
  *   - default bucket type is `STANDARD`
  * @returns Promise with response containing newly created bucket name or error
  *
  * @example Create bucket
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .createBucket('avatars', {
  *     public: false,
  *     allowedMimeTypes: ['image/png'],
  *     fileSizeLimit: 1024
  *   })
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "name": "avatars"
  *   },
  *   "error": null
  * }
  * ```
  */
  async createBucket(r, e = { public: !1 }) {
    var t = this;
    return t.handleOperation(async () => await he(t.fetch, `${t.url}/bucket`, {
      id: r,
      name: r,
      type: e.type,
      public: e.public,
      file_size_limit: e.fileSizeLimit,
      allowed_mime_types: e.allowedMimeTypes
    }, { headers: t.headers }));
  }
  /**
  * Updates a Storage bucket
  *
  * @category File Buckets
  * @param id A unique identifier for the bucket you are updating.
  * @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations.
  * @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
  * The global file size limit takes precedence over this value.
  * The default value is null, which doesn't set a per bucket file size limit.
  * @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
  * The default value is null, which allows files with all mime types to be uploaded.
  * Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
  * @returns Promise with response containing success message or error
  *
  * @example Update bucket
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .updateBucket('avatars', {
  *     public: false,
  *     allowedMimeTypes: ['image/png'],
  *     fileSizeLimit: 1024
  *   })
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "message": "Successfully updated"
  *   },
  *   "error": null
  * }
  * ```
  */
  async updateBucket(r, e) {
    var t = this;
    return t.handleOperation(async () => await Kr(t.fetch, `${t.url}/bucket/${r}`, {
      id: r,
      name: r,
      public: e.public,
      file_size_limit: e.fileSizeLimit,
      allowed_mime_types: e.allowedMimeTypes
    }, { headers: t.headers }));
  }
  /**
  * Removes all objects inside a single bucket.
  *
  * @category File Buckets
  * @param id The unique identifier of the bucket you would like to empty.
  * @returns Promise with success message or error
  *
  * @example Empty bucket
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .emptyBucket('avatars')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "message": "Successfully emptied"
  *   },
  *   "error": null
  * }
  * ```
  */
  async emptyBucket(r) {
    var e = this;
    return e.handleOperation(async () => await he(e.fetch, `${e.url}/bucket/${r}/empty`, {}, { headers: e.headers }));
  }
  /**
  * Deletes an existing bucket. A bucket can't be deleted with existing objects inside it.
  * You must first `empty()` the bucket.
  *
  * @category File Buckets
  * @param id The unique identifier of the bucket you would like to delete.
  * @returns Promise with success message or error
  *
  * @example Delete bucket
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .deleteBucket('avatars')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "message": "Successfully deleted"
  *   },
  *   "error": null
  * }
  * ```
  */
  async deleteBucket(r) {
    var e = this;
    return e.handleOperation(async () => await si(e.fetch, `${e.url}/bucket/${r}`, {}, { headers: e.headers }));
  }
  listBucketOptionsToQueryString(r) {
    const e = {};
    return r && ("limit" in r && (e.limit = String(r.limit)), "offset" in r && (e.offset = String(r.offset)), r.search && (e.search = r.search), r.sortColumn && (e.sortColumn = r.sortColumn), r.sortOrder && (e.sortOrder = r.sortOrder)), Object.keys(e).length > 0 ? "?" + new URLSearchParams(e).toString() : "";
  }
}, il = class extends ot {
  /**
  * @alpha
  *
  * Creates a new StorageAnalyticsClient instance
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Analytics Buckets
  * @param url - The base URL for the storage API
  * @param headers - HTTP headers to include in requests
  * @param fetch - Optional custom fetch implementation
  *
  * @example
  * ```typescript
  * const client = new StorageAnalyticsClient(url, headers)
  * ```
  */
  constructor(r, e = {}, t) {
    const i = r.replace(/\/$/, ""), n = R(R({}, Dt), e);
    super(i, n, t, "storage");
  }
  /**
  * @alpha
  *
  * Creates a new analytics bucket using Iceberg tables
  * Analytics buckets are optimized for analytical queries and data processing
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Analytics Buckets
  * @param name A unique name for the bucket you are creating
  * @returns Promise with response containing newly created analytics bucket or error
  *
  * @example Create analytics bucket
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .analytics
  *   .createBucket('analytics-data')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "name": "analytics-data",
  *     "type": "ANALYTICS",
  *     "format": "iceberg",
  *     "created_at": "2024-05-22T22:26:05.100Z",
  *     "updated_at": "2024-05-22T22:26:05.100Z"
  *   },
  *   "error": null
  * }
  * ```
  */
  async createBucket(r) {
    var e = this;
    return e.handleOperation(async () => await he(e.fetch, `${e.url}/bucket`, { name: r }, { headers: e.headers }));
  }
  /**
  * @alpha
  *
  * Retrieves the details of all Analytics Storage buckets within an existing project
  * Only returns buckets of type 'ANALYTICS'
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Analytics Buckets
  * @param options Query parameters for listing buckets
  * @param options.limit Maximum number of buckets to return
  * @param options.offset Number of buckets to skip
  * @param options.sortColumn Column to sort by ('name', 'created_at', 'updated_at')
  * @param options.sortOrder Sort order ('asc' or 'desc')
  * @param options.search Search term to filter bucket names
  * @returns Promise with response containing array of analytics buckets or error
  *
  * @example List analytics buckets
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .analytics
  *   .listBuckets({
  *     limit: 10,
  *     offset: 0,
  *     sortColumn: 'created_at',
  *     sortOrder: 'desc'
  *   })
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": [
  *     {
  *       "name": "analytics-data",
  *       "type": "ANALYTICS",
  *       "format": "iceberg",
  *       "created_at": "2024-05-22T22:26:05.100Z",
  *       "updated_at": "2024-05-22T22:26:05.100Z"
  *     }
  *   ],
  *   "error": null
  * }
  * ```
  */
  async listBuckets(r) {
    var e = this;
    return e.handleOperation(async () => {
      const t = new URLSearchParams();
      (r == null ? void 0 : r.limit) !== void 0 && t.set("limit", r.limit.toString()), (r == null ? void 0 : r.offset) !== void 0 && t.set("offset", r.offset.toString()), r != null && r.sortColumn && t.set("sortColumn", r.sortColumn), r != null && r.sortOrder && t.set("sortOrder", r.sortOrder), r != null && r.search && t.set("search", r.search);
      const i = t.toString(), n = i ? `${e.url}/bucket?${i}` : `${e.url}/bucket`;
      return await Et(e.fetch, n, { headers: e.headers });
    });
  }
  /**
  * @alpha
  *
  * Deletes an existing analytics bucket
  * A bucket can't be deleted with existing objects inside it
  * You must first empty the bucket before deletion
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Analytics Buckets
  * @param bucketName The unique identifier of the bucket you would like to delete
  * @returns Promise with response containing success message or error
  *
  * @example Delete analytics bucket
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .analytics
  *   .deleteBucket('analytics-data')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "message": "Successfully deleted"
  *   },
  *   "error": null
  * }
  * ```
  */
  async deleteBucket(r) {
    var e = this;
    return e.handleOperation(async () => await si(e.fetch, `${e.url}/bucket/${r}`, {}, { headers: e.headers }));
  }
  /**
  * @alpha
  *
  * Get an Iceberg REST Catalog client configured for a specific analytics bucket
  * Use this to perform advanced table and namespace operations within the bucket
  * The returned client provides full access to the Apache Iceberg REST Catalog API
  * with the Supabase `{ data, error }` pattern for consistent error handling on all operations.
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Analytics Buckets
  * @param bucketName - The name of the analytics bucket (warehouse) to connect to
  * @returns The wrapped Iceberg catalog client
  * @throws {StorageError} If the bucket name is invalid
  *
  * @example Get catalog and create table
  * ```js
  * // First, create an analytics bucket
  * const { data: bucket, error: bucketError } = await supabase
  *   .storage
  *   .analytics
  *   .createBucket('analytics-data')
  *
  * // Get the Iceberg catalog for that bucket
  * const catalog = supabase.storage.analytics.from('analytics-data')
  *
  * // Create a namespace
  * const { error: nsError } = await catalog.createNamespace({ namespace: ['default'] })
  *
  * // Create a table with schema
  * const { data: tableMetadata, error: tableError } = await catalog.createTable(
  *   { namespace: ['default'] },
  *   {
  *     name: 'events',
  *     schema: {
  *       type: 'struct',
  *       fields: [
  *         { id: 1, name: 'id', type: 'long', required: true },
  *         { id: 2, name: 'timestamp', type: 'timestamp', required: true },
  *         { id: 3, name: 'user_id', type: 'string', required: false }
  *       ],
  *       'schema-id': 0,
  *       'identifier-field-ids': [1]
  *     },
  *     'partition-spec': {
  *       'spec-id': 0,
  *       fields: []
  *     },
  *     'write-order': {
  *       'order-id': 0,
  *       fields: []
  *     },
  *     properties: {
  *       'write.format.default': 'parquet'
  *     }
  *   }
  * )
  * ```
  *
  * @example List tables in namespace
  * ```js
  * const catalog = supabase.storage.analytics.from('analytics-data')
  *
  * // List all tables in the default namespace
  * const { data: tables, error: listError } = await catalog.listTables({ namespace: ['default'] })
  * if (listError) {
  *   if (listError.isNotFound()) {
  *     console.log('Namespace not found')
  *   }
  *   return
  * }
  * console.log(tables) // [{ namespace: ['default'], name: 'events' }]
  * ```
  *
  * @example Working with namespaces
  * ```js
  * const catalog = supabase.storage.analytics.from('analytics-data')
  *
  * // List all namespaces
  * const { data: namespaces } = await catalog.listNamespaces()
  *
  * // Create namespace with properties
  * await catalog.createNamespace(
  *   { namespace: ['production'] },
  *   { properties: { owner: 'data-team', env: 'prod' } }
  * )
  * ```
  *
  * @example Cleanup operations
  * ```js
  * const catalog = supabase.storage.analytics.from('analytics-data')
  *
  * // Drop table with purge option (removes all data)
  * const { error: dropError } = await catalog.dropTable(
  *   { namespace: ['default'], name: 'events' },
  *   { purge: true }
  * )
  *
  * if (dropError?.isNotFound()) {
  *   console.log('Table does not exist')
  * }
  *
  * // Drop namespace (must be empty)
  * await catalog.dropNamespace({ namespace: ['default'] })
  * ```
  *
  * @remarks
  * This method provides a bridge between Supabase's bucket management and the standard
  * Apache Iceberg REST Catalog API. The bucket name maps to the Iceberg warehouse parameter.
  * All authentication and configuration is handled automatically using your Supabase credentials.
  *
  * **Error Handling**: Invalid bucket names throw immediately. All catalog
  * operations return `{ data, error }` where errors are `IcebergError` instances from iceberg-js.
  * Use helper methods like `error.isNotFound()` or check `error.status` for specific error handling.
  * Use `.throwOnError()` on the analytics client if you prefer exceptions for catalog operations.
  *
  * **Cleanup Operations**: When using `dropTable`, the `purge: true` option permanently
  * deletes all table data. Without it, the table is marked as deleted but data remains.
  *
  * **Library Dependency**: The returned catalog wraps `IcebergRestCatalog` from iceberg-js.
  * For complete API documentation and advanced usage, refer to the
  * [iceberg-js documentation](https://supabase.github.io/iceberg-js/).
  */
  from(r) {
    var e = this;
    if (!qc(r))
      throw new fr("Invalid bucket name: File, folder, and bucket names must follow AWS object key naming guidelines and should avoid the use of any other characters.");
    const t = new Mc({
      baseUrl: this.url,
      catalogName: r,
      auth: {
        type: "custom",
        getHeaders: async () => e.headers
      },
      fetch: this.fetch
    }), i = this.shouldThrowOnError;
    return new Proxy(t, { get(n, a) {
      const s = n[a];
      return typeof s != "function" ? s : async (...o) => {
        try {
          return {
            data: await s.apply(n, o),
            error: null
          };
        } catch (c) {
          if (i)
            throw c;
          return {
            data: null,
            error: c
          };
        }
      };
    } });
  }
}, nl = class extends ot {
  /** Creates a new VectorIndexApi instance */
  constructor(r, e = {}, t) {
    const i = r.replace(/\/$/, ""), n = R(R({}, Dt), {}, { "Content-Type": "application/json" }, e);
    super(i, n, t, "vectors");
  }
  /** Creates a new vector index within a bucket */
  async createIndex(r) {
    var e = this;
    return e.handleOperation(async () => await ae.post(e.fetch, `${e.url}/CreateIndex`, r, { headers: e.headers }) || {});
  }
  /** Retrieves metadata for a specific vector index */
  async getIndex(r, e) {
    var t = this;
    return t.handleOperation(async () => await ae.post(t.fetch, `${t.url}/GetIndex`, {
      vectorBucketName: r,
      indexName: e
    }, { headers: t.headers }));
  }
  /** Lists vector indexes within a bucket with optional filtering and pagination */
  async listIndexes(r) {
    var e = this;
    return e.handleOperation(async () => await ae.post(e.fetch, `${e.url}/ListIndexes`, r, { headers: e.headers }));
  }
  /** Deletes a vector index and all its data */
  async deleteIndex(r, e) {
    var t = this;
    return t.handleOperation(async () => await ae.post(t.fetch, `${t.url}/DeleteIndex`, {
      vectorBucketName: r,
      indexName: e
    }, { headers: t.headers }) || {});
  }
}, sl = class extends ot {
  /** Creates a new VectorDataApi instance */
  constructor(r, e = {}, t) {
    const i = r.replace(/\/$/, ""), n = R(R({}, Dt), {}, { "Content-Type": "application/json" }, e);
    super(i, n, t, "vectors");
  }
  /** Inserts or updates vectors in batch (1-500 per request) */
  async putVectors(r) {
    var e = this;
    if (r.vectors.length < 1 || r.vectors.length > 500)
      throw new Error("Vector batch size must be between 1 and 500 items");
    return e.handleOperation(async () => await ae.post(e.fetch, `${e.url}/PutVectors`, r, { headers: e.headers }) || {});
  }
  /** Retrieves vectors by their keys in batch */
  async getVectors(r) {
    var e = this;
    return e.handleOperation(async () => await ae.post(e.fetch, `${e.url}/GetVectors`, r, { headers: e.headers }));
  }
  /** Lists vectors in an index with pagination */
  async listVectors(r) {
    var e = this;
    if (r.segmentCount !== void 0) {
      if (r.segmentCount < 1 || r.segmentCount > 16)
        throw new Error("segmentCount must be between 1 and 16");
      if (r.segmentIndex !== void 0 && (r.segmentIndex < 0 || r.segmentIndex >= r.segmentCount))
        throw new Error(`segmentIndex must be between 0 and ${r.segmentCount - 1}`);
    }
    return e.handleOperation(async () => await ae.post(e.fetch, `${e.url}/ListVectors`, r, { headers: e.headers }));
  }
  /** Queries for similar vectors using approximate nearest neighbor search */
  async queryVectors(r) {
    var e = this;
    return e.handleOperation(async () => await ae.post(e.fetch, `${e.url}/QueryVectors`, r, { headers: e.headers }));
  }
  /** Deletes vectors by their keys in batch (1-500 per request) */
  async deleteVectors(r) {
    var e = this;
    if (r.keys.length < 1 || r.keys.length > 500)
      throw new Error("Keys batch size must be between 1 and 500 items");
    return e.handleOperation(async () => await ae.post(e.fetch, `${e.url}/DeleteVectors`, r, { headers: e.headers }) || {});
  }
}, al = class extends ot {
  /** Creates a new VectorBucketApi instance */
  constructor(r, e = {}, t) {
    const i = r.replace(/\/$/, ""), n = R(R({}, Dt), {}, { "Content-Type": "application/json" }, e);
    super(i, n, t, "vectors");
  }
  /** Creates a new vector bucket */
  async createBucket(r) {
    var e = this;
    return e.handleOperation(async () => await ae.post(e.fetch, `${e.url}/CreateVectorBucket`, { vectorBucketName: r }, { headers: e.headers }) || {});
  }
  /** Retrieves metadata for a specific vector bucket */
  async getBucket(r) {
    var e = this;
    return e.handleOperation(async () => await ae.post(e.fetch, `${e.url}/GetVectorBucket`, { vectorBucketName: r }, { headers: e.headers }));
  }
  /** Lists vector buckets with optional filtering and pagination */
  async listBuckets(r = {}) {
    var e = this;
    return e.handleOperation(async () => await ae.post(e.fetch, `${e.url}/ListVectorBuckets`, r, { headers: e.headers }));
  }
  /** Deletes a vector bucket (must be empty first) */
  async deleteBucket(r) {
    var e = this;
    return e.handleOperation(async () => await ae.post(e.fetch, `${e.url}/DeleteVectorBucket`, { vectorBucketName: r }, { headers: e.headers }) || {});
  }
}, ol = class extends al {
  /**
  * @alpha
  *
  * Creates a StorageVectorsClient that can manage buckets, indexes, and vectors.
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Vector Buckets
  * @param url - Base URL of the Storage Vectors REST API.
  * @param options.headers - Optional headers (for example `Authorization`) applied to every request.
  * @param options.fetch - Optional custom `fetch` implementation for non-browser runtimes.
  *
  * @example
  * ```typescript
  * const client = new StorageVectorsClient(url, options)
  * ```
  */
  constructor(r, e = {}) {
    super(r, e.headers || {}, e.fetch);
  }
  /**
  *
  * @alpha
  *
  * Access operations for a specific vector bucket
  * Returns a scoped client for index and vector operations within the bucket
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Vector Buckets
  * @param vectorBucketName - Name of the vector bucket
  * @returns Bucket-scoped client with index and vector operations
  *
  * @example
  * ```typescript
  * const bucket = supabase.storage.vectors.from('embeddings-prod')
  * ```
  */
  from(r) {
    return new cl(this.url, this.headers, r, this.fetch);
  }
  /**
  *
  * @alpha
  *
  * Creates a new vector bucket
  * Vector buckets are containers for vector indexes and their data
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Vector Buckets
  * @param vectorBucketName - Unique name for the vector bucket
  * @returns Promise with empty response on success or error
  *
  * @example
  * ```typescript
  * const { data, error } = await supabase
  *   .storage
  *   .vectors
  *   .createBucket('embeddings-prod')
  * ```
  */
  async createBucket(r) {
    var e = () => super.createBucket, t = this;
    return e().call(t, r);
  }
  /**
  *
  * @alpha
  *
  * Retrieves metadata for a specific vector bucket
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Vector Buckets
  * @param vectorBucketName - Name of the vector bucket
  * @returns Promise with bucket metadata or error
  *
  * @example
  * ```typescript
  * const { data, error } = await supabase
  *   .storage
  *   .vectors
  *   .getBucket('embeddings-prod')
  *
  * console.log('Bucket created:', data?.vectorBucket.creationTime)
  * ```
  */
  async getBucket(r) {
    var e = () => super.getBucket, t = this;
    return e().call(t, r);
  }
  /**
  *
  * @alpha
  *
  * Lists all vector buckets with optional filtering and pagination
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Vector Buckets
  * @param options - Optional filters (prefix, maxResults, nextToken)
  * @returns Promise with list of buckets or error
  *
  * @example
  * ```typescript
  * const { data, error } = await supabase
  *   .storage
  *   .vectors
  *   .listBuckets({ prefix: 'embeddings-' })
  *
  * data?.vectorBuckets.forEach(bucket => {
  *   console.log(bucket.vectorBucketName)
  * })
  * ```
  */
  async listBuckets(r = {}) {
    var e = () => super.listBuckets, t = this;
    return e().call(t, r);
  }
  /**
  *
  * @alpha
  *
  * Deletes a vector bucket (bucket must be empty)
  * All indexes must be deleted before deleting the bucket
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Vector Buckets
  * @param vectorBucketName - Name of the vector bucket to delete
  * @returns Promise with empty response on success or error
  *
  * @example
  * ```typescript
  * const { data, error } = await supabase
  *   .storage
  *   .vectors
  *   .deleteBucket('embeddings-old')
  * ```
  */
  async deleteBucket(r) {
    var e = () => super.deleteBucket, t = this;
    return e().call(t, r);
  }
}, cl = class extends nl {
  /**
  * @alpha
  *
  * Creates a helper that automatically scopes all index operations to the provided bucket.
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Vector Buckets
  * @example
  * ```typescript
  * const bucket = supabase.storage.vectors.from('embeddings-prod')
  * ```
  */
  constructor(r, e, t, i) {
    super(r, e, i), this.vectorBucketName = t;
  }
  /**
  *
  * @alpha
  *
  * Creates a new vector index in this bucket
  * Convenience method that automatically includes the bucket name
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Vector Buckets
  * @param options - Index configuration (vectorBucketName is automatically set)
  * @returns Promise with empty response on success or error
  *
  * @example
  * ```typescript
  * const bucket = supabase.storage.vectors.from('embeddings-prod')
  * await bucket.createIndex({
  *   indexName: 'documents-openai',
  *   dataType: 'float32',
  *   dimension: 1536,
  *   distanceMetric: 'cosine',
  *   metadataConfiguration: {
  *     nonFilterableMetadataKeys: ['raw_text']
  *   }
  * })
  * ```
  */
  async createIndex(r) {
    var e = () => super.createIndex, t = this;
    return e().call(t, R(R({}, r), {}, { vectorBucketName: t.vectorBucketName }));
  }
  /**
  *
  * @alpha
  *
  * Lists indexes in this bucket
  * Convenience method that automatically includes the bucket name
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Vector Buckets
  * @param options - Listing options (vectorBucketName is automatically set)
  * @returns Promise with response containing indexes array and pagination token or error
  *
  * @example
  * ```typescript
  * const bucket = supabase.storage.vectors.from('embeddings-prod')
  * const { data } = await bucket.listIndexes({ prefix: 'documents-' })
  * ```
  */
  async listIndexes(r = {}) {
    var e = () => super.listIndexes, t = this;
    return e().call(t, R(R({}, r), {}, { vectorBucketName: t.vectorBucketName }));
  }
  /**
  *
  * @alpha
  *
  * Retrieves metadata for a specific index in this bucket
  * Convenience method that automatically includes the bucket name
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Vector Buckets
  * @param indexName - Name of the index to retrieve
  * @returns Promise with index metadata or error
  *
  * @example
  * ```typescript
  * const bucket = supabase.storage.vectors.from('embeddings-prod')
  * const { data } = await bucket.getIndex('documents-openai')
  * console.log('Dimension:', data?.index.dimension)
  * ```
  */
  async getIndex(r) {
    var e = () => super.getIndex, t = this;
    return e().call(t, t.vectorBucketName, r);
  }
  /**
  *
  * @alpha
  *
  * Deletes an index from this bucket
  * Convenience method that automatically includes the bucket name
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Vector Buckets
  * @param indexName - Name of the index to delete
  * @returns Promise with empty response on success or error
  *
  * @example
  * ```typescript
  * const bucket = supabase.storage.vectors.from('embeddings-prod')
  * await bucket.deleteIndex('old-index')
  * ```
  */
  async deleteIndex(r) {
    var e = () => super.deleteIndex, t = this;
    return e().call(t, t.vectorBucketName, r);
  }
  /**
  *
  * @alpha
  *
  * Access operations for a specific index within this bucket
  * Returns a scoped client for vector data operations
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Vector Buckets
  * @param indexName - Name of the index
  * @returns Index-scoped client with vector data operations
  *
  * @example
  * ```typescript
  * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
  *
  * // Insert vectors
  * await index.putVectors({
  *   vectors: [
  *     { key: 'doc-1', data: { float32: [...] }, metadata: { title: 'Intro' } }
  *   ]
  * })
  *
  * // Query similar vectors
  * const { data } = await index.queryVectors({
  *   queryVector: { float32: [...] },
  *   topK: 5
  * })
  * ```
  */
  index(r) {
    return new ll(this.url, this.headers, this.vectorBucketName, r, this.fetch);
  }
}, ll = class extends sl {
  /**
  *
  * @alpha
  *
  * Creates a helper that automatically scopes all vector operations to the provided bucket/index names.
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Vector Buckets
  * @example
  * ```typescript
  * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
  * ```
  */
  constructor(r, e, t, i, n) {
    super(r, e, n), this.vectorBucketName = t, this.indexName = i;
  }
  /**
  *
  * @alpha
  *
  * Inserts or updates vectors in this index
  * Convenience method that automatically includes bucket and index names
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Vector Buckets
  * @param options - Vector insertion options (bucket and index names automatically set)
  * @returns Promise with empty response on success or error
  *
  * @example
  * ```typescript
  * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
  * await index.putVectors({
  *   vectors: [
  *     {
  *       key: 'doc-1',
  *       data: { float32: [0.1, 0.2, ...] },
  *       metadata: { title: 'Introduction', page: 1 }
  *     }
  *   ]
  * })
  * ```
  */
  async putVectors(r) {
    var e = () => super.putVectors, t = this;
    return e().call(t, R(R({}, r), {}, {
      vectorBucketName: t.vectorBucketName,
      indexName: t.indexName
    }));
  }
  /**
  *
  * @alpha
  *
  * Retrieves vectors by keys from this index
  * Convenience method that automatically includes bucket and index names
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Vector Buckets
  * @param options - Vector retrieval options (bucket and index names automatically set)
  * @returns Promise with response containing vectors array or error
  *
  * @example
  * ```typescript
  * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
  * const { data } = await index.getVectors({
  *   keys: ['doc-1', 'doc-2'],
  *   returnMetadata: true
  * })
  * ```
  */
  async getVectors(r) {
    var e = () => super.getVectors, t = this;
    return e().call(t, R(R({}, r), {}, {
      vectorBucketName: t.vectorBucketName,
      indexName: t.indexName
    }));
  }
  /**
  *
  * @alpha
  *
  * Lists vectors in this index with pagination
  * Convenience method that automatically includes bucket and index names
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Vector Buckets
  * @param options - Listing options (bucket and index names automatically set)
  * @returns Promise with response containing vectors array and pagination token or error
  *
  * @example
  * ```typescript
  * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
  * const { data } = await index.listVectors({
  *   maxResults: 500,
  *   returnMetadata: true
  * })
  * ```
  */
  async listVectors(r = {}) {
    var e = () => super.listVectors, t = this;
    return e().call(t, R(R({}, r), {}, {
      vectorBucketName: t.vectorBucketName,
      indexName: t.indexName
    }));
  }
  /**
  *
  * @alpha
  *
  * Queries for similar vectors in this index
  * Convenience method that automatically includes bucket and index names
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Vector Buckets
  * @param options - Query options (bucket and index names automatically set)
  * @returns Promise with response containing matches array of similar vectors ordered by distance or error
  *
  * @example
  * ```typescript
  * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
  * const { data } = await index.queryVectors({
  *   queryVector: { float32: [0.1, 0.2, ...] },
  *   topK: 5,
  *   filter: { category: 'technical' },
  *   returnDistance: true,
  *   returnMetadata: true
  * })
  * ```
  */
  async queryVectors(r) {
    var e = () => super.queryVectors, t = this;
    return e().call(t, R(R({}, r), {}, {
      vectorBucketName: t.vectorBucketName,
      indexName: t.indexName
    }));
  }
  /**
  *
  * @alpha
  *
  * Deletes vectors by keys from this index
  * Convenience method that automatically includes bucket and index names
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Vector Buckets
  * @param options - Deletion options (bucket and index names automatically set)
  * @returns Promise with empty response on success or error
  *
  * @example
  * ```typescript
  * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
  * await index.deleteVectors({
  *   keys: ['doc-1', 'doc-2', 'doc-3']
  * })
  * ```
  */
  async deleteVectors(r) {
    var e = () => super.deleteVectors, t = this;
    return e().call(t, R(R({}, r), {}, {
      vectorBucketName: t.vectorBucketName,
      indexName: t.indexName
    }));
  }
}, ul = class extends rl {
  /**
  * Creates a client for Storage buckets, files, analytics, and vectors.
  *
  * @category File Buckets
  * @example
  * ```ts
  * import { StorageClient } from '@supabase/storage-js'
  *
  * const storage = new StorageClient('https://xyzcompany.supabase.co/storage/v1', {
  *   apikey: 'public-anon-key',
  * })
  * const avatars = storage.from('avatars')
  * ```
  */
  constructor(r, e = {}, t, i) {
    super(r, e, t, i);
  }
  /**
  * Perform file operation in a bucket.
  *
  * @category File Buckets
  * @param id The bucket id to operate on.
  *
  * @example
  * ```typescript
  * const avatars = supabase.storage.from('avatars')
  * ```
  */
  from(r) {
    return new el(this.url, this.headers, r, this.fetch);
  }
  /**
  *
  * @alpha
  *
  * Access vector storage operations.
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Vector Buckets
  * @returns A StorageVectorsClient instance configured with the current storage settings.
  */
  get vectors() {
    return new ol(this.url + "/vector", {
      headers: this.headers,
      fetch: this.fetch
    });
  }
  /**
  *
  * @alpha
  *
  * Access analytics storage operations using Iceberg tables.
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Analytics Buckets
  * @returns A StorageAnalyticsClient instance configured with the current storage settings.
  */
  get analytics() {
    return new il(this.url + "/iceberg", this.headers, this.fetch);
  }
};
const Fn = "2.95.3", et = 30 * 1e3, Vr = 3, Ar = Vr * et, hl = "http://localhost:9999", dl = "supabase.auth.token", fl = { "X-Client-Info": `gotrue-js/${Fn}` }, Hr = "X-Supabase-Api-Version", zn = {
  "2024-01-01": {
    timestamp: Date.parse("2024-01-01T00:00:00.0Z"),
    name: "2024-01-01"
  }
}, pl = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i, ml = 10 * 60 * 1e3;
class At extends Error {
  constructor(e, t, i) {
    super(e), this.__isAuthError = !0, this.name = "AuthError", this.status = t, this.code = i;
  }
}
function A(r) {
  return typeof r == "object" && r !== null && "__isAuthError" in r;
}
class gl extends At {
  constructor(e, t, i) {
    super(e, t, i), this.name = "AuthApiError", this.status = t, this.code = i;
  }
}
function yl(r) {
  return A(r) && r.name === "AuthApiError";
}
class $e extends At {
  constructor(e, t) {
    super(e), this.name = "AuthUnknownError", this.originalError = t;
  }
}
class xe extends At {
  constructor(e, t, i, n) {
    super(e, i, n), this.name = t, this.status = i;
  }
}
class se extends xe {
  constructor() {
    super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
  }
}
function Ir(r) {
  return A(r) && r.name === "AuthSessionMissingError";
}
class He extends xe {
  constructor() {
    super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
  }
}
class Jt extends xe {
  constructor(e) {
    super(e, "AuthInvalidCredentialsError", 400, void 0);
  }
}
class Yt extends xe {
  constructor(e, t = null) {
    super(e, "AuthImplicitGrantRedirectError", 500, void 0), this.details = null, this.details = t;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      details: this.details
    };
  }
}
function wl(r) {
  return A(r) && r.name === "AuthImplicitGrantRedirectError";
}
class ji extends xe {
  constructor(e, t = null) {
    super(e, "AuthPKCEGrantCodeExchangeError", 500, void 0), this.details = null, this.details = t;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      details: this.details
    };
  }
}
class vl extends xe {
  constructor() {
    super("PKCE code verifier not found in storage. This can happen if the auth flow was initiated in a different browser or device, or if the storage was cleared. For SSR frameworks (Next.js, SvelteKit, etc.), use @supabase/ssr on both the server and client to store the code verifier in cookies.", "AuthPKCECodeVerifierMissingError", 400, "pkce_code_verifier_not_found");
  }
}
class Xr extends xe {
  constructor(e, t) {
    super(e, "AuthRetryableFetchError", t, void 0);
  }
}
function Rr(r) {
  return A(r) && r.name === "AuthRetryableFetchError";
}
class Ni extends xe {
  constructor(e, t, i) {
    super(e, "AuthWeakPasswordError", t, "weak_password"), this.reasons = i;
  }
}
class Jr extends xe {
  constructor(e) {
    super(e, "AuthInvalidJwtError", 400, "invalid_jwt");
  }
}
const sr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""), Bi = ` 	
\r=`.split(""), bl = (() => {
  const r = new Array(128);
  for (let e = 0; e < r.length; e += 1)
    r[e] = -1;
  for (let e = 0; e < Bi.length; e += 1)
    r[Bi[e].charCodeAt(0)] = -2;
  for (let e = 0; e < sr.length; e += 1)
    r[sr[e].charCodeAt(0)] = e;
  return r;
})();
function $i(r, e, t) {
  if (r !== null)
    for (e.queue = e.queue << 8 | r, e.queuedBits += 8; e.queuedBits >= 6; ) {
      const i = e.queue >> e.queuedBits - 6 & 63;
      t(sr[i]), e.queuedBits -= 6;
    }
  else if (e.queuedBits > 0)
    for (e.queue = e.queue << 6 - e.queuedBits, e.queuedBits = 6; e.queuedBits >= 6; ) {
      const i = e.queue >> e.queuedBits - 6 & 63;
      t(sr[i]), e.queuedBits -= 6;
    }
}
function qn(r, e, t) {
  const i = bl[r];
  if (i > -1)
    for (e.queue = e.queue << 6 | i, e.queuedBits += 6; e.queuedBits >= 8; )
      t(e.queue >> e.queuedBits - 8 & 255), e.queuedBits -= 8;
  else {
    if (i === -2)
      return;
    throw new Error(`Invalid Base64-URL character "${String.fromCharCode(r)}"`);
  }
}
function Mi(r) {
  const e = [], t = (s) => {
    e.push(String.fromCodePoint(s));
  }, i = {
    utf8seq: 0,
    codepoint: 0
  }, n = { queue: 0, queuedBits: 0 }, a = (s) => {
    Tl(s, i, t);
  };
  for (let s = 0; s < r.length; s += 1)
    qn(r.charCodeAt(s), n, a);
  return e.join("");
}
function _l(r, e) {
  if (r <= 127) {
    e(r);
    return;
  } else if (r <= 2047) {
    e(192 | r >> 6), e(128 | r & 63);
    return;
  } else if (r <= 65535) {
    e(224 | r >> 12), e(128 | r >> 6 & 63), e(128 | r & 63);
    return;
  } else if (r <= 1114111) {
    e(240 | r >> 18), e(128 | r >> 12 & 63), e(128 | r >> 6 & 63), e(128 | r & 63);
    return;
  }
  throw new Error(`Unrecognized Unicode codepoint: ${r.toString(16)}`);
}
function xl(r, e) {
  for (let t = 0; t < r.length; t += 1) {
    let i = r.charCodeAt(t);
    if (i > 55295 && i <= 56319) {
      const n = (i - 55296) * 1024 & 65535;
      i = (r.charCodeAt(t + 1) - 56320 & 65535 | n) + 65536, t += 1;
    }
    _l(i, e);
  }
}
function Tl(r, e, t) {
  if (e.utf8seq === 0) {
    if (r <= 127) {
      t(r);
      return;
    }
    for (let i = 1; i < 6; i += 1)
      if (!(r >> 7 - i & 1)) {
        e.utf8seq = i;
        break;
      }
    if (e.utf8seq === 2)
      e.codepoint = r & 31;
    else if (e.utf8seq === 3)
      e.codepoint = r & 15;
    else if (e.utf8seq === 4)
      e.codepoint = r & 7;
    else
      throw new Error("Invalid UTF-8 sequence");
    e.utf8seq -= 1;
  } else if (e.utf8seq > 0) {
    if (r <= 127)
      throw new Error("Invalid UTF-8 sequence");
    e.codepoint = e.codepoint << 6 | r & 63, e.utf8seq -= 1, e.utf8seq === 0 && t(e.codepoint);
  }
}
function st(r) {
  const e = [], t = { queue: 0, queuedBits: 0 }, i = (n) => {
    e.push(n);
  };
  for (let n = 0; n < r.length; n += 1)
    qn(r.charCodeAt(n), t, i);
  return new Uint8Array(e);
}
function kl(r) {
  const e = [];
  return xl(r, (t) => e.push(t)), new Uint8Array(e);
}
function Me(r) {
  const e = [], t = { queue: 0, queuedBits: 0 }, i = (n) => {
    e.push(n);
  };
  return r.forEach((n) => $i(n, t, i)), $i(null, t, i), e.join("");
}
function Sl(r) {
  return Math.round(Date.now() / 1e3) + r;
}
function El() {
  return Symbol("auth-callback");
}
const J = () => typeof window < "u" && typeof document < "u", Le = {
  tested: !1,
  writable: !1
}, Gn = () => {
  if (!J())
    return !1;
  try {
    if (typeof globalThis.localStorage != "object")
      return !1;
  } catch {
    return !1;
  }
  if (Le.tested)
    return Le.writable;
  const r = `lswt-${Math.random()}${Math.random()}`;
  try {
    globalThis.localStorage.setItem(r, r), globalThis.localStorage.removeItem(r), Le.tested = !0, Le.writable = !0;
  } catch {
    Le.tested = !0, Le.writable = !1;
  }
  return Le.writable;
};
function Al(r) {
  const e = {}, t = new URL(r);
  if (t.hash && t.hash[0] === "#")
    try {
      new URLSearchParams(t.hash.substring(1)).forEach((n, a) => {
        e[a] = n;
      });
    } catch {
    }
  return t.searchParams.forEach((i, n) => {
    e[n] = i;
  }), e;
}
const Wn = (r) => r ? (...e) => r(...e) : (...e) => fetch(...e), Il = (r) => typeof r == "object" && r !== null && "status" in r && "ok" in r && "json" in r && typeof r.json == "function", tt = async (r, e, t) => {
  await r.setItem(e, JSON.stringify(t));
}, je = async (r, e) => {
  const t = await r.getItem(e);
  if (!t)
    return null;
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}, X = async (r, e) => {
  await r.removeItem(e);
};
class mr {
  constructor() {
    this.promise = new mr.promiseConstructor((e, t) => {
      this.resolve = e, this.reject = t;
    });
  }
}
mr.promiseConstructor = Promise;
function Zt(r) {
  const e = r.split(".");
  if (e.length !== 3)
    throw new Jr("Invalid JWT structure");
  for (let i = 0; i < e.length; i++)
    if (!pl.test(e[i]))
      throw new Jr("JWT not in base64url format");
  return {
    // using base64url lib
    header: JSON.parse(Mi(e[0])),
    payload: JSON.parse(Mi(e[1])),
    signature: st(e[2]),
    raw: {
      header: e[0],
      payload: e[1]
    }
  };
}
async function Rl(r) {
  return await new Promise((e) => {
    setTimeout(() => e(null), r);
  });
}
function Cl(r, e) {
  return new Promise((i, n) => {
    (async () => {
      for (let a = 0; a < 1 / 0; a++)
        try {
          const s = await r(a);
          if (!e(a, null, s)) {
            i(s);
            return;
          }
        } catch (s) {
          if (!e(a, s)) {
            n(s);
            return;
          }
        }
    })();
  });
}
function Ol(r) {
  return ("0" + r.toString(16)).substr(-2);
}
function Pl() {
  const e = new Uint32Array(56);
  if (typeof crypto > "u") {
    const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~", i = t.length;
    let n = "";
    for (let a = 0; a < 56; a++)
      n += t.charAt(Math.floor(Math.random() * i));
    return n;
  }
  return crypto.getRandomValues(e), Array.from(e, Ol).join("");
}
async function Dl(r) {
  const t = new TextEncoder().encode(r), i = await crypto.subtle.digest("SHA-256", t), n = new Uint8Array(i);
  return Array.from(n).map((a) => String.fromCharCode(a)).join("");
}
async function Ul(r) {
  if (!(typeof crypto < "u" && typeof crypto.subtle < "u" && typeof TextEncoder < "u"))
    return console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256."), r;
  const t = await Dl(r);
  return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function Xe(r, e, t = !1) {
  const i = Pl();
  let n = i;
  t && (n += "/PASSWORD_RECOVERY"), await tt(r, `${e}-code-verifier`, n);
  const a = await Ul(i);
  return [a, i === a ? "plain" : "s256"];
}
const Ll = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;
function jl(r) {
  const e = r.headers.get(Hr);
  if (!e || !e.match(Ll))
    return null;
  try {
    return /* @__PURE__ */ new Date(`${e}T00:00:00.0Z`);
  } catch {
    return null;
  }
}
function Nl(r) {
  if (!r)
    throw new Error("Missing exp claim");
  const e = Math.floor(Date.now() / 1e3);
  if (r <= e)
    throw new Error("JWT has expired");
}
function Bl(r) {
  switch (r) {
    case "RS256":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: { name: "SHA-256" }
      };
    case "ES256":
      return {
        name: "ECDSA",
        namedCurve: "P-256",
        hash: { name: "SHA-256" }
      };
    default:
      throw new Error("Invalid alg claim");
  }
}
const $l = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function Je(r) {
  if (!$l.test(r))
    throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not");
}
function Cr() {
  const r = {};
  return new Proxy(r, {
    get: (e, t) => {
      if (t === "__isUserNotAvailableProxy")
        return !0;
      if (typeof t == "symbol") {
        const i = t.toString();
        if (i === "Symbol(Symbol.toPrimitive)" || i === "Symbol(Symbol.toStringTag)" || i === "Symbol(util.inspect.custom)")
          return;
      }
      throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Accessing the "${t}" property of the session object is not supported. Please use getUser() instead.`);
    },
    set: (e, t) => {
      throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Setting the "${t}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
    },
    deleteProperty: (e, t) => {
      throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Deleting the "${t}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
    }
  });
}
function Ml(r, e) {
  return new Proxy(r, {
    get: (t, i, n) => {
      if (i === "__isInsecureUserWarningProxy")
        return !0;
      if (typeof i == "symbol") {
        const a = i.toString();
        if (a === "Symbol(Symbol.toPrimitive)" || a === "Symbol(Symbol.toStringTag)" || a === "Symbol(util.inspect.custom)" || a === "Symbol(nodejs.util.inspect.custom)")
          return Reflect.get(t, i, n);
      }
      return !e.value && typeof i == "string" && (console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server."), e.value = !0), Reflect.get(t, i, n);
    }
  });
}
function Fi(r) {
  return JSON.parse(JSON.stringify(r));
}
const Ne = (r) => r.msg || r.message || r.error_description || r.error || JSON.stringify(r), Fl = [502, 503, 504];
async function zi(r) {
  var e;
  if (!Il(r))
    throw new Xr(Ne(r), 0);
  if (Fl.includes(r.status))
    throw new Xr(Ne(r), r.status);
  let t;
  try {
    t = await r.json();
  } catch (a) {
    throw new $e(Ne(a), a);
  }
  let i;
  const n = jl(r);
  if (n && n.getTime() >= zn["2024-01-01"].timestamp && typeof t == "object" && t && typeof t.code == "string" ? i = t.code : typeof t == "object" && t && typeof t.error_code == "string" && (i = t.error_code), i) {
    if (i === "weak_password")
      throw new Ni(Ne(t), r.status, ((e = t.weak_password) === null || e === void 0 ? void 0 : e.reasons) || []);
    if (i === "session_not_found")
      throw new se();
  } else if (typeof t == "object" && t && typeof t.weak_password == "object" && t.weak_password && Array.isArray(t.weak_password.reasons) && t.weak_password.reasons.length && t.weak_password.reasons.reduce((a, s) => a && typeof s == "string", !0))
    throw new Ni(Ne(t), r.status, t.weak_password.reasons);
  throw new gl(Ne(t), r.status || 500, i);
}
const zl = (r, e, t, i) => {
  const n = { method: r, headers: (e == null ? void 0 : e.headers) || {} };
  return r === "GET" ? n : (n.headers = Object.assign({ "Content-Type": "application/json;charset=UTF-8" }, e == null ? void 0 : e.headers), n.body = JSON.stringify(i), Object.assign(Object.assign({}, n), t));
};
async function I(r, e, t, i) {
  var n;
  const a = Object.assign({}, i == null ? void 0 : i.headers);
  a[Hr] || (a[Hr] = zn["2024-01-01"].name), i != null && i.jwt && (a.Authorization = `Bearer ${i.jwt}`);
  const s = (n = i == null ? void 0 : i.query) !== null && n !== void 0 ? n : {};
  i != null && i.redirectTo && (s.redirect_to = i.redirectTo);
  const o = Object.keys(s).length ? "?" + new URLSearchParams(s).toString() : "", c = await ql(r, e, t + o, {
    headers: a,
    noResolveJson: i == null ? void 0 : i.noResolveJson
  }, {}, i == null ? void 0 : i.body);
  return i != null && i.xform ? i == null ? void 0 : i.xform(c) : { data: Object.assign({}, c), error: null };
}
async function ql(r, e, t, i, n, a) {
  const s = zl(e, i, n, a);
  let o;
  try {
    o = await r(t, Object.assign({}, s));
  } catch (c) {
    throw console.error(c), new Xr(Ne(c), 0);
  }
  if (o.ok || await zi(o), i != null && i.noResolveJson)
    return o;
  try {
    return await o.json();
  } catch (c) {
    await zi(c);
  }
}
function ue(r) {
  var e;
  let t = null;
  Kl(r) && (t = Object.assign({}, r), r.expires_at || (t.expires_at = Sl(r.expires_in)));
  const i = (e = r.user) !== null && e !== void 0 ? e : r;
  return { data: { session: t, user: i }, error: null };
}
function qi(r) {
  const e = ue(r);
  return !e.error && r.weak_password && typeof r.weak_password == "object" && Array.isArray(r.weak_password.reasons) && r.weak_password.reasons.length && r.weak_password.message && typeof r.weak_password.message == "string" && r.weak_password.reasons.reduce((t, i) => t && typeof i == "string", !0) && (e.data.weak_password = r.weak_password), e;
}
function Re(r) {
  var e;
  return { data: { user: (e = r.user) !== null && e !== void 0 ? e : r }, error: null };
}
function Gl(r) {
  return { data: r, error: null };
}
function Wl(r) {
  const { action_link: e, email_otp: t, hashed_token: i, redirect_to: n, verification_type: a } = r, s = dr(r, ["action_link", "email_otp", "hashed_token", "redirect_to", "verification_type"]), o = {
    action_link: e,
    email_otp: t,
    hashed_token: i,
    redirect_to: n,
    verification_type: a
  }, c = Object.assign({}, s);
  return {
    data: {
      properties: o,
      user: c
    },
    error: null
  };
}
function Gi(r) {
  return r;
}
function Kl(r) {
  return r.access_token && r.refresh_token && r.expires_in;
}
const Or = ["global", "local", "others"];
class Vl {
  /**
   * Creates an admin API client that can be used to manage users and OAuth clients.
   *
   * @example
   * ```ts
   * import { GoTrueAdminApi } from '@supabase/auth-js'
   *
   * const admin = new GoTrueAdminApi({
   *   url: 'https://xyzcompany.supabase.co/auth/v1',
   *   headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
   * })
   * ```
   */
  constructor({ url: e = "", headers: t = {}, fetch: i }) {
    this.url = e, this.headers = t, this.fetch = Wn(i), this.mfa = {
      listFactors: this._listFactors.bind(this),
      deleteFactor: this._deleteFactor.bind(this)
    }, this.oauth = {
      listClients: this._listOAuthClients.bind(this),
      createClient: this._createOAuthClient.bind(this),
      getClient: this._getOAuthClient.bind(this),
      updateClient: this._updateOAuthClient.bind(this),
      deleteClient: this._deleteOAuthClient.bind(this),
      regenerateClientSecret: this._regenerateOAuthClientSecret.bind(this)
    };
  }
  /**
   * Removes a logged-in session.
   * @param jwt A valid, logged-in JWT.
   * @param scope The logout sope.
   */
  async signOut(e, t = Or[0]) {
    if (Or.indexOf(t) < 0)
      throw new Error(`@supabase/auth-js: Parameter scope must be one of ${Or.join(", ")}`);
    try {
      return await I(this.fetch, "POST", `${this.url}/logout?scope=${t}`, {
        headers: this.headers,
        jwt: e,
        noResolveJson: !0
      }), { data: null, error: null };
    } catch (i) {
      if (A(i))
        return { data: null, error: i };
      throw i;
    }
  }
  /**
   * Sends an invite link to an email address.
   * @param email The email address of the user.
   * @param options Additional options to be included when inviting.
   */
  async inviteUserByEmail(e, t = {}) {
    try {
      return await I(this.fetch, "POST", `${this.url}/invite`, {
        body: { email: e, data: t.data },
        headers: this.headers,
        redirectTo: t.redirectTo,
        xform: Re
      });
    } catch (i) {
      if (A(i))
        return { data: { user: null }, error: i };
      throw i;
    }
  }
  /**
   * Generates email links and OTPs to be sent via a custom email provider.
   * @param email The user's email.
   * @param options.password User password. For signup only.
   * @param options.data Optional user metadata. For signup only.
   * @param options.redirectTo The redirect url which should be appended to the generated link
   */
  async generateLink(e) {
    try {
      const { options: t } = e, i = dr(e, ["options"]), n = Object.assign(Object.assign({}, i), t);
      return "newEmail" in i && (n.new_email = i == null ? void 0 : i.newEmail, delete n.newEmail), await I(this.fetch, "POST", `${this.url}/admin/generate_link`, {
        body: n,
        headers: this.headers,
        xform: Wl,
        redirectTo: t == null ? void 0 : t.redirectTo
      });
    } catch (t) {
      if (A(t))
        return {
          data: {
            properties: null,
            user: null
          },
          error: t
        };
      throw t;
    }
  }
  // User Admin API
  /**
   * Creates a new user.
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async createUser(e) {
    try {
      return await I(this.fetch, "POST", `${this.url}/admin/users`, {
        body: e,
        headers: this.headers,
        xform: Re
      });
    } catch (t) {
      if (A(t))
        return { data: { user: null }, error: t };
      throw t;
    }
  }
  /**
   * Get a list of users.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   * @param params An object which supports `page` and `perPage` as numbers, to alter the paginated results.
   */
  async listUsers(e) {
    var t, i, n, a, s, o, c;
    try {
      const l = { nextPage: null, lastPage: 0, total: 0 }, u = await I(this.fetch, "GET", `${this.url}/admin/users`, {
        headers: this.headers,
        noResolveJson: !0,
        query: {
          page: (i = (t = e == null ? void 0 : e.page) === null || t === void 0 ? void 0 : t.toString()) !== null && i !== void 0 ? i : "",
          per_page: (a = (n = e == null ? void 0 : e.perPage) === null || n === void 0 ? void 0 : n.toString()) !== null && a !== void 0 ? a : ""
        },
        xform: Gi
      });
      if (u.error)
        throw u.error;
      const h = await u.json(), d = (s = u.headers.get("x-total-count")) !== null && s !== void 0 ? s : 0, f = (c = (o = u.headers.get("link")) === null || o === void 0 ? void 0 : o.split(",")) !== null && c !== void 0 ? c : [];
      return f.length > 0 && (f.forEach((p) => {
        const m = parseInt(p.split(";")[0].split("=")[1].substring(0, 1)), g = JSON.parse(p.split(";")[1].split("=")[1]);
        l[`${g}Page`] = m;
      }), l.total = parseInt(d)), { data: Object.assign(Object.assign({}, h), l), error: null };
    } catch (l) {
      if (A(l))
        return { data: { users: [] }, error: l };
      throw l;
    }
  }
  /**
   * Get user by id.
   *
   * @param uid The user's unique identifier
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async getUserById(e) {
    Je(e);
    try {
      return await I(this.fetch, "GET", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        xform: Re
      });
    } catch (t) {
      if (A(t))
        return { data: { user: null }, error: t };
      throw t;
    }
  }
  /**
   * Updates the user data. Changes are applied directly without confirmation flows.
   *
   * @param attributes The data you want to update.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async updateUserById(e, t) {
    Je(e);
    try {
      return await I(this.fetch, "PUT", `${this.url}/admin/users/${e}`, {
        body: t,
        headers: this.headers,
        xform: Re
      });
    } catch (i) {
      if (A(i))
        return { data: { user: null }, error: i };
      throw i;
    }
  }
  /**
   * Delete a user. Requires a `service_role` key.
   *
   * @param id The user id you want to remove.
   * @param shouldSoftDelete If true, then the user will be soft-deleted from the auth schema. Soft deletion allows user identification from the hashed user ID but is not reversible.
   * Defaults to false for backward compatibility.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async deleteUser(e, t = !1) {
    Je(e);
    try {
      return await I(this.fetch, "DELETE", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        body: {
          should_soft_delete: t
        },
        xform: Re
      });
    } catch (i) {
      if (A(i))
        return { data: { user: null }, error: i };
      throw i;
    }
  }
  async _listFactors(e) {
    Je(e.userId);
    try {
      const { data: t, error: i } = await I(this.fetch, "GET", `${this.url}/admin/users/${e.userId}/factors`, {
        headers: this.headers,
        xform: (n) => ({ data: { factors: n }, error: null })
      });
      return { data: t, error: i };
    } catch (t) {
      if (A(t))
        return { data: null, error: t };
      throw t;
    }
  }
  async _deleteFactor(e) {
    Je(e.userId), Je(e.id);
    try {
      return { data: await I(this.fetch, "DELETE", `${this.url}/admin/users/${e.userId}/factors/${e.id}`, {
        headers: this.headers
      }), error: null };
    } catch (t) {
      if (A(t))
        return { data: null, error: t };
      throw t;
    }
  }
  /**
   * Lists all OAuth clients with optional pagination.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async _listOAuthClients(e) {
    var t, i, n, a, s, o, c;
    try {
      const l = { nextPage: null, lastPage: 0, total: 0 }, u = await I(this.fetch, "GET", `${this.url}/admin/oauth/clients`, {
        headers: this.headers,
        noResolveJson: !0,
        query: {
          page: (i = (t = e == null ? void 0 : e.page) === null || t === void 0 ? void 0 : t.toString()) !== null && i !== void 0 ? i : "",
          per_page: (a = (n = e == null ? void 0 : e.perPage) === null || n === void 0 ? void 0 : n.toString()) !== null && a !== void 0 ? a : ""
        },
        xform: Gi
      });
      if (u.error)
        throw u.error;
      const h = await u.json(), d = (s = u.headers.get("x-total-count")) !== null && s !== void 0 ? s : 0, f = (c = (o = u.headers.get("link")) === null || o === void 0 ? void 0 : o.split(",")) !== null && c !== void 0 ? c : [];
      return f.length > 0 && (f.forEach((p) => {
        const m = parseInt(p.split(";")[0].split("=")[1].substring(0, 1)), g = JSON.parse(p.split(";")[1].split("=")[1]);
        l[`${g}Page`] = m;
      }), l.total = parseInt(d)), { data: Object.assign(Object.assign({}, h), l), error: null };
    } catch (l) {
      if (A(l))
        return { data: { clients: [] }, error: l };
      throw l;
    }
  }
  /**
   * Creates a new OAuth client.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async _createOAuthClient(e) {
    try {
      return await I(this.fetch, "POST", `${this.url}/admin/oauth/clients`, {
        body: e,
        headers: this.headers,
        xform: (t) => ({ data: t, error: null })
      });
    } catch (t) {
      if (A(t))
        return { data: null, error: t };
      throw t;
    }
  }
  /**
   * Gets details of a specific OAuth client.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async _getOAuthClient(e) {
    try {
      return await I(this.fetch, "GET", `${this.url}/admin/oauth/clients/${e}`, {
        headers: this.headers,
        xform: (t) => ({ data: t, error: null })
      });
    } catch (t) {
      if (A(t))
        return { data: null, error: t };
      throw t;
    }
  }
  /**
   * Updates an existing OAuth client.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async _updateOAuthClient(e, t) {
    try {
      return await I(this.fetch, "PUT", `${this.url}/admin/oauth/clients/${e}`, {
        body: t,
        headers: this.headers,
        xform: (i) => ({ data: i, error: null })
      });
    } catch (i) {
      if (A(i))
        return { data: null, error: i };
      throw i;
    }
  }
  /**
   * Deletes an OAuth client.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async _deleteOAuthClient(e) {
    try {
      return await I(this.fetch, "DELETE", `${this.url}/admin/oauth/clients/${e}`, {
        headers: this.headers,
        noResolveJson: !0
      }), { data: null, error: null };
    } catch (t) {
      if (A(t))
        return { data: null, error: t };
      throw t;
    }
  }
  /**
   * Regenerates the secret for an OAuth client.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async _regenerateOAuthClientSecret(e) {
    try {
      return await I(this.fetch, "POST", `${this.url}/admin/oauth/clients/${e}/regenerate_secret`, {
        headers: this.headers,
        xform: (t) => ({ data: t, error: null })
      });
    } catch (t) {
      if (A(t))
        return { data: null, error: t };
      throw t;
    }
  }
}
function Wi(r = {}) {
  return {
    getItem: (e) => r[e] || null,
    setItem: (e, t) => {
      r[e] = t;
    },
    removeItem: (e) => {
      delete r[e];
    }
  };
}
const Ye = {
  /**
   * @experimental
   */
  debug: !!(globalThis && Gn() && globalThis.localStorage && globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug") === "true")
};
class Kn extends Error {
  constructor(e) {
    super(e), this.isAcquireTimeout = !0;
  }
}
class Hl extends Kn {
}
async function Xl(r, e, t) {
  Ye.debug && console.log("@supabase/gotrue-js: navigatorLock: acquire lock", r, e);
  const i = new globalThis.AbortController();
  return e > 0 && setTimeout(() => {
    i.abort(), Ye.debug && console.log("@supabase/gotrue-js: navigatorLock acquire timed out", r);
  }, e), await Promise.resolve().then(() => globalThis.navigator.locks.request(r, e === 0 ? {
    mode: "exclusive",
    ifAvailable: !0
  } : {
    mode: "exclusive",
    signal: i.signal
  }, async (n) => {
    if (n) {
      Ye.debug && console.log("@supabase/gotrue-js: navigatorLock: acquired", r, n.name);
      try {
        return await t();
      } finally {
        Ye.debug && console.log("@supabase/gotrue-js: navigatorLock: released", r, n.name);
      }
    } else {
      if (e === 0)
        throw Ye.debug && console.log("@supabase/gotrue-js: navigatorLock: not immediately available", r), new Hl(`Acquiring an exclusive Navigator LockManager lock "${r}" immediately failed`);
      if (Ye.debug)
        try {
          const a = await globalThis.navigator.locks.query();
          console.log("@supabase/gotrue-js: Navigator LockManager state", JSON.stringify(a, null, "  "));
        } catch (a) {
          console.warn("@supabase/gotrue-js: Error when querying Navigator LockManager state", a);
        }
      return console.warn("@supabase/gotrue-js: Navigator LockManager returned a null lock when using #request without ifAvailable set to true, it appears this browser is not following the LockManager spec https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request"), await t();
    }
  }));
}
function Jl() {
  if (typeof globalThis != "object")
    try {
      Object.defineProperty(Object.prototype, "__magic__", {
        get: function() {
          return this;
        },
        configurable: !0
      }), __magic__.globalThis = __magic__, delete Object.prototype.__magic__;
    } catch {
      typeof self < "u" && (self.globalThis = self);
    }
}
function Vn(r) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(r))
    throw new Error(`@supabase/auth-js: Address "${r}" is invalid.`);
  return r.toLowerCase();
}
function Yl(r) {
  return parseInt(r, 16);
}
function Zl(r) {
  const e = new TextEncoder().encode(r);
  return "0x" + Array.from(e, (i) => i.toString(16).padStart(2, "0")).join("");
}
function Ql(r) {
  var e;
  const { chainId: t, domain: i, expirationTime: n, issuedAt: a = /* @__PURE__ */ new Date(), nonce: s, notBefore: o, requestId: c, resources: l, scheme: u, uri: h, version: d } = r;
  {
    if (!Number.isInteger(t))
      throw new Error(`@supabase/auth-js: Invalid SIWE message field "chainId". Chain ID must be a EIP-155 chain ID. Provided value: ${t}`);
    if (!i)
      throw new Error('@supabase/auth-js: Invalid SIWE message field "domain". Domain must be provided.');
    if (s && s.length < 8)
      throw new Error(`@supabase/auth-js: Invalid SIWE message field "nonce". Nonce must be at least 8 characters. Provided value: ${s}`);
    if (!h)
      throw new Error('@supabase/auth-js: Invalid SIWE message field "uri". URI must be provided.');
    if (d !== "1")
      throw new Error(`@supabase/auth-js: Invalid SIWE message field "version". Version must be '1'. Provided value: ${d}`);
    if (!((e = r.statement) === null || e === void 0) && e.includes(`
`))
      throw new Error(`@supabase/auth-js: Invalid SIWE message field "statement". Statement must not include '\\n'. Provided value: ${r.statement}`);
  }
  const f = Vn(r.address), p = u ? `${u}://${i}` : i, m = r.statement ? `${r.statement}
` : "", g = `${p} wants you to sign in with your Ethereum account:
${f}

${m}`;
  let y = `URI: ${h}
Version: ${d}
Chain ID: ${t}${s ? `
Nonce: ${s}` : ""}
Issued At: ${a.toISOString()}`;
  if (n && (y += `
Expiration Time: ${n.toISOString()}`), o && (y += `
Not Before: ${o.toISOString()}`), c && (y += `
Request ID: ${c}`), l) {
    let w = `
Resources:`;
    for (const v of l) {
      if (!v || typeof v != "string")
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "resources". Every resource must be a valid string. Provided value: ${v}`);
      w += `
- ${v}`;
    }
    y += w;
  }
  return `${g}
${y}`;
}
class W extends Error {
  constructor({ message: e, code: t, cause: i, name: n }) {
    var a;
    super(e, { cause: i }), this.__isWebAuthnError = !0, this.name = (a = n ?? (i instanceof Error ? i.name : void 0)) !== null && a !== void 0 ? a : "Unknown Error", this.code = t;
  }
}
class ar extends W {
  constructor(e, t) {
    super({
      code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
      cause: t,
      message: e
    }), this.name = "WebAuthnUnknownError", this.originalError = t;
  }
}
function eu({ error: r, options: e }) {
  var t, i, n;
  const { publicKey: a } = e;
  if (!a)
    throw Error("options was missing required publicKey property");
  if (r.name === "AbortError") {
    if (e.signal instanceof AbortSignal)
      return new W({
        message: "Registration ceremony was sent an abort signal",
        code: "ERROR_CEREMONY_ABORTED",
        cause: r
      });
  } else if (r.name === "ConstraintError") {
    if (((t = a.authenticatorSelection) === null || t === void 0 ? void 0 : t.requireResidentKey) === !0)
      return new W({
        message: "Discoverable credentials were required but no available authenticator supported it",
        code: "ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT",
        cause: r
      });
    if (
      // @ts-ignore: `mediation` doesn't yet exist on CredentialCreationOptions but it's possible as of Sept 2024
      e.mediation === "conditional" && ((i = a.authenticatorSelection) === null || i === void 0 ? void 0 : i.userVerification) === "required"
    )
      return new W({
        message: "User verification was required during automatic registration but it could not be performed",
        code: "ERROR_AUTO_REGISTER_USER_VERIFICATION_FAILURE",
        cause: r
      });
    if (((n = a.authenticatorSelection) === null || n === void 0 ? void 0 : n.userVerification) === "required")
      return new W({
        message: "User verification was required but no available authenticator supported it",
        code: "ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT",
        cause: r
      });
  } else {
    if (r.name === "InvalidStateError")
      return new W({
        message: "The authenticator was previously registered",
        code: "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED",
        cause: r
      });
    if (r.name === "NotAllowedError")
      return new W({
        message: r.message,
        code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
        cause: r
      });
    if (r.name === "NotSupportedError")
      return a.pubKeyCredParams.filter((o) => o.type === "public-key").length === 0 ? new W({
        message: 'No entry in pubKeyCredParams was of type "public-key"',
        code: "ERROR_MALFORMED_PUBKEYCREDPARAMS",
        cause: r
      }) : new W({
        message: "No available authenticator supported any of the specified pubKeyCredParams algorithms",
        code: "ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG",
        cause: r
      });
    if (r.name === "SecurityError") {
      const s = window.location.hostname;
      if (Hn(s)) {
        if (a.rp.id !== s)
          return new W({
            message: `The RP ID "${a.rp.id}" is invalid for this domain`,
            code: "ERROR_INVALID_RP_ID",
            cause: r
          });
      } else
        return new W({
          message: `${window.location.hostname} is an invalid domain`,
          code: "ERROR_INVALID_DOMAIN",
          cause: r
        });
    } else if (r.name === "TypeError") {
      if (a.user.id.byteLength < 1 || a.user.id.byteLength > 64)
        return new W({
          message: "User ID was not between 1 and 64 characters",
          code: "ERROR_INVALID_USER_ID_LENGTH",
          cause: r
        });
    } else if (r.name === "UnknownError")
      return new W({
        message: "The authenticator was unable to process the specified options, or could not create a new credential",
        code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
        cause: r
      });
  }
  return new W({
    message: "a Non-Webauthn related error has occurred",
    code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
    cause: r
  });
}
function tu({ error: r, options: e }) {
  const { publicKey: t } = e;
  if (!t)
    throw Error("options was missing required publicKey property");
  if (r.name === "AbortError") {
    if (e.signal instanceof AbortSignal)
      return new W({
        message: "Authentication ceremony was sent an abort signal",
        code: "ERROR_CEREMONY_ABORTED",
        cause: r
      });
  } else {
    if (r.name === "NotAllowedError")
      return new W({
        message: r.message,
        code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
        cause: r
      });
    if (r.name === "SecurityError") {
      const i = window.location.hostname;
      if (Hn(i)) {
        if (t.rpId !== i)
          return new W({
            message: `The RP ID "${t.rpId}" is invalid for this domain`,
            code: "ERROR_INVALID_RP_ID",
            cause: r
          });
      } else
        return new W({
          message: `${window.location.hostname} is an invalid domain`,
          code: "ERROR_INVALID_DOMAIN",
          cause: r
        });
    } else if (r.name === "UnknownError")
      return new W({
        message: "The authenticator was unable to process the specified options, or could not create a new assertion signature",
        code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
        cause: r
      });
  }
  return new W({
    message: "a Non-Webauthn related error has occurred",
    code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
    cause: r
  });
}
class ru {
  /**
   * Create an abort signal for a new WebAuthn operation.
   * Automatically cancels any existing operation.
   *
   * @returns {AbortSignal} Signal to pass to navigator.credentials.create() or .get()
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal MDN - AbortSignal}
   */
  createNewAbortSignal() {
    if (this.controller) {
      const t = new Error("Cancelling existing WebAuthn API call for new one");
      t.name = "AbortError", this.controller.abort(t);
    }
    const e = new AbortController();
    return this.controller = e, e.signal;
  }
  /**
   * Manually cancel the current WebAuthn operation.
   * Useful for cleaning up when user cancels or navigates away.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort MDN - AbortController.abort}
   */
  cancelCeremony() {
    if (this.controller) {
      const e = new Error("Manually cancelling existing WebAuthn API call");
      e.name = "AbortError", this.controller.abort(e), this.controller = void 0;
    }
  }
}
const iu = new ru();
function nu(r) {
  if (!r)
    throw new Error("Credential creation options are required");
  if (typeof PublicKeyCredential < "u" && "parseCreationOptionsFromJSON" in PublicKeyCredential && typeof PublicKeyCredential.parseCreationOptionsFromJSON == "function")
    return PublicKeyCredential.parseCreationOptionsFromJSON(
      /** we assert the options here as typescript still doesn't know about future webauthn types */
      r
    );
  const { challenge: e, user: t, excludeCredentials: i } = r, n = dr(
    r,
    ["challenge", "user", "excludeCredentials"]
  ), a = st(e).buffer, s = Object.assign(Object.assign({}, t), { id: st(t.id).buffer }), o = Object.assign(Object.assign({}, n), {
    challenge: a,
    user: s
  });
  if (i && i.length > 0) {
    o.excludeCredentials = new Array(i.length);
    for (let c = 0; c < i.length; c++) {
      const l = i[c];
      o.excludeCredentials[c] = Object.assign(Object.assign({}, l), {
        id: st(l.id).buffer,
        type: l.type || "public-key",
        // Cast transports to handle future transport types like "cable"
        transports: l.transports
      });
    }
  }
  return o;
}
function su(r) {
  if (!r)
    throw new Error("Credential request options are required");
  if (typeof PublicKeyCredential < "u" && "parseRequestOptionsFromJSON" in PublicKeyCredential && typeof PublicKeyCredential.parseRequestOptionsFromJSON == "function")
    return PublicKeyCredential.parseRequestOptionsFromJSON(r);
  const { challenge: e, allowCredentials: t } = r, i = dr(
    r,
    ["challenge", "allowCredentials"]
  ), n = st(e).buffer, a = Object.assign(Object.assign({}, i), { challenge: n });
  if (t && t.length > 0) {
    a.allowCredentials = new Array(t.length);
    for (let s = 0; s < t.length; s++) {
      const o = t[s];
      a.allowCredentials[s] = Object.assign(Object.assign({}, o), {
        id: st(o.id).buffer,
        type: o.type || "public-key",
        // Cast transports to handle future transport types like "cable"
        transports: o.transports
      });
    }
  }
  return a;
}
function au(r) {
  var e;
  if ("toJSON" in r && typeof r.toJSON == "function")
    return r.toJSON();
  const t = r;
  return {
    id: r.id,
    rawId: r.id,
    response: {
      attestationObject: Me(new Uint8Array(r.response.attestationObject)),
      clientDataJSON: Me(new Uint8Array(r.response.clientDataJSON))
    },
    type: "public-key",
    clientExtensionResults: r.getClientExtensionResults(),
    // Convert null to undefined and cast to AuthenticatorAttachment type
    authenticatorAttachment: (e = t.authenticatorAttachment) !== null && e !== void 0 ? e : void 0
  };
}
function ou(r) {
  var e;
  if ("toJSON" in r && typeof r.toJSON == "function")
    return r.toJSON();
  const t = r, i = r.getClientExtensionResults(), n = r.response;
  return {
    id: r.id,
    rawId: r.id,
    // W3C spec expects rawId to match id for JSON format
    response: {
      authenticatorData: Me(new Uint8Array(n.authenticatorData)),
      clientDataJSON: Me(new Uint8Array(n.clientDataJSON)),
      signature: Me(new Uint8Array(n.signature)),
      userHandle: n.userHandle ? Me(new Uint8Array(n.userHandle)) : void 0
    },
    type: "public-key",
    clientExtensionResults: i,
    // Convert null to undefined and cast to AuthenticatorAttachment type
    authenticatorAttachment: (e = t.authenticatorAttachment) !== null && e !== void 0 ? e : void 0
  };
}
function Hn(r) {
  return (
    // Consider localhost valid as well since it's okay wrt Secure Contexts
    r === "localhost" || /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(r)
  );
}
function Ki() {
  var r, e;
  return !!(J() && "PublicKeyCredential" in window && window.PublicKeyCredential && "credentials" in navigator && typeof ((r = navigator == null ? void 0 : navigator.credentials) === null || r === void 0 ? void 0 : r.create) == "function" && typeof ((e = navigator == null ? void 0 : navigator.credentials) === null || e === void 0 ? void 0 : e.get) == "function");
}
async function cu(r) {
  try {
    const e = await navigator.credentials.create(
      /** we assert the type here until typescript types are updated */
      r
    );
    return e ? e instanceof PublicKeyCredential ? { data: e, error: null } : {
      data: null,
      error: new ar("Browser returned unexpected credential type", e)
    } : {
      data: null,
      error: new ar("Empty credential response", e)
    };
  } catch (e) {
    return {
      data: null,
      error: eu({
        error: e,
        options: r
      })
    };
  }
}
async function lu(r) {
  try {
    const e = await navigator.credentials.get(
      /** we assert the type here until typescript types are updated */
      r
    );
    return e ? e instanceof PublicKeyCredential ? { data: e, error: null } : {
      data: null,
      error: new ar("Browser returned unexpected credential type", e)
    } : {
      data: null,
      error: new ar("Empty credential response", e)
    };
  } catch (e) {
    return {
      data: null,
      error: tu({
        error: e,
        options: r
      })
    };
  }
}
const uu = {
  hints: ["security-key"],
  authenticatorSelection: {
    authenticatorAttachment: "cross-platform",
    requireResidentKey: !1,
    /** set to preferred because older yubikeys don't have PIN/Biometric */
    userVerification: "preferred",
    residentKey: "discouraged"
  },
  attestation: "direct"
}, hu = {
  /** set to preferred because older yubikeys don't have PIN/Biometric */
  userVerification: "preferred",
  hints: ["security-key"],
  attestation: "direct"
};
function or(...r) {
  const e = (n) => n !== null && typeof n == "object" && !Array.isArray(n), t = (n) => n instanceof ArrayBuffer || ArrayBuffer.isView(n), i = {};
  for (const n of r)
    if (n)
      for (const a in n) {
        const s = n[a];
        if (s !== void 0)
          if (Array.isArray(s))
            i[a] = s;
          else if (t(s))
            i[a] = s;
          else if (e(s)) {
            const o = i[a];
            e(o) ? i[a] = or(o, s) : i[a] = or(s);
          } else
            i[a] = s;
      }
  return i;
}
function du(r, e) {
  return or(uu, r, e || {});
}
function fu(r, e) {
  return or(hu, r, e || {});
}
class pu {
  constructor(e) {
    this.client = e, this.enroll = this._enroll.bind(this), this.challenge = this._challenge.bind(this), this.verify = this._verify.bind(this), this.authenticate = this._authenticate.bind(this), this.register = this._register.bind(this);
  }
  /**
   * Enroll a new WebAuthn factor.
   * Creates an unverified WebAuthn factor that must be verified with a credential.
   *
   * @experimental This method is experimental and may change in future releases
   * @param {Omit<MFAEnrollWebauthnParams, 'factorType'>} params - Enrollment parameters (friendlyName required)
   * @returns {Promise<AuthMFAEnrollWebauthnResponse>} Enrolled factor details or error
   * @see {@link https://w3c.github.io/webauthn/#sctn-registering-a-new-credential W3C WebAuthn Spec - Registering a New Credential}
   */
  async _enroll(e) {
    return this.client.mfa.enroll(Object.assign(Object.assign({}, e), { factorType: "webauthn" }));
  }
  /**
   * Challenge for WebAuthn credential creation or authentication.
   * Combines server challenge with browser credential operations.
   * Handles both registration (create) and authentication (request) flows.
   *
   * @experimental This method is experimental and may change in future releases
   * @param {MFAChallengeWebauthnParams & { friendlyName?: string; signal?: AbortSignal }} params - Challenge parameters including factorId
   * @param {Object} overrides - Allows you to override the parameters passed to navigator.credentials
   * @param {PublicKeyCredentialCreationOptionsFuture} overrides.create - Override options for credential creation
   * @param {PublicKeyCredentialRequestOptionsFuture} overrides.request - Override options for credential request
   * @returns {Promise<RequestResult>} Challenge response with credential or error
   * @see {@link https://w3c.github.io/webauthn/#sctn-credential-creation W3C WebAuthn Spec - Credential Creation}
   * @see {@link https://w3c.github.io/webauthn/#sctn-verifying-assertion W3C WebAuthn Spec - Verifying Assertion}
   */
  async _challenge({ factorId: e, webauthn: t, friendlyName: i, signal: n }, a) {
    var s;
    try {
      const { data: o, error: c } = await this.client.mfa.challenge({
        factorId: e,
        webauthn: t
      });
      if (!o)
        return { data: null, error: c };
      const l = n ?? iu.createNewAbortSignal();
      if (o.webauthn.type === "create") {
        const { user: u } = o.webauthn.credential_options.publicKey;
        if (!u.name) {
          const h = i;
          if (h)
            u.name = `${u.id}:${h}`;
          else {
            const f = (await this.client.getUser()).data.user, p = ((s = f == null ? void 0 : f.user_metadata) === null || s === void 0 ? void 0 : s.name) || (f == null ? void 0 : f.email) || (f == null ? void 0 : f.id) || "User";
            u.name = `${u.id}:${p}`;
          }
        }
        u.displayName || (u.displayName = u.name);
      }
      switch (o.webauthn.type) {
        case "create": {
          const u = du(o.webauthn.credential_options.publicKey, a == null ? void 0 : a.create), { data: h, error: d } = await cu({
            publicKey: u,
            signal: l
          });
          return h ? {
            data: {
              factorId: e,
              challengeId: o.id,
              webauthn: {
                type: o.webauthn.type,
                credential_response: h
              }
            },
            error: null
          } : { data: null, error: d };
        }
        case "request": {
          const u = fu(o.webauthn.credential_options.publicKey, a == null ? void 0 : a.request), { data: h, error: d } = await lu(Object.assign(Object.assign({}, o.webauthn.credential_options), { publicKey: u, signal: l }));
          return h ? {
            data: {
              factorId: e,
              challengeId: o.id,
              webauthn: {
                type: o.webauthn.type,
                credential_response: h
              }
            },
            error: null
          } : { data: null, error: d };
        }
      }
    } catch (o) {
      return A(o) ? { data: null, error: o } : {
        data: null,
        error: new $e("Unexpected error in challenge", o)
      };
    }
  }
  /**
   * Verify a WebAuthn credential with the server.
   * Completes the WebAuthn ceremony by sending the credential to the server for verification.
   *
   * @experimental This method is experimental and may change in future releases
   * @param {Object} params - Verification parameters
   * @param {string} params.challengeId - ID of the challenge being verified
   * @param {string} params.factorId - ID of the WebAuthn factor
   * @param {MFAVerifyWebauthnParams<T>['webauthn']} params.webauthn - WebAuthn credential response
   * @returns {Promise<AuthMFAVerifyResponse>} Verification result with session or error
   * @see {@link https://w3c.github.io/webauthn/#sctn-verifying-assertion W3C WebAuthn Spec - Verifying an Authentication Assertion}
   * */
  async _verify({ challengeId: e, factorId: t, webauthn: i }) {
    return this.client.mfa.verify({
      factorId: t,
      challengeId: e,
      webauthn: i
    });
  }
  /**
   * Complete WebAuthn authentication flow.
   * Performs challenge and verification in a single operation for existing credentials.
   *
   * @experimental This method is experimental and may change in future releases
   * @param {Object} params - Authentication parameters
   * @param {string} params.factorId - ID of the WebAuthn factor to authenticate with
   * @param {Object} params.webauthn - WebAuthn configuration
   * @param {string} params.webauthn.rpId - Relying Party ID (defaults to current hostname)
   * @param {string[]} params.webauthn.rpOrigins - Allowed origins (defaults to current origin)
   * @param {AbortSignal} params.webauthn.signal - Optional abort signal
   * @param {PublicKeyCredentialRequestOptionsFuture} overrides - Override options for navigator.credentials.get
   * @returns {Promise<RequestResult<AuthMFAVerifyResponseData, WebAuthnError | AuthError>>} Authentication result
   * @see {@link https://w3c.github.io/webauthn/#sctn-authentication W3C WebAuthn Spec - Authentication Ceremony}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions MDN - PublicKeyCredentialRequestOptions}
   */
  async _authenticate({ factorId: e, webauthn: { rpId: t = typeof window < "u" ? window.location.hostname : void 0, rpOrigins: i = typeof window < "u" ? [window.location.origin] : void 0, signal: n } = {} }, a) {
    if (!t)
      return {
        data: null,
        error: new At("rpId is required for WebAuthn authentication")
      };
    try {
      if (!Ki())
        return {
          data: null,
          error: new $e("Browser does not support WebAuthn", null)
        };
      const { data: s, error: o } = await this.challenge({
        factorId: e,
        webauthn: { rpId: t, rpOrigins: i },
        signal: n
      }, { request: a });
      if (!s)
        return { data: null, error: o };
      const { webauthn: c } = s;
      return this._verify({
        factorId: e,
        challengeId: s.challengeId,
        webauthn: {
          type: c.type,
          rpId: t,
          rpOrigins: i,
          credential_response: c.credential_response
        }
      });
    } catch (s) {
      return A(s) ? { data: null, error: s } : {
        data: null,
        error: new $e("Unexpected error in authenticate", s)
      };
    }
  }
  /**
   * Complete WebAuthn registration flow.
   * Performs enrollment, challenge, and verification in a single operation for new credentials.
   *
   * @experimental This method is experimental and may change in future releases
   * @param {Object} params - Registration parameters
   * @param {string} params.friendlyName - User-friendly name for the credential
   * @param {string} params.rpId - Relying Party ID (defaults to current hostname)
   * @param {string[]} params.rpOrigins - Allowed origins (defaults to current origin)
   * @param {AbortSignal} params.signal - Optional abort signal
   * @param {PublicKeyCredentialCreationOptionsFuture} overrides - Override options for navigator.credentials.create
   * @returns {Promise<RequestResult<AuthMFAVerifyResponseData, WebAuthnError | AuthError>>} Registration result
   * @see {@link https://w3c.github.io/webauthn/#sctn-registering-a-new-credential W3C WebAuthn Spec - Registration Ceremony}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions MDN - PublicKeyCredentialCreationOptions}
   */
  async _register({ friendlyName: e, webauthn: { rpId: t = typeof window < "u" ? window.location.hostname : void 0, rpOrigins: i = typeof window < "u" ? [window.location.origin] : void 0, signal: n } = {} }, a) {
    if (!t)
      return {
        data: null,
        error: new At("rpId is required for WebAuthn registration")
      };
    try {
      if (!Ki())
        return {
          data: null,
          error: new $e("Browser does not support WebAuthn", null)
        };
      const { data: s, error: o } = await this._enroll({
        friendlyName: e
      });
      if (!s)
        return await this.client.mfa.listFactors().then((u) => {
          var h;
          return (h = u.data) === null || h === void 0 ? void 0 : h.all.find((d) => d.factor_type === "webauthn" && d.friendly_name === e && d.status !== "unverified");
        }).then((u) => u ? this.client.mfa.unenroll({ factorId: u == null ? void 0 : u.id }) : void 0), { data: null, error: o };
      const { data: c, error: l } = await this._challenge({
        factorId: s.id,
        friendlyName: s.friendly_name,
        webauthn: { rpId: t, rpOrigins: i },
        signal: n
      }, {
        create: a
      });
      return c ? this._verify({
        factorId: s.id,
        challengeId: c.challengeId,
        webauthn: {
          rpId: t,
          rpOrigins: i,
          type: c.webauthn.type,
          credential_response: c.webauthn.credential_response
        }
      }) : { data: null, error: l };
    } catch (s) {
      return A(s) ? { data: null, error: s } : {
        data: null,
        error: new $e("Unexpected error in register", s)
      };
    }
  }
}
Jl();
const mu = {
  url: hl,
  storageKey: dl,
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  headers: fl,
  flowType: "implicit",
  debug: !1,
  hasCustomAuthorizationHeader: !1,
  throwOnError: !1,
  lockAcquireTimeout: 1e4
  // 10 seconds
};
async function Vi(r, e, t) {
  return await t();
}
const Ze = {};
class It {
  /**
   * The JWKS used for verifying asymmetric JWTs
   */
  get jwks() {
    var e, t;
    return (t = (e = Ze[this.storageKey]) === null || e === void 0 ? void 0 : e.jwks) !== null && t !== void 0 ? t : { keys: [] };
  }
  set jwks(e) {
    Ze[this.storageKey] = Object.assign(Object.assign({}, Ze[this.storageKey]), { jwks: e });
  }
  get jwks_cached_at() {
    var e, t;
    return (t = (e = Ze[this.storageKey]) === null || e === void 0 ? void 0 : e.cachedAt) !== null && t !== void 0 ? t : Number.MIN_SAFE_INTEGER;
  }
  set jwks_cached_at(e) {
    Ze[this.storageKey] = Object.assign(Object.assign({}, Ze[this.storageKey]), { cachedAt: e });
  }
  /**
   * Create a new client for use in the browser.
   *
   * @example
   * ```ts
   * import { GoTrueClient } from '@supabase/auth-js'
   *
   * const auth = new GoTrueClient({
   *   url: 'https://xyzcompany.supabase.co/auth/v1',
   *   headers: { apikey: 'public-anon-key' },
   *   storageKey: 'supabase-auth',
   * })
   * ```
   */
  constructor(e) {
    var t, i, n;
    this.userStorage = null, this.memoryStorage = null, this.stateChangeEmitters = /* @__PURE__ */ new Map(), this.autoRefreshTicker = null, this.autoRefreshTickTimeout = null, this.visibilityChangedCallback = null, this.refreshingDeferred = null, this.initializePromise = null, this.detectSessionInUrl = !0, this.hasCustomAuthorizationHeader = !1, this.suppressGetSessionWarning = !1, this.lockAcquired = !1, this.pendingInLock = [], this.broadcastChannel = null, this.logger = console.log;
    const a = Object.assign(Object.assign({}, mu), e);
    if (this.storageKey = a.storageKey, this.instanceID = (t = It.nextInstanceID[this.storageKey]) !== null && t !== void 0 ? t : 0, It.nextInstanceID[this.storageKey] = this.instanceID + 1, this.logDebugMessages = !!a.debug, typeof a.debug == "function" && (this.logger = a.debug), this.instanceID > 0 && J()) {
      const s = `${this._logPrefix()} Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.`;
      console.warn(s), this.logDebugMessages && console.trace(s);
    }
    if (this.persistSession = a.persistSession, this.autoRefreshToken = a.autoRefreshToken, this.admin = new Vl({
      url: a.url,
      headers: a.headers,
      fetch: a.fetch
    }), this.url = a.url, this.headers = a.headers, this.fetch = Wn(a.fetch), this.lock = a.lock || Vi, this.detectSessionInUrl = a.detectSessionInUrl, this.flowType = a.flowType, this.hasCustomAuthorizationHeader = a.hasCustomAuthorizationHeader, this.throwOnError = a.throwOnError, this.lockAcquireTimeout = a.lockAcquireTimeout, a.lock ? this.lock = a.lock : this.persistSession && J() && (!((i = globalThis == null ? void 0 : globalThis.navigator) === null || i === void 0) && i.locks) ? this.lock = Xl : this.lock = Vi, this.jwks || (this.jwks = { keys: [] }, this.jwks_cached_at = Number.MIN_SAFE_INTEGER), this.mfa = {
      verify: this._verify.bind(this),
      enroll: this._enroll.bind(this),
      unenroll: this._unenroll.bind(this),
      challenge: this._challenge.bind(this),
      listFactors: this._listFactors.bind(this),
      challengeAndVerify: this._challengeAndVerify.bind(this),
      getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this),
      webauthn: new pu(this)
    }, this.oauth = {
      getAuthorizationDetails: this._getAuthorizationDetails.bind(this),
      approveAuthorization: this._approveAuthorization.bind(this),
      denyAuthorization: this._denyAuthorization.bind(this),
      listGrants: this._listOAuthGrants.bind(this),
      revokeGrant: this._revokeOAuthGrant.bind(this)
    }, this.persistSession ? (a.storage ? this.storage = a.storage : Gn() ? this.storage = globalThis.localStorage : (this.memoryStorage = {}, this.storage = Wi(this.memoryStorage)), a.userStorage && (this.userStorage = a.userStorage)) : (this.memoryStorage = {}, this.storage = Wi(this.memoryStorage)), J() && globalThis.BroadcastChannel && this.persistSession && this.storageKey) {
      try {
        this.broadcastChannel = new globalThis.BroadcastChannel(this.storageKey);
      } catch (s) {
        console.error("Failed to create a new BroadcastChannel, multi-tab state changes will not be available", s);
      }
      (n = this.broadcastChannel) === null || n === void 0 || n.addEventListener("message", async (s) => {
        this._debug("received broadcast notification from other tab or client", s);
        try {
          await this._notifyAllSubscribers(s.data.event, s.data.session, !1);
        } catch (o) {
          this._debug("#broadcastChannel", "error", o);
        }
      });
    }
    this.initialize().catch((s) => {
      this._debug("#initialize()", "error", s);
    });
  }
  /**
   * Returns whether error throwing mode is enabled for this client.
   */
  isThrowOnErrorEnabled() {
    return this.throwOnError;
  }
  /**
   * Centralizes return handling with optional error throwing. When `throwOnError` is enabled
   * and the provided result contains a non-nullish error, the error is thrown instead of
   * being returned. This ensures consistent behavior across all public API methods.
   */
  _returnResult(e) {
    if (this.throwOnError && e && e.error)
      throw e.error;
    return e;
  }
  _logPrefix() {
    return `GoTrueClient@${this.storageKey}:${this.instanceID} (${Fn}) ${(/* @__PURE__ */ new Date()).toISOString()}`;
  }
  _debug(...e) {
    return this.logDebugMessages && this.logger(this._logPrefix(), ...e), this;
  }
  /**
   * Initializes the client session either from the url or from storage.
   * This method is automatically called when instantiating the client, but should also be called
   * manually when checking for an error from an auth redirect (oauth, magiclink, password recovery, etc).
   */
  async initialize() {
    return this.initializePromise ? await this.initializePromise : (this.initializePromise = (async () => await this._acquireLock(this.lockAcquireTimeout, async () => await this._initialize()))(), await this.initializePromise);
  }
  /**
   * IMPORTANT:
   * 1. Never throw in this method, as it is called from the constructor
   * 2. Never return a session from this method as it would be cached over
   *    the whole lifetime of the client
   */
  async _initialize() {
    var e;
    try {
      let t = {}, i = "none";
      if (J() && (t = Al(window.location.href), this._isImplicitGrantCallback(t) ? i = "implicit" : await this._isPKCECallback(t) && (i = "pkce")), J() && this.detectSessionInUrl && i !== "none") {
        const { data: n, error: a } = await this._getSessionFromURL(t, i);
        if (a) {
          if (this._debug("#_initialize()", "error detecting session from URL", a), wl(a)) {
            const c = (e = a.details) === null || e === void 0 ? void 0 : e.code;
            if (c === "identity_already_exists" || c === "identity_not_found" || c === "single_identity_not_deletable")
              return { error: a };
          }
          return { error: a };
        }
        const { session: s, redirectType: o } = n;
        return this._debug("#_initialize()", "detected session in URL", s, "redirect type", o), await this._saveSession(s), setTimeout(async () => {
          o === "recovery" ? await this._notifyAllSubscribers("PASSWORD_RECOVERY", s) : await this._notifyAllSubscribers("SIGNED_IN", s);
        }, 0), { error: null };
      }
      return await this._recoverAndRefresh(), { error: null };
    } catch (t) {
      return A(t) ? this._returnResult({ error: t }) : this._returnResult({
        error: new $e("Unexpected error during initialization", t)
      });
    } finally {
      await this._handleVisibilityChange(), this._debug("#_initialize()", "end");
    }
  }
  /**
   * Creates a new anonymous user.
   *
   * @returns A session where the is_anonymous claim in the access token JWT set to true
   */
  async signInAnonymously(e) {
    var t, i, n;
    try {
      const a = await I(this.fetch, "POST", `${this.url}/signup`, {
        headers: this.headers,
        body: {
          data: (i = (t = e == null ? void 0 : e.options) === null || t === void 0 ? void 0 : t.data) !== null && i !== void 0 ? i : {},
          gotrue_meta_security: { captcha_token: (n = e == null ? void 0 : e.options) === null || n === void 0 ? void 0 : n.captchaToken }
        },
        xform: ue
      }), { data: s, error: o } = a;
      if (o || !s)
        return this._returnResult({ data: { user: null, session: null }, error: o });
      const c = s.session, l = s.user;
      return s.session && (await this._saveSession(s.session), await this._notifyAllSubscribers("SIGNED_IN", c)), this._returnResult({ data: { user: l, session: c }, error: null });
    } catch (a) {
      if (A(a))
        return this._returnResult({ data: { user: null, session: null }, error: a });
      throw a;
    }
  }
  /**
   * Creates a new user.
   *
   * Be aware that if a user account exists in the system you may get back an
   * error message that attempts to hide this information from the user.
   * This method has support for PKCE via email signups. The PKCE flow cannot be used when autoconfirm is enabled.
   *
   * @returns A logged-in session if the server has "autoconfirm" ON
   * @returns A user if the server has "autoconfirm" OFF
   */
  async signUp(e) {
    var t, i, n;
    try {
      let a;
      if ("email" in e) {
        const { email: u, password: h, options: d } = e;
        let f = null, p = null;
        this.flowType === "pkce" && ([f, p] = await Xe(this.storage, this.storageKey)), a = await I(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          redirectTo: d == null ? void 0 : d.emailRedirectTo,
          body: {
            email: u,
            password: h,
            data: (t = d == null ? void 0 : d.data) !== null && t !== void 0 ? t : {},
            gotrue_meta_security: { captcha_token: d == null ? void 0 : d.captchaToken },
            code_challenge: f,
            code_challenge_method: p
          },
          xform: ue
        });
      } else if ("phone" in e) {
        const { phone: u, password: h, options: d } = e;
        a = await I(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          body: {
            phone: u,
            password: h,
            data: (i = d == null ? void 0 : d.data) !== null && i !== void 0 ? i : {},
            channel: (n = d == null ? void 0 : d.channel) !== null && n !== void 0 ? n : "sms",
            gotrue_meta_security: { captcha_token: d == null ? void 0 : d.captchaToken }
          },
          xform: ue
        });
      } else
        throw new Jt("You must provide either an email or phone number and a password");
      const { data: s, error: o } = a;
      if (o || !s)
        return await X(this.storage, `${this.storageKey}-code-verifier`), this._returnResult({ data: { user: null, session: null }, error: o });
      const c = s.session, l = s.user;
      return s.session && (await this._saveSession(s.session), await this._notifyAllSubscribers("SIGNED_IN", c)), this._returnResult({ data: { user: l, session: c }, error: null });
    } catch (a) {
      if (await X(this.storage, `${this.storageKey}-code-verifier`), A(a))
        return this._returnResult({ data: { user: null, session: null }, error: a });
      throw a;
    }
  }
  /**
   * Log in an existing user with an email and password or phone and password.
   *
   * Be aware that you may get back an error message that will not distinguish
   * between the cases where the account does not exist or that the
   * email/phone and password combination is wrong or that the account can only
   * be accessed via social login.
   */
  async signInWithPassword(e) {
    try {
      let t;
      if ("email" in e) {
        const { email: a, password: s, options: o } = e;
        t = await I(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
          headers: this.headers,
          body: {
            email: a,
            password: s,
            gotrue_meta_security: { captcha_token: o == null ? void 0 : o.captchaToken }
          },
          xform: qi
        });
      } else if ("phone" in e) {
        const { phone: a, password: s, options: o } = e;
        t = await I(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
          headers: this.headers,
          body: {
            phone: a,
            password: s,
            gotrue_meta_security: { captcha_token: o == null ? void 0 : o.captchaToken }
          },
          xform: qi
        });
      } else
        throw new Jt("You must provide either an email or phone number and a password");
      const { data: i, error: n } = t;
      if (n)
        return this._returnResult({ data: { user: null, session: null }, error: n });
      if (!i || !i.session || !i.user) {
        const a = new He();
        return this._returnResult({ data: { user: null, session: null }, error: a });
      }
      return i.session && (await this._saveSession(i.session), await this._notifyAllSubscribers("SIGNED_IN", i.session)), this._returnResult({
        data: Object.assign({ user: i.user, session: i.session }, i.weak_password ? { weakPassword: i.weak_password } : null),
        error: n
      });
    } catch (t) {
      if (A(t))
        return this._returnResult({ data: { user: null, session: null }, error: t });
      throw t;
    }
  }
  /**
   * Log in an existing user via a third-party provider.
   * This method supports the PKCE flow.
   */
  async signInWithOAuth(e) {
    var t, i, n, a;
    return await this._handleProviderSignIn(e.provider, {
      redirectTo: (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo,
      scopes: (i = e.options) === null || i === void 0 ? void 0 : i.scopes,
      queryParams: (n = e.options) === null || n === void 0 ? void 0 : n.queryParams,
      skipBrowserRedirect: (a = e.options) === null || a === void 0 ? void 0 : a.skipBrowserRedirect
    });
  }
  /**
   * Log in an existing user by exchanging an Auth Code issued during the PKCE flow.
   */
  async exchangeCodeForSession(e) {
    return await this.initializePromise, this._acquireLock(this.lockAcquireTimeout, async () => this._exchangeCodeForSession(e));
  }
  /**
   * Signs in a user by verifying a message signed by the user's private key.
   * Supports Ethereum (via Sign-In-With-Ethereum) & Solana (Sign-In-With-Solana) standards,
   * both of which derive from the EIP-4361 standard
   * With slight variation on Solana's side.
   * @reference https://eips.ethereum.org/EIPS/eip-4361
   */
  async signInWithWeb3(e) {
    const { chain: t } = e;
    switch (t) {
      case "ethereum":
        return await this.signInWithEthereum(e);
      case "solana":
        return await this.signInWithSolana(e);
      default:
        throw new Error(`@supabase/auth-js: Unsupported chain "${t}"`);
    }
  }
  async signInWithEthereum(e) {
    var t, i, n, a, s, o, c, l, u, h, d;
    let f, p;
    if ("message" in e)
      f = e.message, p = e.signature;
    else {
      const { chain: m, wallet: g, statement: y, options: w } = e;
      let v;
      if (J())
        if (typeof g == "object")
          v = g;
        else {
          const U = window;
          if ("ethereum" in U && typeof U.ethereum == "object" && "request" in U.ethereum && typeof U.ethereum.request == "function")
            v = U.ethereum;
          else
            throw new Error("@supabase/auth-js: No compatible Ethereum wallet interface on the window object (window.ethereum) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'ethereum', wallet: resolvedUserWallet }) instead.");
        }
      else {
        if (typeof g != "object" || !(w != null && w.url))
          throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
        v = g;
      }
      const x = new URL((t = w == null ? void 0 : w.url) !== null && t !== void 0 ? t : window.location.href), S = await v.request({
        method: "eth_requestAccounts"
      }).then((U) => U).catch(() => {
        throw new Error("@supabase/auth-js: Wallet method eth_requestAccounts is missing or invalid");
      });
      if (!S || S.length === 0)
        throw new Error("@supabase/auth-js: No accounts available. Please ensure the wallet is connected.");
      const E = Vn(S[0]);
      let O = (i = w == null ? void 0 : w.signInWithEthereum) === null || i === void 0 ? void 0 : i.chainId;
      if (!O) {
        const U = await v.request({
          method: "eth_chainId"
        });
        O = Yl(U);
      }
      const k = {
        domain: x.host,
        address: E,
        statement: y,
        uri: x.href,
        version: "1",
        chainId: O,
        nonce: (n = w == null ? void 0 : w.signInWithEthereum) === null || n === void 0 ? void 0 : n.nonce,
        issuedAt: (s = (a = w == null ? void 0 : w.signInWithEthereum) === null || a === void 0 ? void 0 : a.issuedAt) !== null && s !== void 0 ? s : /* @__PURE__ */ new Date(),
        expirationTime: (o = w == null ? void 0 : w.signInWithEthereum) === null || o === void 0 ? void 0 : o.expirationTime,
        notBefore: (c = w == null ? void 0 : w.signInWithEthereum) === null || c === void 0 ? void 0 : c.notBefore,
        requestId: (l = w == null ? void 0 : w.signInWithEthereum) === null || l === void 0 ? void 0 : l.requestId,
        resources: (u = w == null ? void 0 : w.signInWithEthereum) === null || u === void 0 ? void 0 : u.resources
      };
      f = Ql(k), p = await v.request({
        method: "personal_sign",
        params: [Zl(f), E]
      });
    }
    try {
      const { data: m, error: g } = await I(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
        headers: this.headers,
        body: Object.assign({
          chain: "ethereum",
          message: f,
          signature: p
        }, !((h = e.options) === null || h === void 0) && h.captchaToken ? { gotrue_meta_security: { captcha_token: (d = e.options) === null || d === void 0 ? void 0 : d.captchaToken } } : null),
        xform: ue
      });
      if (g)
        throw g;
      if (!m || !m.session || !m.user) {
        const y = new He();
        return this._returnResult({ data: { user: null, session: null }, error: y });
      }
      return m.session && (await this._saveSession(m.session), await this._notifyAllSubscribers("SIGNED_IN", m.session)), this._returnResult({ data: Object.assign({}, m), error: g });
    } catch (m) {
      if (A(m))
        return this._returnResult({ data: { user: null, session: null }, error: m });
      throw m;
    }
  }
  async signInWithSolana(e) {
    var t, i, n, a, s, o, c, l, u, h, d, f;
    let p, m;
    if ("message" in e)
      p = e.message, m = e.signature;
    else {
      const { chain: g, wallet: y, statement: w, options: v } = e;
      let x;
      if (J())
        if (typeof y == "object")
          x = y;
        else {
          const E = window;
          if ("solana" in E && typeof E.solana == "object" && ("signIn" in E.solana && typeof E.solana.signIn == "function" || "signMessage" in E.solana && typeof E.solana.signMessage == "function"))
            x = E.solana;
          else
            throw new Error("@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.");
        }
      else {
        if (typeof y != "object" || !(v != null && v.url))
          throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
        x = y;
      }
      const S = new URL((t = v == null ? void 0 : v.url) !== null && t !== void 0 ? t : window.location.href);
      if ("signIn" in x && x.signIn) {
        const E = await x.signIn(Object.assign(Object.assign(Object.assign({ issuedAt: (/* @__PURE__ */ new Date()).toISOString() }, v == null ? void 0 : v.signInWithSolana), {
          // non-overridable properties
          version: "1",
          domain: S.host,
          uri: S.href
        }), w ? { statement: w } : null));
        let O;
        if (Array.isArray(E) && E[0] && typeof E[0] == "object")
          O = E[0];
        else if (E && typeof E == "object" && "signedMessage" in E && "signature" in E)
          O = E;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");
        if ("signedMessage" in O && "signature" in O && (typeof O.signedMessage == "string" || O.signedMessage instanceof Uint8Array) && O.signature instanceof Uint8Array)
          p = typeof O.signedMessage == "string" ? O.signedMessage : new TextDecoder().decode(O.signedMessage), m = O.signature;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields");
      } else {
        if (!("signMessage" in x) || typeof x.signMessage != "function" || !("publicKey" in x) || typeof x != "object" || !x.publicKey || !("toBase58" in x.publicKey) || typeof x.publicKey.toBase58 != "function")
          throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");
        p = [
          `${S.host} wants you to sign in with your Solana account:`,
          x.publicKey.toBase58(),
          ...w ? ["", w, ""] : [""],
          "Version: 1",
          `URI: ${S.href}`,
          `Issued At: ${(n = (i = v == null ? void 0 : v.signInWithSolana) === null || i === void 0 ? void 0 : i.issuedAt) !== null && n !== void 0 ? n : (/* @__PURE__ */ new Date()).toISOString()}`,
          ...!((a = v == null ? void 0 : v.signInWithSolana) === null || a === void 0) && a.notBefore ? [`Not Before: ${v.signInWithSolana.notBefore}`] : [],
          ...!((s = v == null ? void 0 : v.signInWithSolana) === null || s === void 0) && s.expirationTime ? [`Expiration Time: ${v.signInWithSolana.expirationTime}`] : [],
          ...!((o = v == null ? void 0 : v.signInWithSolana) === null || o === void 0) && o.chainId ? [`Chain ID: ${v.signInWithSolana.chainId}`] : [],
          ...!((c = v == null ? void 0 : v.signInWithSolana) === null || c === void 0) && c.nonce ? [`Nonce: ${v.signInWithSolana.nonce}`] : [],
          ...!((l = v == null ? void 0 : v.signInWithSolana) === null || l === void 0) && l.requestId ? [`Request ID: ${v.signInWithSolana.requestId}`] : [],
          ...!((h = (u = v == null ? void 0 : v.signInWithSolana) === null || u === void 0 ? void 0 : u.resources) === null || h === void 0) && h.length ? [
            "Resources",
            ...v.signInWithSolana.resources.map((O) => `- ${O}`)
          ] : []
        ].join(`
`);
        const E = await x.signMessage(new TextEncoder().encode(p), "utf8");
        if (!E || !(E instanceof Uint8Array))
          throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");
        m = E;
      }
    }
    try {
      const { data: g, error: y } = await I(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
        headers: this.headers,
        body: Object.assign({ chain: "solana", message: p, signature: Me(m) }, !((d = e.options) === null || d === void 0) && d.captchaToken ? { gotrue_meta_security: { captcha_token: (f = e.options) === null || f === void 0 ? void 0 : f.captchaToken } } : null),
        xform: ue
      });
      if (y)
        throw y;
      if (!g || !g.session || !g.user) {
        const w = new He();
        return this._returnResult({ data: { user: null, session: null }, error: w });
      }
      return g.session && (await this._saveSession(g.session), await this._notifyAllSubscribers("SIGNED_IN", g.session)), this._returnResult({ data: Object.assign({}, g), error: y });
    } catch (g) {
      if (A(g))
        return this._returnResult({ data: { user: null, session: null }, error: g });
      throw g;
    }
  }
  async _exchangeCodeForSession(e) {
    const t = await je(this.storage, `${this.storageKey}-code-verifier`), [i, n] = (t ?? "").split("/");
    try {
      if (!i && this.flowType === "pkce")
        throw new vl();
      const { data: a, error: s } = await I(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, {
        headers: this.headers,
        body: {
          auth_code: e,
          code_verifier: i
        },
        xform: ue
      });
      if (await X(this.storage, `${this.storageKey}-code-verifier`), s)
        throw s;
      if (!a || !a.session || !a.user) {
        const o = new He();
        return this._returnResult({
          data: { user: null, session: null, redirectType: null },
          error: o
        });
      }
      return a.session && (await this._saveSession(a.session), await this._notifyAllSubscribers("SIGNED_IN", a.session)), this._returnResult({ data: Object.assign(Object.assign({}, a), { redirectType: n ?? null }), error: s });
    } catch (a) {
      if (await X(this.storage, `${this.storageKey}-code-verifier`), A(a))
        return this._returnResult({
          data: { user: null, session: null, redirectType: null },
          error: a
        });
      throw a;
    }
  }
  /**
   * Allows signing in with an OIDC ID token. The authentication provider used
   * should be enabled and configured.
   */
  async signInWithIdToken(e) {
    try {
      const { options: t, provider: i, token: n, access_token: a, nonce: s } = e, o = await I(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
        headers: this.headers,
        body: {
          provider: i,
          id_token: n,
          access_token: a,
          nonce: s,
          gotrue_meta_security: { captcha_token: t == null ? void 0 : t.captchaToken }
        },
        xform: ue
      }), { data: c, error: l } = o;
      if (l)
        return this._returnResult({ data: { user: null, session: null }, error: l });
      if (!c || !c.session || !c.user) {
        const u = new He();
        return this._returnResult({ data: { user: null, session: null }, error: u });
      }
      return c.session && (await this._saveSession(c.session), await this._notifyAllSubscribers("SIGNED_IN", c.session)), this._returnResult({ data: c, error: l });
    } catch (t) {
      if (A(t))
        return this._returnResult({ data: { user: null, session: null }, error: t });
      throw t;
    }
  }
  /**
   * Log in a user using magiclink or a one-time password (OTP).
   *
   * If the `{{ .ConfirmationURL }}` variable is specified in the email template, a magiclink will be sent.
   * If the `{{ .Token }}` variable is specified in the email template, an OTP will be sent.
   * If you're using phone sign-ins, only an OTP will be sent. You won't be able to send a magiclink for phone sign-ins.
   *
   * Be aware that you may get back an error message that will not distinguish
   * between the cases where the account does not exist or, that the account
   * can only be accessed via social login.
   *
   * Do note that you will need to configure a Whatsapp sender on Twilio
   * if you are using phone sign in with the 'whatsapp' channel. The whatsapp
   * channel is not supported on other providers
   * at this time.
   * This method supports PKCE when an email is passed.
   */
  async signInWithOtp(e) {
    var t, i, n, a, s;
    try {
      if ("email" in e) {
        const { email: o, options: c } = e;
        let l = null, u = null;
        this.flowType === "pkce" && ([l, u] = await Xe(this.storage, this.storageKey));
        const { error: h } = await I(this.fetch, "POST", `${this.url}/otp`, {
          headers: this.headers,
          body: {
            email: o,
            data: (t = c == null ? void 0 : c.data) !== null && t !== void 0 ? t : {},
            create_user: (i = c == null ? void 0 : c.shouldCreateUser) !== null && i !== void 0 ? i : !0,
            gotrue_meta_security: { captcha_token: c == null ? void 0 : c.captchaToken },
            code_challenge: l,
            code_challenge_method: u
          },
          redirectTo: c == null ? void 0 : c.emailRedirectTo
        });
        return this._returnResult({ data: { user: null, session: null }, error: h });
      }
      if ("phone" in e) {
        const { phone: o, options: c } = e, { data: l, error: u } = await I(this.fetch, "POST", `${this.url}/otp`, {
          headers: this.headers,
          body: {
            phone: o,
            data: (n = c == null ? void 0 : c.data) !== null && n !== void 0 ? n : {},
            create_user: (a = c == null ? void 0 : c.shouldCreateUser) !== null && a !== void 0 ? a : !0,
            gotrue_meta_security: { captcha_token: c == null ? void 0 : c.captchaToken },
            channel: (s = c == null ? void 0 : c.channel) !== null && s !== void 0 ? s : "sms"
          }
        });
        return this._returnResult({
          data: { user: null, session: null, messageId: l == null ? void 0 : l.message_id },
          error: u
        });
      }
      throw new Jt("You must provide either an email or phone number.");
    } catch (o) {
      if (await X(this.storage, `${this.storageKey}-code-verifier`), A(o))
        return this._returnResult({ data: { user: null, session: null }, error: o });
      throw o;
    }
  }
  /**
   * Log in a user given a User supplied OTP or TokenHash received through mobile or email.
   */
  async verifyOtp(e) {
    var t, i;
    try {
      let n, a;
      "options" in e && (n = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo, a = (i = e.options) === null || i === void 0 ? void 0 : i.captchaToken);
      const { data: s, error: o } = await I(this.fetch, "POST", `${this.url}/verify`, {
        headers: this.headers,
        body: Object.assign(Object.assign({}, e), { gotrue_meta_security: { captcha_token: a } }),
        redirectTo: n,
        xform: ue
      });
      if (o)
        throw o;
      if (!s)
        throw new Error("An error occurred on token verification.");
      const c = s.session, l = s.user;
      return c != null && c.access_token && (await this._saveSession(c), await this._notifyAllSubscribers(e.type == "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", c)), this._returnResult({ data: { user: l, session: c }, error: null });
    } catch (n) {
      if (A(n))
        return this._returnResult({ data: { user: null, session: null }, error: n });
      throw n;
    }
  }
  /**
   * Attempts a single-sign on using an enterprise Identity Provider. A
   * successful SSO attempt will redirect the current page to the identity
   * provider authorization page. The redirect URL is implementation and SSO
   * protocol specific.
   *
   * You can use it by providing a SSO domain. Typically you can extract this
   * domain by asking users for their email address. If this domain is
   * registered on the Auth instance the redirect will use that organization's
   * currently active SSO Identity Provider for the login.
   *
   * If you have built an organization-specific login page, you can use the
   * organization's SSO Identity Provider UUID directly instead.
   */
  async signInWithSSO(e) {
    var t, i, n, a, s;
    try {
      let o = null, c = null;
      this.flowType === "pkce" && ([o, c] = await Xe(this.storage, this.storageKey));
      const l = await I(this.fetch, "POST", `${this.url}/sso`, {
        body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in e ? { provider_id: e.providerId } : null), "domain" in e ? { domain: e.domain } : null), { redirect_to: (i = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo) !== null && i !== void 0 ? i : void 0 }), !((n = e == null ? void 0 : e.options) === null || n === void 0) && n.captchaToken ? { gotrue_meta_security: { captcha_token: e.options.captchaToken } } : null), { skip_http_redirect: !0, code_challenge: o, code_challenge_method: c }),
        headers: this.headers,
        xform: Gl
      });
      return !((a = l.data) === null || a === void 0) && a.url && J() && !(!((s = e.options) === null || s === void 0) && s.skipBrowserRedirect) && window.location.assign(l.data.url), this._returnResult(l);
    } catch (o) {
      if (await X(this.storage, `${this.storageKey}-code-verifier`), A(o))
        return this._returnResult({ data: null, error: o });
      throw o;
    }
  }
  /**
   * Sends a reauthentication OTP to the user's email or phone number.
   * Requires the user to be signed-in.
   */
  async reauthenticate() {
    return await this.initializePromise, await this._acquireLock(this.lockAcquireTimeout, async () => await this._reauthenticate());
  }
  async _reauthenticate() {
    try {
      return await this._useSession(async (e) => {
        const { data: { session: t }, error: i } = e;
        if (i)
          throw i;
        if (!t)
          throw new se();
        const { error: n } = await I(this.fetch, "GET", `${this.url}/reauthenticate`, {
          headers: this.headers,
          jwt: t.access_token
        });
        return this._returnResult({ data: { user: null, session: null }, error: n });
      });
    } catch (e) {
      if (A(e))
        return this._returnResult({ data: { user: null, session: null }, error: e });
      throw e;
    }
  }
  /**
   * Resends an existing signup confirmation email, email change email, SMS OTP or phone change OTP.
   */
  async resend(e) {
    try {
      const t = `${this.url}/resend`;
      if ("email" in e) {
        const { email: i, type: n, options: a } = e, { error: s } = await I(this.fetch, "POST", t, {
          headers: this.headers,
          body: {
            email: i,
            type: n,
            gotrue_meta_security: { captcha_token: a == null ? void 0 : a.captchaToken }
          },
          redirectTo: a == null ? void 0 : a.emailRedirectTo
        });
        return this._returnResult({ data: { user: null, session: null }, error: s });
      } else if ("phone" in e) {
        const { phone: i, type: n, options: a } = e, { data: s, error: o } = await I(this.fetch, "POST", t, {
          headers: this.headers,
          body: {
            phone: i,
            type: n,
            gotrue_meta_security: { captcha_token: a == null ? void 0 : a.captchaToken }
          }
        });
        return this._returnResult({
          data: { user: null, session: null, messageId: s == null ? void 0 : s.message_id },
          error: o
        });
      }
      throw new Jt("You must provide either an email or phone number and a type");
    } catch (t) {
      if (A(t))
        return this._returnResult({ data: { user: null, session: null }, error: t });
      throw t;
    }
  }
  /**
   * Returns the session, refreshing it if necessary.
   *
   * The session returned can be null if the session is not detected which can happen in the event a user is not signed-in or has logged out.
   *
   * **IMPORTANT:** This method loads values directly from the storage attached
   * to the client. If that storage is based on request cookies for example,
   * the values in it may not be authentic and therefore it's strongly advised
   * against using this method and its results in such circumstances. A warning
   * will be emitted if this is detected. Use {@link #getUser()} instead.
   */
  async getSession() {
    return await this.initializePromise, await this._acquireLock(this.lockAcquireTimeout, async () => this._useSession(async (t) => t));
  }
  /**
   * Acquires a global lock based on the storage key.
   */
  async _acquireLock(e, t) {
    this._debug("#_acquireLock", "begin", e);
    try {
      if (this.lockAcquired) {
        const i = this.pendingInLock.length ? this.pendingInLock[this.pendingInLock.length - 1] : Promise.resolve(), n = (async () => (await i, await t()))();
        return this.pendingInLock.push((async () => {
          try {
            await n;
          } catch {
          }
        })()), n;
      }
      return await this.lock(`lock:${this.storageKey}`, e, async () => {
        this._debug("#_acquireLock", "lock acquired for storage key", this.storageKey);
        try {
          this.lockAcquired = !0;
          const i = t();
          for (this.pendingInLock.push((async () => {
            try {
              await i;
            } catch {
            }
          })()), await i; this.pendingInLock.length; ) {
            const n = [...this.pendingInLock];
            await Promise.all(n), this.pendingInLock.splice(0, n.length);
          }
          return await i;
        } finally {
          this._debug("#_acquireLock", "lock released for storage key", this.storageKey), this.lockAcquired = !1;
        }
      });
    } finally {
      this._debug("#_acquireLock", "end");
    }
  }
  /**
   * Use instead of {@link #getSession} inside the library. It is
   * semantically usually what you want, as getting a session involves some
   * processing afterwards that requires only one client operating on the
   * session at once across multiple tabs or processes.
   */
  async _useSession(e) {
    this._debug("#_useSession", "begin");
    try {
      const t = await this.__loadSession();
      return await e(t);
    } finally {
      this._debug("#_useSession", "end");
    }
  }
  /**
   * NEVER USE DIRECTLY!
   *
   * Always use {@link #_useSession}.
   */
  async __loadSession() {
    this._debug("#__loadSession()", "begin"), this.lockAcquired || this._debug("#__loadSession()", "used outside of an acquired lock!", new Error().stack);
    try {
      let e = null;
      const t = await je(this.storage, this.storageKey);
      if (this._debug("#getSession()", "session from storage", t), t !== null && (this._isValidSession(t) ? e = t : (this._debug("#getSession()", "session from storage is not valid"), await this._removeSession())), !e)
        return { data: { session: null }, error: null };
      const i = e.expires_at ? e.expires_at * 1e3 - Date.now() < Ar : !1;
      if (this._debug("#__loadSession()", `session has${i ? "" : " not"} expired`, "expires_at", e.expires_at), !i) {
        if (this.userStorage) {
          const s = await je(this.userStorage, this.storageKey + "-user");
          s != null && s.user ? e.user = s.user : e.user = Cr();
        }
        if (this.storage.isServer && e.user && !e.user.__isUserNotAvailableProxy) {
          const s = { value: this.suppressGetSessionWarning };
          e.user = Ml(e.user, s), s.value && (this.suppressGetSessionWarning = !0);
        }
        return { data: { session: e }, error: null };
      }
      const { data: n, error: a } = await this._callRefreshToken(e.refresh_token);
      return a ? this._returnResult({ data: { session: null }, error: a }) : this._returnResult({ data: { session: n }, error: null });
    } finally {
      this._debug("#__loadSession()", "end");
    }
  }
  /**
   * Gets the current user details if there is an existing session. This method
   * performs a network request to the Supabase Auth server, so the returned
   * value is authentic and can be used to base authorization rules on.
   *
   * @param jwt Takes in an optional access token JWT. If no JWT is provided, the JWT from the current session is used.
   */
  async getUser(e) {
    if (e)
      return await this._getUser(e);
    await this.initializePromise;
    const t = await this._acquireLock(this.lockAcquireTimeout, async () => await this._getUser());
    return t.data.user && (this.suppressGetSessionWarning = !0), t;
  }
  async _getUser(e) {
    try {
      return e ? await I(this.fetch, "GET", `${this.url}/user`, {
        headers: this.headers,
        jwt: e,
        xform: Re
      }) : await this._useSession(async (t) => {
        var i, n, a;
        const { data: s, error: o } = t;
        if (o)
          throw o;
        return !(!((i = s.session) === null || i === void 0) && i.access_token) && !this.hasCustomAuthorizationHeader ? { data: { user: null }, error: new se() } : await I(this.fetch, "GET", `${this.url}/user`, {
          headers: this.headers,
          jwt: (a = (n = s.session) === null || n === void 0 ? void 0 : n.access_token) !== null && a !== void 0 ? a : void 0,
          xform: Re
        });
      });
    } catch (t) {
      if (A(t))
        return Ir(t) && (await this._removeSession(), await X(this.storage, `${this.storageKey}-code-verifier`)), this._returnResult({ data: { user: null }, error: t });
      throw t;
    }
  }
  /**
   * Updates user data for a logged in user.
   */
  async updateUser(e, t = {}) {
    return await this.initializePromise, await this._acquireLock(this.lockAcquireTimeout, async () => await this._updateUser(e, t));
  }
  async _updateUser(e, t = {}) {
    try {
      return await this._useSession(async (i) => {
        const { data: n, error: a } = i;
        if (a)
          throw a;
        if (!n.session)
          throw new se();
        const s = n.session;
        let o = null, c = null;
        this.flowType === "pkce" && e.email != null && ([o, c] = await Xe(this.storage, this.storageKey));
        const { data: l, error: u } = await I(this.fetch, "PUT", `${this.url}/user`, {
          headers: this.headers,
          redirectTo: t == null ? void 0 : t.emailRedirectTo,
          body: Object.assign(Object.assign({}, e), { code_challenge: o, code_challenge_method: c }),
          jwt: s.access_token,
          xform: Re
        });
        if (u)
          throw u;
        return s.user = l.user, await this._saveSession(s), await this._notifyAllSubscribers("USER_UPDATED", s), this._returnResult({ data: { user: s.user }, error: null });
      });
    } catch (i) {
      if (await X(this.storage, `${this.storageKey}-code-verifier`), A(i))
        return this._returnResult({ data: { user: null }, error: i });
      throw i;
    }
  }
  /**
   * Sets the session data from the current session. If the current session is expired, setSession will take care of refreshing it to obtain a new session.
   * If the refresh token or access token in the current session is invalid, an error will be thrown.
   * @param currentSession The current session that minimally contains an access token and refresh token.
   */
  async setSession(e) {
    return await this.initializePromise, await this._acquireLock(this.lockAcquireTimeout, async () => await this._setSession(e));
  }
  async _setSession(e) {
    try {
      if (!e.access_token || !e.refresh_token)
        throw new se();
      const t = Date.now() / 1e3;
      let i = t, n = !0, a = null;
      const { payload: s } = Zt(e.access_token);
      if (s.exp && (i = s.exp, n = i <= t), n) {
        const { data: o, error: c } = await this._callRefreshToken(e.refresh_token);
        if (c)
          return this._returnResult({ data: { user: null, session: null }, error: c });
        if (!o)
          return { data: { user: null, session: null }, error: null };
        a = o;
      } else {
        const { data: o, error: c } = await this._getUser(e.access_token);
        if (c)
          return this._returnResult({ data: { user: null, session: null }, error: c });
        a = {
          access_token: e.access_token,
          refresh_token: e.refresh_token,
          user: o.user,
          token_type: "bearer",
          expires_in: i - t,
          expires_at: i
        }, await this._saveSession(a), await this._notifyAllSubscribers("SIGNED_IN", a);
      }
      return this._returnResult({ data: { user: a.user, session: a }, error: null });
    } catch (t) {
      if (A(t))
        return this._returnResult({ data: { session: null, user: null }, error: t });
      throw t;
    }
  }
  /**
   * Returns a new session, regardless of expiry status.
   * Takes in an optional current session. If not passed in, then refreshSession() will attempt to retrieve it from getSession().
   * If the current session's refresh token is invalid, an error will be thrown.
   * @param currentSession The current session. If passed in, it must contain a refresh token.
   */
  async refreshSession(e) {
    return await this.initializePromise, await this._acquireLock(this.lockAcquireTimeout, async () => await this._refreshSession(e));
  }
  async _refreshSession(e) {
    try {
      return await this._useSession(async (t) => {
        var i;
        if (!e) {
          const { data: s, error: o } = t;
          if (o)
            throw o;
          e = (i = s.session) !== null && i !== void 0 ? i : void 0;
        }
        if (!(e != null && e.refresh_token))
          throw new se();
        const { data: n, error: a } = await this._callRefreshToken(e.refresh_token);
        return a ? this._returnResult({ data: { user: null, session: null }, error: a }) : n ? this._returnResult({ data: { user: n.user, session: n }, error: null }) : this._returnResult({ data: { user: null, session: null }, error: null });
      });
    } catch (t) {
      if (A(t))
        return this._returnResult({ data: { user: null, session: null }, error: t });
      throw t;
    }
  }
  /**
   * Gets the session data from a URL string
   */
  async _getSessionFromURL(e, t) {
    try {
      if (!J())
        throw new Yt("No browser detected.");
      if (e.error || e.error_description || e.error_code)
        throw new Yt(e.error_description || "Error in URL with unspecified error_description", {
          error: e.error || "unspecified_error",
          code: e.error_code || "unspecified_code"
        });
      switch (t) {
        case "implicit":
          if (this.flowType === "pkce")
            throw new ji("Not a valid PKCE flow url.");
          break;
        case "pkce":
          if (this.flowType === "implicit")
            throw new Yt("Not a valid implicit grant flow url.");
          break;
        default:
      }
      if (t === "pkce") {
        if (this._debug("#_initialize()", "begin", "is PKCE flow", !0), !e.code)
          throw new ji("No code detected.");
        const { data: w, error: v } = await this._exchangeCodeForSession(e.code);
        if (v)
          throw v;
        const x = new URL(window.location.href);
        return x.searchParams.delete("code"), window.history.replaceState(window.history.state, "", x.toString()), { data: { session: w.session, redirectType: null }, error: null };
      }
      const { provider_token: i, provider_refresh_token: n, access_token: a, refresh_token: s, expires_in: o, expires_at: c, token_type: l } = e;
      if (!a || !o || !s || !l)
        throw new Yt("No session defined in URL");
      const u = Math.round(Date.now() / 1e3), h = parseInt(o);
      let d = u + h;
      c && (d = parseInt(c));
      const f = d - u;
      f * 1e3 <= et && console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${f}s, should have been closer to ${h}s`);
      const p = d - h;
      u - p >= 120 ? console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale", p, d, u) : u - p < 0 && console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew", p, d, u);
      const { data: m, error: g } = await this._getUser(a);
      if (g)
        throw g;
      const y = {
        provider_token: i,
        provider_refresh_token: n,
        access_token: a,
        expires_in: h,
        expires_at: d,
        refresh_token: s,
        token_type: l,
        user: m.user
      };
      return window.location.hash = "", this._debug("#_getSessionFromURL()", "clearing window.location.hash"), this._returnResult({ data: { session: y, redirectType: e.type }, error: null });
    } catch (i) {
      if (A(i))
        return this._returnResult({ data: { session: null, redirectType: null }, error: i });
      throw i;
    }
  }
  /**
   * Checks if the current URL contains parameters given by an implicit oauth grant flow (https://www.rfc-editor.org/rfc/rfc6749.html#section-4.2)
   *
   * If `detectSessionInUrl` is a function, it will be called with the URL and params to determine
   * if the URL should be processed as a Supabase auth callback. This allows users to exclude
   * URLs from other OAuth providers (e.g., Facebook Login) that also return access_token in the fragment.
   */
  _isImplicitGrantCallback(e) {
    return typeof this.detectSessionInUrl == "function" ? this.detectSessionInUrl(new URL(window.location.href), e) : !!(e.access_token || e.error_description);
  }
  /**
   * Checks if the current URL and backing storage contain parameters given by a PKCE flow
   */
  async _isPKCECallback(e) {
    const t = await je(this.storage, `${this.storageKey}-code-verifier`);
    return !!(e.code && t);
  }
  /**
   * Inside a browser context, `signOut()` will remove the logged in user from the browser session and log them out - removing all items from localstorage and then trigger a `"SIGNED_OUT"` event.
   *
   * For server-side management, you can revoke all refresh tokens for a user by passing a user's JWT through to `auth.api.signOut(JWT: string)`.
   * There is no way to revoke a user's access token jwt until it expires. It is recommended to set a shorter expiry on the jwt for this reason.
   *
   * If using `others` scope, no `SIGNED_OUT` event is fired!
   */
  async signOut(e = { scope: "global" }) {
    return await this.initializePromise, await this._acquireLock(this.lockAcquireTimeout, async () => await this._signOut(e));
  }
  async _signOut({ scope: e } = { scope: "global" }) {
    return await this._useSession(async (t) => {
      var i;
      const { data: n, error: a } = t;
      if (a && !Ir(a))
        return this._returnResult({ error: a });
      const s = (i = n.session) === null || i === void 0 ? void 0 : i.access_token;
      if (s) {
        const { error: o } = await this.admin.signOut(s, e);
        if (o && !(yl(o) && (o.status === 404 || o.status === 401 || o.status === 403) || Ir(o)))
          return this._returnResult({ error: o });
      }
      return e !== "others" && (await this._removeSession(), await X(this.storage, `${this.storageKey}-code-verifier`)), this._returnResult({ error: null });
    });
  }
  onAuthStateChange(e) {
    const t = El(), i = {
      id: t,
      callback: e,
      unsubscribe: () => {
        this._debug("#unsubscribe()", "state change callback with id removed", t), this.stateChangeEmitters.delete(t);
      }
    };
    return this._debug("#onAuthStateChange()", "registered callback with id", t), this.stateChangeEmitters.set(t, i), (async () => (await this.initializePromise, await this._acquireLock(this.lockAcquireTimeout, async () => {
      this._emitInitialSession(t);
    })))(), { data: { subscription: i } };
  }
  async _emitInitialSession(e) {
    return await this._useSession(async (t) => {
      var i, n;
      try {
        const { data: { session: a }, error: s } = t;
        if (s)
          throw s;
        await ((i = this.stateChangeEmitters.get(e)) === null || i === void 0 ? void 0 : i.callback("INITIAL_SESSION", a)), this._debug("INITIAL_SESSION", "callback id", e, "session", a);
      } catch (a) {
        await ((n = this.stateChangeEmitters.get(e)) === null || n === void 0 ? void 0 : n.callback("INITIAL_SESSION", null)), this._debug("INITIAL_SESSION", "callback id", e, "error", a), console.error(a);
      }
    });
  }
  /**
   * Sends a password reset request to an email address. This method supports the PKCE flow.
   *
   * @param email The email address of the user.
   * @param options.redirectTo The URL to send the user to after they click the password reset link.
   * @param options.captchaToken Verification token received when the user completes the captcha on the site.
   */
  async resetPasswordForEmail(e, t = {}) {
    let i = null, n = null;
    this.flowType === "pkce" && ([i, n] = await Xe(
      this.storage,
      this.storageKey,
      !0
      // isPasswordRecovery
    ));
    try {
      return await I(this.fetch, "POST", `${this.url}/recover`, {
        body: {
          email: e,
          code_challenge: i,
          code_challenge_method: n,
          gotrue_meta_security: { captcha_token: t.captchaToken }
        },
        headers: this.headers,
        redirectTo: t.redirectTo
      });
    } catch (a) {
      if (await X(this.storage, `${this.storageKey}-code-verifier`), A(a))
        return this._returnResult({ data: null, error: a });
      throw a;
    }
  }
  /**
   * Gets all the identities linked to a user.
   */
  async getUserIdentities() {
    var e;
    try {
      const { data: t, error: i } = await this.getUser();
      if (i)
        throw i;
      return this._returnResult({ data: { identities: (e = t.user.identities) !== null && e !== void 0 ? e : [] }, error: null });
    } catch (t) {
      if (A(t))
        return this._returnResult({ data: null, error: t });
      throw t;
    }
  }
  async linkIdentity(e) {
    return "token" in e ? this.linkIdentityIdToken(e) : this.linkIdentityOAuth(e);
  }
  async linkIdentityOAuth(e) {
    var t;
    try {
      const { data: i, error: n } = await this._useSession(async (a) => {
        var s, o, c, l, u;
        const { data: h, error: d } = a;
        if (d)
          throw d;
        const f = await this._getUrlForProvider(`${this.url}/user/identities/authorize`, e.provider, {
          redirectTo: (s = e.options) === null || s === void 0 ? void 0 : s.redirectTo,
          scopes: (o = e.options) === null || o === void 0 ? void 0 : o.scopes,
          queryParams: (c = e.options) === null || c === void 0 ? void 0 : c.queryParams,
          skipBrowserRedirect: !0
        });
        return await I(this.fetch, "GET", f, {
          headers: this.headers,
          jwt: (u = (l = h.session) === null || l === void 0 ? void 0 : l.access_token) !== null && u !== void 0 ? u : void 0
        });
      });
      if (n)
        throw n;
      return J() && !(!((t = e.options) === null || t === void 0) && t.skipBrowserRedirect) && window.location.assign(i == null ? void 0 : i.url), this._returnResult({
        data: { provider: e.provider, url: i == null ? void 0 : i.url },
        error: null
      });
    } catch (i) {
      if (A(i))
        return this._returnResult({ data: { provider: e.provider, url: null }, error: i });
      throw i;
    }
  }
  async linkIdentityIdToken(e) {
    return await this._useSession(async (t) => {
      var i;
      try {
        const { error: n, data: { session: a } } = t;
        if (n)
          throw n;
        const { options: s, provider: o, token: c, access_token: l, nonce: u } = e, h = await I(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
          headers: this.headers,
          jwt: (i = a == null ? void 0 : a.access_token) !== null && i !== void 0 ? i : void 0,
          body: {
            provider: o,
            id_token: c,
            access_token: l,
            nonce: u,
            link_identity: !0,
            gotrue_meta_security: { captcha_token: s == null ? void 0 : s.captchaToken }
          },
          xform: ue
        }), { data: d, error: f } = h;
        return f ? this._returnResult({ data: { user: null, session: null }, error: f }) : !d || !d.session || !d.user ? this._returnResult({
          data: { user: null, session: null },
          error: new He()
        }) : (d.session && (await this._saveSession(d.session), await this._notifyAllSubscribers("USER_UPDATED", d.session)), this._returnResult({ data: d, error: f }));
      } catch (n) {
        if (await X(this.storage, `${this.storageKey}-code-verifier`), A(n))
          return this._returnResult({ data: { user: null, session: null }, error: n });
        throw n;
      }
    });
  }
  /**
   * Unlinks an identity from a user by deleting it. The user will no longer be able to sign in with that identity once it's unlinked.
   */
  async unlinkIdentity(e) {
    try {
      return await this._useSession(async (t) => {
        var i, n;
        const { data: a, error: s } = t;
        if (s)
          throw s;
        return await I(this.fetch, "DELETE", `${this.url}/user/identities/${e.identity_id}`, {
          headers: this.headers,
          jwt: (n = (i = a.session) === null || i === void 0 ? void 0 : i.access_token) !== null && n !== void 0 ? n : void 0
        });
      });
    } catch (t) {
      if (A(t))
        return this._returnResult({ data: null, error: t });
      throw t;
    }
  }
  /**
   * Generates a new JWT.
   * @param refreshToken A valid refresh token that was returned on login.
   */
  async _refreshAccessToken(e) {
    const t = `#_refreshAccessToken(${e.substring(0, 5)}...)`;
    this._debug(t, "begin");
    try {
      const i = Date.now();
      return await Cl(async (n) => (n > 0 && await Rl(200 * Math.pow(2, n - 1)), this._debug(t, "refreshing attempt", n), await I(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, {
        body: { refresh_token: e },
        headers: this.headers,
        xform: ue
      })), (n, a) => {
        const s = 200 * Math.pow(2, n);
        return a && Rr(a) && // retryable only if the request can be sent before the backoff overflows the tick duration
        Date.now() + s - i < et;
      });
    } catch (i) {
      if (this._debug(t, "error", i), A(i))
        return this._returnResult({ data: { session: null, user: null }, error: i });
      throw i;
    } finally {
      this._debug(t, "end");
    }
  }
  _isValidSession(e) {
    return typeof e == "object" && e !== null && "access_token" in e && "refresh_token" in e && "expires_at" in e;
  }
  async _handleProviderSignIn(e, t) {
    const i = await this._getUrlForProvider(`${this.url}/authorize`, e, {
      redirectTo: t.redirectTo,
      scopes: t.scopes,
      queryParams: t.queryParams
    });
    return this._debug("#_handleProviderSignIn()", "provider", e, "options", t, "url", i), J() && !t.skipBrowserRedirect && window.location.assign(i), { data: { provider: e, url: i }, error: null };
  }
  /**
   * Recovers the session from LocalStorage and refreshes the token
   * Note: this method is async to accommodate for AsyncStorage e.g. in React native.
   */
  async _recoverAndRefresh() {
    var e, t;
    const i = "#_recoverAndRefresh()";
    this._debug(i, "begin");
    try {
      const n = await je(this.storage, this.storageKey);
      if (n && this.userStorage) {
        let s = await je(this.userStorage, this.storageKey + "-user");
        !this.storage.isServer && Object.is(this.storage, this.userStorage) && !s && (s = { user: n.user }, await tt(this.userStorage, this.storageKey + "-user", s)), n.user = (e = s == null ? void 0 : s.user) !== null && e !== void 0 ? e : Cr();
      } else if (n && !n.user && !n.user) {
        const s = await je(this.storage, this.storageKey + "-user");
        s && (s != null && s.user) ? (n.user = s.user, await X(this.storage, this.storageKey + "-user"), await tt(this.storage, this.storageKey, n)) : n.user = Cr();
      }
      if (this._debug(i, "session from storage", n), !this._isValidSession(n)) {
        this._debug(i, "session is not valid"), n !== null && await this._removeSession();
        return;
      }
      const a = ((t = n.expires_at) !== null && t !== void 0 ? t : 1 / 0) * 1e3 - Date.now() < Ar;
      if (this._debug(i, `session has${a ? "" : " not"} expired with margin of ${Ar}s`), a) {
        if (this.autoRefreshToken && n.refresh_token) {
          const { error: s } = await this._callRefreshToken(n.refresh_token);
          s && (console.error(s), Rr(s) || (this._debug(i, "refresh failed with a non-retryable error, removing the session", s), await this._removeSession()));
        }
      } else if (n.user && n.user.__isUserNotAvailableProxy === !0)
        try {
          const { data: s, error: o } = await this._getUser(n.access_token);
          !o && (s != null && s.user) ? (n.user = s.user, await this._saveSession(n), await this._notifyAllSubscribers("SIGNED_IN", n)) : this._debug(i, "could not get user data, skipping SIGNED_IN notification");
        } catch (s) {
          console.error("Error getting user data:", s), this._debug(i, "error getting user data, skipping SIGNED_IN notification", s);
        }
      else
        await this._notifyAllSubscribers("SIGNED_IN", n);
    } catch (n) {
      this._debug(i, "error", n), console.error(n);
      return;
    } finally {
      this._debug(i, "end");
    }
  }
  async _callRefreshToken(e) {
    var t, i;
    if (!e)
      throw new se();
    if (this.refreshingDeferred)
      return this.refreshingDeferred.promise;
    const n = `#_callRefreshToken(${e.substring(0, 5)}...)`;
    this._debug(n, "begin");
    try {
      this.refreshingDeferred = new mr();
      const { data: a, error: s } = await this._refreshAccessToken(e);
      if (s)
        throw s;
      if (!a.session)
        throw new se();
      await this._saveSession(a.session), await this._notifyAllSubscribers("TOKEN_REFRESHED", a.session);
      const o = { data: a.session, error: null };
      return this.refreshingDeferred.resolve(o), o;
    } catch (a) {
      if (this._debug(n, "error", a), A(a)) {
        const s = { data: null, error: a };
        return Rr(a) || await this._removeSession(), (t = this.refreshingDeferred) === null || t === void 0 || t.resolve(s), s;
      }
      throw (i = this.refreshingDeferred) === null || i === void 0 || i.reject(a), a;
    } finally {
      this.refreshingDeferred = null, this._debug(n, "end");
    }
  }
  async _notifyAllSubscribers(e, t, i = !0) {
    const n = `#_notifyAllSubscribers(${e})`;
    this._debug(n, "begin", t, `broadcast = ${i}`);
    try {
      this.broadcastChannel && i && this.broadcastChannel.postMessage({ event: e, session: t });
      const a = [], s = Array.from(this.stateChangeEmitters.values()).map(async (o) => {
        try {
          await o.callback(e, t);
        } catch (c) {
          a.push(c);
        }
      });
      if (await Promise.all(s), a.length > 0) {
        for (let o = 0; o < a.length; o += 1)
          console.error(a[o]);
        throw a[0];
      }
    } finally {
      this._debug(n, "end");
    }
  }
  /**
   * set currentSession and currentUser
   * process to _startAutoRefreshToken if possible
   */
  async _saveSession(e) {
    this._debug("#_saveSession()", e), this.suppressGetSessionWarning = !0, await X(this.storage, `${this.storageKey}-code-verifier`);
    const t = Object.assign({}, e), i = t.user && t.user.__isUserNotAvailableProxy === !0;
    if (this.userStorage) {
      !i && t.user && await tt(this.userStorage, this.storageKey + "-user", {
        user: t.user
      });
      const n = Object.assign({}, t);
      delete n.user;
      const a = Fi(n);
      await tt(this.storage, this.storageKey, a);
    } else {
      const n = Fi(t);
      await tt(this.storage, this.storageKey, n);
    }
  }
  async _removeSession() {
    this._debug("#_removeSession()"), this.suppressGetSessionWarning = !1, await X(this.storage, this.storageKey), await X(this.storage, this.storageKey + "-code-verifier"), await X(this.storage, this.storageKey + "-user"), this.userStorage && await X(this.userStorage, this.storageKey + "-user"), await this._notifyAllSubscribers("SIGNED_OUT", null);
  }
  /**
   * Removes any registered visibilitychange callback.
   *
   * {@see #startAutoRefresh}
   * {@see #stopAutoRefresh}
   */
  _removeVisibilityChangedCallback() {
    this._debug("#_removeVisibilityChangedCallback()");
    const e = this.visibilityChangedCallback;
    this.visibilityChangedCallback = null;
    try {
      e && J() && (window != null && window.removeEventListener) && window.removeEventListener("visibilitychange", e);
    } catch (t) {
      console.error("removing visibilitychange callback failed", t);
    }
  }
  /**
   * This is the private implementation of {@link #startAutoRefresh}. Use this
   * within the library.
   */
  async _startAutoRefresh() {
    await this._stopAutoRefresh(), this._debug("#_startAutoRefresh()");
    const e = setInterval(() => this._autoRefreshTokenTick(), et);
    this.autoRefreshTicker = e, e && typeof e == "object" && typeof e.unref == "function" ? e.unref() : typeof Deno < "u" && typeof Deno.unrefTimer == "function" && Deno.unrefTimer(e);
    const t = setTimeout(async () => {
      await this.initializePromise, await this._autoRefreshTokenTick();
    }, 0);
    this.autoRefreshTickTimeout = t, t && typeof t == "object" && typeof t.unref == "function" ? t.unref() : typeof Deno < "u" && typeof Deno.unrefTimer == "function" && Deno.unrefTimer(t);
  }
  /**
   * This is the private implementation of {@link #stopAutoRefresh}. Use this
   * within the library.
   */
  async _stopAutoRefresh() {
    this._debug("#_stopAutoRefresh()");
    const e = this.autoRefreshTicker;
    this.autoRefreshTicker = null, e && clearInterval(e);
    const t = this.autoRefreshTickTimeout;
    this.autoRefreshTickTimeout = null, t && clearTimeout(t);
  }
  /**
   * Starts an auto-refresh process in the background. The session is checked
   * every few seconds. Close to the time of expiration a process is started to
   * refresh the session. If refreshing fails it will be retried for as long as
   * necessary.
   *
   * If you set the {@link GoTrueClientOptions#autoRefreshToken} you don't need
   * to call this function, it will be called for you.
   *
   * On browsers the refresh process works only when the tab/window is in the
   * foreground to conserve resources as well as prevent race conditions and
   * flooding auth with requests. If you call this method any managed
   * visibility change callback will be removed and you must manage visibility
   * changes on your own.
   *
   * On non-browser platforms the refresh process works *continuously* in the
   * background, which may not be desirable. You should hook into your
   * platform's foreground indication mechanism and call these methods
   * appropriately to conserve resources.
   *
   * {@see #stopAutoRefresh}
   */
  async startAutoRefresh() {
    this._removeVisibilityChangedCallback(), await this._startAutoRefresh();
  }
  /**
   * Stops an active auto refresh process running in the background (if any).
   *
   * If you call this method any managed visibility change callback will be
   * removed and you must manage visibility changes on your own.
   *
   * See {@link #startAutoRefresh} for more details.
   */
  async stopAutoRefresh() {
    this._removeVisibilityChangedCallback(), await this._stopAutoRefresh();
  }
  /**
   * Runs the auto refresh token tick.
   */
  async _autoRefreshTokenTick() {
    this._debug("#_autoRefreshTokenTick()", "begin");
    try {
      await this._acquireLock(0, async () => {
        try {
          const e = Date.now();
          try {
            return await this._useSession(async (t) => {
              const { data: { session: i } } = t;
              if (!i || !i.refresh_token || !i.expires_at) {
                this._debug("#_autoRefreshTokenTick()", "no session");
                return;
              }
              const n = Math.floor((i.expires_at * 1e3 - e) / et);
              this._debug("#_autoRefreshTokenTick()", `access token expires in ${n} ticks, a tick lasts ${et}ms, refresh threshold is ${Vr} ticks`), n <= Vr && await this._callRefreshToken(i.refresh_token);
            });
          } catch (t) {
            console.error("Auto refresh tick failed with error. This is likely a transient error.", t);
          }
        } finally {
          this._debug("#_autoRefreshTokenTick()", "end");
        }
      });
    } catch (e) {
      if (e.isAcquireTimeout || e instanceof Kn)
        this._debug("auto refresh token tick lock not available");
      else
        throw e;
    }
  }
  /**
   * Registers callbacks on the browser / platform, which in-turn run
   * algorithms when the browser window/tab are in foreground. On non-browser
   * platforms it assumes always foreground.
   */
  async _handleVisibilityChange() {
    if (this._debug("#_handleVisibilityChange()"), !J() || !(window != null && window.addEventListener))
      return this.autoRefreshToken && this.startAutoRefresh(), !1;
    try {
      this.visibilityChangedCallback = async () => {
        try {
          await this._onVisibilityChanged(!1);
        } catch (e) {
          this._debug("#visibilityChangedCallback", "error", e);
        }
      }, window == null || window.addEventListener("visibilitychange", this.visibilityChangedCallback), await this._onVisibilityChanged(!0);
    } catch (e) {
      console.error("_handleVisibilityChange", e);
    }
  }
  /**
   * Callback registered with `window.addEventListener('visibilitychange')`.
   */
  async _onVisibilityChanged(e) {
    const t = `#_onVisibilityChanged(${e})`;
    this._debug(t, "visibilityState", document.visibilityState), document.visibilityState === "visible" ? (this.autoRefreshToken && this._startAutoRefresh(), e || (await this.initializePromise, await this._acquireLock(this.lockAcquireTimeout, async () => {
      if (document.visibilityState !== "visible") {
        this._debug(t, "acquired the lock to recover the session, but the browser visibilityState is no longer visible, aborting");
        return;
      }
      await this._recoverAndRefresh();
    }))) : document.visibilityState === "hidden" && this.autoRefreshToken && this._stopAutoRefresh();
  }
  /**
   * Generates the relevant login URL for a third-party provider.
   * @param options.redirectTo A URL or mobile address to send the user to after they are confirmed.
   * @param options.scopes A space-separated list of scopes granted to the OAuth application.
   * @param options.queryParams An object of key-value pairs containing query parameters granted to the OAuth application.
   */
  async _getUrlForProvider(e, t, i) {
    const n = [`provider=${encodeURIComponent(t)}`];
    if (i != null && i.redirectTo && n.push(`redirect_to=${encodeURIComponent(i.redirectTo)}`), i != null && i.scopes && n.push(`scopes=${encodeURIComponent(i.scopes)}`), this.flowType === "pkce") {
      const [a, s] = await Xe(this.storage, this.storageKey), o = new URLSearchParams({
        code_challenge: `${encodeURIComponent(a)}`,
        code_challenge_method: `${encodeURIComponent(s)}`
      });
      n.push(o.toString());
    }
    if (i != null && i.queryParams) {
      const a = new URLSearchParams(i.queryParams);
      n.push(a.toString());
    }
    return i != null && i.skipBrowserRedirect && n.push(`skip_http_redirect=${i.skipBrowserRedirect}`), `${e}?${n.join("&")}`;
  }
  async _unenroll(e) {
    try {
      return await this._useSession(async (t) => {
        var i;
        const { data: n, error: a } = t;
        return a ? this._returnResult({ data: null, error: a }) : await I(this.fetch, "DELETE", `${this.url}/factors/${e.factorId}`, {
          headers: this.headers,
          jwt: (i = n == null ? void 0 : n.session) === null || i === void 0 ? void 0 : i.access_token
        });
      });
    } catch (t) {
      if (A(t))
        return this._returnResult({ data: null, error: t });
      throw t;
    }
  }
  async _enroll(e) {
    try {
      return await this._useSession(async (t) => {
        var i, n;
        const { data: a, error: s } = t;
        if (s)
          return this._returnResult({ data: null, error: s });
        const o = Object.assign({ friendly_name: e.friendlyName, factor_type: e.factorType }, e.factorType === "phone" ? { phone: e.phone } : e.factorType === "totp" ? { issuer: e.issuer } : {}), { data: c, error: l } = await I(this.fetch, "POST", `${this.url}/factors`, {
          body: o,
          headers: this.headers,
          jwt: (i = a == null ? void 0 : a.session) === null || i === void 0 ? void 0 : i.access_token
        });
        return l ? this._returnResult({ data: null, error: l }) : (e.factorType === "totp" && c.type === "totp" && (!((n = c == null ? void 0 : c.totp) === null || n === void 0) && n.qr_code) && (c.totp.qr_code = `data:image/svg+xml;utf-8,${c.totp.qr_code}`), this._returnResult({ data: c, error: null }));
      });
    } catch (t) {
      if (A(t))
        return this._returnResult({ data: null, error: t });
      throw t;
    }
  }
  async _verify(e) {
    return this._acquireLock(this.lockAcquireTimeout, async () => {
      try {
        return await this._useSession(async (t) => {
          var i;
          const { data: n, error: a } = t;
          if (a)
            return this._returnResult({ data: null, error: a });
          const s = Object.assign({ challenge_id: e.challengeId }, "webauthn" in e ? {
            webauthn: Object.assign(Object.assign({}, e.webauthn), { credential_response: e.webauthn.type === "create" ? au(e.webauthn.credential_response) : ou(e.webauthn.credential_response) })
          } : { code: e.code }), { data: o, error: c } = await I(this.fetch, "POST", `${this.url}/factors/${e.factorId}/verify`, {
            body: s,
            headers: this.headers,
            jwt: (i = n == null ? void 0 : n.session) === null || i === void 0 ? void 0 : i.access_token
          });
          return c ? this._returnResult({ data: null, error: c }) : (await this._saveSession(Object.assign({ expires_at: Math.round(Date.now() / 1e3) + o.expires_in }, o)), await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED", o), this._returnResult({ data: o, error: c }));
        });
      } catch (t) {
        if (A(t))
          return this._returnResult({ data: null, error: t });
        throw t;
      }
    });
  }
  async _challenge(e) {
    return this._acquireLock(this.lockAcquireTimeout, async () => {
      try {
        return await this._useSession(async (t) => {
          var i;
          const { data: n, error: a } = t;
          if (a)
            return this._returnResult({ data: null, error: a });
          const s = await I(this.fetch, "POST", `${this.url}/factors/${e.factorId}/challenge`, {
            body: e,
            headers: this.headers,
            jwt: (i = n == null ? void 0 : n.session) === null || i === void 0 ? void 0 : i.access_token
          });
          if (s.error)
            return s;
          const { data: o } = s;
          if (o.type !== "webauthn")
            return { data: o, error: null };
          switch (o.webauthn.type) {
            case "create":
              return {
                data: Object.assign(Object.assign({}, o), { webauthn: Object.assign(Object.assign({}, o.webauthn), { credential_options: Object.assign(Object.assign({}, o.webauthn.credential_options), { publicKey: nu(o.webauthn.credential_options.publicKey) }) }) }),
                error: null
              };
            case "request":
              return {
                data: Object.assign(Object.assign({}, o), { webauthn: Object.assign(Object.assign({}, o.webauthn), { credential_options: Object.assign(Object.assign({}, o.webauthn.credential_options), { publicKey: su(o.webauthn.credential_options.publicKey) }) }) }),
                error: null
              };
          }
        });
      } catch (t) {
        if (A(t))
          return this._returnResult({ data: null, error: t });
        throw t;
      }
    });
  }
  /**
   * {@see GoTrueMFAApi#challengeAndVerify}
   */
  async _challengeAndVerify(e) {
    const { data: t, error: i } = await this._challenge({
      factorId: e.factorId
    });
    return i ? this._returnResult({ data: null, error: i }) : await this._verify({
      factorId: e.factorId,
      challengeId: t.id,
      code: e.code
    });
  }
  /**
   * {@see GoTrueMFAApi#listFactors}
   */
  async _listFactors() {
    var e;
    const { data: { user: t }, error: i } = await this.getUser();
    if (i)
      return { data: null, error: i };
    const n = {
      all: [],
      phone: [],
      totp: [],
      webauthn: []
    };
    for (const a of (e = t == null ? void 0 : t.factors) !== null && e !== void 0 ? e : [])
      n.all.push(a), a.status === "verified" && n[a.factor_type].push(a);
    return {
      data: n,
      error: null
    };
  }
  /**
   * {@see GoTrueMFAApi#getAuthenticatorAssuranceLevel}
   */
  async _getAuthenticatorAssuranceLevel(e) {
    var t, i, n, a;
    if (e)
      try {
        const { payload: f } = Zt(e);
        let p = null;
        f.aal && (p = f.aal);
        let m = p;
        const { data: { user: g }, error: y } = await this.getUser(e);
        if (y)
          return this._returnResult({ data: null, error: y });
        ((i = (t = g == null ? void 0 : g.factors) === null || t === void 0 ? void 0 : t.filter((x) => x.status === "verified")) !== null && i !== void 0 ? i : []).length > 0 && (m = "aal2");
        const v = f.amr || [];
        return { data: { currentLevel: p, nextLevel: m, currentAuthenticationMethods: v }, error: null };
      } catch (f) {
        if (A(f))
          return this._returnResult({ data: null, error: f });
        throw f;
      }
    const { data: { session: s }, error: o } = await this.getSession();
    if (o)
      return this._returnResult({ data: null, error: o });
    if (!s)
      return {
        data: { currentLevel: null, nextLevel: null, currentAuthenticationMethods: [] },
        error: null
      };
    const { payload: c } = Zt(s.access_token);
    let l = null;
    c.aal && (l = c.aal);
    let u = l;
    ((a = (n = s.user.factors) === null || n === void 0 ? void 0 : n.filter((f) => f.status === "verified")) !== null && a !== void 0 ? a : []).length > 0 && (u = "aal2");
    const d = c.amr || [];
    return { data: { currentLevel: l, nextLevel: u, currentAuthenticationMethods: d }, error: null };
  }
  /**
   * Retrieves details about an OAuth authorization request.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   *
   * Returns authorization details including client info, scopes, and user information.
   * If the response includes only a redirect_url field, it means consent was already given - the caller
   * should handle the redirect manually if needed.
   */
  async _getAuthorizationDetails(e) {
    try {
      return await this._useSession(async (t) => {
        const { data: { session: i }, error: n } = t;
        return n ? this._returnResult({ data: null, error: n }) : i ? await I(this.fetch, "GET", `${this.url}/oauth/authorizations/${e}`, {
          headers: this.headers,
          jwt: i.access_token,
          xform: (a) => ({ data: a, error: null })
        }) : this._returnResult({ data: null, error: new se() });
      });
    } catch (t) {
      if (A(t))
        return this._returnResult({ data: null, error: t });
      throw t;
    }
  }
  /**
   * Approves an OAuth authorization request.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   */
  async _approveAuthorization(e, t) {
    try {
      return await this._useSession(async (i) => {
        const { data: { session: n }, error: a } = i;
        if (a)
          return this._returnResult({ data: null, error: a });
        if (!n)
          return this._returnResult({ data: null, error: new se() });
        const s = await I(this.fetch, "POST", `${this.url}/oauth/authorizations/${e}/consent`, {
          headers: this.headers,
          jwt: n.access_token,
          body: { action: "approve" },
          xform: (o) => ({ data: o, error: null })
        });
        return s.data && s.data.redirect_url && J() && !(t != null && t.skipBrowserRedirect) && window.location.assign(s.data.redirect_url), s;
      });
    } catch (i) {
      if (A(i))
        return this._returnResult({ data: null, error: i });
      throw i;
    }
  }
  /**
   * Denies an OAuth authorization request.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   */
  async _denyAuthorization(e, t) {
    try {
      return await this._useSession(async (i) => {
        const { data: { session: n }, error: a } = i;
        if (a)
          return this._returnResult({ data: null, error: a });
        if (!n)
          return this._returnResult({ data: null, error: new se() });
        const s = await I(this.fetch, "POST", `${this.url}/oauth/authorizations/${e}/consent`, {
          headers: this.headers,
          jwt: n.access_token,
          body: { action: "deny" },
          xform: (o) => ({ data: o, error: null })
        });
        return s.data && s.data.redirect_url && J() && !(t != null && t.skipBrowserRedirect) && window.location.assign(s.data.redirect_url), s;
      });
    } catch (i) {
      if (A(i))
        return this._returnResult({ data: null, error: i });
      throw i;
    }
  }
  /**
   * Lists all OAuth grants that the authenticated user has authorized.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   */
  async _listOAuthGrants() {
    try {
      return await this._useSession(async (e) => {
        const { data: { session: t }, error: i } = e;
        return i ? this._returnResult({ data: null, error: i }) : t ? await I(this.fetch, "GET", `${this.url}/user/oauth/grants`, {
          headers: this.headers,
          jwt: t.access_token,
          xform: (n) => ({ data: n, error: null })
        }) : this._returnResult({ data: null, error: new se() });
      });
    } catch (e) {
      if (A(e))
        return this._returnResult({ data: null, error: e });
      throw e;
    }
  }
  /**
   * Revokes a user's OAuth grant for a specific client.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   */
  async _revokeOAuthGrant(e) {
    try {
      return await this._useSession(async (t) => {
        const { data: { session: i }, error: n } = t;
        return n ? this._returnResult({ data: null, error: n }) : i ? (await I(this.fetch, "DELETE", `${this.url}/user/oauth/grants`, {
          headers: this.headers,
          jwt: i.access_token,
          query: { client_id: e.clientId },
          noResolveJson: !0
        }), { data: {}, error: null }) : this._returnResult({ data: null, error: new se() });
      });
    } catch (t) {
      if (A(t))
        return this._returnResult({ data: null, error: t });
      throw t;
    }
  }
  async fetchJwk(e, t = { keys: [] }) {
    let i = t.keys.find((o) => o.kid === e);
    if (i)
      return i;
    const n = Date.now();
    if (i = this.jwks.keys.find((o) => o.kid === e), i && this.jwks_cached_at + ml > n)
      return i;
    const { data: a, error: s } = await I(this.fetch, "GET", `${this.url}/.well-known/jwks.json`, {
      headers: this.headers
    });
    if (s)
      throw s;
    return !a.keys || a.keys.length === 0 || (this.jwks = a, this.jwks_cached_at = n, i = a.keys.find((o) => o.kid === e), !i) ? null : i;
  }
  /**
   * Extracts the JWT claims present in the access token by first verifying the
   * JWT against the server's JSON Web Key Set endpoint
   * `/.well-known/jwks.json` which is often cached, resulting in significantly
   * faster responses. Prefer this method over {@link #getUser} which always
   * sends a request to the Auth server for each JWT.
   *
   * If the project is not using an asymmetric JWT signing key (like ECC or
   * RSA) it always sends a request to the Auth server (similar to {@link
   * #getUser}) to verify the JWT.
   *
   * @param jwt An optional specific JWT you wish to verify, not the one you
   *            can obtain from {@link #getSession}.
   * @param options Various additional options that allow you to customize the
   *                behavior of this method.
   */
  async getClaims(e, t = {}) {
    try {
      let i = e;
      if (!i) {
        const { data: f, error: p } = await this.getSession();
        if (p || !f.session)
          return this._returnResult({ data: null, error: p });
        i = f.session.access_token;
      }
      const { header: n, payload: a, signature: s, raw: { header: o, payload: c } } = Zt(i);
      t != null && t.allowExpired || Nl(a.exp);
      const l = !n.alg || n.alg.startsWith("HS") || !n.kid || !("crypto" in globalThis && "subtle" in globalThis.crypto) ? null : await this.fetchJwk(n.kid, t != null && t.keys ? { keys: t.keys } : t == null ? void 0 : t.jwks);
      if (!l) {
        const { error: f } = await this.getUser(i);
        if (f)
          throw f;
        return {
          data: {
            claims: a,
            header: n,
            signature: s
          },
          error: null
        };
      }
      const u = Bl(n.alg), h = await crypto.subtle.importKey("jwk", l, u, !0, [
        "verify"
      ]);
      if (!await crypto.subtle.verify(u, h, s, kl(`${o}.${c}`)))
        throw new Jr("Invalid JWT signature");
      return {
        data: {
          claims: a,
          header: n,
          signature: s
        },
        error: null
      };
    } catch (i) {
      if (A(i))
        return this._returnResult({ data: null, error: i });
      throw i;
    }
  }
}
It.nextInstanceID = {};
const gu = It, yu = "2.95.3";
let gt = "";
typeof Deno < "u" ? gt = "deno" : typeof document < "u" ? gt = "web" : typeof navigator < "u" && navigator.product === "ReactNative" ? gt = "react-native" : gt = "node";
const wu = { "X-Client-Info": `supabase-js-${gt}/${yu}` }, vu = { headers: wu }, bu = { schema: "public" }, _u = {
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  flowType: "implicit"
}, xu = {};
function Rt(r) {
  "@babel/helpers - typeof";
  return Rt = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
    return typeof e;
  } : function(e) {
    return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, Rt(r);
}
function Tu(r, e) {
  if (Rt(r) != "object" || !r)
    return r;
  var t = r[Symbol.toPrimitive];
  if (t !== void 0) {
    var i = t.call(r, e);
    if (Rt(i) != "object")
      return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(r);
}
function ku(r) {
  var e = Tu(r, "string");
  return Rt(e) == "symbol" ? e : e + "";
}
function Su(r, e, t) {
  return (e = ku(e)) in r ? Object.defineProperty(r, e, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : r[e] = t, r;
}
function Hi(r, e) {
  var t = Object.keys(r);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(r);
    e && (i = i.filter(function(n) {
      return Object.getOwnPropertyDescriptor(r, n).enumerable;
    })), t.push.apply(t, i);
  }
  return t;
}
function q(r) {
  for (var e = 1; e < arguments.length; e++) {
    var t = arguments[e] != null ? arguments[e] : {};
    e % 2 ? Hi(Object(t), !0).forEach(function(i) {
      Su(r, i, t[i]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(r, Object.getOwnPropertyDescriptors(t)) : Hi(Object(t)).forEach(function(i) {
      Object.defineProperty(r, i, Object.getOwnPropertyDescriptor(t, i));
    });
  }
  return r;
}
const Eu = (r) => r ? (...e) => r(...e) : (...e) => fetch(...e), Au = () => Headers, Iu = (r, e, t) => {
  const i = Eu(t), n = Au();
  return async (a, s) => {
    var o;
    const c = (o = await e()) !== null && o !== void 0 ? o : r;
    let l = new n(s == null ? void 0 : s.headers);
    return l.has("apikey") || l.set("apikey", r), l.has("Authorization") || l.set("Authorization", `Bearer ${c}`), i(a, q(q({}, s), {}, { headers: l }));
  };
};
function Ru(r) {
  return r.endsWith("/") ? r : r + "/";
}
function Cu(r, e) {
  var t, i;
  const { db: n, auth: a, realtime: s, global: o } = r, { db: c, auth: l, realtime: u, global: h } = e, d = {
    db: q(q({}, c), n),
    auth: q(q({}, l), a),
    realtime: q(q({}, u), s),
    storage: {},
    global: q(q(q({}, h), o), {}, { headers: q(q({}, (t = h == null ? void 0 : h.headers) !== null && t !== void 0 ? t : {}), (i = o == null ? void 0 : o.headers) !== null && i !== void 0 ? i : {}) }),
    accessToken: async () => ""
  };
  return r.accessToken ? d.accessToken = r.accessToken : delete d.accessToken, d;
}
function Ou(r) {
  const e = r == null ? void 0 : r.trim();
  if (!e)
    throw new Error("supabaseUrl is required.");
  if (!e.match(/^https?:\/\//i))
    throw new Error("Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.");
  try {
    return new URL(Ru(e));
  } catch {
    throw Error("Invalid supabaseUrl: Provided URL is malformed.");
  }
}
var Pu = class extends gu {
  constructor(r) {
    super(r);
  }
}, Du = class {
  /**
  * Create a new client for use in the browser.
  * @param supabaseUrl The unique Supabase URL which is supplied when you create a new project in your project dashboard.
  * @param supabaseKey The unique Supabase Key which is supplied when you create a new project in your project dashboard.
  * @param options.db.schema You can switch in between schemas. The schema needs to be on the list of exposed schemas inside Supabase.
  * @param options.auth.autoRefreshToken Set to "true" if you want to automatically refresh the token before expiring.
  * @param options.auth.persistSession Set to "true" if you want to automatically save the user session into local storage.
  * @param options.auth.detectSessionInUrl Set to "true" if you want to automatically detects OAuth grants in the URL and signs in the user.
  * @param options.realtime Options passed along to realtime-js constructor.
  * @param options.storage Options passed along to the storage-js constructor.
  * @param options.global.fetch A custom fetch implementation.
  * @param options.global.headers Any additional headers to send with each network request.
  * @example
  * ```ts
  * import { createClient } from '@supabase/supabase-js'
  *
  * const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key')
  * const { data } = await supabase.from('profiles').select('*')
  * ```
  */
  constructor(r, e, t) {
    var i, n;
    this.supabaseUrl = r, this.supabaseKey = e;
    const a = Ou(r);
    if (!e)
      throw new Error("supabaseKey is required.");
    this.realtimeUrl = new URL("realtime/v1", a), this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws"), this.authUrl = new URL("auth/v1", a), this.storageUrl = new URL("storage/v1", a), this.functionsUrl = new URL("functions/v1", a);
    const s = `sb-${a.hostname.split(".")[0]}-auth-token`, o = {
      db: bu,
      realtime: xu,
      auth: q(q({}, _u), {}, { storageKey: s }),
      global: vu
    }, c = Cu(t ?? {}, o);
    if (this.storageKey = (i = c.auth.storageKey) !== null && i !== void 0 ? i : "", this.headers = (n = c.global.headers) !== null && n !== void 0 ? n : {}, c.accessToken)
      this.accessToken = c.accessToken, this.auth = new Proxy({}, { get: (u, h) => {
        throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(h)} is not possible`);
      } });
    else {
      var l;
      this.auth = this._initSupabaseAuthClient((l = c.auth) !== null && l !== void 0 ? l : {}, this.headers, c.global.fetch);
    }
    this.fetch = Iu(e, this._getAccessToken.bind(this), c.global.fetch), this.realtime = this._initRealtimeClient(q({
      headers: this.headers,
      accessToken: this._getAccessToken.bind(this)
    }, c.realtime)), this.accessToken && Promise.resolve(this.accessToken()).then((u) => this.realtime.setAuth(u)).catch((u) => console.warn("Failed to set initial Realtime auth token:", u)), this.rest = new yc(new URL("rest/v1", a).href, {
      headers: this.headers,
      schema: c.db.schema,
      fetch: this.fetch,
      timeout: c.db.timeout,
      urlLengthLimit: c.db.urlLengthLimit
    }), this.storage = new ul(this.storageUrl.href, this.headers, this.fetch, t == null ? void 0 : t.storage), c.accessToken || this._listenForAuthEvents();
  }
  /**
  * Supabase Functions allows you to deploy and invoke edge functions.
  */
  get functions() {
    return new lc(this.functionsUrl.href, {
      headers: this.headers,
      customFetch: this.fetch
    });
  }
  /**
  * Perform a query on a table or a view.
  *
  * @param relation - The table or view name to query
  */
  from(r) {
    return this.rest.from(r);
  }
  /**
  * Select a schema to query or perform an function (rpc) call.
  *
  * The schema needs to be on the list of exposed schemas inside Supabase.
  *
  * @param schema - The schema to query
  */
  schema(r) {
    return this.rest.schema(r);
  }
  /**
  * Perform a function call.
  *
  * @param fn - The function name to call
  * @param args - The arguments to pass to the function call
  * @param options - Named parameters
  * @param options.head - When set to `true`, `data` will not be returned.
  * Useful if you only need the count.
  * @param options.get - When set to `true`, the function will be called with
  * read-only access mode.
  * @param options.count - Count algorithm to use to count rows returned by the
  * function. Only applicable for [set-returning
  * functions](https://www.postgresql.org/docs/current/functions-srf.html).
  *
  * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
  * hood.
  *
  * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
  * statistics under the hood.
  *
  * `"estimated"`: Uses exact count for low numbers and planned count for high
  * numbers.
  */
  rpc(r, e = {}, t = {
    head: !1,
    get: !1,
    count: void 0
  }) {
    return this.rest.rpc(r, e, t);
  }
  /**
  * Creates a Realtime channel with Broadcast, Presence, and Postgres Changes.
  *
  * @param {string} name - The name of the Realtime channel.
  * @param {Object} opts - The options to pass to the Realtime channel.
  *
  */
  channel(r, e = { config: {} }) {
    return this.realtime.channel(r, e);
  }
  /**
  * Returns all Realtime channels.
  */
  getChannels() {
    return this.realtime.getChannels();
  }
  /**
  * Unsubscribes and removes Realtime channel from Realtime client.
  *
  * @param {RealtimeChannel} channel - The name of the Realtime channel.
  *
  */
  removeChannel(r) {
    return this.realtime.removeChannel(r);
  }
  /**
  * Unsubscribes and removes all Realtime channels from Realtime client.
  */
  removeAllChannels() {
    return this.realtime.removeAllChannels();
  }
  async _getAccessToken() {
    var r = this, e, t;
    if (r.accessToken)
      return await r.accessToken();
    const { data: i } = await r.auth.getSession();
    return (e = (t = i.session) === null || t === void 0 ? void 0 : t.access_token) !== null && e !== void 0 ? e : r.supabaseKey;
  }
  _initSupabaseAuthClient({ autoRefreshToken: r, persistSession: e, detectSessionInUrl: t, storage: i, userStorage: n, storageKey: a, flowType: s, lock: o, debug: c, throwOnError: l }, u, h) {
    const d = {
      Authorization: `Bearer ${this.supabaseKey}`,
      apikey: `${this.supabaseKey}`
    };
    return new Pu({
      url: this.authUrl.href,
      headers: q(q({}, d), u),
      storageKey: a,
      autoRefreshToken: r,
      persistSession: e,
      detectSessionInUrl: t,
      storage: i,
      userStorage: n,
      flowType: s,
      lock: o,
      debug: c,
      throwOnError: l,
      fetch: h,
      hasCustomAuthorizationHeader: Object.keys(this.headers).some((f) => f.toLowerCase() === "authorization")
    });
  }
  _initRealtimeClient(r) {
    return new Uc(this.realtimeUrl.href, q(q({}, r), {}, { params: q(q({}, { apikey: this.supabaseKey }), r == null ? void 0 : r.params) }));
  }
  _listenForAuthEvents() {
    return this.auth.onAuthStateChange((r, e) => {
      this._handleTokenChanged(r, "CLIENT", e == null ? void 0 : e.access_token);
    });
  }
  _handleTokenChanged(r, e, t) {
    (r === "TOKEN_REFRESHED" || r === "SIGNED_IN") && this.changedAccessToken !== t ? (this.changedAccessToken = t, this.realtime.setAuth(t)) : r === "SIGNED_OUT" && (this.realtime.setAuth(), e == "STORAGE" && this.auth.signOut(), this.changedAccessToken = void 0);
  }
};
const Uu = (r, e, t) => new Du(r, e, t);
function Lu() {
  if (typeof window < "u")
    return !1;
  const r = globalThis.process;
  if (!r)
    return !1;
  const e = r.version;
  if (e == null)
    return !1;
  const t = e.match(/^v(\d+)\./);
  return t ? parseInt(t[1], 10) <= 18 : !1;
}
Lu() && console.warn("⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217");
var Te = { exports: {} };
const ju = "16.6.1", Nu = {
  version: ju
}, Yr = F, cr = z, Bu = an, $u = _t, Mu = Nu, ai = Mu.version, Fu = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
function zu(r) {
  const e = {};
  let t = r.toString();
  t = t.replace(/\r\n?/mg, `
`);
  let i;
  for (; (i = Fu.exec(t)) != null; ) {
    const n = i[1];
    let a = i[2] || "";
    a = a.trim();
    const s = a[0];
    a = a.replace(/^(['"`])([\s\S]*)\1$/mg, "$2"), s === '"' && (a = a.replace(/\\n/g, `
`), a = a.replace(/\\r/g, "\r")), e[n] = a;
  }
  return e;
}
function qu(r) {
  r = r || {};
  const e = Yn(r);
  r.path = e;
  const t = V.configDotenv(r);
  if (!t.parsed) {
    const s = new Error(`MISSING_DATA: Cannot parse ${e} for an unknown reason`);
    throw s.code = "MISSING_DATA", s;
  }
  const i = Jn(r).split(","), n = i.length;
  let a;
  for (let s = 0; s < n; s++)
    try {
      const o = i[s].trim(), c = Wu(t, o);
      a = V.decrypt(c.ciphertext, c.key);
      break;
    } catch (o) {
      if (s + 1 >= n)
        throw o;
    }
  return V.parse(a);
}
function Gu(r) {
  console.log(`[dotenv@${ai}][WARN] ${r}`);
}
function vt(r) {
  console.log(`[dotenv@${ai}][DEBUG] ${r}`);
}
function Xn(r) {
  console.log(`[dotenv@${ai}] ${r}`);
}
function Jn(r) {
  return r && r.DOTENV_KEY && r.DOTENV_KEY.length > 0 ? r.DOTENV_KEY : process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0 ? process.env.DOTENV_KEY : "";
}
function Wu(r, e) {
  let t;
  try {
    t = new URL(e);
  } catch (o) {
    if (o.code === "ERR_INVALID_URL") {
      const c = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
      throw c.code = "INVALID_DOTENV_KEY", c;
    }
    throw o;
  }
  const i = t.password;
  if (!i) {
    const o = new Error("INVALID_DOTENV_KEY: Missing key part");
    throw o.code = "INVALID_DOTENV_KEY", o;
  }
  const n = t.searchParams.get("environment");
  if (!n) {
    const o = new Error("INVALID_DOTENV_KEY: Missing environment part");
    throw o.code = "INVALID_DOTENV_KEY", o;
  }
  const a = `DOTENV_VAULT_${n.toUpperCase()}`, s = r.parsed[a];
  if (!s) {
    const o = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${a} in your .env.vault file.`);
    throw o.code = "NOT_FOUND_DOTENV_ENVIRONMENT", o;
  }
  return { ciphertext: s, key: i };
}
function Yn(r) {
  let e = null;
  if (r && r.path && r.path.length > 0)
    if (Array.isArray(r.path))
      for (const t of r.path)
        Yr.existsSync(t) && (e = t.endsWith(".vault") ? t : `${t}.vault`);
    else
      e = r.path.endsWith(".vault") ? r.path : `${r.path}.vault`;
  else
    e = cr.resolve(process.cwd(), ".env.vault");
  return Yr.existsSync(e) ? e : null;
}
function Xi(r) {
  return r[0] === "~" ? cr.join(Bu.homedir(), r.slice(1)) : r;
}
function Ku(r) {
  const e = !!(r && r.debug), t = r && "quiet" in r ? r.quiet : !0;
  (e || !t) && Xn("Loading env from encrypted .env.vault");
  const i = V._parseVault(r);
  let n = process.env;
  return r && r.processEnv != null && (n = r.processEnv), V.populate(n, i, r), { parsed: i };
}
function Vu(r) {
  const e = cr.resolve(process.cwd(), ".env");
  let t = "utf8";
  const i = !!(r && r.debug), n = r && "quiet" in r ? r.quiet : !0;
  r && r.encoding ? t = r.encoding : i && vt("No encoding is specified. UTF-8 is used by default");
  let a = [e];
  if (r && r.path)
    if (!Array.isArray(r.path))
      a = [Xi(r.path)];
    else {
      a = [];
      for (const l of r.path)
        a.push(Xi(l));
    }
  let s;
  const o = {};
  for (const l of a)
    try {
      const u = V.parse(Yr.readFileSync(l, { encoding: t }));
      V.populate(o, u, r);
    } catch (u) {
      i && vt(`Failed to load ${l} ${u.message}`), s = u;
    }
  let c = process.env;
  if (r && r.processEnv != null && (c = r.processEnv), V.populate(c, o, r), i || !n) {
    const l = Object.keys(o).length, u = [];
    for (const h of a)
      try {
        const d = cr.relative(process.cwd(), h);
        u.push(d);
      } catch (d) {
        i && vt(`Failed to load ${h} ${d.message}`), s = d;
      }
    Xn(`injecting env (${l}) from ${u.join(",")}`);
  }
  return s ? { parsed: o, error: s } : { parsed: o };
}
function Hu(r) {
  if (Jn(r).length === 0)
    return V.configDotenv(r);
  const e = Yn(r);
  return e ? V._configVault(r) : (Gu(`You set DOTENV_KEY but you are missing a .env.vault file at ${e}. Did you forget to build it?`), V.configDotenv(r));
}
function Xu(r, e) {
  const t = Buffer.from(e.slice(-64), "hex");
  let i = Buffer.from(r, "base64");
  const n = i.subarray(0, 12), a = i.subarray(-16);
  i = i.subarray(12, -16);
  try {
    const s = $u.createDecipheriv("aes-256-gcm", t, n);
    return s.setAuthTag(a), `${s.update(i)}${s.final()}`;
  } catch (s) {
    const o = s instanceof RangeError, c = s.message === "Invalid key length", l = s.message === "Unsupported state or unable to authenticate data";
    if (o || c) {
      const u = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
      throw u.code = "INVALID_DOTENV_KEY", u;
    } else if (l) {
      const u = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
      throw u.code = "DECRYPTION_FAILED", u;
    } else
      throw s;
  }
}
function Ju(r, e, t = {}) {
  const i = !!(t && t.debug), n = !!(t && t.override);
  if (typeof e != "object") {
    const a = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
    throw a.code = "OBJECT_REQUIRED", a;
  }
  for (const a of Object.keys(e))
    Object.prototype.hasOwnProperty.call(r, a) ? (n === !0 && (r[a] = e[a]), i && vt(n === !0 ? `"${a}" is already defined and WAS overwritten` : `"${a}" is already defined and was NOT overwritten`)) : r[a] = e[a];
}
const V = {
  configDotenv: Vu,
  _configVault: Ku,
  _parseVault: qu,
  config: Hu,
  decrypt: Xu,
  parse: zu,
  populate: Ju
};
Te.exports.configDotenv = V.configDotenv;
Te.exports._configVault = V._configVault;
Te.exports._parseVault = V._parseVault;
Te.exports.config = V.config;
Te.exports.decrypt = V.decrypt;
Te.exports.parse = V.parse;
Te.exports.populate = V.populate;
Te.exports = V;
var Yu = Te.exports;
const Zu = /* @__PURE__ */ on(Yu);
Zu.config();
const Qu = "youtube_quota.json", ft = 9e3, Ji = 100, Yi = 1;
class eh {
  constructor() {
    L(this, "apiKey", "");
    L(this, "supabase", null);
    L(this, "quotaPath");
    L(this, "businessId");
    this.quotaPath = z.join(rt.getPath("userData"), Qu), this.businessId = process.env.BUSINESS_ID || process.env.VITE_BUSINESS_ID || "22222222-2222-2222-2222-222222222222", this.initialize();
  }
  async initialize() {
    const e = process.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321", t = process.env.VITE_SUPABASE_ANON_KEY || "";
    t ? (this.supabase = Uu(e, t), console.log("🎥 [YouTube] Supabase Client Initialized"), await this.fetchApiKey(), this.setupRealtimeWatcher()) : console.warn("⚠️ [YouTube] Missing Supabase Config - Dynamic Sync Disabled");
  }
  async fetchApiKey() {
    if (this.supabase) {
      try {
        const { data: e, error: t } = await this.supabase.from("businesses").select("youtube_api_key").eq("id", this.businessId).single();
        e != null && e.youtube_api_key ? (this.apiKey = e.youtube_api_key, console.log("🔑 [YouTube] API Key Loaded")) : t && console.error("❌ [YouTube] Failed to fetch API key:", t.message);
      } catch (e) {
        console.error("❌ [YouTube] Error fetching key from Supabase:", e);
      }
      !this.apiKey && process.env.YOUTUBE_API_KEY && (this.apiKey = process.env.YOUTUBE_API_KEY, console.log("🔑 [YouTube] API Key Loaded from .env (Fallback)"));
    }
  }
  setupRealtimeWatcher() {
    this.supabase && (console.log(`👀 [YouTube] Watching settings for Business: ${this.businessId}`), this.supabase.channel("public:businesses").on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "businesses", filter: `id=eq.${this.businessId}` },
      (e) => {
        const t = e.new.youtube_api_key;
        t && t !== this.apiKey && (console.log("🔄 [YouTube] Hot-Reload: API Key Updated!"), this.apiKey = t);
      }
    ).subscribe());
  }
  // --- QUOTA MANAGEMENT ---
  getQuota() {
    const e = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    let t = { date: e, unitsUsed: 0 };
    if (F.existsSync(this.quotaPath))
      try {
        const i = JSON.parse(F.readFileSync(this.quotaPath, "utf-8"));
        i.date === e && (t = i);
      } catch {
        console.warn("⚠️ [YouTube] Failed to read quota file, resetting.");
      }
    return t;
  }
  updateQuota(e) {
    const t = this.getQuota();
    return t.unitsUsed += e, F.writeFileSync(this.quotaPath, JSON.stringify(t)), t.unitsUsed;
  }
  getQuotaStatus() {
    const e = this.getQuota();
    return {
      used: e.unitsUsed,
      limit: ft,
      remaining: Math.max(0, ft - e.unitsUsed),
      isExceeded: e.unitsUsed >= ft
    };
  }
  // --- SEARCH LOGIC ---
  async search(e) {
    let t = [];
    if (this.supabase)
      try {
        const { data: n } = await this.supabase.from("music_songs").select("id, title, artist:artist_id(name), album:album_id(cover_url)").ilike("title", `%${e}%`).limit(10);
        n && (t = n.map((a) => {
          var s, o;
          return {
            id: a.id,
            title: a.title,
            artist: (s = a.artist) == null ? void 0 : s.name,
            thumbnail: ((o = a.album) == null ? void 0 : o.cover_url) || "",
            isLocal: !0,
            source: "LOCAL"
          };
        }));
      } catch (n) {
        console.error("⚠️ [YouTube] Local search failed:", n);
      }
    if (t.length >= 5)
      return console.log(`🏠 [YouTube] Found ${t.length} local matches. Skipping API to save quota.`), { results: t, offline: !1 };
    if (this.getQuota().unitsUsed >= ft)
      return console.warn("⚠️ [YouTube] Quota Exceeded. Returning Offline Mode."), { results: t, offline: !0, error: "Daily Quota Exceeded" };
    if (!this.apiKey)
      return { results: t, offline: !0, error: "No API Key Configured" };
    try {
      console.log(`🔎 [YouTube] Searching: "${e}" (Cost: ${Ji})`);
      const n = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(e)}&type=video&videoCategoryId=10&maxResults=20&key=${this.apiKey}`, s = await (await gr.fetch(n)).json();
      if (s.error)
        throw console.error("❌ [YouTube] API Error:", s.error), new Error(s.error.message);
      this.updateQuota(Ji);
      const o = s.items.map((c) => {
        var l, u;
        return {
          id: c.id.videoId,
          title: c.snippet.title,
          artist: c.snippet.channelTitle,
          thumbnail: ((l = c.snippet.thumbnails.high) == null ? void 0 : l.url) || ((u = c.snippet.thumbnails.default) == null ? void 0 : u.url),
          isLocal: !1,
          source: "YOUTUBE"
        };
      });
      return { results: [...t, ...o], offline: !1 };
    } catch (n) {
      return console.error("❌ [YouTube] Search Failed:", n), { results: t, offline: !0, error: n.message };
    }
  }
  // --- PLAYLIST OPTIMIZATION ---
  async getPlaylistItems(e, t) {
    if (!this.apiKey)
      return { items: [], error: "No API Key Configured" };
    if (this.getQuota().unitsUsed >= ft)
      return { items: [], error: "Daily Quota Exceeded" };
    try {
      console.log(`📋 [YouTube] Fetching Playlist: ${e} (Cost: ${Yi})`);
      let n = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${e}&key=${this.apiKey}`;
      t && (n += `&pageToken=${t}`);
      const s = await (await gr.fetch(n)).json();
      if (s.error)
        throw new Error(s.error.message);
      return this.updateQuota(Yi), {
        items: s.items,
        nextPageToken: s.nextPageToken
      };
    } catch (n) {
      return console.error("❌ [YouTube] Playlist Fetch Failed:", n), { items: [], error: n.message };
    }
  }
  // --- VALIDATION ---
  async testApiKey(e) {
    var t, i;
    try {
      console.log("🧪 [YouTube] Testing API Key...");
      const n = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=1&regionCode=IL&key=${e}`, s = await (await gr.fetch(n)).json();
      if (s.error) {
        const o = (i = (t = s.error.errors) == null ? void 0 : t[0]) == null ? void 0 : i.reason;
        let c = "UNKNOWN";
        return o === "quotaExceeded" ? c = "QUOTA" : (o === "keyInvalid" || o === "badRequest") && (c = "AUTH"), { success: !1, errorType: c, message: s.error.message };
      }
      return { success: !0 };
    } catch (n) {
      return { success: !1, errorType: "NETWORK", message: n.message };
    }
  }
}
const { app: fe, BrowserWindow: oi, ipcMain: re, powerSaveBlocker: Zi, globalShortcut: Qi } = is, th = new sc(), Qt = new eh(), rh = ss(import.meta.url), ih = z.dirname(rh), nh = 5432, Pr = process.platform === "linux" ? "/mnt/raid1" : z.join(fe.getPath("userData"), "data"), en = process.platform === "darwin" ? "/Volumes/Ran1/Music" : "/mnt/music_ssd", Dr = 8081, sh = 1500, tn = 10;
let M = null, _e = null, Zn = "OPTIMAL", rr = [], pt = null;
function Qn(r) {
  r && pt === null ? (pt = Zi.start("prevent-display-sleep"), console.log("🛡️ Power Save Blocker: Active")) : !r && pt !== null && (Zi.stop(pt), pt = null, console.log("🛡️ Power Save Blocker: Inactive"));
}
function rn() {
  const r = !fe.isPackaged, t = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
  if (r)
    return "yt-dlp";
  const i = z.join(process.resourcesPath, "binaries", t);
  return F.existsSync(i) ? (console.log(`Using bundled yt-dlp: ${i}`), `"${i}"`) : (console.warn("Bundled yt-dlp not found, falling back to global PATH"), "yt-dlp");
}
function ah() {
  re.handle("auth:get-machine-id", async () => {
    try {
      return await ds.machineId();
    } catch (r) {
      return console.error("Failed to get machine ID:", r), "unknown-device-id";
    }
  }), re.handle("display:force-wake", async () => {
    M && (M.isMinimized() && M.restore(), M.show(), M.focus());
  }), re.handle("display:get-health", async () => M ? {
    isKiosk: M.isKiosk(),
    isVisible: M.isVisible(),
    bounds: M.getBounds()
  } : { isKiosk: !1, isVisible: !1, bounds: { x: 0, y: 0, width: 0, height: 0 } }), re.handle("system:restart-app", () => {
    fe.relaunch(), fe.exit(0);
  }), re.handle("system:get-health-status", () => ({ status: Zn, issues: rr })), re.handle("music:get-youtube-metadata", async (r, e) => new Promise((t, i) => {
    const n = rn();
    bt(`${n} --dump-json --flat-playlist --no-warnings "${e}"`, (a, s, o) => {
      if (a) {
        console.error("yt-dlp metadata error:", o), i(o || a.message);
        return;
      }
      try {
        const c = JSON.parse(s);
        t({
          title: c.title,
          uploader: c.uploader,
          duration: c.duration,
          thumbnail: c.thumbnail,
          id: c.id
        });
      } catch {
        i("Failed to parse metadata");
      }
    });
  })), re.handle("music:download-youtube", async (r, { url: e, artist: t, album: i, title: n }) => new Promise((a, s) => {
    const o = t.replace(/[^\w\s\u0590-\u05FF-]/g, "").trim() || "Unknown Artist", c = i.replace(/[^\w\s\u0590-\u05FF-]/g, "").trim() || "Unknown Album", l = n.replace(/[^\w\s\u0590-\u05FF-]/g, "").trim() || "Unknown Title", u = en, h = z.join(u, `${o} - ${c}`, `${l}.%(ext)s`), d = z.join(u, `${o} - ${c}`);
    F.existsSync(d) || F.mkdirSync(d, { recursive: !0 });
    const p = `${rn()} -x --audio-format mp3 --audio-quality 0 --add-metadata --embed-thumbnail -o "${h}" "${e}"`;
    console.log("🎵 Executing DL:", p), bt(p, (m, g, y) => {
      if (m) {
        console.error("yt-dlp download error:", y), s(y || m.message);
        return;
      }
      a({ success: !0, path: h.replace("%(ext)s", "mp3") });
    });
  })), re.handle("disk:scan-request", async (r, e) => {
    const t = e || en;
    console.log(`🔍 Scanning: ${t}`);
    try {
      return { success: !0, tracks: await th.scanDirectory(t) };
    } catch (i) {
      return console.error("Scan failed:", i), { success: !1, error: i.message };
    }
  }), re.handle("disk:import-confirm", async (r, e) => (console.log(`💾 Importing ${e.length} tracks from external drive...`), { success: !0, count: e.length })), re.handle("youtube:search", async (r, e) => await Qt.search(e)), re.handle("youtube:test-api-key", async (r, e) => await Qt.testApiKey(e)), re.handle("youtube:quota-status", () => Qt.getQuotaStatus()), re.handle("youtube:get-playlist", async (r, { playlistId: e, pageToken: t }) => await Qt.getPlaylistItems(e, t));
}
async function oh(r) {
  let e = !1;
  if (rr = [], r("Checking Storage...", 10), !F.existsSync(Pr)) {
    console.warn(`⚠️ Storage path ${Pr} not found. Creating...`);
    try {
      F.mkdirSync(Pr, { recursive: !0 });
    } catch {
      e = !0, rr.push("STORAGE_ERROR");
    }
  }
  r("Checking Database Status...", 30), await er(nh) || r("Database down. Attempting recovery...", 35), r("Checking Backend API...", 60);
  let i = await er(Dr);
  if (!i) {
    r("Backend down. Starting automatically...", 65);
    const a = fe.getAppPath();
    z.join(a, "..", "..");
    const s = [
      z.join(a, "backend_server.js"),
      z.join(process.cwd(), "backend_server.js")
    ];
    let o = !1;
    for (const l of s)
      if (F.existsSync(l)) {
        console.log(`🚀 Launching backend process from: ${l}`), bt(`node "${l}"`, (u) => {
          u && console.error("Backend process failed:", u);
        }), o = !0;
        break;
      }
    o || (console.warn("Backend script not found. Trying npm run start-backend..."), bt("npm run start-backend"));
    let c = 0;
    for (; c < tn && (await new Promise((l) => setTimeout(l, sh)), i = await er(Dr), !i); )
      c++, r(`Waiting for API (${c}/${tn})...`, 65 + c * 2);
  }
  return r("Final integrity check...", 92), await er(Dr) || (r("Checking once more...", 96), await new Promise((a) => setTimeout(a, 1e3))), Zn = e || !i ? "DEGRADED" : "OPTIMAL", e ? (r(`Booting in DEGRADED Mode: ${rr.join(", ")}`, 90), await new Promise((a) => setTimeout(a, 2e3))) : (r("All Services Online!", 100), await new Promise((a) => setTimeout(a, 500))), !0;
}
function er(r) {
  return new Promise((e) => {
    const i = new ns.Socket();
    i.setTimeout(1e3), i.once("error", () => {
      i.destroy(), e(!1);
    }), i.once("timeout", () => {
      i.destroy(), e(!1);
    }), i.connect(r, "127.0.0.1", () => {
      i.end(), e(!0);
    });
  });
}
function ch() {
  return _e = new oi({
    width: 600,
    height: 350,
    frame: !1,
    alwaysOnTop: !0,
    transparent: !0,
    webPreferences: {
      nodeIntegration: !0,
      contextIsolation: !1
    }
  }), _e.loadURL(`data:text/html;charset=utf-8,
    <body style="background:#111;color:#eee;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;-webkit-app-region:drag;border:1px solid #333;">
      <h2 style="margin-bottom:5px;">icaffeos booting...</h2>
      <div id="status" style="margin-top:20px;color:#888;font-size:14px;">Initializing...</div>
      <div style="width:80%;height:4px;background:#333;margin-top:15px;border-radius:2px;">
        <div id="bar" style="width:0%;height:100%;background:#00bcd4;transition:width 0.3s;border-radius:2px;"></div>
      </div>
      <div id="warn" style="margin-top:20px;color:#ff9800;font-size:12px;height:20px;"></div>
      <script>
        const { ipcRenderer } = require('electron');
        ipcRenderer.on('boot-update', (event, { message, progress }) => {
          const statusEl = document.getElementById('status');
          statusEl.innerText = message;
          document.getElementById('bar').style.width = progress + '%';
          
          if (message.includes('DEGRADED')) {
             document.getElementById('bar').style.background = '#ff9800';
             statusEl.style.color = '#ff9800';
          }
        });
      <\/script>
    </body>
  `), _e;
}
async function nn() {
  if (M = new oi({
    width: 1280,
    height: 800,
    kiosk: !1,
    // Temporary false to debug visibility
    show: !1,
    webPreferences: {
      preload: z.join(ih, "../preload/index.js"),
      sandbox: !1,
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), process.env.VITE_DEV_SERVER_URL)
    M.loadURL(process.env.VITE_DEV_SERVER_URL);
  else {
    const r = fe.getAppPath();
    M.loadFile(z.join(r, "build/index.html"));
  }
  return Qn(!0), M.webContents.openDevTools({ mode: "detach" }), M.once("ready-to-show", () => {
    _e && (_e.close(), _e = null), M == null || M.show();
  }), M;
}
fe.whenReady().then(async () => {
  if (ah(), ch(), Qi.register("CommandOrControl+Option+Q", () => {
    console.log("🚨 Emergency Exit Triggered"), fe.quit();
  }), Qi.register("CommandOrControl+Option+I", () => {
    M == null || M.webContents.toggleDevTools();
  }), await oh((r, e) => {
    _e && !_e.isDestroyed() && _e.webContents.send("boot-update", { message: r, progress: e });
  }), await nn(), M) {
    const { monitor: r, logger: e } = ws(M);
    r.startMonitoring(), e.startStreaming(), xs(M), re.on("hardware:request-power-save", (t, i) => Qn(i));
  }
  fe.on("activate", () => {
    oi.getAllWindows().length === 0 && nn();
  });
});
fe.on("window-all-closed", () => {
  process.platform !== "darwin" && fe.quit();
});
export {
  Ph as A,
  Rn as B,
  Eh as C,
  Ct as D,
  Q as E,
  Cn as F,
  Ti as G,
  Zo as H,
  ea as I,
  Za as J,
  Dh as K,
  Pn as L,
  pn as M,
  no as N,
  so as O,
  wi as P,
  Oh as Q,
  ao as R,
  H as S,
  we as T,
  xt as U,
  Lh as V,
  Uh as W,
  Ae as a,
  Fe as b,
  at as c,
  wn as d,
  $r as e,
  D as f,
  En as g,
  yn as h,
  Ch as i,
  B as j,
  mt as k,
  oa as l,
  Ya as m,
  Lr as n,
  sa as o,
  na as p,
  da as q,
  ua as r,
  Rh as s,
  aa as t,
  Ah as u,
  gn as v,
  ia as w,
  Nr as x,
  mn as y,
  Sh as z
};
