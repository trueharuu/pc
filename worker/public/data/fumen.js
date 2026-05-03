var fumen = (() => {
    var _ = Object.defineProperty;
    var de = Object.getOwnPropertyDescriptor;
    var fe = Object.getOwnPropertyNames;
    var he = Object.prototype.hasOwnProperty;
    var me = (r, e) => {
            for (var t in e) _(r, t, { get: e[t], enumerable: !0 });
        },
        pe = (r, e, t, n) => {
            if ((e && typeof e == "object") || typeof e == "function")
                for (let i of fe(e))
                    !he.call(r, i) &&
                        i !== t &&
                        _(r, i, {
                            get: () => e[i],
                            enumerable: !(n = de(e, i)) || n.enumerable,
                        });
            return r;
        };
    var ge = (r) => pe(_({}, "__esModule", { value: !0 }), r);
    var Le = {};
    me(Le, {
        Field: () => q,
        Mino: () => O,
        decoder: () => ze,
        encoder: () => Oe,
    });
    function I(r) {
        return r !== 0 && r !== 8;
    }
    function k(r) {
        switch (r) {
            case 1:
                return "I";
            case 2:
                return "L";
            case 3:
                return "O";
            case 4:
                return "Z";
            case 5:
                return "T";
            case 6:
                return "J";
            case 7:
                return "S";
            case 8:
                return "X";
            case 0:
                return "_";
        }
        throw new Error(`Unknown piece: ${r}`);
    }
    function w(r) {
        switch (r.toUpperCase()) {
            case "I":
                return 1;
            case "L":
                return 2;
            case "O":
                return 3;
            case "Z":
                return 4;
            case "T":
                return 5;
            case "J":
                return 6;
            case "S":
                return 7;
            case "X":
            case "GRAY":
                return 8;
            case " ":
            case "_":
            case "EMPTY":
                return 0;
        }
        throw new Error(`Unknown piece: ${r}`);
    }
    function ne(r) {
        switch (r) {
            case 0:
                return "spawn";
            case 3:
                return "left";
            case 1:
                return "right";
            case 2:
                return "reverse";
        }
        throw new Error(`Unknown rotation: ${r}`);
    }
    function N(r) {
        switch (r.toLowerCase()) {
            case "spawn":
                return 0;
            case "left":
                return 3;
            case "right":
                return 1;
            case "reverse":
                return 2;
        }
        throw new Error(`Unknown rotation: ${r}`);
    }
    var g = { Width: 10, Height: 23, PlayBlocks: 230 };
    function G() {
        return new M({});
    }
    function U(r) {
        let e = new M({});
        for (let t = -1; t < g.Height; t += 1)
            for (let n = 0; n < g.Width; n += 1) {
                let i = r.at(n, t);
                e.setNumberAt(n, t, w(i));
            }
        return e;
    }
    var M = class r {
            static create(e) {
                return new T({ length: e });
            }
            constructor({
                field: e = r.create(g.PlayBlocks),
                garbage: t = r.create(g.Width),
            }) {
                ((this.field = e), (this.garbage = t));
            }
            fill(e) {
                this.field.fill(e);
            }
            fillAll(e, t) {
                this.field.fillAll(e, t);
            }
            canFill(e, t, n, i) {
                return be(e, t, n, i).every(
                    ([a, u]) =>
                        0 <= a &&
                        a < 10 &&
                        0 <= u &&
                        u < g.Height &&
                        this.getNumberAt(a, u) === 0,
                );
            }
            canFillAll(e) {
                return e.every(
                    ({ x: t, y: n }) =>
                        0 <= t &&
                        t < 10 &&
                        0 <= n &&
                        n < g.Height &&
                        this.getNumberAt(t, n) === 0,
                );
            }
            isOnGround(e, t, n, i) {
                return !this.canFill(e, t, n, i - 1);
            }
            clearLine() {
                this.field.clearLine();
            }
            riseGarbage() {
                (this.field.up(this.garbage), this.garbage.clearAll());
            }
            mirror() {
                this.field.mirror();
            }
            shiftToLeft() {
                this.field.shiftToLeft();
            }
            shiftToRight() {
                this.field.shiftToRight();
            }
            shiftToUp() {
                this.field.shiftToUp();
            }
            shiftToBottom() {
                this.field.shiftToBottom();
            }
            copy() {
                return new r({
                    field: this.field.copy(),
                    garbage: this.garbage.copy(),
                });
            }
            equals(e) {
                return (
                    this.field.equals(e.field) && this.garbage.equals(e.garbage)
                );
            }
            addNumber(e, t, n) {
                0 <= t
                    ? this.field.addOffset(e, t, n)
                    : this.garbage.addOffset(e, -(t + 1), n);
            }
            setNumberFieldAt(e, t) {
                this.field.setAt(e, t);
            }
            setNumberGarbageAt(e, t) {
                this.garbage.setAt(e, t);
            }
            setNumberAt(e, t, n) {
                return 0 <= t
                    ? this.field.set(e, t, n)
                    : this.garbage.set(e, -(t + 1), n);
            }
            getNumberAt(e, t) {
                return 0 <= t
                    ? this.field.get(e, t)
                    : this.garbage.get(e, -(t + 1));
            }
            getNumberAtIndex(e, t) {
                return t
                    ? this.getNumberAt(e % 10, Math.floor(e / 10))
                    : this.getNumberAt(e % 10, -(Math.floor(e / 10) + 1));
            }
            toFieldNumberArray() {
                return this.field.toArray();
            }
            toGarbageNumberArray() {
                return this.garbage.toArray();
            }
        },
        T = class r {
            static load(...e) {
                let t = e.join("").trim();
                return r.loadInner(t);
            }
            static loadMinify(...e) {
                let t = e.join("").trim();
                return r.loadInner(t, t.length);
            }
            static loadInner(e, t) {
                let n = t !== void 0 ? t : e.length;
                if (n % 10 !== 0)
                    throw new Error("Num of blocks in field should be mod 10");
                let i = t !== void 0 ? new r({ length: t }) : new r({});
                for (let l = 0; l < n; l += 1) {
                    let a = e[l];
                    i.set(l % 10, Math.floor((n - l - 1) / 10), w(a));
                }
                return i;
            }
            constructor({ pieces: e, length: t = g.PlayBlocks }) {
                (e !== void 0
                    ? (this.pieces = e)
                    : (this.pieces = Array.from({ length: t }).map(() => 0)),
                    (this.length = t));
            }
            get(e, t) {
                return this.pieces[e + t * g.Width];
            }
            addOffset(e, t, n) {
                this.pieces[e + t * g.Width] += n;
            }
            set(e, t, n) {
                this.setAt(e + t * g.Width, n);
            }
            setAt(e, t) {
                this.pieces[e] = t;
            }
            fill({ type: e, rotation: t, x: n, y: i }) {
                let l = J(e, t);
                for (let a of l) {
                    let [u, o] = [n + a[0], i + a[1]];
                    this.set(u, o, e);
                }
            }
            fillAll(e, t) {
                for (let { x: n, y: i } of e) this.set(n, i, t);
            }
            clearLine() {
                let e = this.pieces.concat(),
                    t = this.pieces.length / g.Width - 1;
                for (let n = t; 0 <= n; n -= 1)
                    if (
                        this.pieces
                            .slice(n * g.Width, (n + 1) * g.Width)
                            .every((a) => a !== 0)
                    ) {
                        let a = e.slice(0, n * g.Width),
                            u = e.slice((n + 1) * g.Width);
                        e = a.concat(
                            u,
                            Array.from({ length: g.Width }).map(() => 0),
                        );
                    }
                this.pieces = e;
            }
            up(e) {
                this.pieces = e.pieces
                    .concat(this.pieces)
                    .slice(0, this.length);
            }
            mirror() {
                let e = [];
                for (let t = 0; t < this.pieces.length; t += 1) {
                    let n = this.pieces.slice(t * g.Width, (t + 1) * g.Width);
                    n.reverse();
                    for (let i of n) e.push(i);
                }
                this.pieces = e;
            }
            shiftToLeft() {
                let e = this.pieces.length / 10;
                for (let t = 0; t < e; t += 1) {
                    for (let n = 0; n < g.Width - 1; n += 1)
                        this.pieces[n + t * g.Width] =
                            this.pieces[n + 1 + t * g.Width];
                    this.pieces[9 + t * g.Width] = 0;
                }
            }
            shiftToRight() {
                let e = this.pieces.length / 10;
                for (let t = 0; t < e; t += 1) {
                    for (let n = g.Width - 1; 1 <= n; n -= 1)
                        this.pieces[n + t * g.Width] =
                            this.pieces[n - 1 + t * g.Width];
                    this.pieces[t * g.Width] = 0;
                }
            }
            shiftToUp() {
                let e = Array.from({ length: 10 }).map(() => 0);
                this.pieces = e.concat(this.pieces).slice(0, this.length);
            }
            shiftToBottom() {
                let e = Array.from({ length: 10 }).map(() => 0);
                this.pieces = this.pieces.slice(10, this.length).concat(e);
            }
            toArray() {
                return this.pieces.concat();
            }
            get numOfBlocks() {
                return this.pieces.length;
            }
            copy() {
                return new r({
                    pieces: this.pieces.concat(),
                    length: this.length,
                });
            }
            toShallowArray() {
                return this.pieces;
            }
            clearAll() {
                this.pieces = this.pieces.map(() => 0);
            }
            equals(e) {
                if (this.pieces.length !== e.pieces.length) return !1;
                for (let t = 0; t < this.pieces.length; t += 1)
                    if (this.pieces[t] !== e.pieces[t]) return !1;
                return !0;
            }
        };
    function be(r, e, t, n) {
        return J(r, e).map((i) => ((i[0] += t), (i[1] += n), i));
    }
    function ie(r, e, t, n) {
        return J(r, e).map((i) => ({ x: i[0] + t, y: i[1] + n }));
    }
    function J(r, e) {
        let t = ye(r);
        switch (e) {
            case 0:
                return t;
            case 3:
                return we(t);
            case 2:
                return Pe(t);
            case 1:
                return xe(t);
        }
        throw new Error("Unsupported block");
    }
    function ye(r) {
        switch (r) {
            case 1:
                return [
                    [0, 0],
                    [-1, 0],
                    [1, 0],
                    [2, 0],
                ];
            case 5:
                return [
                    [0, 0],
                    [-1, 0],
                    [1, 0],
                    [0, 1],
                ];
            case 3:
                return [
                    [0, 0],
                    [1, 0],
                    [0, 1],
                    [1, 1],
                ];
            case 2:
                return [
                    [0, 0],
                    [-1, 0],
                    [1, 0],
                    [1, 1],
                ];
            case 6:
                return [
                    [0, 0],
                    [-1, 0],
                    [1, 0],
                    [-1, 1],
                ];
            case 7:
                return [
                    [0, 0],
                    [-1, 0],
                    [0, 1],
                    [1, 1],
                ];
            case 4:
                return [
                    [0, 0],
                    [1, 0],
                    [0, 1],
                    [-1, 1],
                ];
        }
        throw new Error("Unsupported rotation");
    }
    function xe(r) {
        return r.map((e) => [e[1], -e[0]]);
    }
    function we(r) {
        return r.map((e) => [-e[1], e[0]]);
    }
    function Pe(r) {
        return r.map((e) => [-e[0], -e[1]]);
    }
    var X = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
        z = class r {
            static {
                this.tableLength = X.length;
            }
            constructor(e = "") {
                this.values = e.split("").map(ve);
            }
            poll(e) {
                let t = 0;
                for (let n = 0; n < e; n += 1) {
                    let i = this.values.shift();
                    if (i === void 0) throw new Error("Unexpected fumen");
                    t += i * Math.pow(r.tableLength, n);
                }
                return t;
            }
            push(e, t = 1) {
                let n = e;
                for (let i = 0; i < t; i += 1)
                    (this.values.push(n % r.tableLength),
                        (n = Math.floor(n / r.tableLength)));
            }
            merge(e) {
                for (let t of e.values) this.values.push(t);
            }
            isEmpty() {
                return this.values.length === 0;
            }
            get length() {
                return this.values.length;
            }
            get(e) {
                return this.values[e];
            }
            set(e, t) {
                this.values[e] = t;
            }
            toString() {
                return this.values.map(Ee).join("");
            }
        };
    function ve(r) {
        return X.indexOf(r);
    }
    function Ee(r) {
        return X[r];
    }
    function C(r) {
        return r !== 0;
    }
    var oe = (r, e, t) => {
        let i = (e + t) * r;
        function l(o) {
            switch (o) {
                case 0:
                    return 0;
                case 1:
                    return 1;
                case 2:
                    return 2;
                case 3:
                    return 3;
                case 4:
                    return 4;
                case 5:
                    return 5;
                case 6:
                    return 6;
                case 7:
                    return 7;
                case 8:
                    return 8;
            }
            throw new Error("Unexpected piece");
        }
        function a(o) {
            switch (o) {
                case 0:
                    return 2;
                case 1:
                    return 1;
                case 2:
                    return 0;
                case 3:
                    return 3;
            }
            throw new Error("Unexpected rotation");
        }
        function u(o, s, d) {
            let f = o % r,
                p = Math.floor(o / 10),
                m = e - p - 1;
            return (
                s === 3 && d === 3
                    ? ((f += 1), (m -= 1))
                    : s === 3 && d === 2
                      ? (f += 1)
                      : s === 3 && d === 0
                        ? (m -= 1)
                        : s === 1 && d === 2
                          ? (f += 1)
                          : (s === 1 && d === 3) || (s === 7 && d === 0)
                            ? (m -= 1)
                            : s === 7 && d === 1
                              ? (f -= 1)
                              : s === 4 && d === 0
                                ? (m -= 1)
                                : s === 4 && d === 3 && (f += 1),
                { x: f, y: m }
            );
        }
        return {
            decode: (o) => {
                let s = o,
                    d = l(s % 8);
                s = Math.floor(s / 8);
                let f = a(s % 4);
                s = Math.floor(s / 4);
                let p = u(s % i, d, f);
                s = Math.floor(s / i);
                let m = C(s % 2);
                s = Math.floor(s / 2);
                let c = C(s % 2);
                s = Math.floor(s / 2);
                let h = C(s % 2);
                s = Math.floor(s / 2);
                let P = C(s % 2);
                s = Math.floor(s / 2);
                let b = !C(s % 2);
                return {
                    rise: m,
                    mirror: c,
                    colorize: h,
                    comment: P,
                    lock: b,
                    piece: { ...p, type: d, rotation: f },
                };
            },
        };
    };
    function W(r) {
        return r ? 1 : 0;
    }
    var se = (r, e, t) => {
        let i = (e + t) * r;
        function l(u) {
            let { type: o, rotation: s } = u,
                d = u.x,
                f = u.y;
            return (
                I(o)
                    ? o === 3 && s === 3
                        ? ((d -= 1), (f += 1))
                        : o === 3 && s === 2
                          ? (d -= 1)
                          : o === 3 && s === 0
                            ? (f += 1)
                            : o === 1 && s === 2
                              ? (d -= 1)
                              : (o === 1 && s === 3) || (o === 7 && s === 0)
                                ? (f += 1)
                                : o === 7 && s === 1
                                  ? (d += 1)
                                  : o === 4 && s === 0
                                    ? (f += 1)
                                    : o === 4 && s === 3 && (d -= 1)
                    : ((d = 0), (f = 22)),
                (e - f - 1) * r + d
            );
        }
        function a({ type: u, rotation: o }) {
            if (!I(u)) return 0;
            switch (o) {
                case 2:
                    return 0;
                case 1:
                    return 1;
                case 0:
                    return 2;
                case 3:
                    return 3;
            }
            throw new Error("No reachable");
        }
        return {
            encode: (u) => {
                let {
                        lock: o,
                        comment: s,
                        colorize: d,
                        mirror: f,
                        rise: p,
                        piece: m,
                    } = u,
                    c = W(!o);
                return (
                    (c *= 2),
                    (c += W(s)),
                    (c *= 2),
                    (c += W(d)),
                    (c *= 2),
                    (c += W(f)),
                    (c *= 2),
                    (c += W(p)),
                    (c *= i),
                    (c += l(m)),
                    (c *= 4),
                    (c += a(m)),
                    (c *= 8),
                    (c += m.type),
                    c
                );
            },
        };
    };
    var j =
            " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~",
        V = j.length + 1,
        D = () => ({
            decode: (r) => {
                let e = "",
                    t = r;
                for (let n = 0; n < 4; n += 1) {
                    let i = t % V;
                    ((e += j[i]), (t = Math.floor(t / V)));
                }
                return e;
            },
            encode: (r, e) => j.indexOf(r) * Math.pow(V, e),
        });
    var R = class r {
        get next() {
            let e = this.quiz.indexOf(")") + 1,
                t = this.quiz[e];
            return t === void 0 || t === ";" ? "" : t;
        }
        static isQuizComment(e) {
            return e.startsWith("#Q=");
        }
        static create(e, t) {
            let n = (i, l) => {
                let a = (u) => u || "";
                return new r(`#Q=[${a(i)}](${a(l[0])})${a(l.substring(1))}`);
            };
            return t !== void 0 ? n(e, t) : n(void 0, e);
        }
        static trim(e) {
            return e.trim().replace(/\s+/g, "");
        }
        constructor(e) {
            this.quiz = r.verify(e);
        }
        get least() {
            let e = this.quiz.indexOf(")");
            return this.quiz.substr(e + 1);
        }
        get current() {
            let e = this.quiz.indexOf("(") + 1,
                t = this.quiz[e];
            return t === ")" ? "" : t;
        }
        get hold() {
            let e = this.quiz.indexOf("[") + 1,
                t = this.quiz[e];
            return t === "]" ? "" : t;
        }
        get leastAfterNext2() {
            let e = this.quiz.indexOf(")");
            return this.quiz[e + 1] === ";"
                ? this.quiz.substr(e + 1)
                : this.quiz.substr(e + 2);
        }
        getOperation(e) {
            let t = k(e),
                n = this.current;
            if (t === n) return "direct";
            let i = this.hold;
            if (t === i) return "swap";
            if (i === "") {
                if (t === this.next) return "stock";
            } else if (n === "" && t === this.next) return "direct";
            throw new Error(`Unexpected hold piece in quiz: ${this.quiz}`);
        }
        get leastInActiveBag() {
            let e = this.quiz.indexOf(";"),
                t = 0 <= e ? this.quiz.substring(0, e) : this.quiz,
                n = t.indexOf(")");
            return t[n + 1] === ";" ? t.substr(n + 1) : t.substr(n + 2);
        }
        static verify(e) {
            let t = this.trim(e);
            if (t.length === 0 || e === "#Q=[]()" || !e.startsWith("#Q="))
                return e;
            if (!t.match(/^#Q=\[[TIOSZJL]?]\([TIOSZJL]?\)[TIOSZJL]*;?.*$/i))
                throw new Error(
                    `Current piece doesn't exist, however next pieces exist: ${e}`,
                );
            return t;
        }
        direct() {
            if (this.current === "") {
                let e = this.leastAfterNext2;
                return new r(`#Q=[${this.hold}](${e[0]})${e.substr(1)}`);
            }
            return new r(
                `#Q=[${this.hold}](${this.next})${this.leastAfterNext2}`,
            );
        }
        swap() {
            if (this.hold === "")
                throw new Error(`Cannot find hold piece: ${this.quiz}`);
            let e = this.next;
            return new r(`#Q=[${this.current}](${e})${this.leastAfterNext2}`);
        }
        stock() {
            if (this.hold !== "" || this.next === "")
                throw new Error(`Cannot stock: ${this.quiz}`);
            let e = this.leastAfterNext2,
                t = e[0] !== void 0 ? e[0] : "";
            return 1 < e.length
                ? new r(`#Q=[${this.current}](${t})${e.substr(1)}`)
                : new r(`#Q=[${this.current}](${t})`);
        }
        operate(e) {
            switch (e) {
                case "direct":
                    return this.direct();
                case "swap":
                    return this.swap();
                case "stock":
                    return this.stock();
            }
            throw new Error("Unexpected operation");
        }
        format() {
            let e = this.nextIfEnd();
            if (e.quiz === "#Q=[]()") return new r("");
            let t = e.current,
                n = e.hold;
            if (t === "" && n !== "") return new r(`#Q=[](${n})${e.least}`);
            if (t === "") {
                let i = e.least,
                    l = i[0];
                return l === void 0
                    ? new r("")
                    : l === ";"
                      ? new r(i.substr(1))
                      : new r(`#Q=[](${l})${i.substr(1)}`);
            }
            return e;
        }
        getHoldPiece() {
            if (!this.canOperate()) return 0;
            let e = this.hold;
            return e === void 0 || e === "" || e === ";" ? 0 : w(e);
        }
        getNextPieces(e) {
            if (!this.canOperate())
                return e !== void 0
                    ? Array.from({ length: e }).map(() => 0)
                    : [];
            let t = (this.current + this.next + this.leastInActiveBag).substr(
                0,
                e,
            );
            return (
                e !== void 0 && t.length < e && (t += " ".repeat(e - t.length)),
                t
                    .split("")
                    .map((n) =>
                        n === void 0 || n === " " || n === ";" ? 0 : w(n),
                    )
            );
        }
        toString() {
            return this.quiz;
        }
        canOperate() {
            let e = this.quiz;
            return (
                e.startsWith("#Q=[]();") && (e = this.quiz.substr(8)),
                e.startsWith("#Q=") && e !== "#Q=[]()"
            );
        }
        nextIfEnd() {
            return this.quiz.startsWith("#Q=[]();")
                ? new r(this.quiz.substr(8))
                : this;
        }
    };
    function Y(r) {
        return r instanceof O ? r.copy() : O.from(r);
    }
    var q = class r {
            constructor(e) {
                this.field = e;
            }
            static create(e, t) {
                return new r(
                    new M({
                        field: e !== void 0 ? T.load(e) : void 0,
                        garbage: t !== void 0 ? T.loadMinify(t) : void 0,
                    }),
                );
            }
            canFill(e) {
                if (e === void 0) return !0;
                let t = Y(e);
                return this.field.canFillAll(t.positions());
            }
            canLock(e) {
                return e === void 0
                    ? !0
                    : this.canFill(e)
                      ? !this.canFill({ ...e, y: e.y - 1 })
                      : !1;
            }
            fill(e, t = !1) {
                if (e === void 0) return;
                let n = Y(e);
                if (!t && !this.canFill(n))
                    throw Error("Cannot fill piece on field");
                return (this.field.fillAll(n.positions(), w(n.type)), n);
            }
            put(e) {
                if (e === void 0) return;
                let t = Y(e);
                for (; 0 <= t.y; t.y -= 1)
                    if (this.canLock(t)) return (this.fill(t), t);
                throw Error("Cannot put piece on field");
            }
            clearLine() {
                this.field.clearLine();
            }
            at(e, t) {
                return k(this.field.getNumberAt(e, t));
            }
            set(e, t, n) {
                this.field.setNumberAt(e, t, w(n));
            }
            copy() {
                return new r(this.field.copy());
            }
            str(e = {}) {
                let t = e.reduced !== void 0 ? e.reduced : !0,
                    n =
                        e.separator !== void 0
                            ? e.separator
                            : `
`,
                    i = e.garbage === void 0 || e.garbage ? -1 : 0,
                    l = "";
                for (let a = 22; i <= a; a -= 1) {
                    let u = "";
                    for (let o = 0; o < 10; o += 1) u += this.at(o, a);
                    (t && u === "__________") ||
                        ((t = !1), (l += u), a !== i && (l += n));
                }
                return l;
            }
        },
        O = class r {
            constructor(e, t, n, i) {
                this.type = e;
                this.rotation = t;
                this.x = n;
                this.y = i;
            }
            static from(e) {
                return new r(e.type, e.rotation, e.x, e.y);
            }
            positions() {
                return ie(w(this.type), N(this.rotation), this.x, this.y).sort(
                    (e, t) => (e.y === t.y ? e.x - t.x : e.y - t.y),
                );
            }
            operation() {
                return {
                    type: this.type,
                    rotation: this.rotation,
                    x: this.x,
                    y: this.y,
                };
            }
            isValid() {
                try {
                    (w(this.type), N(this.rotation));
                } catch {
                    return !1;
                }
                return this.positions().every(
                    ({ x: e, y: t }) => 0 <= e && e < 10 && 0 <= t && t < 23,
                );
            }
            copy() {
                return new r(this.type, this.rotation, this.x, this.y);
            }
        };
    var K = class {
            constructor(e, t, n, i, l, a) {
                this.index = e;
                this.operation = n;
                this.comment = i;
                this.flags = l;
                this.refs = a;
                this._field = t.copy();
            }
            get field() {
                return new q(this._field.copy());
            }
            set field(e) {
                this._field = U(e);
            }
            mino() {
                return O.from(this.operation);
            }
        },
        S = { GarbageLine: 1, Width: 10 };
    function Fe(r) {
        let e = (i, l) => {
                let a = l.trim().replace(/[?\s]+/g, "");
                return { version: i, data: a };
            },
            t = r,
            n = t.indexOf("&");
        0 <= n && (t = t.substring(0, n));
        {
            let i = r.match(/[vmd]115@/);
            if (i != null && i.index !== void 0) {
                let l = t.substr(i.index + 5);
                return e("115", l);
            }
        }
        {
            let i = r.match(/[vmd]110@/);
            if (i != null && i.index !== void 0) {
                let l = t.substr(i.index + 5);
                return e("110", l);
            }
        }
        throw new Error("Unsupported fumen version");
    }
    function ae(r) {
        let { version: e, data: t } = Fe(r);
        switch (e) {
            case "115":
                return ce(t, 23);
            case "110":
                return ce(t, 21);
        }
        throw new Error("Unsupported fumen version");
    }
    function ce(r, e) {
        let n = (e + S.GarbageLine) * S.Width,
            i = new z(r),
            l = (p) => {
                let m = { changed: !0, field: p },
                    c = 0;
                for (; c < n; ) {
                    let h = i.poll(2),
                        P = Math.floor(h / n),
                        b = h % n;
                    P === 8 && b === n - 1 && (m.changed = !1);
                    for (let y = 0; y < b + 1; y += 1) {
                        let v = c % S.Width,
                            x = e - Math.floor(c / S.Width) - 1;
                        (m.field.addNumber(v, x, P - 8), (c += 1));
                    }
                }
                return m;
            },
            a = 0,
            u = G(),
            o = {
                repeatCount: -1,
                refIndex: { comment: 0, field: 0 },
                quiz: void 0,
                lastCommentText: "",
            },
            s = [],
            d = oe(S.Width, e, S.GarbageLine),
            f = D();
        for (; !i.isEmpty(); ) {
            let p;
            0 < o.repeatCount
                ? ((p = { field: u, changed: !1 }), (o.repeatCount -= 1))
                : ((p = l(u.copy())), p.changed || (o.repeatCount = i.poll(1)));
            let m = i.poll(3),
                c = d.decode(m),
                h;
            if (c.comment) {
                let v = [],
                    x = i.poll(2);
                for (let E = 0; E < Math.floor((x + 3) / 4); E += 1) {
                    let A = i.poll(5);
                    v.push(A);
                }
                let L = "";
                for (let E of v) L += f.decode(E);
                let F = unescape(L.slice(0, x));
                ((o.lastCommentText = F),
                    (h = { text: F }),
                    (o.refIndex.comment = a));
                let Q = h.text;
                if (R.isQuizComment(Q))
                    try {
                        o.quiz = new R(Q);
                    } catch {
                        o.quiz = void 0;
                    }
                else o.quiz = void 0;
            } else
                a === 0
                    ? (h = { text: "" })
                    : (h = {
                          text:
                              o.quiz !== void 0
                                  ? o.quiz.format().toString()
                                  : void 0,
                          ref: o.refIndex.comment,
                      });
            let P = !1;
            if (o.quiz !== void 0 && ((P = !0), o.quiz.canOperate() && c.lock))
                if (I(c.piece.type))
                    try {
                        let v = o.quiz.nextIfEnd(),
                            x = v.getOperation(c.piece.type);
                        o.quiz = v.operate(x);
                    } catch {
                        o.quiz = o.quiz.format();
                    }
                else o.quiz = o.quiz.format();
            let b;
            c.piece.type !== 0 && (b = c.piece);
            let y;
            (p.changed || a === 0
                ? ((y = {}), (o.refIndex.field = a))
                : (y = { ref: o.refIndex.field }),
                s.push(
                    new K(
                        a,
                        p.field,
                        b !== void 0
                            ? O.from({
                                  type: k(b.type),
                                  rotation: ne(b.rotation),
                                  x: b.x,
                                  y: b.y,
                              })
                            : void 0,
                        h.text !== void 0 ? h.text : o.lastCommentText,
                        {
                            quiz: P,
                            lock: c.lock,
                            mirror: c.mirror,
                            colorize: c.colorize,
                            rise: c.rise,
                        },
                        { field: y.ref, comment: h.ref },
                    ),
                ),
                (a += 1),
                c.lock &&
                    (I(c.piece.type) && p.field.fill(c.piece),
                    p.field.clearLine(),
                    c.rise && p.field.riseGarbage(),
                    c.mirror && p.field.mirror()),
                (u = p.field));
        }
        return s;
    }
    var H = { GarbageLine: 1, Width: 10 };
    function ue(r) {
        let e = (c, h) => {
                let { changed: P, values: b } = Ie(c, h);
                if (P) (n.merge(b), (t = -1));
                else if (t < 0 || n.get(t) === z.tableLength - 1)
                    (n.merge(b), n.push(0), (t = n.length - 1));
                else if (n.get(t) < z.tableLength - 1) {
                    let y = n.get(t);
                    n.set(t, y + 1);
                }
            },
            t = -1,
            n = new z(),
            i = G(),
            l = se(H.Width, 23, H.GarbageLine),
            a = D(),
            u = "",
            o,
            s = (c) => {
                let h = r[c];
                h.flags = h.flags ? h.flags : {};
                let P = h.field,
                    b = P !== void 0 ? U(P) : i.copy();
                e(i, b);
                let y =
                        h.comment !== void 0 && (c !== 0 || h.comment !== "")
                            ? h.comment
                            : void 0,
                    v =
                        h.operation !== void 0
                            ? {
                                  type: w(h.operation.type),
                                  rotation: N(h.operation.rotation),
                                  x: h.operation.x,
                                  y: h.operation.y,
                              }
                            : { type: 0, rotation: 2, x: 0, y: 22 },
                    x;
                if (
                    (y !== void 0
                        ? y.startsWith("#Q=")
                            ? o !== void 0 && o.format().toString() === y
                                ? (x = void 0)
                                : ((x = y), (u = x), (o = new R(y)))
                            : o !== void 0 && o.format().toString() === y
                              ? ((x = void 0), (u = y), (o = void 0))
                              : ((x = u !== y ? y : void 0),
                                (u = u !== y ? x : u),
                                (o = void 0))
                        : ((x = void 0), (o = void 0)),
                    o !== void 0 && o.canOperate() && h.flags.lock)
                )
                    if (I(v.type))
                        try {
                            let E = o.nextIfEnd(),
                                A = E.getOperation(v.type);
                            o = E.operate(A);
                        } catch {
                            o = o.format();
                        }
                    else o = o.format();
                let L = { lock: !0, colorize: c === 0, ...h.flags },
                    F = {
                        piece: v,
                        rise: !!L.rise,
                        mirror: !!L.mirror,
                        colorize: !!L.colorize,
                        lock: !!L.lock,
                        comment: x !== void 0,
                    },
                    Q = l.encode(F);
                if ((n.push(Q, 3), x !== void 0)) {
                    let E = escape(h.comment),
                        A = Math.min(E.length, 4095);
                    n.push(A, 2);
                    for (let Z = 0; Z < A; Z += 4) {
                        let ee = 0;
                        for (let $ = 0; $ < 4; $ += 1) {
                            let te = Z + $;
                            if (A <= te) break;
                            let le = E.charAt(te);
                            ee += a.encode(le, $);
                        }
                        n.push(ee, 5);
                    }
                } else h.comment === void 0 && (u = void 0);
                (F.lock &&
                    (I(F.piece.type) && b.fill(F.piece),
                    b.clearLine(),
                    F.rise && b.riseGarbage(),
                    F.mirror && b.mirror()),
                    (i = b));
            };
        for (let c = 0; c < r.length; c += 1) s(c);
        let d = n.toString();
        if (d.length < 41) return d;
        let f = [d.substr(0, 42)],
            m = d.substring(42).match(/[\S]{1,47}/g) || [];
        return f.concat(m).join("?");
    }
    function Ie(r, e) {
        let i = 24 * H.Width,
            l = new z(),
            a = (f, p) => {
                let m = 23 - p - 1;
                return e.getNumberAt(f, m) - r.getNumberAt(f, m) + 8;
            },
            u = (f, p) => {
                let m = f * i + p;
                l.push(m, 2);
            },
            o = !0,
            s = a(0, 0),
            d = -1;
        for (let f = 0; f < 24; f += 1)
            for (let p = 0; p < H.Width; p += 1) {
                let m = a(p, f);
                m !== s ? (u(s, d), (d = 0), (s = m)) : (d += 1);
            }
        return (
            u(s, d),
            s === 8 && d === i - 1 && (o = !1),
            { changed: o, values: l }
        );
    }
    var ze = { decode: (r) => ae(r) },
        Oe = { encode: (r) => `v115@${ue(r)}` };
    return ge(Le);
})();
