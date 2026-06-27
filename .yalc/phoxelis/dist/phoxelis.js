//#region \0rolldown/runtime.js
var e = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), t = function(e, t, n, r) {
	function i(e) {
		return e instanceof n ? e : new n(function(t) {
			t(e);
		});
	}
	return new (n ||= Promise)(function(n, a) {
		function o(e) {
			try {
				c(r.next(e));
			} catch (e) {
				a(e);
			}
		}
		function s(e) {
			try {
				c(r.throw(e));
			} catch (e) {
				a(e);
			}
		}
		function c(e) {
			e.done ? n(e.value) : i(e.value).then(o, s);
		}
		c((r = r.apply(e, t || [])).next());
	});
}, n = function(e) {
	if (!Symbol.asyncIterator) throw TypeError("Symbol.asyncIterator is not defined.");
	var t = e[Symbol.asyncIterator], n;
	return t ? t.call(e) : (e = typeof __values == "function" ? __values(e) : e[Symbol.iterator](), n = {}, r("next"), r("throw"), r("return"), n[Symbol.asyncIterator] = function() {
		return this;
	}, n);
	function r(t) {
		n[t] = e[t] && function(n) {
			return new Promise(function(r, a) {
				n = e[t](n), i(r, a, n.done, n.value);
			});
		};
	}
	function i(e, t, n, r) {
		Promise.resolve(r).then(function(t) {
			e({
				value: t,
				done: n
			});
		}, t);
	}
}, r = (e, t, n) => {
	e[t] = n;
}, i = "[\\s]+", a = {
	glyphname: "empty",
	codepoint: 8203,
	bbw: 0,
	bbh: 0,
	bbxoff: 0,
	bbyoff: 0,
	swx0: 0,
	swy0: 0,
	dwx0: 0,
	dwy0: 0,
	swx1: 0,
	swy1: 0,
	dwx1: 0,
	dwy1: 0,
	vvectorx: 0,
	vvectory: 0,
	hexdata: []
}, o = [
	"glyphname",
	"codepoint",
	"bbw",
	"bbh",
	"bbxoff",
	"bbyoff",
	"swx0",
	"swy0",
	"dwx0",
	"dwy0",
	"swx1",
	"swy1",
	"dwx1",
	"dwy1",
	"vvectorx",
	"vvectory",
	"hexdata"
], s = {
	lr: "lrtb",
	rl: "rltb",
	tb: "tbrl",
	bt: "btrl",
	lrtb: void 0,
	lrbt: void 0,
	rltb: void 0,
	rlbt: void 0,
	tbrl: void 0,
	tblr: void 0,
	btrl: void 0,
	btlr: void 0
}, c = {
	lr: 1,
	rl: 2,
	tb: 0,
	bt: -1
}, l = class {
	constructor() {
		this.headers = void 0, this.__headers = {}, this.props = {}, this.glyphs = /* @__PURE__ */ new Map(), this.__glyph_count_to_check = null, this.__curline_startchar = null, this.__curline_chars = null;
	}
	load_filelines(e) {
		var r, i;
		return t(this, void 0, void 0, function* () {
			try {
				this.__f = e, yield this.__parse_headers();
			} finally {
				if (typeof Deno < "u" && this.__f !== void 0) try {
					for (var t = n(this.__f), a; a = yield t.next(), !a.done;) a.value;
				} catch (e) {
					r = { error: e };
				} finally {
					try {
						a && !a.done && (i = t.return) && (yield i.call(t));
					} finally {
						if (r) throw r.error;
					}
				}
			}
			return this;
		});
	}
	__parse_headers() {
		return t(this, void 0, void 0, function* () {
			for (;;) {
				let e = (yield this.__f?.next())?.value, t = e.split(/ (.+)/, 2), n = t.length, r;
				if (n === 2) {
					let n = t[0], a = t[1].trim();
					switch (n) {
						case "STARTFONT":
							this.__headers.bdfversion = parseFloat(a);
							break;
						case "FONT":
							this.__headers.fontname = a;
							break;
						case "SIZE":
							r = a.split(" "), this.__headers.pointsize = parseInt(r[0], 10), this.__headers.xres = parseInt(r[1], 10), this.__headers.yres = parseInt(r[2], 10);
							break;
						case "FONTBOUNDINGBOX":
							r = a.split(" "), this.__headers.fbbx = parseInt(r[0], 10), this.__headers.fbby = parseInt(r[1], 10), this.__headers.fbbxoff = parseInt(r[2], 10), this.__headers.fbbyoff = parseInt(r[3], 10);
							break;
						case "STARTPROPERTIES":
							this.__parse_headers_after(), yield this.__parse_props();
							return;
						case "COMMENT":
							(!("comment" in this.__headers) || !Array.isArray(this.__headers.comment)) && (this.__headers.comment = []), this.__headers.comment.push(a.replace(/^[\s"'\t\r\n]+|[\s"'\t\r\n]+$/g, ""));
							break;
						case "SWIDTH":
							r = a.split(" "), this.__headers.swx0 = parseInt(r[0], 10), this.__headers.swy0 = parseInt(r[1], 10);
							break;
						case "DWIDTH":
							r = a.split(" "), this.__headers.dwx0 = parseInt(r[0], 10), this.__headers.dwy0 = parseInt(r[1], 10);
							break;
						case "SWIDTH1":
							r = a.split(" "), this.__headers.swx1 = parseInt(r[0], 10), this.__headers.swy1 = parseInt(r[1], 10);
							break;
						case "DWIDTH1":
							r = a.split(" "), this.__headers.dwx1 = parseInt(r[0], 10), this.__headers.dwy1 = parseInt(r[1], 10);
							break;
						case "VVECTOR":
							r = i.split(a), this.__headers.vvectorx = parseInt(r[0], 10), this.__headers.vvectory = parseInt(r[1], 10);
							break;
						case "METRICSSET":
						case "CONTENTVERSION":
							this.__headers[n.toLowerCase()] = parseInt(a, 10);
							break;
						case "CHARS":
							console.warn("It looks like the font does not have property block beginning with 'STARTPROPERTIES' keyword"), this.__parse_headers_after(), this.__curline_chars = e, yield this.__parse_glyph_count();
							return;
						case "STARTCHAR":
							console.warn("It looks like the font does not have property block beginning with 'STARTPROPERTIES' keyword"), console.warn("Cannot find 'CHARS' line"), this.__parse_headers_after(), this.__curline_startchar = e, yield this.__prepare_glyphs();
							return;
					}
				}
				if (n === 1 && t[0].trim() === "ENDFONT") {
					console.warn("It looks like the font does not have property block beginning with 'STARTPROPERTIES' keyword"), console.warn("This font does not have any glyphs");
					return;
				}
			}
		});
	}
	__parse_headers_after() {
		"metricsset" in this.__headers || (this.__headers.metricsset = 0), this.headers = this.__headers;
	}
	__parse_props() {
		return t(this, void 0, void 0, function* () {
			for (;;) {
				let e = ((yield this.__f?.next())?.value).split(/ (.+)/, 2), t = e.length;
				if (t === 2) {
					let t = e[0], n = e[1].replace(/^[\s"'\t\r\n]+|[\s"'\t\r\n]+$/g, "");
					t === "COMMENT" ? ((!("comment" in this.props) || !Array.isArray(this.props.comment)) && (this.props.comment = []), this.props.comment.push(n.replace(/^[\s"'\t\r\n]+|[\s"'\t\r\n]+$/g, ""))) : this.props[t.toLowerCase()] = n;
				} else if (t === 1) {
					let t = e[0].trim();
					if (t === "ENDPROPERTIES") {
						yield this.__parse_glyph_count();
						return;
					}
					if (t === "ENDFONT") {
						console.warn("This font does not have any glyphs");
						return;
					} else this.props[t] = null;
				}
			}
		});
	}
	__parse_glyph_count() {
		return t(this, void 0, void 0, function* () {
			let e;
			if (this.__curline_chars === null ? e = (yield this.__f?.next())?.value : (e = this.__curline_chars, this.__curline_chars = null), e.trim() === "ENDFONT") {
				console.warn("This font does not have any glyphs");
				return;
			}
			let t = e.split(/ (.+)/, 2);
			t[0] === "CHARS" ? this.__glyph_count_to_check = parseInt(t[1].trim(), 10) : (this.__curline_startchar = e, console.warn("Cannot find 'CHARS' line next to 'ENDPROPERTIES' line")), yield this.__prepare_glyphs();
		});
	}
	__prepare_glyphs() {
		return t(this, void 0, void 0, function* () {
			let e = 0, t = [
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null
			], n = [], r = !1, a = !1;
			for (;;) {
				let o;
				if (this.__curline_startchar === null ? o = (yield this.__f?.next())?.value : (o = this.__curline_startchar, this.__curline_startchar = null), o == null) {
					console.warn("This font does not have 'ENDFONT' keyword"), this.__prepare_glyphs_after();
					return;
				}
				let s = o.split(/ (.+)/, 2), c = s.length;
				if (c === 2) {
					let n = s[0], r = s[1].trim(), o;
					switch (n) {
						case "STARTCHAR":
							t = [
								null,
								null,
								null,
								null,
								null,
								null,
								null,
								null,
								null,
								null,
								null,
								null,
								null,
								null,
								null,
								null,
								null
							], t[0] = r, a = !1;
							break;
						case "ENCODING":
							e = parseInt(r, 10), t[1] = e;
							break;
						case "BBX":
							o = r.split(" "), t[2] = parseInt(o[0], 10), t[3] = parseInt(o[1], 10), t[4] = parseInt(o[2], 10), t[5] = parseInt(o[3], 10);
							break;
						case "SWIDTH":
							o = r.split(" "), t[6] = parseInt(o[0], 10), t[7] = parseInt(o[1], 10);
							break;
						case "DWIDTH":
							o = r.split(" "), t[8] = parseInt(o[0], 10), t[9] = parseInt(o[1], 10);
							break;
						case "SWIDTH1":
							o = r.split(" "), t[10] = parseInt(o[0], 10), t[11] = parseInt(o[1], 10);
							break;
						case "DWIDTH1":
							o = r.split(" "), t[12] = parseInt(o[0], 10), t[13] = parseInt(o[1], 10);
							break;
						case "VVECTOR":
							o = i.split(r), t[14] = parseInt(o[0], 10), t[15] = parseInt(o[1], 10);
							break;
					}
				} else if (c === 1) {
					let i = s[0].trim();
					switch (i) {
						case "BITMAP":
							n = [], r = !0;
							break;
						case "ENDCHAR":
							r = !1, t[16] = n, this.glyphs.set(e, t), a = !0;
							break;
						case "ENDFONT": if (a) {
							this.__prepare_glyphs_after();
							return;
						}
						default:
							r && n.push(i);
							break;
					}
				}
			}
		});
	}
	__prepare_glyphs_after() {
		let e = this.glyphs.size;
		this.__glyph_count_to_check !== e && (this.__glyph_count_to_check === null ? console.warn("The glyph count next to 'CHARS' keyword does not exist") : console.warn(`The glyph count next to 'CHARS' keyword is ${this.__glyph_count_to_check.toString()}, which does not match the actual glyph count ${e.toString()}`));
	}
	get length() {
		return this.glyphs.size;
	}
	itercps(e, t) {
		let n = e ?? 1, r = t ?? null, i, a = [...this.glyphs.keys()];
		switch (n) {
			case 1:
				i = a.sort((e, t) => e - t);
				break;
			case 0:
				i = a;
				break;
			case 2:
				i = a.sort((e, t) => t - e);
				break;
			case -1:
				i = a.reverse();
				break;
		}
		return r !== null && (i = i.filter((e) => {
			if (typeof r == "number") return e < r;
			if (Array.isArray(r) && r.length === 2 && typeof r[0] == "number" && typeof r[1] == "number") return e <= r[1] && e >= r[0];
			if (Array.isArray(r) && Array.isArray(r[0])) for (let t of r) {
				let [n, r] = t;
				if (e <= r && e >= n) return !0;
			}
			return !1;
		})), i;
	}
	*iterglyphs(e, t) {
		for (let n of this.itercps(e, t)) yield this.glyphbycp(n);
	}
	glyphbycp(e) {
		let t = this.glyphs.get(e);
		if (t == null) return console.warn(`Glyph "${String.fromCodePoint(e)}" (codepoint ${e.toString()}) does not exist in the font. Will return 'null'`), null;
		{
			let e = {};
			return o.forEach((n, i) => {
				r(e, n, t[i]);
			}), new u(e, this);
		}
	}
	glyph(e) {
		let t = e.codePointAt(0);
		return t === void 0 ? null : this.glyphbycp(t);
	}
	lacksglyphs(e) {
		let t = [], n = e.length;
		for (let r, i = 0; i < n; i++) {
			r = e[i];
			let n = r.codePointAt(0);
			(n === void 0 || !this.glyphs.has(n)) && t.push(r);
		}
		return t.length === 0 ? null : t;
	}
	drawcps(e, t = {}) {
		let n = t.linelimit ?? 512, r = t.mode ?? 1, i = t.direction ?? "lrtb", o = t.usecurrentglyphspacing ?? !1, l = t.missing ?? null;
		if (this.headers === void 0) throw Error("Font is not loaded");
		let f, p, m, h, g, _, v, y, b, x, S, C, w, T, ee, te, ne, re, ie = s[i] ?? i, ae = ie.slice(0, 2), oe = ie.slice(2, 4);
		ae in c && oe in c ? (_ = c[ae], v = c[oe]) : (_ = 1, v = 0), v === 0 || v === 2 ? f = 1 : (v === 1 || v === -1) && (f = 0), _ === 1 || _ === -1 ? p = 1 : (_ === 2 || _ === 0) && (p = 0), r === 1 && (y = _ > 0 ? this.headers.fbbx : this.headers.fbby, _ > 0 ? (C = "dwx0", w = "dwy0") : (C = "dwx1", w = "dwy1"), S = C in this.headers ? this.headers[C] : w in this.headers ? this.headers[w] : null);
		let se = [];
		h = [];
		let ce = [];
		ee = [], te = 0;
		let le = () => {
			se.push(h), o ? ee.shift() : ee.pop(), ce.push(ee);
		}, ue = e[Symbol.iterator]();
		for (ne = !1;;) {
			if (ne) ne = !1;
			else {
				if (g = ue.next()?.value, g === void 0) break;
				let e = this.glyphbycp(g);
				b = e === null ? l ? l instanceof u ? l : new u(l, this) : new u(a, this) : e, m = b.draw(), re = m.width(), T = 0, r === 1 && C !== void 0 && w !== void 0 && (x = b.meta[C] || b.meta[w], x ??= S, x != null && y !== void 0 && (T = x - y));
			}
			if (re !== void 0 && T !== void 0 && m !== void 0 && b !== void 0 && g !== void 0) if (te += re + T, te <= n) h.push(m), ee.push(T);
			else {
				if (h.length === 0) throw Error(`\`_linelimit\` (${n}) is too small the line can't even contain one glyph: "${b.chr()}" (codepoint ${g}, width: ${re})`);
				le(), te = 0, h = [], ee = [], ne = !0;
			}
		}
		h.length !== 0 && le();
		let E = se.map((e, t) => d.concatall(e, {
			direction: _,
			align: f,
			offsetlist: ce[t]
		}));
		return d.concatall(E, {
			direction: v,
			align: p
		});
	}
	draw(e, t = {}) {
		let { linelimit: n, mode: r, direction: i, usecurrentglyphspacing: a, missing: o } = t;
		return this.drawcps(e.split("").map((e) => {
			let t = e.codePointAt(0);
			return t === void 0 ? 8203 : t;
		}), {
			linelimit: n,
			mode: r,
			direction: i,
			usecurrentglyphspacing: a,
			missing: o
		});
	}
	drawall(e = {}) {
		let { order: t, r: n, linelimit: r, mode: i, direction: a, usecurrentglyphspacing: o } = e, s = i ?? 0;
		return this.drawcps(this.itercps(t, n), {
			linelimit: r,
			mode: s,
			direction: a,
			usecurrentglyphspacing: o
		});
	}
}, u = class {
	constructor(e, t) {
		this.meta = e, this.font = t;
	}
	toString() {
		return this.draw().toString();
	}
	repr() {
		return "Glyph(" + JSON.stringify(this.meta, null, 2) + ", Font(<" + this.font.headers?.fontname + ">)";
	}
	cp() {
		return this.meta.codepoint;
	}
	chr() {
		return String.fromCodePoint(this.cp());
	}
	draw(e, t) {
		let n = e ?? 0, r = t ?? null, i;
		switch (n) {
			case 0:
				i = this.__draw_fbb();
				break;
			case 1:
				i = this.__draw_bb();
				break;
			case 2:
				i = this.__draw_original();
				break;
			case -1:
				if (r !== null) i = this.__draw_user_specified(r);
				else throw Error("Parameter bb in draw() method must be set when mode=-1");
				break;
		}
		return i;
	}
	__draw_user_specified(e) {
		let t = this.meta.bbxoff, n = this.meta.bbyoff, [r, i, a, o] = e;
		return this.__draw_bb().crop(r, i, -t + a, -n + o);
	}
	__draw_original() {
		return new d(this.meta.hexdata.map((e) => e ? parseInt(e, 16).toString(2).padStart(e.length * 4, "0") : ""));
	}
	__draw_bb() {
		let e = this.meta.bbw, t = this.meta.bbh, n = this.__draw_original(), r = n.bindata, i = r.length;
		return i !== t && console.warn(`Glyph "${this.meta.glyphname.toString()}" (codepoint ${this.meta.codepoint.toString()})'s bbh, ${t.toString()}, does not match its hexdata line count, ${i.toString()}`), n.bindata = r.map((t) => t.slice(0, e)), n;
	}
	__draw_fbb() {
		let e = this.font.headers;
		if (e === void 0) throw Error("Font is not loaded");
		return this.__draw_user_specified([
			e.fbbx,
			e.fbby,
			e.fbbxoff,
			e.fbbyoff
		]);
	}
	origin(e = {}) {
		let t = e.mode ?? 0, n = e.fromorigin ?? !1, r = e.xoff ?? null, i = e.yoff ?? null, a, o = this.meta.bbxoff, s = this.meta.bbyoff;
		switch (t) {
			case 0:
				let e = this.font.headers;
				if (e === void 0) throw Error("Font is not loaded");
				a = [e.fbbxoff, e.fbbyoff];
				break;
			case 1:
				a = [o, s];
				break;
			case 2:
				a = [o, s];
				break;
			case -1:
				if (r !== null && i !== null) a = [r, i];
				else throw Error("Parameter xoff and yoff in origin() method must be all set when mode=-1");
				break;
		}
		return n ? a : [0 - a[0], 0 - a[1]];
	}
}, d = class e {
	constructor(e) {
		this.bindata = e;
	}
	toString() {
		return this.bindata.join("\n").replace(/0/g, ".").replace(/1/g, "#").replace(/2/g, "&");
	}
	repr() {
		return `Bitmap(${JSON.stringify(this.bindata, null, 2)})`;
	}
	width() {
		return this.bindata[0].length;
	}
	height() {
		return this.bindata.length;
	}
	clone() {
		return new e([...this.bindata]);
	}
	static __crop_string(e, t, n) {
		let r = e, i = e.length, a = 0;
		t < 0 && (a = 0 - t, r = r.padStart(a + i, "0")), t + n > i && (r = r.padEnd(t + n - i + r.length, "0"));
		let o = t + a;
		return r.slice(o, o + n);
	}
	static __string_offset_concat(t, n, r) {
		let i = r ?? 0;
		if (i === 0) return t + n;
		let a = t.length, o = n.length, s = a + i, c = s + o, l = Math.min(0, s), u = Math.max(a, c), d = e.__crop_string(t, l, u - l), f = e.__crop_string(n, l - s, u - l);
		return d.split("").map((e, t) => (parseInt(f[t], 10) || parseInt(e, 10)).toString()).join("");
	}
	static __listofstr_offset_concat(e, t, n) {
		let r = n ?? 0, i, a;
		if (r === 0) return e.concat(t);
		let o = e[0].length, s = e.length, c = t.length, l = s + r, u = l + c, d = Math.min(0, l), f = Math.max(s, u), p = [];
		for (let n = d; n < f; n++) i = n < 0 || n >= s ? "0".repeat(o) : e[n], a = n < l || n >= u ? "0".repeat(o) : t[n - l], p.push(i.split("").map((e, t) => (parseInt(a[t], 10) || parseInt(e, 10)).toString()).join(""));
		return p;
	}
	static __crop_bitmap(t, n, r, i, a) {
		let o, s = [], c = t.length;
		for (let l = 0; l < r; l++) o = c - a - r + l, o < 0 || o >= c ? s.push("0".repeat(n)) : s.push(e.__crop_string(t[o], i, n));
		return s;
	}
	crop(t, n, r, i) {
		let a = r ?? 0, o = i ?? 0;
		return this.bindata = e.__crop_bitmap(this.bindata, t, n, a, o), this;
	}
	overlay(e) {
		let t = this.bindata, n = e.bindata;
		return t.length !== n.length && console.warn("the bitmaps to overlay have different height"), t[0].length !== n[0].length && console.warn("the bitmaps to overlay have different width"), this.bindata = t.map((e, t) => {
			let r = e, i = n[t];
			return r.split("").map((e, t) => (parseInt(i[t], 10) || parseInt(e, 10)).toString()).join("");
		}), this;
	}
	static concatall(t, n = {}) {
		let r = n.direction ?? 1, i = n.align ?? 1, a = n.offsetlist ?? null, o, s, c, l, u, d, f;
		if (r > 0) {
			c = Math.max(...t.map((e) => e.height())), u = Array(c).fill("");
			let n = (t, n, i) => r === 1 ? e.__string_offset_concat(t, n, i) : e.__string_offset_concat(n, t, i);
			for (let e = 0; e < c; e++) {
				s = i ? -e - 1 : e, l = 0;
				let r = t.length;
				for (let i = 0; i < r; i++) {
					let r = t[i];
					a && i !== 0 && (l = a[i - 1]), e < r.height() ? s >= 0 ? u[s] = n(u[s], r.bindata[s], l) : u[c + s] = n(u[c + s], r.bindata[r.height() + s], l) : s >= 0 ? u[s] = n(u[s], "0".repeat(r.width()), l) : u[c + s] = n(u[c + s], "0".repeat(r.width()), l);
				}
			}
		} else {
			c = Math.max(...t.map((e) => e.width())), u = [], l = 0;
			let n = t.length;
			for (let s = 0; s < n; s++) {
				let n = t[s];
				a && s !== 0 && (l = a[s - 1]), o = n.bindata, d = n.width(), d !== c && (f = i ? 0 : d - c, o = this.__crop_bitmap(o, c, n.height(), f, 0)), u = r === 0 ? e.__listofstr_offset_concat(u, o, l) : e.__listofstr_offset_concat(o, u, l);
			}
		}
		return new this(u);
	}
	concat(t, n = {}) {
		let { direction: r, align: i, offset: a } = n, o = a ?? 0;
		return this.bindata = e.concatall([this, t], {
			direction: r,
			align: i,
			offsetlist: [o]
		}).bindata, this;
	}
	static __enlarge_bindata(e, t, n) {
		let r = t ?? 1, i = n ?? 1, a = [...e];
		return r > 1 && (a = a.map((e) => e.split("").reduce((e, t) => e.concat(Array(r).fill(t)), []).join(""))), i > 1 && (a = a.reduce((e, t) => e.concat(Array(i).fill(t)), [])), a;
	}
	enlarge(t, n) {
		return this.bindata = e.__enlarge_bindata(this.bindata, t, n), this;
	}
	replace(e, t) {
		let n = typeof e == "number" ? e.toString() : e, r = typeof t == "number" ? t.toString() : t, i = (e, t, n) => "replaceAll" in String.prototype ? e.replaceAll(t, n) : e.replace(new RegExp(((e) => e.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"))(t), "g"), n);
		return this.bindata = this.bindata.map((e) => i(e, n, r)), this;
	}
	shadow(e, t) {
		let n = e ?? 1, r = t ?? -1, i, a, o, s, c, l, u = this.clone();
		return l = this.width(), i = this.height(), l += Math.abs(n), i += Math.abs(r), u.bindata = u.bindata.map((e) => e.replace(/1/g, "2")), n > 0 ? (a = 0, s = -n) : (a = n, s = 0), r > 0 ? (o = 0, c = -r) : (o = r, c = 0), this.crop(l, i, a, o), u.crop(l, i, s, c), u.overlay(this), this.bindata = u.bindata, this;
	}
	glow(e) {
		var t, n, r, i, a, o, s, c, l, u, d, f, p, m;
		let h = e ?? 0, g, _, v, y;
		v = this.width(), y = this.height(), v += 2, y += 2, this.crop(v, y, -1, -1);
		let b = this.todata(2), x = b.length;
		for (let e = 0; e < x; e++) {
			g = b[e];
			let v = g.length;
			for (let y = 0; y < v; y++) _ = g[y], _ === 1 && ((t = b[e])[n = y - 1] || (t[n] = 2), (r = b[e])[i = y + 1] || (r[i] = 2), (a = b[e - 1])[y] || (a[y] = 2), (o = b[e + 1])[y] || (o[y] = 2), h === 1 && ((s = b[e - 1])[c = y - 1] || (s[c] = 2), (l = b[e - 1])[u = y + 1] || (l[u] = 2), (d = b[e + 1])[f = y - 1] || (d[f] = 2), (p = b[e + 1])[m = y + 1] || (p[m] = 2)));
		}
		return this.bindata = b.map((e) => e.map((e) => e.toString()).join("")), this;
	}
	bytepad(e) {
		let t = e ?? 8, n = this.width(), r = this.height(), i = n % t;
		return i === 0 ? this : this.crop(n + t - i, r);
	}
	todata(e) {
		let t = e ?? 1, n;
		switch (t) {
			case 0:
				n = this.bindata.join("\n");
				break;
			case 1:
				n = this.bindata;
				break;
			case 2:
				n = this.bindata.map((e) => e.split("").map((e) => parseInt(e, 10)));
				break;
			case 3:
				n = [].concat(...this.todata(2));
				break;
			case 4:
				n = this.bindata.map((e) => {
					if (!/^[01]+$/.test(e)) throw Error(`Invalid binary string: ${e}`);
					return parseInt(e, 2).toString(16).padStart(Math.floor(-1 * this.width() / 4) * -1, "0");
				});
				break;
			case 5:
				n = this.bindata.map((e) => {
					if (!/^[01]+$/.test(e)) throw Error(`Invalid binary string: ${e}`);
					return parseInt(e, 2);
				});
				break;
		}
		return n;
	}
	draw2canvas(e, t) {
		let n = t ?? {
			0: null,
			1: "black",
			2: "red"
		};
		return this.todata(2).forEach((t, r) => {
			t.forEach((t, i) => {
				let a = t.toString();
				if (a === "0" || a === "1" || a === "2") {
					let t = n[a];
					t != null && (e.fillStyle = t, e.fillRect(i, r, 1, 1));
				}
			});
		}), this;
	}
}, f = (e) => t(void 0, void 0, void 0, function* () {
	return yield new l().load_filelines(e);
}), p = function(e, t, n, r) {
	function i(e) {
		return e instanceof n ? e : new n(function(t) {
			t(e);
		});
	}
	return new (n ||= Promise)(function(n, a) {
		function o(e) {
			try {
				c(r.next(e));
			} catch (e) {
				a(e);
			}
		}
		function s(e) {
			try {
				c(r.throw(e));
			} catch (e) {
				a(e);
			}
		}
		function c(e) {
			e.done ? n(e.value) : i(e.value).then(o, s);
		}
		c((r = r.apply(e, t || [])).next());
	});
}, m = function(e) {
	return this instanceof m ? (this.v = e, this) : new m(e);
}, h = function(e, t, n) {
	if (!Symbol.asyncIterator) throw TypeError("Symbol.asyncIterator is not defined.");
	var r = n.apply(e, t || []), i, a = [];
	return i = {}, o("next"), o("throw"), o("return"), i[Symbol.asyncIterator] = function() {
		return this;
	}, i;
	function o(e) {
		r[e] && (i[e] = function(t) {
			return new Promise(function(n, r) {
				a.push([
					e,
					t,
					n,
					r
				]) > 1 || s(e, t);
			});
		});
	}
	function s(e, t) {
		try {
			c(r[e](t));
		} catch (e) {
			d(a[0][3], e);
		}
	}
	function c(e) {
		e.value instanceof m ? Promise.resolve(e.value.v).then(l, u) : d(a[0][2], e);
	}
	function l(e) {
		s("next", e);
	}
	function u(e) {
		s("throw", e);
	}
	function d(e, t) {
		e(t), a.shift(), a.length && s(a[0][0], a[0][1]);
	}
}, g = (e) => e.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"), _ = (e) => p(void 0, void 0, void 0, function* () {
	let t = yield fetch(e);
	if (t.body === null) throw Error("Cannot read file");
	return t.body.getReader();
});
function v(e, { includeLastEmptyLine: t = !0, encoding: n = "utf-8", delimiter: r = /\r?\n/g } = {}) {
	return h(this, arguments, function* () {
		let i = yield m(_(e)), { value: a, done: o } = yield m(i.read()), s = new TextDecoder(n), c = a ? s.decode(a) : "", l;
		if (typeof r == "string") {
			if (r === "") throw Error("delimiter cannot be empty string!");
			l = new RegExp(g(r), "g");
		} else l = /g/.test(r.flags) === !1 ? new RegExp(r.source, r.flags + "g") : r;
		let u = 0;
		for (;;) {
			let e = l.exec(c);
			if (e === null) {
				if (o === !0) break;
				let e = c.substring(u);
				({value: a, done: o} = yield m(i.read())), c = e + (c ? s.decode(a) : ""), u = 0;
				continue;
			}
			yield yield m(c.substring(u, e.index)), u = l.lastIndex;
		}
		(t || u < c.length) && (yield yield m(c.substring(u)));
	});
}
//#endregion
//#region src/utils/fontLoader.ts
var y = "/fonts/", b = {
	"0_Trithemius437": {
		width: 8,
		height: 16
	},
	"1_Trithemius8x16": {
		width: 8,
		height: 16
	},
	"2_Trithemius9x15": {
		width: 9,
		height: 15
	},
	"3_Trithemius6x9": {
		width: 6,
		height: 9
	},
	"4_Trithemius5x8": {
		width: 5,
		height: 8
	}
};
async function x(e) {
	let t = await f(v(`${y}${e}.bdf`));
	if (!t) throw Error(`fontLoader.ts: WARNING: Could not load font ${e}`);
	let n = b[e], r = {
		fontName: e,
		length: t.length,
		height: n.height,
		width: n.width,
		characters: {},
		charactersList: []
	};
	for (let e of t.itercps()) {
		let i = t.glyphbycp(e)?.draw().todata(2);
		if (!i) {
			console.warn("fontLoader.ts: WARNING: Could not get data of codepoint ", e);
			continue;
		}
		let a = i.slice(0, n.height).map((e) => e.slice(0, n.width));
		r.characters[e] = a, r.charactersList.push({
			codepoint: e,
			shape: a
		});
	}
	return r;
}
(/* @__PURE__ */ e(((e, t) => {
	(function() {
		var n, r = "4.18.1", i = 200, a = "Unsupported core-js use. Try https://npms.io/search?q=ponyfill.", o = "Expected a function", s = "Invalid `variable` option passed into `_.template`", c = "Invalid `imports` option passed into `_.template`", l = "__lodash_hash_undefined__", u = 500, d = "__lodash_placeholder__", f = 1, p = 2, m = 4, h = 1, g = 2, _ = 1, v = 2, y = 4, b = 8, x = 16, S = 32, C = 64, w = 128, T = 256, ee = 512, te = 30, ne = "...", re = 800, ie = 16, ae = 1, oe = 2, se = 3, ce = Infinity, le = 9007199254740991, ue = 17976931348623157e292, E = NaN, D = 4294967295, de = D - 1, fe = D >>> 1, pe = [
			["ary", w],
			["bind", _],
			["bindKey", v],
			["curry", b],
			["curryRight", x],
			["flip", ee],
			["partial", S],
			["partialRight", C],
			["rearg", T]
		], me = "[object Arguments]", he = "[object Array]", ge = "[object AsyncFunction]", _e = "[object Boolean]", ve = "[object Date]", ye = "[object DOMException]", be = "[object Error]", xe = "[object Function]", Se = "[object GeneratorFunction]", Ce = "[object Map]", we = "[object Number]", Te = "[object Null]", Ee = "[object Object]", De = "[object Promise]", Oe = "[object Proxy]", ke = "[object RegExp]", Ae = "[object Set]", je = "[object String]", Me = "[object Symbol]", Ne = "[object Undefined]", Pe = "[object WeakMap]", Fe = "[object WeakSet]", Ie = "[object ArrayBuffer]", Le = "[object DataView]", Re = "[object Float32Array]", ze = "[object Float64Array]", Be = "[object Int8Array]", Ve = "[object Int16Array]", He = "[object Int32Array]", Ue = "[object Uint8Array]", We = "[object Uint8ClampedArray]", Ge = "[object Uint16Array]", Ke = "[object Uint32Array]", qe = /\b__p \+= '';/g, Je = /\b(__p \+=) '' \+/g, Ye = /(__e\(.*?\)|\b__t\)) \+\n'';/g, Xe = /&(?:amp|lt|gt|quot|#39);/g, Ze = /[&<>"']/g, Qe = RegExp(Xe.source), $e = RegExp(Ze.source), et = /<%-([\s\S]+?)%>/g, tt = /<%([\s\S]+?)%>/g, nt = /<%=([\s\S]+?)%>/g, rt = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, it = /^\w*$/, at = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, ot = /[\\^$.*+?()[\]{}|]/g, st = RegExp(ot.source), ct = /^\s+/, O = /\s/, lt = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/, ut = /\{\n\/\* \[wrapped with (.+)\] \*/, dt = /,? & /, ft = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g, pt = /[()=,{}\[\]\/\s]/, mt = /\\(\\)?/g, ht = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g, gt = /\w*$/, _t = /^[-+]0x[0-9a-f]+$/i, vt = /^0b[01]+$/i, yt = /^\[object .+?Constructor\]$/, bt = /^0o[0-7]+$/i, xt = /^(?:0|[1-9]\d*)$/, St = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g, Ct = /($^)/, wt = /['\n\r\u2028\u2029\\]/g, Tt = "\\ud800-\\udfff", Et = "\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff", Dt = "\\u2700-\\u27bf", k = "a-z\\xdf-\\xf6\\xf8-\\xff", Ot = "\\xac\\xb1\\xd7\\xf7", kt = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", At = "\\u2000-\\u206f", jt = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", Mt = "A-Z\\xc0-\\xd6\\xd8-\\xde", Nt = "\\ufe0e\\ufe0f", Pt = Ot + kt + At + jt, Ft = "['’]", A = "[" + Tt + "]", It = "[" + Pt + "]", Lt = "[" + Et + "]", Rt = "\\d+", zt = "[" + Dt + "]", Bt = "[" + k + "]", Vt = "[^" + Tt + Pt + Rt + Dt + k + Mt + "]", Ht = "\\ud83c[\\udffb-\\udfff]", Ut = "(?:" + Lt + "|" + Ht + ")", Wt = "[^" + Tt + "]", Gt = "(?:\\ud83c[\\udde6-\\uddff]){2}", Kt = "[\\ud800-\\udbff][\\udc00-\\udfff]", qt = "[" + Mt + "]", Jt = "\\u200d", Yt = "(?:" + Bt + "|" + Vt + ")", Xt = "(?:" + qt + "|" + Vt + ")", Zt = "(?:" + Ft + "(?:d|ll|m|re|s|t|ve))?", Qt = "(?:" + Ft + "(?:D|LL|M|RE|S|T|VE))?", $t = Ut + "?", en = "[" + Nt + "]?", tn = "(?:" + Jt + "(?:" + [
			Wt,
			Gt,
			Kt
		].join("|") + ")" + en + $t + ")*", nn = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", rn = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", an = en + $t + tn, on = "(?:" + [
			zt,
			Gt,
			Kt
		].join("|") + ")" + an, sn = "(?:" + [
			Wt + Lt + "?",
			Lt,
			Gt,
			Kt,
			A
		].join("|") + ")", cn = RegExp(Ft, "g"), ln = RegExp(Lt, "g"), un = RegExp(Ht + "(?=" + Ht + ")|" + sn + an, "g"), dn = RegExp([
			qt + "?" + Bt + "+" + Zt + "(?=" + [
				It,
				qt,
				"$"
			].join("|") + ")",
			Xt + "+" + Qt + "(?=" + [
				It,
				qt + Yt,
				"$"
			].join("|") + ")",
			qt + "?" + Yt + "+" + Zt,
			qt + "+" + Qt,
			rn,
			nn,
			Rt,
			on
		].join("|"), "g"), fn = RegExp("[" + Jt + Tt + Et + Nt + "]"), j = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/, pn = /* @__PURE__ */ "Array.Buffer.DataView.Date.Error.Float32Array.Float64Array.Function.Int8Array.Int16Array.Int32Array.Map.Math.Object.Promise.RegExp.Set.String.Symbol.TypeError.Uint8Array.Uint8ClampedArray.Uint16Array.Uint32Array.WeakMap._.clearTimeout.isFinite.parseInt.setTimeout".split("."), mn = -1, M = {};
		M[Re] = M[ze] = M[Be] = M[Ve] = M[He] = M[Ue] = M[We] = M[Ge] = M[Ke] = !0, M[me] = M[he] = M[Ie] = M[_e] = M[Le] = M[ve] = M[be] = M[xe] = M[Ce] = M[we] = M[Ee] = M[ke] = M[Ae] = M[je] = M[Pe] = !1;
		var N = {};
		N[me] = N[he] = N[Ie] = N[Le] = N[_e] = N[ve] = N[Re] = N[ze] = N[Be] = N[Ve] = N[He] = N[Ce] = N[we] = N[Ee] = N[ke] = N[Ae] = N[je] = N[Me] = N[Ue] = N[We] = N[Ge] = N[Ke] = !0, N[be] = N[xe] = N[Pe] = !1;
		var P = {
			À: "A",
			Á: "A",
			Â: "A",
			Ã: "A",
			Ä: "A",
			Å: "A",
			à: "a",
			á: "a",
			â: "a",
			ã: "a",
			ä: "a",
			å: "a",
			Ç: "C",
			ç: "c",
			Ð: "D",
			ð: "d",
			È: "E",
			É: "E",
			Ê: "E",
			Ë: "E",
			è: "e",
			é: "e",
			ê: "e",
			ë: "e",
			Ì: "I",
			Í: "I",
			Î: "I",
			Ï: "I",
			ì: "i",
			í: "i",
			î: "i",
			ï: "i",
			Ñ: "N",
			ñ: "n",
			Ò: "O",
			Ó: "O",
			Ô: "O",
			Õ: "O",
			Ö: "O",
			Ø: "O",
			ò: "o",
			ó: "o",
			ô: "o",
			õ: "o",
			ö: "o",
			ø: "o",
			Ù: "U",
			Ú: "U",
			Û: "U",
			Ü: "U",
			ù: "u",
			ú: "u",
			û: "u",
			ü: "u",
			Ý: "Y",
			ý: "y",
			ÿ: "y",
			Æ: "Ae",
			æ: "ae",
			Þ: "Th",
			þ: "th",
			ß: "ss",
			Ā: "A",
			Ă: "A",
			Ą: "A",
			ā: "a",
			ă: "a",
			ą: "a",
			Ć: "C",
			Ĉ: "C",
			Ċ: "C",
			Č: "C",
			ć: "c",
			ĉ: "c",
			ċ: "c",
			č: "c",
			Ď: "D",
			Đ: "D",
			ď: "d",
			đ: "d",
			Ē: "E",
			Ĕ: "E",
			Ė: "E",
			Ę: "E",
			Ě: "E",
			ē: "e",
			ĕ: "e",
			ė: "e",
			ę: "e",
			ě: "e",
			Ĝ: "G",
			Ğ: "G",
			Ġ: "G",
			Ģ: "G",
			ĝ: "g",
			ğ: "g",
			ġ: "g",
			ģ: "g",
			Ĥ: "H",
			Ħ: "H",
			ĥ: "h",
			ħ: "h",
			Ĩ: "I",
			Ī: "I",
			Ĭ: "I",
			Į: "I",
			İ: "I",
			ĩ: "i",
			ī: "i",
			ĭ: "i",
			į: "i",
			ı: "i",
			Ĵ: "J",
			ĵ: "j",
			Ķ: "K",
			ķ: "k",
			ĸ: "k",
			Ĺ: "L",
			Ļ: "L",
			Ľ: "L",
			Ŀ: "L",
			Ł: "L",
			ĺ: "l",
			ļ: "l",
			ľ: "l",
			ŀ: "l",
			ł: "l",
			Ń: "N",
			Ņ: "N",
			Ň: "N",
			Ŋ: "N",
			ń: "n",
			ņ: "n",
			ň: "n",
			ŋ: "n",
			Ō: "O",
			Ŏ: "O",
			Ő: "O",
			ō: "o",
			ŏ: "o",
			ő: "o",
			Ŕ: "R",
			Ŗ: "R",
			Ř: "R",
			ŕ: "r",
			ŗ: "r",
			ř: "r",
			Ś: "S",
			Ŝ: "S",
			Ş: "S",
			Š: "S",
			ś: "s",
			ŝ: "s",
			ş: "s",
			š: "s",
			Ţ: "T",
			Ť: "T",
			Ŧ: "T",
			ţ: "t",
			ť: "t",
			ŧ: "t",
			Ũ: "U",
			Ū: "U",
			Ŭ: "U",
			Ů: "U",
			Ű: "U",
			Ų: "U",
			ũ: "u",
			ū: "u",
			ŭ: "u",
			ů: "u",
			ű: "u",
			ų: "u",
			Ŵ: "W",
			ŵ: "w",
			Ŷ: "Y",
			ŷ: "y",
			Ÿ: "Y",
			Ź: "Z",
			Ż: "Z",
			Ž: "Z",
			ź: "z",
			ż: "z",
			ž: "z",
			Ĳ: "IJ",
			ĳ: "ij",
			Œ: "Oe",
			œ: "oe",
			ŉ: "'n",
			ſ: "s"
		}, hn = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			"\"": "&quot;",
			"'": "&#39;"
		}, gn = {
			"&amp;": "&",
			"&lt;": "<",
			"&gt;": ">",
			"&quot;": "\"",
			"&#39;": "'"
		}, _n = {
			"\\": "\\",
			"'": "'",
			"\n": "n",
			"\r": "r",
			"\u2028": "u2028",
			"\u2029": "u2029"
		}, vn = parseFloat, yn = parseInt, bn = typeof global == "object" && global && global.Object === Object && global, xn = typeof self == "object" && self && self.Object === Object && self, F = bn || xn || Function("return this")(), Sn = typeof e == "object" && e && !e.nodeType && e, Cn = Sn && typeof t == "object" && t && !t.nodeType && t, wn = Cn && Cn.exports === Sn, Tn = wn && bn.process, I = function() {
			try {
				return Cn && Cn.require && Cn.require("util").types || Tn && Tn.binding && Tn.binding("util");
			} catch {}
		}(), En = I && I.isArrayBuffer, Dn = I && I.isDate, On = I && I.isMap, kn = I && I.isRegExp, An = I && I.isSet, jn = I && I.isTypedArray;
		function Mn(e, t, n) {
			switch (n.length) {
				case 0: return e.call(t);
				case 1: return e.call(t, n[0]);
				case 2: return e.call(t, n[0], n[1]);
				case 3: return e.call(t, n[0], n[1], n[2]);
			}
			return e.apply(t, n);
		}
		function Nn(e, t, n, r) {
			for (var i = -1, a = e == null ? 0 : e.length; ++i < a;) {
				var o = e[i];
				t(r, o, n(o), e);
			}
			return r;
		}
		function Pn(e, t) {
			for (var n = -1, r = e == null ? 0 : e.length; ++n < r && t(e[n], n, e) !== !1;);
			return e;
		}
		function Fn(e, t) {
			for (var n = e == null ? 0 : e.length; n-- && t(e[n], n, e) !== !1;);
			return e;
		}
		function In(e, t) {
			for (var n = -1, r = e == null ? 0 : e.length; ++n < r;) if (!t(e[n], n, e)) return !1;
			return !0;
		}
		function Ln(e, t) {
			for (var n = -1, r = e == null ? 0 : e.length, i = 0, a = []; ++n < r;) {
				var o = e[n];
				t(o, n, e) && (a[i++] = o);
			}
			return a;
		}
		function Rn(e, t) {
			return !!(e != null && e.length) && Yn(e, t, 0) > -1;
		}
		function zn(e, t, n) {
			for (var r = -1, i = e == null ? 0 : e.length; ++r < i;) if (n(t, e[r])) return !0;
			return !1;
		}
		function L(e, t) {
			for (var n = -1, r = e == null ? 0 : e.length, i = Array(r); ++n < r;) i[n] = t(e[n], n, e);
			return i;
		}
		function Bn(e, t) {
			for (var n = -1, r = t.length, i = e.length; ++n < r;) e[i + n] = t[n];
			return e;
		}
		function Vn(e, t, n, r) {
			var i = -1, a = e == null ? 0 : e.length;
			for (r && a && (n = e[++i]); ++i < a;) n = t(n, e[i], i, e);
			return n;
		}
		function Hn(e, t, n, r) {
			var i = e == null ? 0 : e.length;
			for (r && i && (n = e[--i]); i--;) n = t(n, e[i], i, e);
			return n;
		}
		function Un(e, t) {
			for (var n = -1, r = e == null ? 0 : e.length; ++n < r;) if (t(e[n], n, e)) return !0;
			return !1;
		}
		var Wn = $n("length");
		function Gn(e) {
			return e.split("");
		}
		function Kn(e) {
			return e.match(ft) || [];
		}
		function qn(e, t, n) {
			var r;
			return n(e, function(e, n, i) {
				if (t(e, n, i)) return r = n, !1;
			}), r;
		}
		function Jn(e, t, n, r) {
			for (var i = e.length, a = n + (r ? 1 : -1); r ? a-- : ++a < i;) if (t(e[a], a, e)) return a;
			return -1;
		}
		function Yn(e, t, n) {
			return t === t ? Tr(e, t, n) : Jn(e, Zn, n);
		}
		function Xn(e, t, n, r) {
			for (var i = n - 1, a = e.length; ++i < a;) if (r(e[i], t)) return i;
			return -1;
		}
		function Zn(e) {
			return e !== e;
		}
		function Qn(e, t) {
			var n = e == null ? 0 : e.length;
			return n ? rr(e, t) / n : E;
		}
		function $n(e) {
			return function(t) {
				return t == null ? n : t[e];
			};
		}
		function er(e) {
			return function(t) {
				return e == null ? n : e[t];
			};
		}
		function tr(e, t, n, r, i) {
			return i(e, function(e, i, a) {
				n = r ? (r = !1, e) : t(n, e, i, a);
			}), n;
		}
		function nr(e, t) {
			var n = e.length;
			for (e.sort(t); n--;) e[n] = e[n].value;
			return e;
		}
		function rr(e, t) {
			for (var r, i = -1, a = e.length; ++i < a;) {
				var o = t(e[i]);
				o !== n && (r = r === n ? o : r + o);
			}
			return r;
		}
		function ir(e, t) {
			for (var n = -1, r = Array(e); ++n < e;) r[n] = t(n);
			return r;
		}
		function ar(e, t) {
			return L(t, function(t) {
				return [t, e[t]];
			});
		}
		function or(e) {
			return e && e.slice(0, kr(e) + 1).replace(ct, "");
		}
		function sr(e) {
			return function(t) {
				return e(t);
			};
		}
		function cr(e, t) {
			return L(t, function(t) {
				return e[t];
			});
		}
		function lr(e, t) {
			return e.has(t);
		}
		function ur(e, t) {
			for (var n = -1, r = e.length; ++n < r && Yn(t, e[n], 0) > -1;);
			return n;
		}
		function dr(e, t) {
			for (var n = e.length; n-- && Yn(t, e[n], 0) > -1;);
			return n;
		}
		function fr(e, t) {
			for (var n = e.length, r = 0; n--;) e[n] === t && ++r;
			return r;
		}
		var pr = er(P), mr = er(hn);
		function hr(e) {
			return "\\" + _n[e];
		}
		function gr(e, t) {
			return e == null ? n : e[t];
		}
		function _r(e) {
			return fn.test(e);
		}
		function vr(e) {
			return j.test(e);
		}
		function yr(e) {
			for (var t, n = []; !(t = e.next()).done;) n.push(t.value);
			return n;
		}
		function br(e) {
			var t = -1, n = Array(e.size);
			return e.forEach(function(e, r) {
				n[++t] = [r, e];
			}), n;
		}
		function xr(e, t) {
			return function(n) {
				return e(t(n));
			};
		}
		function Sr(e, t) {
			for (var n = -1, r = e.length, i = 0, a = []; ++n < r;) {
				var o = e[n];
				(o === t || o === d) && (e[n] = d, a[i++] = n);
			}
			return a;
		}
		function Cr(e) {
			var t = -1, n = Array(e.size);
			return e.forEach(function(e) {
				n[++t] = e;
			}), n;
		}
		function wr(e) {
			var t = -1, n = Array(e.size);
			return e.forEach(function(e) {
				n[++t] = [e, e];
			}), n;
		}
		function Tr(e, t, n) {
			for (var r = n - 1, i = e.length; ++r < i;) if (e[r] === t) return r;
			return -1;
		}
		function Er(e, t, n) {
			for (var r = n + 1; r--;) if (e[r] === t) return r;
			return r;
		}
		function Dr(e) {
			return _r(e) ? jr(e) : Wn(e);
		}
		function Or(e) {
			return _r(e) ? Mr(e) : Gn(e);
		}
		function kr(e) {
			for (var t = e.length; t-- && O.test(e.charAt(t)););
			return t;
		}
		var Ar = er(gn);
		function jr(e) {
			for (var t = un.lastIndex = 0; un.test(e);) ++t;
			return t;
		}
		function Mr(e) {
			return e.match(un) || [];
		}
		function Nr(e) {
			return e.match(dn) || [];
		}
		var Pr = (function e(t) {
			t = t == null ? F : Pr.defaults(F.Object(), t, Pr.pick(F, pn));
			var O = t.Array, ft = t.Date, Tt = t.Error, Et = t.Function, Dt = t.Math, k = t.Object, Ot = t.RegExp, kt = t.String, At = t.TypeError, jt = O.prototype, Mt = Et.prototype, Nt = k.prototype, Pt = t["__core-js_shared__"], Ft = Mt.toString, A = Nt.hasOwnProperty, It = 0, Lt = function() {
				var e = /[^.]+$/.exec(Pt && Pt.keys && Pt.keys.IE_PROTO || "");
				return e ? "Symbol(src)_1." + e : "";
			}(), Rt = Nt.toString, zt = Ft.call(k), Bt = F._, Vt = Ot("^" + Ft.call(A).replace(ot, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"), Ht = wn ? t.Buffer : n, Ut = t.Symbol, Wt = t.Uint8Array, Gt = Ht ? Ht.allocUnsafe : n, Kt = xr(k.getPrototypeOf, k), qt = k.create, Jt = Nt.propertyIsEnumerable, Yt = jt.splice, Xt = Ut ? Ut.isConcatSpreadable : n, Zt = Ut ? Ut.iterator : n, Qt = Ut ? Ut.toStringTag : n, $t = function() {
				try {
					var e = is(k, "defineProperty");
					return e({}, "", {}), e;
				} catch {}
			}(), en = t.clearTimeout !== F.clearTimeout && t.clearTimeout, tn = ft && ft.now !== F.Date.now && ft.now, nn = t.setTimeout !== F.setTimeout && t.setTimeout, rn = Dt.ceil, an = Dt.floor, on = k.getOwnPropertySymbols, sn = Ht ? Ht.isBuffer : n, un = t.isFinite, dn = jt.join, fn = xr(k.keys, k), j = Dt.max, P = Dt.min, hn = ft.now, gn = t.parseInt, _n = Dt.random, bn = jt.reverse, xn = is(t, "DataView"), Sn = is(t, "Map"), Cn = is(t, "Promise"), Tn = is(t, "Set"), I = is(t, "WeakMap"), Wn = is(k, "create"), Gn = I && new I(), er = {}, Tr = Vs(xn), jr = Vs(Sn), Mr = Vs(Cn), Fr = Vs(Tn), Ir = Vs(I), Lr = Ut ? Ut.prototype : n, Rr = Lr ? Lr.valueOf : n, zr = Lr ? Lr.toString : n;
			function R(e) {
				if (Y(e) && !K(e) && !(e instanceof z)) {
					if (e instanceof Hr) return e;
					if (A.call(e, "__wrapped__")) return Us(e);
				}
				return new Hr(e);
			}
			var Br = function() {
				function e() {}
				return function(t) {
					if (!J(t)) return {};
					if (qt) return qt(t);
					e.prototype = t;
					var r = new e();
					return e.prototype = n, r;
				};
			}();
			function Vr() {}
			function Hr(e, t) {
				this.__wrapped__ = e, this.__actions__ = [], this.__chain__ = !!t, this.__index__ = 0, this.__values__ = n;
			}
			R.templateSettings = {
				escape: et,
				evaluate: tt,
				interpolate: nt,
				variable: "",
				imports: { _: R }
			}, R.prototype = Vr.prototype, R.prototype.constructor = R, Hr.prototype = Br(Vr.prototype), Hr.prototype.constructor = Hr;
			function z(e) {
				this.__wrapped__ = e, this.__actions__ = [], this.__dir__ = 1, this.__filtered__ = !1, this.__iteratees__ = [], this.__takeCount__ = D, this.__views__ = [];
			}
			function Ur() {
				var e = new z(this.__wrapped__);
				return e.__actions__ = go(this.__actions__), e.__dir__ = this.__dir__, e.__filtered__ = this.__filtered__, e.__iteratees__ = go(this.__iteratees__), e.__takeCount__ = this.__takeCount__, e.__views__ = go(this.__views__), e;
			}
			function Wr() {
				if (this.__filtered__) {
					var e = new z(this);
					e.__dir__ = -1, e.__filtered__ = !0;
				} else e = this.clone(), e.__dir__ *= -1;
				return e;
			}
			function Gr() {
				var e = this.__wrapped__.value(), t = this.__dir__, n = K(e), r = t < 0, i = n ? e.length : 0, a = cs(0, i, this.__views__), o = a.start, s = a.end, c = s - o, l = r ? s : o - 1, u = this.__iteratees__, d = u.length, f = 0, p = P(c, this.__takeCount__);
				if (!n || !r && i == c && p == c) return Xa(e, this.__actions__);
				var m = [];
				outer: for (; c-- && f < p;) {
					l += t;
					for (var h = -1, g = e[l]; ++h < d;) {
						var _ = u[h], v = _.iteratee, y = _.type, b = v(g);
						if (y == oe) g = b;
						else if (!b) {
							if (y == ae) continue outer;
							break outer;
						}
					}
					m[f++] = g;
				}
				return m;
			}
			z.prototype = Br(Vr.prototype), z.prototype.constructor = z;
			function Kr(e) {
				var t = -1, n = e == null ? 0 : e.length;
				for (this.clear(); ++t < n;) {
					var r = e[t];
					this.set(r[0], r[1]);
				}
			}
			function qr() {
				this.__data__ = Wn ? Wn(null) : {}, this.size = 0;
			}
			function Jr(e) {
				var t = this.has(e) && delete this.__data__[e];
				return this.size -= +!!t, t;
			}
			function Yr(e) {
				var t = this.__data__;
				if (Wn) {
					var r = t[e];
					return r === l ? n : r;
				}
				return A.call(t, e) ? t[e] : n;
			}
			function Xr(e) {
				var t = this.__data__;
				return Wn ? t[e] !== n : A.call(t, e);
			}
			function Zr(e, t) {
				var r = this.__data__;
				return this.size += +!this.has(e), r[e] = Wn && t === n ? l : t, this;
			}
			Kr.prototype.clear = qr, Kr.prototype.delete = Jr, Kr.prototype.get = Yr, Kr.prototype.has = Xr, Kr.prototype.set = Zr;
			function Qr(e) {
				var t = -1, n = e == null ? 0 : e.length;
				for (this.clear(); ++t < n;) {
					var r = e[t];
					this.set(r[0], r[1]);
				}
			}
			function $r() {
				this.__data__ = [], this.size = 0;
			}
			function ei(e) {
				var t = this.__data__, n = Ti(t, e);
				return n < 0 ? !1 : (n == t.length - 1 ? t.pop() : Yt.call(t, n, 1), --this.size, !0);
			}
			function ti(e) {
				var t = this.__data__, r = Ti(t, e);
				return r < 0 ? n : t[r][1];
			}
			function ni(e) {
				return Ti(this.__data__, e) > -1;
			}
			function ri(e, t) {
				var n = this.__data__, r = Ti(n, e);
				return r < 0 ? (++this.size, n.push([e, t])) : n[r][1] = t, this;
			}
			Qr.prototype.clear = $r, Qr.prototype.delete = ei, Qr.prototype.get = ti, Qr.prototype.has = ni, Qr.prototype.set = ri;
			function ii(e) {
				var t = -1, n = e == null ? 0 : e.length;
				for (this.clear(); ++t < n;) {
					var r = e[t];
					this.set(r[0], r[1]);
				}
			}
			function ai() {
				this.size = 0, this.__data__ = {
					hash: new Kr(),
					map: new (Sn || Qr)(),
					string: new Kr()
				};
			}
			function oi(e) {
				var t = ns(this, e).delete(e);
				return this.size -= +!!t, t;
			}
			function si(e) {
				return ns(this, e).get(e);
			}
			function ci(e) {
				return ns(this, e).has(e);
			}
			function li(e, t) {
				var n = ns(this, e), r = n.size;
				return n.set(e, t), this.size += n.size == r ? 0 : 1, this;
			}
			ii.prototype.clear = ai, ii.prototype.delete = oi, ii.prototype.get = si, ii.prototype.has = ci, ii.prototype.set = li;
			function ui(e) {
				var t = -1, n = e == null ? 0 : e.length;
				for (this.__data__ = new ii(); ++t < n;) this.add(e[t]);
			}
			function di(e) {
				return this.__data__.set(e, l), this;
			}
			function fi(e) {
				return this.__data__.has(e);
			}
			ui.prototype.add = ui.prototype.push = di, ui.prototype.has = fi;
			function pi(e) {
				var t = this.__data__ = new Qr(e);
				this.size = t.size;
			}
			function mi() {
				this.__data__ = new Qr(), this.size = 0;
			}
			function hi(e) {
				var t = this.__data__, n = t.delete(e);
				return this.size = t.size, n;
			}
			function gi(e) {
				return this.__data__.get(e);
			}
			function _i(e) {
				return this.__data__.has(e);
			}
			function vi(e, t) {
				var n = this.__data__;
				if (n instanceof Qr) {
					var r = n.__data__;
					if (!Sn || r.length < i - 1) return r.push([e, t]), this.size = ++n.size, this;
					n = this.__data__ = new ii(r);
				}
				return n.set(e, t), this.size = n.size, this;
			}
			pi.prototype.clear = mi, pi.prototype.delete = hi, pi.prototype.get = gi, pi.prototype.has = _i, pi.prototype.set = vi;
			function yi(e, t) {
				var n = K(e), r = !n && gu(e), i = !n && !r && bu(e), a = !n && !r && !i && Gu(e), o = n || r || i || a, s = o ? ir(e.length, kt) : [], c = s.length;
				for (var l in e) (t || A.call(e, l)) && !(o && (l == "length" || i && (l == "offset" || l == "parent") || a && (l == "buffer" || l == "byteLength" || l == "byteOffset") || gs(l, c))) && s.push(l);
				return s;
			}
			function bi(e) {
				var t = e.length;
				return t ? e[Aa(0, t - 1)] : n;
			}
			function xi(e, t) {
				return Rs(go(e), ji(t, 0, e.length));
			}
			function Si(e) {
				return Rs(go(e));
			}
			function Ci(e, t, r) {
				(r !== n && !pu(e[t], r) || r === n && !(t in e)) && ki(e, t, r);
			}
			function wi(e, t, r) {
				var i = e[t];
				(!(A.call(e, t) && pu(i, r)) || r === n && !(t in e)) && ki(e, t, r);
			}
			function Ti(e, t) {
				for (var n = e.length; n--;) if (pu(e[n][0], t)) return n;
				return -1;
			}
			function Ei(e, t, n, r) {
				return Li(e, function(e, i, a) {
					t(r, e, n(e), a);
				}), r;
			}
			function Di(e, t) {
				return e && _o(t, Q(t), e);
			}
			function Oi(e, t) {
				return e && _o(t, $(t), e);
			}
			function ki(e, t, n) {
				t == "__proto__" && $t ? $t(e, t, {
					configurable: !0,
					enumerable: !0,
					value: n,
					writable: !0
				}) : e[t] = n;
			}
			function Ai(e, t) {
				for (var r = -1, i = t.length, a = O(i), o = e == null; ++r < i;) a[r] = o ? n : yd(e, t[r]);
				return a;
			}
			function ji(e, t, r) {
				return e === e && (r !== n && (e = e <= r ? e : r), t !== n && (e = e >= t ? e : t)), e;
			}
			function Mi(e, t, r, i, a, o) {
				var s, c = t & f, l = t & p, u = t & m;
				if (r && (s = a ? r(e, i, a, o) : r(e)), s !== n) return s;
				if (!J(e)) return e;
				var d = K(e);
				if (d) {
					if (s = ds(e), !c) return go(e, s);
				} else {
					var h = W(e), g = h == xe || h == Se;
					if (bu(e)) return ao(e, c);
					if (h == Ee || h == me || g && !a) {
						if (s = l || g ? {} : fs(e), !c) return l ? yo(e, Oi(s, e)) : vo(e, Di(s, e));
					} else {
						if (!N[h]) return a ? e : {};
						s = ps(e, h, c);
					}
				}
				o ||= new pi();
				var _ = o.get(e);
				if (_) return _;
				o.set(e, s), Hu(e) ? e.forEach(function(n) {
					s.add(Mi(n, t, r, n, e, o));
				}) : ju(e) && e.forEach(function(n, i) {
					s.set(i, Mi(n, t, r, i, e, o));
				});
				var v = d ? n : (u ? l ? Qo : Zo : l ? $ : Q)(e);
				return Pn(v || e, function(n, i) {
					v && (i = n, n = e[i]), wi(s, i, Mi(n, t, r, i, e, o));
				}), s;
			}
			function Ni(e) {
				var t = Q(e);
				return function(n) {
					return Pi(n, e, t);
				};
			}
			function Pi(e, t, r) {
				var i = r.length;
				if (e == null) return !i;
				for (e = k(e); i--;) {
					var a = r[i], o = t[a], s = e[a];
					if (s === n && !(a in e) || !o(s)) return !1;
				}
				return !0;
			}
			function Fi(e, t, r) {
				if (typeof e != "function") throw new At(o);
				return Ps(function() {
					e.apply(n, r);
				}, t);
			}
			function Ii(e, t, n, r) {
				var a = -1, o = Rn, s = !0, c = e.length, l = [], u = t.length;
				if (!c) return l;
				n && (t = L(t, sr(n))), r ? (o = zn, s = !1) : t.length >= i && (o = lr, s = !1, t = new ui(t));
				outer: for (; ++a < c;) {
					var d = e[a], f = n == null ? d : n(d);
					if (d = r || d !== 0 ? d : 0, s && f === f) {
						for (var p = u; p--;) if (t[p] === f) continue outer;
						l.push(d);
					} else o(t, f, r) || l.push(d);
				}
				return l;
			}
			var Li = So(Gi), Ri = So(Ki, !0);
			function zi(e, t) {
				var n = !0;
				return Li(e, function(e, r, i) {
					return n = !!t(e, r, i), n;
				}), n;
			}
			function Bi(e, t, r) {
				for (var i = -1, a = e.length; ++i < a;) {
					var o = e[i], s = t(o);
					if (s != null && (c === n ? s === s && !Wu(s) : r(s, c))) var c = s, l = o;
				}
				return l;
			}
			function Vi(e, t, r, i) {
				var a = e.length;
				for (r = X(r), r < 0 && (r = -r > a ? 0 : a + r), i = i === n || i > a ? a : X(i), i < 0 && (i += a), i = r > i ? 0 : $u(i); r < i;) e[r++] = t;
				return e;
			}
			function Hi(e, t) {
				var n = [];
				return Li(e, function(e, r, i) {
					t(e, r, i) && n.push(e);
				}), n;
			}
			function B(e, t, n, r, i) {
				var a = -1, o = e.length;
				for (n ||= hs, i ||= []; ++a < o;) {
					var s = e[a];
					t > 0 && n(s) ? t > 1 ? B(s, t - 1, n, r, i) : Bn(i, s) : r || (i[i.length] = s);
				}
				return i;
			}
			var Ui = Co(), Wi = Co(!0);
			function Gi(e, t) {
				return e && Ui(e, t, Q);
			}
			function Ki(e, t) {
				return e && Wi(e, t, Q);
			}
			function qi(e, t) {
				return Ln(t, function(t) {
					return Ou(e[t]);
				});
			}
			function Ji(e, t) {
				t = to(t, e);
				for (var r = 0, i = t.length; e != null && r < i;) e = e[Bs(t[r++])];
				return r && r == i ? e : n;
			}
			function Yi(e, t, n) {
				var r = t(e);
				return K(e) ? r : Bn(r, n(e));
			}
			function V(e) {
				return e == null ? e === n ? Ne : Te : Qt && Qt in k(e) ? as(e) : Os(e);
			}
			function Xi(e, t) {
				return e > t;
			}
			function Zi(e, t) {
				return e != null && A.call(e, t);
			}
			function Qi(e, t) {
				return e != null && t in k(e);
			}
			function $i(e, t, n) {
				return e >= P(t, n) && e < j(t, n);
			}
			function ea(e, t, r) {
				for (var i = r ? zn : Rn, a = e[0].length, o = e.length, s = o, c = O(o), l = Infinity, u = []; s--;) {
					var d = e[s];
					s && t && (d = L(d, sr(t))), l = P(d.length, l), c[s] = !r && (t || a >= 120 && d.length >= 120) ? new ui(s && d) : n;
				}
				d = e[0];
				var f = -1, p = c[0];
				outer: for (; ++f < a && u.length < l;) {
					var m = d[f], h = t ? t(m) : m;
					if (m = r || m !== 0 ? m : 0, !(p ? lr(p, h) : i(u, h, r))) {
						for (s = o; --s;) {
							var g = c[s];
							if (!(g ? lr(g, h) : i(e[s], h, r))) continue outer;
						}
						p && p.push(h), u.push(m);
					}
				}
				return u;
			}
			function ta(e, t, n, r) {
				return Gi(e, function(e, i, a) {
					t(r, n(e), i, a);
				}), r;
			}
			function na(e, t, r) {
				t = to(t, e), e = As(e, t);
				var i = e == null ? e : e[Bs(mc(t))];
				return i == null ? n : Mn(i, e, r);
			}
			function ra(e) {
				return Y(e) && V(e) == me;
			}
			function ia(e) {
				return Y(e) && V(e) == Ie;
			}
			function aa(e) {
				return Y(e) && V(e) == ve;
			}
			function oa(e, t, n, r, i) {
				return e === t ? !0 : e == null || t == null || !Y(e) && !Y(t) ? e !== e && t !== t : sa(e, t, n, r, oa, i);
			}
			function sa(e, t, n, r, i, a) {
				var o = K(e), s = K(t), c = o ? he : W(e), l = s ? he : W(t);
				c = c == me ? Ee : c, l = l == me ? Ee : l;
				var u = c == Ee, d = l == Ee, f = c == l;
				if (f && bu(e)) {
					if (!bu(t)) return !1;
					o = !0, u = !1;
				}
				if (f && !u) return a ||= new pi(), o || Gu(e) ? qo(e, t, n, r, i, a) : Jo(e, t, c, n, r, i, a);
				if (!(n & h)) {
					var p = u && A.call(e, "__wrapped__"), m = d && A.call(t, "__wrapped__");
					if (p || m) {
						var g = p ? e.value() : e, _ = m ? t.value() : t;
						return a ||= new pi(), i(g, _, n, r, a);
					}
				}
				return f ? (a ||= new pi(), Yo(e, t, n, r, i, a)) : !1;
			}
			function ca(e) {
				return Y(e) && W(e) == Ce;
			}
			function la(e, t, r, i) {
				var a = r.length, o = a, s = !i;
				if (e == null) return !o;
				for (e = k(e); a--;) {
					var c = r[a];
					if (s && c[2] ? c[1] !== e[c[0]] : !(c[0] in e)) return !1;
				}
				for (; ++a < o;) {
					c = r[a];
					var l = c[0], u = e[l], d = c[1];
					if (s && c[2]) {
						if (u === n && !(l in e)) return !1;
					} else {
						var f = new pi();
						if (i) var p = i(u, d, l, e, t, f);
						if (!(p === n ? oa(d, u, h | g, i, f) : p)) return !1;
					}
				}
				return !0;
			}
			function ua(e) {
				return !J(e) || bs(e) ? !1 : (Ou(e) ? Vt : yt).test(Vs(e));
			}
			function da(e) {
				return Y(e) && V(e) == ke;
			}
			function fa(e) {
				return Y(e) && W(e) == Ae;
			}
			function pa(e) {
				return Y(e) && Au(e.length) && !!M[V(e)];
			}
			function ma(e) {
				return typeof e == "function" ? e : e == null ? Mf : typeof e == "object" ? K(e) ? ba(e[0], e[1]) : ya(e) : Gf(e);
			}
			function ha(e) {
				if (!Ss(e)) return fn(e);
				var t = [];
				for (var n in k(e)) A.call(e, n) && n != "constructor" && t.push(n);
				return t;
			}
			function ga(e) {
				if (!J(e)) return Ds(e);
				var t = Ss(e), n = [];
				for (var r in e) r == "constructor" && (t || !A.call(e, r)) || n.push(r);
				return n;
			}
			function _a(e, t) {
				return e < t;
			}
			function va(e, t) {
				var n = -1, r = vu(e) ? O(e.length) : [];
				return Li(e, function(e, i, a) {
					r[++n] = t(e, i, a);
				}), r;
			}
			function ya(e) {
				var t = rs(e);
				return t.length == 1 && t[0][2] ? ws(t[0][0], t[0][1]) : function(n) {
					return n === e || la(n, e, t);
				};
			}
			function ba(e, t) {
				return _s(e) && Cs(t) ? ws(Bs(e), t) : function(r) {
					var i = yd(r, e);
					return i === n && i === t ? xd(r, e) : oa(t, i, h | g);
				};
			}
			function xa(e, t, r, i, a) {
				e !== t && Ui(t, function(o, s) {
					if (a ||= new pi(), J(o)) Sa(e, t, s, r, xa, i, a);
					else {
						var c = i ? i(Ms(e, s), o, s + "", e, t, a) : n;
						c === n && (c = o), Ci(e, s, c);
					}
				}, $);
			}
			function Sa(e, t, r, i, a, o, s) {
				var c = Ms(e, r), l = Ms(t, r), u = s.get(l);
				if (u) {
					Ci(e, r, u);
					return;
				}
				var d = o ? o(c, l, r + "", e, t, s) : n, f = d === n;
				if (f) {
					var p = K(l), m = !p && bu(l), h = !p && !m && Gu(l);
					d = l, p || m || h ? K(c) ? d = c : q(c) ? d = go(c) : m ? (f = !1, d = ao(l, !0)) : h ? (f = !1, d = uo(l, !0)) : d = [] : zu(l) || gu(l) ? (d = c, gu(c) ? d = td(c) : (!J(c) || Ou(c)) && (d = fs(l))) : f = !1;
				}
				f && (s.set(l, d), a(d, l, i, o, s), s.delete(l)), Ci(e, r, d);
			}
			function Ca(e, t) {
				var r = e.length;
				if (r) return t += t < 0 ? r : 0, gs(t, r) ? e[t] : n;
			}
			function wa(e, t, n) {
				t = t.length ? L(t, function(e) {
					return K(e) ? function(t) {
						return Ji(t, e.length === 1 ? e[0] : e);
					} : e;
				}) : [Mf];
				var r = -1;
				return t = L(t, sr(U())), nr(va(e, function(e, n, i) {
					return {
						criteria: L(t, function(t) {
							return t(e);
						}),
						index: ++r,
						value: e
					};
				}), function(e, t) {
					return po(e, t, n);
				});
			}
			function Ta(e, t) {
				return Ea(e, t, function(t, n) {
					return xd(e, n);
				});
			}
			function Ea(e, t, n) {
				for (var r = -1, i = t.length, a = {}; ++r < i;) {
					var o = t[r], s = Ji(e, o);
					n(s, o) && Fa(a, to(o, e), s);
				}
				return a;
			}
			function Da(e) {
				return function(t) {
					return Ji(t, e);
				};
			}
			function Oa(e, t, n, r) {
				var i = r ? Xn : Yn, a = -1, o = t.length, s = e;
				for (e === t && (t = go(t)), n && (s = L(e, sr(n))); ++a < o;) for (var c = 0, l = t[a], u = n ? n(l) : l; (c = i(s, u, c, r)) > -1;) s !== e && Yt.call(s, c, 1), Yt.call(e, c, 1);
				return e;
			}
			function ka(e, t) {
				for (var n = e ? t.length : 0, r = n - 1; n--;) {
					var i = t[n];
					if (n == r || i !== a) {
						var a = i;
						gs(i) ? Yt.call(e, i, 1) : qa(e, i);
					}
				}
				return e;
			}
			function Aa(e, t) {
				return e + an(_n() * (t - e + 1));
			}
			function ja(e, t, n, r) {
				for (var i = -1, a = j(rn((t - e) / (n || 1)), 0), o = O(a); a--;) o[r ? a : ++i] = e, e += n;
				return o;
			}
			function Ma(e, t) {
				var n = "";
				if (!e || t < 1 || t > le) return n;
				do
					t % 2 && (n += e), t = an(t / 2), t && (e += e);
				while (t);
				return n;
			}
			function H(e, t) {
				return Fs(ks(e, t, Mf), e + "");
			}
			function Na(e) {
				return bi(Hd(e));
			}
			function Pa(e, t) {
				var n = Hd(e);
				return Rs(n, ji(t, 0, n.length));
			}
			function Fa(e, t, r, i) {
				if (!J(e)) return e;
				t = to(t, e);
				for (var a = -1, o = t.length, s = o - 1, c = e; c != null && ++a < o;) {
					var l = Bs(t[a]), u = r;
					if (l === "__proto__" || l === "constructor" || l === "prototype") return e;
					if (a != s) {
						var d = c[l];
						u = i ? i(d, l, c) : n, u === n && (u = J(d) ? d : gs(t[a + 1]) ? [] : {});
					}
					wi(c, l, u), c = c[l];
				}
				return e;
			}
			var Ia = Gn ? function(e, t) {
				return Gn.set(e, t), e;
			} : Mf, La = $t ? function(e, t) {
				return $t(e, "toString", {
					configurable: !0,
					enumerable: !1,
					value: Of(t),
					writable: !0
				});
			} : Mf;
			function Ra(e) {
				return Rs(Hd(e));
			}
			function za(e, t, n) {
				var r = -1, i = e.length;
				t < 0 && (t = -t > i ? 0 : i + t), n = n > i ? i : n, n < 0 && (n += i), i = t > n ? 0 : n - t >>> 0, t >>>= 0;
				for (var a = O(i); ++r < i;) a[r] = e[r + t];
				return a;
			}
			function Ba(e, t) {
				var n;
				return Li(e, function(e, r, i) {
					return n = t(e, r, i), !n;
				}), !!n;
			}
			function Va(e, t, n) {
				var r = 0, i = e == null ? r : e.length;
				if (typeof t == "number" && t === t && i <= fe) {
					for (; r < i;) {
						var a = r + i >>> 1, o = e[a];
						o !== null && !Wu(o) && (n ? o <= t : o < t) ? r = a + 1 : i = a;
					}
					return i;
				}
				return Ha(e, t, Mf, n);
			}
			function Ha(e, t, r, i) {
				var a = 0, o = e == null ? 0 : e.length;
				if (o === 0) return 0;
				t = r(t);
				for (var s = t !== t, c = t === null, l = Wu(t), u = t === n; a < o;) {
					var d = an((a + o) / 2), f = r(e[d]), p = f !== n, m = f === null, h = f === f, g = Wu(f);
					if (s) var _ = i || h;
					else _ = u ? h && (i || p) : c ? h && p && (i || !m) : l ? h && p && !m && (i || !g) : m || g ? !1 : i ? f <= t : f < t;
					_ ? a = d + 1 : o = d;
				}
				return P(o, de);
			}
			function Ua(e, t) {
				for (var n = -1, r = e.length, i = 0, a = []; ++n < r;) {
					var o = e[n], s = t ? t(o) : o;
					if (!n || !pu(s, c)) {
						var c = s;
						a[i++] = o === 0 ? 0 : o;
					}
				}
				return a;
			}
			function Wa(e) {
				return typeof e == "number" ? e : Wu(e) ? E : +e;
			}
			function Ga(e) {
				if (typeof e == "string") return e;
				if (K(e)) return L(e, Ga) + "";
				if (Wu(e)) return zr ? zr.call(e) : "";
				var t = e + "";
				return t == "0" && 1 / e == -ce ? "-0" : t;
			}
			function Ka(e, t, n) {
				var r = -1, a = Rn, o = e.length, s = !0, c = [], l = c;
				if (n) s = !1, a = zn;
				else if (o >= i) {
					var u = t ? null : Vo(e);
					if (u) return Cr(u);
					s = !1, a = lr, l = new ui();
				} else l = t ? [] : c;
				outer: for (; ++r < o;) {
					var d = e[r], f = t ? t(d) : d;
					if (d = n || d !== 0 ? d : 0, s && f === f) {
						for (var p = l.length; p--;) if (l[p] === f) continue outer;
						t && l.push(f), c.push(d);
					} else a(l, f, n) || (l !== c && l.push(f), c.push(d));
				}
				return c;
			}
			function qa(e, t) {
				t = to(t, e);
				var n = -1, r = t.length;
				if (!r) return !0;
				for (; ++n < r;) {
					var i = Bs(t[n]);
					if (i === "__proto__" && !A.call(e, "__proto__") || (i === "constructor" || i === "prototype") && n < r - 1) return !1;
				}
				var a = As(e, t);
				return a == null || delete a[Bs(mc(t))];
			}
			function Ja(e, t, n, r) {
				return Fa(e, t, n(Ji(e, t)), r);
			}
			function Ya(e, t, n, r) {
				for (var i = e.length, a = r ? i : -1; (r ? a-- : ++a < i) && t(e[a], a, e););
				return n ? za(e, r ? 0 : a, r ? a + 1 : i) : za(e, r ? a + 1 : 0, r ? i : a);
			}
			function Xa(e, t) {
				var n = e;
				return n instanceof z && (n = n.value()), Vn(t, function(e, t) {
					return t.func.apply(t.thisArg, Bn([e], t.args));
				}, n);
			}
			function Za(e, t, n) {
				var r = e.length;
				if (r < 2) return r ? Ka(e[0]) : [];
				for (var i = -1, a = O(r); ++i < r;) for (var o = e[i], s = -1; ++s < r;) s != i && (a[i] = Ii(a[i] || o, e[s], t, n));
				return Ka(B(a, 1), t, n);
			}
			function Qa(e, t, r) {
				for (var i = -1, a = e.length, o = t.length, s = {}; ++i < a;) {
					var c = i < o ? t[i] : n;
					r(s, e[i], c);
				}
				return s;
			}
			function $a(e) {
				return q(e) ? e : [];
			}
			function eo(e) {
				return typeof e == "function" ? e : Mf;
			}
			function to(e, t) {
				return K(e) ? e : _s(e, t) ? [e] : zs(Z(e));
			}
			var no = H;
			function ro(e, t, r) {
				var i = e.length;
				return r = r === n ? i : r, !t && r >= i ? e : za(e, t, r);
			}
			var io = en || function(e) {
				return F.clearTimeout(e);
			};
			function ao(e, t) {
				if (t) return e.slice();
				var n = e.length, r = Gt ? Gt(n) : new e.constructor(n);
				return e.copy(r), r;
			}
			function oo(e) {
				var t = new e.constructor(e.byteLength);
				return new Wt(t).set(new Wt(e)), t;
			}
			function so(e, t) {
				var n = t ? oo(e.buffer) : e.buffer;
				return new e.constructor(n, e.byteOffset, e.byteLength);
			}
			function co(e) {
				var t = new e.constructor(e.source, gt.exec(e));
				return t.lastIndex = e.lastIndex, t;
			}
			function lo(e) {
				return Rr ? k(Rr.call(e)) : {};
			}
			function uo(e, t) {
				var n = t ? oo(e.buffer) : e.buffer;
				return new e.constructor(n, e.byteOffset, e.length);
			}
			function fo(e, t) {
				if (e !== t) {
					var r = e !== n, i = e === null, a = e === e, o = Wu(e), s = t !== n, c = t === null, l = t === t, u = Wu(t);
					if (!c && !u && !o && e > t || o && s && l && !c && !u || i && s && l || !r && l || !a) return 1;
					if (!i && !o && !u && e < t || u && r && a && !i && !o || c && r && a || !s && a || !l) return -1;
				}
				return 0;
			}
			function po(e, t, n) {
				for (var r = -1, i = e.criteria, a = t.criteria, o = i.length, s = n.length; ++r < o;) {
					var c = fo(i[r], a[r]);
					if (c) return r >= s ? c : c * (n[r] == "desc" ? -1 : 1);
				}
				return e.index - t.index;
			}
			function mo(e, t, n, r) {
				for (var i = -1, a = e.length, o = n.length, s = -1, c = t.length, l = j(a - o, 0), u = O(c + l), d = !r; ++s < c;) u[s] = t[s];
				for (; ++i < o;) (d || i < a) && (u[n[i]] = e[i]);
				for (; l--;) u[s++] = e[i++];
				return u;
			}
			function ho(e, t, n, r) {
				for (var i = -1, a = e.length, o = -1, s = n.length, c = -1, l = t.length, u = j(a - s, 0), d = O(u + l), f = !r; ++i < u;) d[i] = e[i];
				for (var p = i; ++c < l;) d[p + c] = t[c];
				for (; ++o < s;) (f || i < a) && (d[p + n[o]] = e[i++]);
				return d;
			}
			function go(e, t) {
				var n = -1, r = e.length;
				for (t ||= O(r); ++n < r;) t[n] = e[n];
				return t;
			}
			function _o(e, t, r, i) {
				var a = !r;
				r ||= {};
				for (var o = -1, s = t.length; ++o < s;) {
					var c = t[o], l = i ? i(r[c], e[c], c, r, e) : n;
					l === n && (l = e[c]), a ? ki(r, c, l) : wi(r, c, l);
				}
				return r;
			}
			function vo(e, t) {
				return _o(e, os(e), t);
			}
			function yo(e, t) {
				return _o(e, ss(e), t);
			}
			function bo(e, t) {
				return function(n, r) {
					var i = K(n) ? Nn : Ei, a = t ? t() : {};
					return i(n, e, U(r, 2), a);
				};
			}
			function xo(e) {
				return H(function(t, r) {
					var i = -1, a = r.length, o = a > 1 ? r[a - 1] : n, s = a > 2 ? r[2] : n;
					for (o = e.length > 3 && typeof o == "function" ? (a--, o) : n, s && G(r[0], r[1], s) && (o = a < 3 ? n : o, a = 1), t = k(t); ++i < a;) {
						var c = r[i];
						c && e(t, c, i, o);
					}
					return t;
				});
			}
			function So(e, t) {
				return function(n, r) {
					if (n == null) return n;
					if (!vu(n)) return e(n, r);
					for (var i = n.length, a = t ? i : -1, o = k(n); (t ? a-- : ++a < i) && r(o[a], a, o) !== !1;);
					return n;
				};
			}
			function Co(e) {
				return function(t, n, r) {
					for (var i = -1, a = k(t), o = r(t), s = o.length; s--;) {
						var c = o[e ? s : ++i];
						if (n(a[c], c, a) === !1) break;
					}
					return t;
				};
			}
			function wo(e, t, n) {
				var r = t & _, i = Do(e);
				function a() {
					return (this && this !== F && this instanceof a ? i : e).apply(r ? n : this, arguments);
				}
				return a;
			}
			function To(e) {
				return function(t) {
					t = Z(t);
					var r = _r(t) ? Or(t) : n, i = r ? r[0] : t.charAt(0), a = r ? ro(r, 1).join("") : t.slice(1);
					return i[e]() + a;
				};
			}
			function Eo(e) {
				return function(t) {
					return Vn(Cf(Yd(t).replace(cn, "")), e, "");
				};
			}
			function Do(e) {
				return function() {
					var t = arguments;
					switch (t.length) {
						case 0: return new e();
						case 1: return new e(t[0]);
						case 2: return new e(t[0], t[1]);
						case 3: return new e(t[0], t[1], t[2]);
						case 4: return new e(t[0], t[1], t[2], t[3]);
						case 5: return new e(t[0], t[1], t[2], t[3], t[4]);
						case 6: return new e(t[0], t[1], t[2], t[3], t[4], t[5]);
						case 7: return new e(t[0], t[1], t[2], t[3], t[4], t[5], t[6]);
					}
					var n = Br(e.prototype), r = e.apply(n, t);
					return J(r) ? r : n;
				};
			}
			function Oo(e, t, r) {
				var i = Do(e);
				function a() {
					for (var o = arguments.length, s = O(o), c = o, l = ts(a); c--;) s[c] = arguments[c];
					var u = o < 3 && s[0] !== l && s[o - 1] !== l ? [] : Sr(s, l);
					return o -= u.length, o < r ? zo(e, t, jo, a.placeholder, n, s, u, n, n, r - o) : Mn(this && this !== F && this instanceof a ? i : e, this, s);
				}
				return a;
			}
			function ko(e) {
				return function(t, r, i) {
					var a = k(t);
					if (!vu(t)) {
						var o = U(r, 3);
						t = Q(t), r = function(e) {
							return o(a[e], e, a);
						};
					}
					var s = e(t, r, i);
					return s > -1 ? a[o ? t[s] : s] : n;
				};
			}
			function Ao(e) {
				return Xo(function(t) {
					var r = t.length, i = r, a = Hr.prototype.thru;
					for (e && t.reverse(); i--;) {
						var s = t[i];
						if (typeof s != "function") throw new At(o);
						if (a && !c && es(s) == "wrapper") var c = new Hr([], !0);
					}
					for (i = c ? i : r; ++i < r;) {
						s = t[i];
						var l = es(s), u = l == "wrapper" ? $o(s) : n;
						c = u && ys(u[0]) && u[1] == (w | b | S | T) && !u[4].length && u[9] == 1 ? c[es(u[0])].apply(c, u[3]) : s.length == 1 && ys(s) ? c[l]() : c.thru(s);
					}
					return function() {
						var e = arguments, n = e[0];
						if (c && e.length == 1 && K(n)) return c.plant(n).value();
						for (var i = 0, a = r ? t[i].apply(this, e) : n; ++i < r;) a = t[i].call(this, a);
						return a;
					};
				});
			}
			function jo(e, t, r, i, a, o, s, c, l, u) {
				var d = t & w, f = t & _, p = t & v, m = t & (b | x), h = t & ee, g = p ? n : Do(e);
				function y() {
					for (var n = arguments.length, _ = O(n), v = n; v--;) _[v] = arguments[v];
					if (m) var b = ts(y), x = fr(_, b);
					if (i && (_ = mo(_, i, a, m)), o && (_ = ho(_, o, s, m)), n -= x, m && n < u) {
						var S = Sr(_, b);
						return zo(e, t, jo, y.placeholder, r, _, S, c, l, u - n);
					}
					var C = f ? r : this, w = p ? C[e] : e;
					return n = _.length, c ? _ = js(_, c) : h && n > 1 && _.reverse(), d && l < n && (_.length = l), this && this !== F && this instanceof y && (w = g || Do(w)), w.apply(C, _);
				}
				return y;
			}
			function Mo(e, t) {
				return function(n, r) {
					return ta(n, e, t(r), {});
				};
			}
			function No(e, t) {
				return function(r, i) {
					var a;
					if (r === n && i === n) return t;
					if (r !== n && (a = r), i !== n) {
						if (a === n) return i;
						typeof r == "string" || typeof i == "string" ? (r = Ga(r), i = Ga(i)) : (r = Wa(r), i = Wa(i)), a = e(r, i);
					}
					return a;
				};
			}
			function Po(e) {
				return Xo(function(t) {
					return t = L(t, sr(U())), H(function(n) {
						var r = this;
						return e(t, function(e) {
							return Mn(e, r, n);
						});
					});
				});
			}
			function Fo(e, t) {
				t = t === n ? " " : Ga(t);
				var r = t.length;
				if (r < 2) return r ? Ma(t, e) : t;
				var i = Ma(t, rn(e / Dr(t)));
				return _r(t) ? ro(Or(i), 0, e).join("") : i.slice(0, e);
			}
			function Io(e, t, n, r) {
				var i = t & _, a = Do(e);
				function o() {
					for (var t = -1, s = arguments.length, c = -1, l = r.length, u = O(l + s), d = this && this !== F && this instanceof o ? a : e; ++c < l;) u[c] = r[c];
					for (; s--;) u[c++] = arguments[++t];
					return Mn(d, i ? n : this, u);
				}
				return o;
			}
			function Lo(e) {
				return function(t, r, i) {
					return i && typeof i != "number" && G(t, r, i) && (r = i = n), t = Qu(t), r === n ? (r = t, t = 0) : r = Qu(r), i = i === n ? t < r ? 1 : -1 : Qu(i), ja(t, r, i, e);
				};
			}
			function Ro(e) {
				return function(t, n) {
					return typeof t == "string" && typeof n == "string" || (t = ed(t), n = ed(n)), e(t, n);
				};
			}
			function zo(e, t, r, i, a, o, s, c, l, u) {
				var d = t & b, f = d ? s : n, p = d ? n : s, m = d ? o : n, h = d ? n : o;
				t |= d ? S : C, t &= ~(d ? C : S), t & y || (t &= ~(_ | v));
				var g = [
					e,
					t,
					a,
					m,
					f,
					h,
					p,
					c,
					l,
					u
				], x = r.apply(n, g);
				return ys(e) && Ns(x, g), x.placeholder = i, Is(x, e, t);
			}
			function Bo(e) {
				var t = Dt[e];
				return function(e, n) {
					if (e = ed(e), n = n == null ? 0 : P(X(n), 292), n && un(e)) {
						var r = (Z(e) + "e").split("e");
						return r = (Z(t(r[0] + "e" + (+r[1] + n))) + "e").split("e"), +(r[0] + "e" + (+r[1] - n));
					}
					return t(e);
				};
			}
			var Vo = Tn && 1 / Cr(new Tn([, -0]))[1] == ce ? function(e) {
				return new Tn(e);
			} : Bf;
			function Ho(e) {
				return function(t) {
					var n = W(t);
					return n == Ce ? br(t) : n == Ae ? wr(t) : ar(t, e(t));
				};
			}
			function Uo(e, t, r, i, a, s, c, l) {
				var u = t & v;
				if (!u && typeof e != "function") throw new At(o);
				var d = i ? i.length : 0;
				if (d || (t &= ~(S | C), i = a = n), c = c === n ? c : j(X(c), 0), l = l === n ? l : X(l), d -= a ? a.length : 0, t & C) {
					var f = i, p = a;
					i = a = n;
				}
				var m = u ? n : $o(e), h = [
					e,
					t,
					r,
					i,
					a,
					f,
					p,
					s,
					c,
					l
				];
				if (m && Es(h, m), e = h[0], t = h[1], r = h[2], i = h[3], a = h[4], l = h[9] = h[9] === n ? u ? 0 : e.length : j(h[9] - d, 0), !l && t & (b | x) && (t &= ~(b | x)), !t || t == _) var g = wo(e, t, r);
				else g = t == b || t == x ? Oo(e, t, l) : (t == S || t == (_ | S)) && !a.length ? Io(e, t, r, i) : jo.apply(n, h);
				return Is((m ? Ia : Ns)(g, h), e, t);
			}
			function Wo(e, t, r, i) {
				return e === n || pu(e, Nt[r]) && !A.call(i, r) ? t : e;
			}
			function Go(e, t, r, i, a, o) {
				return J(e) && J(t) && (o.set(t, e), xa(e, t, n, Go, o), o.delete(t)), e;
			}
			function Ko(e) {
				return zu(e) ? n : e;
			}
			function qo(e, t, r, i, a, o) {
				var s = r & h, c = e.length, l = t.length;
				if (c != l && !(s && l > c)) return !1;
				var u = o.get(e), d = o.get(t);
				if (u && d) return u == t && d == e;
				var f = -1, p = !0, m = r & g ? new ui() : n;
				for (o.set(e, t), o.set(t, e); ++f < c;) {
					var _ = e[f], v = t[f];
					if (i) var y = s ? i(v, _, f, t, e, o) : i(_, v, f, e, t, o);
					if (y !== n) {
						if (y) continue;
						p = !1;
						break;
					}
					if (m) {
						if (!Un(t, function(e, t) {
							if (!lr(m, t) && (_ === e || a(_, e, r, i, o))) return m.push(t);
						})) {
							p = !1;
							break;
						}
					} else if (!(_ === v || a(_, v, r, i, o))) {
						p = !1;
						break;
					}
				}
				return o.delete(e), o.delete(t), p;
			}
			function Jo(e, t, n, r, i, a, o) {
				switch (n) {
					case Le:
						if (e.byteLength != t.byteLength || e.byteOffset != t.byteOffset) return !1;
						e = e.buffer, t = t.buffer;
					case Ie: return !(e.byteLength != t.byteLength || !a(new Wt(e), new Wt(t)));
					case _e:
					case ve:
					case we: return pu(+e, +t);
					case be: return e.name == t.name && e.message == t.message;
					case ke:
					case je: return e == t + "";
					case Ce: var s = br;
					case Ae:
						var c = r & h;
						if (s ||= Cr, e.size != t.size && !c) return !1;
						var l = o.get(e);
						if (l) return l == t;
						r |= g, o.set(e, t);
						var u = qo(s(e), s(t), r, i, a, o);
						return o.delete(e), u;
					case Me: if (Rr) return Rr.call(e) == Rr.call(t);
				}
				return !1;
			}
			function Yo(e, t, r, i, a, o) {
				var s = r & h, c = Zo(e), l = c.length;
				if (l != Zo(t).length && !s) return !1;
				for (var u = l; u--;) {
					var d = c[u];
					if (!(s ? d in t : A.call(t, d))) return !1;
				}
				var f = o.get(e), p = o.get(t);
				if (f && p) return f == t && p == e;
				var m = !0;
				o.set(e, t), o.set(t, e);
				for (var g = s; ++u < l;) {
					d = c[u];
					var _ = e[d], v = t[d];
					if (i) var y = s ? i(v, _, d, t, e, o) : i(_, v, d, e, t, o);
					if (!(y === n ? _ === v || a(_, v, r, i, o) : y)) {
						m = !1;
						break;
					}
					g ||= d == "constructor";
				}
				if (m && !g) {
					var b = e.constructor, x = t.constructor;
					b != x && "constructor" in e && "constructor" in t && !(typeof b == "function" && b instanceof b && typeof x == "function" && x instanceof x) && (m = !1);
				}
				return o.delete(e), o.delete(t), m;
			}
			function Xo(e) {
				return Fs(ks(e, n, rc), e + "");
			}
			function Zo(e) {
				return Yi(e, Q, os);
			}
			function Qo(e) {
				return Yi(e, $, ss);
			}
			var $o = Gn ? function(e) {
				return Gn.get(e);
			} : Bf;
			function es(e) {
				for (var t = e.name + "", n = er[t], r = A.call(er, t) ? n.length : 0; r--;) {
					var i = n[r], a = i.func;
					if (a == null || a == e) return i.name;
				}
				return t;
			}
			function ts(e) {
				return (A.call(R, "placeholder") ? R : e).placeholder;
			}
			function U() {
				var e = R.iteratee || Nf;
				return e = e === Nf ? ma : e, arguments.length ? e(arguments[0], arguments[1]) : e;
			}
			function ns(e, t) {
				var n = e.__data__;
				return vs(t) ? n[typeof t == "string" ? "string" : "hash"] : n.map;
			}
			function rs(e) {
				for (var t = Q(e), n = t.length; n--;) {
					var r = t[n], i = e[r];
					t[n] = [
						r,
						i,
						Cs(i)
					];
				}
				return t;
			}
			function is(e, t) {
				var r = gr(e, t);
				return ua(r) ? r : n;
			}
			function as(e) {
				var t = A.call(e, Qt), r = e[Qt];
				try {
					e[Qt] = n;
					var i = !0;
				} catch {}
				var a = Rt.call(e);
				return i && (t ? e[Qt] = r : delete e[Qt]), a;
			}
			var os = on ? function(e) {
				return e == null ? [] : (e = k(e), Ln(on(e), function(t) {
					return Jt.call(e, t);
				}));
			} : Yf, ss = on ? function(e) {
				for (var t = []; e;) Bn(t, os(e)), e = Kt(e);
				return t;
			} : Yf, W = V;
			(xn && W(new xn(/* @__PURE__ */ new ArrayBuffer(1))) != Le || Sn && W(new Sn()) != Ce || Cn && W(Cn.resolve()) != De || Tn && W(new Tn()) != Ae || I && W(new I()) != Pe) && (W = function(e) {
				var t = V(e), r = t == Ee ? e.constructor : n, i = r ? Vs(r) : "";
				if (i) switch (i) {
					case Tr: return Le;
					case jr: return Ce;
					case Mr: return De;
					case Fr: return Ae;
					case Ir: return Pe;
				}
				return t;
			});
			function cs(e, t, n) {
				for (var r = -1, i = n.length; ++r < i;) {
					var a = n[r], o = a.size;
					switch (a.type) {
						case "drop":
							e += o;
							break;
						case "dropRight":
							t -= o;
							break;
						case "take":
							t = P(t, e + o);
							break;
						case "takeRight":
							e = j(e, t - o);
							break;
					}
				}
				return {
					start: e,
					end: t
				};
			}
			function ls(e) {
				var t = e.match(ut);
				return t ? t[1].split(dt) : [];
			}
			function us(e, t, n) {
				t = to(t, e);
				for (var r = -1, i = t.length, a = !1; ++r < i;) {
					var o = Bs(t[r]);
					if (!(a = e != null && n(e, o))) break;
					e = e[o];
				}
				return a || ++r != i ? a : (i = e == null ? 0 : e.length, !!i && Au(i) && gs(o, i) && (K(e) || gu(e)));
			}
			function ds(e) {
				var t = e.length, n = new e.constructor(t);
				return t && typeof e[0] == "string" && A.call(e, "index") && (n.index = e.index, n.input = e.input), n;
			}
			function fs(e) {
				return typeof e.constructor == "function" && !Ss(e) ? Br(Kt(e)) : {};
			}
			function ps(e, t, n) {
				var r = e.constructor;
				switch (t) {
					case Ie: return oo(e);
					case _e:
					case ve: return new r(+e);
					case Le: return so(e, n);
					case Re:
					case ze:
					case Be:
					case Ve:
					case He:
					case Ue:
					case We:
					case Ge:
					case Ke: return uo(e, n);
					case Ce: return new r();
					case we:
					case je: return new r(e);
					case ke: return co(e);
					case Ae: return new r();
					case Me: return lo(e);
				}
			}
			function ms(e, t) {
				var n = t.length;
				if (!n) return e;
				var r = n - 1;
				return t[r] = (n > 1 ? "& " : "") + t[r], t = t.join(n > 2 ? ", " : " "), e.replace(lt, "{\n/* [wrapped with " + t + "] */\n");
			}
			function hs(e) {
				return K(e) || gu(e) || !!(Xt && e && e[Xt]);
			}
			function gs(e, t) {
				var n = typeof e;
				return t ??= le, !!t && (n == "number" || n != "symbol" && xt.test(e)) && e > -1 && e % 1 == 0 && e < t;
			}
			function G(e, t, n) {
				if (!J(n)) return !1;
				var r = typeof t;
				return (r == "number" ? vu(n) && gs(t, n.length) : r == "string" && t in n) ? pu(n[t], e) : !1;
			}
			function _s(e, t) {
				if (K(e)) return !1;
				var n = typeof e;
				return n == "number" || n == "symbol" || n == "boolean" || e == null || Wu(e) ? !0 : it.test(e) || !rt.test(e) || t != null && e in k(t);
			}
			function vs(e) {
				var t = typeof e;
				return t == "string" || t == "number" || t == "symbol" || t == "boolean" ? e !== "__proto__" : e === null;
			}
			function ys(e) {
				var t = es(e), n = R[t];
				if (typeof n != "function" || !(t in z.prototype)) return !1;
				if (e === n) return !0;
				var r = $o(n);
				return !!r && e === r[0];
			}
			function bs(e) {
				return !!Lt && Lt in e;
			}
			var xs = Pt ? Ou : Xf;
			function Ss(e) {
				var t = e && e.constructor;
				return e === (typeof t == "function" && t.prototype || Nt);
			}
			function Cs(e) {
				return e === e && !J(e);
			}
			function ws(e, t) {
				return function(r) {
					return r == null ? !1 : r[e] === t && (t !== n || e in k(r));
				};
			}
			function Ts(e) {
				var t = Yl(e, function(e) {
					return n.size === u && n.clear(), e;
				}), n = t.cache;
				return t;
			}
			function Es(e, t) {
				var n = e[1], r = t[1], i = n | r, a = i < (_ | v | w), o = r == w && n == b || r == w && n == T && e[7].length <= t[8] || r == (w | T) && t[7].length <= t[8] && n == b;
				if (!(a || o)) return e;
				r & _ && (e[2] = t[2], i |= n & _ ? 0 : y);
				var s = t[3];
				if (s) {
					var c = e[3];
					e[3] = c ? mo(c, s, t[4]) : s, e[4] = c ? Sr(e[3], d) : t[4];
				}
				return s = t[5], s && (c = e[5], e[5] = c ? ho(c, s, t[6]) : s, e[6] = c ? Sr(e[5], d) : t[6]), s = t[7], s && (e[7] = s), r & w && (e[8] = e[8] == null ? t[8] : P(e[8], t[8])), e[9] ??= t[9], e[0] = t[0], e[1] = i, e;
			}
			function Ds(e) {
				var t = [];
				if (e != null) for (var n in k(e)) t.push(n);
				return t;
			}
			function Os(e) {
				return Rt.call(e);
			}
			function ks(e, t, r) {
				return t = j(t === n ? e.length - 1 : t, 0), function() {
					for (var n = arguments, i = -1, a = j(n.length - t, 0), o = O(a); ++i < a;) o[i] = n[t + i];
					i = -1;
					for (var s = O(t + 1); ++i < t;) s[i] = n[i];
					return s[t] = r(o), Mn(e, this, s);
				};
			}
			function As(e, t) {
				return t.length < 2 ? e : Ji(e, za(t, 0, -1));
			}
			function js(e, t) {
				for (var r = e.length, i = P(t.length, r), a = go(e); i--;) {
					var o = t[i];
					e[i] = gs(o, r) ? a[o] : n;
				}
				return e;
			}
			function Ms(e, t) {
				if (!(t === "constructor" && typeof e[t] == "function") && t != "__proto__") return e[t];
			}
			var Ns = Ls(Ia), Ps = nn || function(e, t) {
				return F.setTimeout(e, t);
			}, Fs = Ls(La);
			function Is(e, t, n) {
				var r = t + "";
				return Fs(e, ms(r, Hs(ls(r), n)));
			}
			function Ls(e) {
				var t = 0, r = 0;
				return function() {
					var i = hn(), a = ie - (i - r);
					if (r = i, a > 0) {
						if (++t >= re) return arguments[0];
					} else t = 0;
					return e.apply(n, arguments);
				};
			}
			function Rs(e, t) {
				var r = -1, i = e.length, a = i - 1;
				for (t = t === n ? i : t; ++r < t;) {
					var o = Aa(r, a), s = e[o];
					e[o] = e[r], e[r] = s;
				}
				return e.length = t, e;
			}
			var zs = Ts(function(e) {
				var t = [];
				return e.charCodeAt(0) === 46 && t.push(""), e.replace(at, function(e, n, r, i) {
					t.push(r ? i.replace(mt, "$1") : n || e);
				}), t;
			});
			function Bs(e) {
				if (typeof e == "string" || Wu(e)) return e;
				var t = e + "";
				return t == "0" && 1 / e == -ce ? "-0" : t;
			}
			function Vs(e) {
				if (e != null) {
					try {
						return Ft.call(e);
					} catch {}
					try {
						return e + "";
					} catch {}
				}
				return "";
			}
			function Hs(e, t) {
				return Pn(pe, function(n) {
					var r = "_." + n[0];
					t & n[1] && !Rn(e, r) && e.push(r);
				}), e.sort();
			}
			function Us(e) {
				if (e instanceof z) return e.clone();
				var t = new Hr(e.__wrapped__, e.__chain__);
				return t.__actions__ = go(e.__actions__), t.__index__ = e.__index__, t.__values__ = e.__values__, t;
			}
			function Ws(e, t, r) {
				t = (r ? G(e, t, r) : t === n) ? 1 : j(X(t), 0);
				var i = e == null ? 0 : e.length;
				if (!i || t < 1) return [];
				for (var a = 0, o = 0, s = O(rn(i / t)); a < i;) s[o++] = za(e, a, a += t);
				return s;
			}
			function Gs(e) {
				for (var t = -1, n = e == null ? 0 : e.length, r = 0, i = []; ++t < n;) {
					var a = e[t];
					a && (i[r++] = a);
				}
				return i;
			}
			function Ks() {
				var e = arguments.length;
				if (!e) return [];
				for (var t = O(e - 1), n = arguments[0], r = e; r--;) t[r - 1] = arguments[r];
				return Bn(K(n) ? go(n) : [n], B(t, 1));
			}
			var qs = H(function(e, t) {
				return q(e) ? Ii(e, B(t, 1, q, !0)) : [];
			}), Js = H(function(e, t) {
				var r = mc(t);
				return q(r) && (r = n), q(e) ? Ii(e, B(t, 1, q, !0), U(r, 2)) : [];
			}), Ys = H(function(e, t) {
				var r = mc(t);
				return q(r) && (r = n), q(e) ? Ii(e, B(t, 1, q, !0), n, r) : [];
			});
			function Xs(e, t, r) {
				var i = e == null ? 0 : e.length;
				return i ? (t = r || t === n ? 1 : X(t), za(e, t < 0 ? 0 : t, i)) : [];
			}
			function Zs(e, t, r) {
				var i = e == null ? 0 : e.length;
				return i ? (t = r || t === n ? 1 : X(t), t = i - t, za(e, 0, t < 0 ? 0 : t)) : [];
			}
			function Qs(e, t) {
				return e && e.length ? Ya(e, U(t, 3), !0, !0) : [];
			}
			function $s(e, t) {
				return e && e.length ? Ya(e, U(t, 3), !0) : [];
			}
			function ec(e, t, n, r) {
				var i = e == null ? 0 : e.length;
				return i ? (n && typeof n != "number" && G(e, t, n) && (n = 0, r = i), Vi(e, t, n, r)) : [];
			}
			function tc(e, t, n) {
				var r = e == null ? 0 : e.length;
				if (!r) return -1;
				var i = n == null ? 0 : X(n);
				return i < 0 && (i = j(r + i, 0)), Jn(e, U(t, 3), i);
			}
			function nc(e, t, r) {
				var i = e == null ? 0 : e.length;
				if (!i) return -1;
				var a = i - 1;
				return r !== n && (a = X(r), a = r < 0 ? j(i + a, 0) : P(a, i - 1)), Jn(e, U(t, 3), a, !0);
			}
			function rc(e) {
				return e != null && e.length ? B(e, 1) : [];
			}
			function ic(e) {
				return e != null && e.length ? B(e, ce) : [];
			}
			function ac(e, t) {
				return e != null && e.length ? (t = t === n ? 1 : X(t), B(e, t)) : [];
			}
			function oc(e) {
				for (var t = -1, n = e == null ? 0 : e.length, r = {}; ++t < n;) {
					var i = e[t];
					ki(r, i[0], i[1]);
				}
				return r;
			}
			function sc(e) {
				return e && e.length ? e[0] : n;
			}
			function cc(e, t, n) {
				var r = e == null ? 0 : e.length;
				if (!r) return -1;
				var i = n == null ? 0 : X(n);
				return i < 0 && (i = j(r + i, 0)), Yn(e, t, i);
			}
			function lc(e) {
				return e != null && e.length ? za(e, 0, -1) : [];
			}
			var uc = H(function(e) {
				var t = L(e, $a);
				return t.length && t[0] === e[0] ? ea(t) : [];
			}), dc = H(function(e) {
				var t = mc(e), r = L(e, $a);
				return t === mc(r) ? t = n : r.pop(), r.length && r[0] === e[0] ? ea(r, U(t, 2)) : [];
			}), fc = H(function(e) {
				var t = mc(e), r = L(e, $a);
				return t = typeof t == "function" ? t : n, t && r.pop(), r.length && r[0] === e[0] ? ea(r, n, t) : [];
			});
			function pc(e, t) {
				return e == null ? "" : dn.call(e, t);
			}
			function mc(e) {
				var t = e == null ? 0 : e.length;
				return t ? e[t - 1] : n;
			}
			function hc(e, t, r) {
				var i = e == null ? 0 : e.length;
				if (!i) return -1;
				var a = i;
				return r !== n && (a = X(r), a = a < 0 ? j(i + a, 0) : P(a, i - 1)), t === t ? Er(e, t, a) : Jn(e, Zn, a, !0);
			}
			function gc(e, t) {
				return e && e.length ? Ca(e, X(t)) : n;
			}
			var _c = H(vc);
			function vc(e, t) {
				return e && e.length && t && t.length ? Oa(e, t) : e;
			}
			function yc(e, t, n) {
				return e && e.length && t && t.length ? Oa(e, t, U(n, 2)) : e;
			}
			function bc(e, t, r) {
				return e && e.length && t && t.length ? Oa(e, t, n, r) : e;
			}
			var xc = Xo(function(e, t) {
				var n = e == null ? 0 : e.length, r = Ai(e, t);
				return ka(e, L(t, function(e) {
					return gs(e, n) ? +e : e;
				}).sort(fo)), r;
			});
			function Sc(e, t) {
				var n = [];
				if (!(e && e.length)) return n;
				var r = -1, i = [], a = e.length;
				for (t = U(t, 3); ++r < a;) {
					var o = e[r];
					t(o, r, e) && (n.push(o), i.push(r));
				}
				return ka(e, i), n;
			}
			function Cc(e) {
				return e == null ? e : bn.call(e);
			}
			function wc(e, t, r) {
				var i = e == null ? 0 : e.length;
				return i ? (r && typeof r != "number" && G(e, t, r) ? (t = 0, r = i) : (t = t == null ? 0 : X(t), r = r === n ? i : X(r)), za(e, t, r)) : [];
			}
			function Tc(e, t) {
				return Va(e, t);
			}
			function Ec(e, t, n) {
				return Ha(e, t, U(n, 2));
			}
			function Dc(e, t) {
				var n = e == null ? 0 : e.length;
				if (n) {
					var r = Va(e, t);
					if (r < n && pu(e[r], t)) return r;
				}
				return -1;
			}
			function Oc(e, t) {
				return Va(e, t, !0);
			}
			function kc(e, t, n) {
				return Ha(e, t, U(n, 2), !0);
			}
			function Ac(e, t) {
				if (e != null && e.length) {
					var n = Va(e, t, !0) - 1;
					if (pu(e[n], t)) return n;
				}
				return -1;
			}
			function jc(e) {
				return e && e.length ? Ua(e) : [];
			}
			function Mc(e, t) {
				return e && e.length ? Ua(e, U(t, 2)) : [];
			}
			function Nc(e) {
				var t = e == null ? 0 : e.length;
				return t ? za(e, 1, t) : [];
			}
			function Pc(e, t, r) {
				return e && e.length ? (t = r || t === n ? 1 : X(t), za(e, 0, t < 0 ? 0 : t)) : [];
			}
			function Fc(e, t, r) {
				var i = e == null ? 0 : e.length;
				return i ? (t = r || t === n ? 1 : X(t), t = i - t, za(e, t < 0 ? 0 : t, i)) : [];
			}
			function Ic(e, t) {
				return e && e.length ? Ya(e, U(t, 3), !1, !0) : [];
			}
			function Lc(e, t) {
				return e && e.length ? Ya(e, U(t, 3)) : [];
			}
			var Rc = H(function(e) {
				return Ka(B(e, 1, q, !0));
			}), zc = H(function(e) {
				var t = mc(e);
				return q(t) && (t = n), Ka(B(e, 1, q, !0), U(t, 2));
			}), Bc = H(function(e) {
				var t = mc(e);
				return t = typeof t == "function" ? t : n, Ka(B(e, 1, q, !0), n, t);
			});
			function Vc(e) {
				return e && e.length ? Ka(e) : [];
			}
			function Hc(e, t) {
				return e && e.length ? Ka(e, U(t, 2)) : [];
			}
			function Uc(e, t) {
				return t = typeof t == "function" ? t : n, e && e.length ? Ka(e, n, t) : [];
			}
			function Wc(e) {
				if (!(e && e.length)) return [];
				var t = 0;
				return e = Ln(e, function(e) {
					if (q(e)) return t = j(e.length, t), !0;
				}), ir(t, function(t) {
					return L(e, $n(t));
				});
			}
			function Gc(e, t) {
				if (!(e && e.length)) return [];
				var r = Wc(e);
				return t == null ? r : L(r, function(e) {
					return Mn(t, n, e);
				});
			}
			var Kc = H(function(e, t) {
				return q(e) ? Ii(e, t) : [];
			}), qc = H(function(e) {
				return Za(Ln(e, q));
			}), Jc = H(function(e) {
				var t = mc(e);
				return q(t) && (t = n), Za(Ln(e, q), U(t, 2));
			}), Yc = H(function(e) {
				var t = mc(e);
				return t = typeof t == "function" ? t : n, Za(Ln(e, q), n, t);
			}), Xc = H(Wc);
			function Zc(e, t) {
				return Qa(e || [], t || [], wi);
			}
			function Qc(e, t) {
				return Qa(e || [], t || [], Fa);
			}
			var $c = H(function(e) {
				var t = e.length, r = t > 1 ? e[t - 1] : n;
				return r = typeof r == "function" ? (e.pop(), r) : n, Gc(e, r);
			});
			function el(e) {
				var t = R(e);
				return t.__chain__ = !0, t;
			}
			function tl(e, t) {
				return t(e), e;
			}
			function nl(e, t) {
				return t(e);
			}
			var rl = Xo(function(e) {
				var t = e.length, r = t ? e[0] : 0, i = this.__wrapped__, a = function(t) {
					return Ai(t, e);
				};
				return t > 1 || this.__actions__.length || !(i instanceof z) || !gs(r) ? this.thru(a) : (i = i.slice(r, +r + +!!t), i.__actions__.push({
					func: nl,
					args: [a],
					thisArg: n
				}), new Hr(i, this.__chain__).thru(function(e) {
					return t && !e.length && e.push(n), e;
				}));
			});
			function il() {
				return el(this);
			}
			function al() {
				return new Hr(this.value(), this.__chain__);
			}
			function ol() {
				this.__values__ === n && (this.__values__ = Zu(this.value()));
				var e = this.__index__ >= this.__values__.length;
				return {
					done: e,
					value: e ? n : this.__values__[this.__index__++]
				};
			}
			function sl() {
				return this;
			}
			function cl(e) {
				for (var t, r = this; r instanceof Vr;) {
					var i = Us(r);
					i.__index__ = 0, i.__values__ = n, t ? a.__wrapped__ = i : t = i;
					var a = i;
					r = r.__wrapped__;
				}
				return a.__wrapped__ = e, t;
			}
			function ll() {
				var e = this.__wrapped__;
				if (e instanceof z) {
					var t = e;
					return this.__actions__.length && (t = new z(this)), t = t.reverse(), t.__actions__.push({
						func: nl,
						args: [Cc],
						thisArg: n
					}), new Hr(t, this.__chain__);
				}
				return this.thru(Cc);
			}
			function ul() {
				return Xa(this.__wrapped__, this.__actions__);
			}
			var dl = bo(function(e, t, n) {
				A.call(e, n) ? ++e[n] : ki(e, n, 1);
			});
			function fl(e, t, r) {
				var i = K(e) ? In : zi;
				return r && G(e, t, r) && (t = n), i(e, U(t, 3));
			}
			function pl(e, t) {
				return (K(e) ? Ln : Hi)(e, U(t, 3));
			}
			var ml = ko(tc), hl = ko(nc);
			function gl(e, t) {
				return B(Tl(e, t), 1);
			}
			function _l(e, t) {
				return B(Tl(e, t), ce);
			}
			function vl(e, t, r) {
				return r = r === n ? 1 : X(r), B(Tl(e, t), r);
			}
			function yl(e, t) {
				return (K(e) ? Pn : Li)(e, U(t, 3));
			}
			function bl(e, t) {
				return (K(e) ? Fn : Ri)(e, U(t, 3));
			}
			var xl = bo(function(e, t, n) {
				A.call(e, n) ? e[n].push(t) : ki(e, n, [t]);
			});
			function Sl(e, t, n, r) {
				e = vu(e) ? e : Hd(e), n = n && !r ? X(n) : 0;
				var i = e.length;
				return n < 0 && (n = j(i + n, 0)), Uu(e) ? n <= i && e.indexOf(t, n) > -1 : !!i && Yn(e, t, n) > -1;
			}
			var Cl = H(function(e, t, n) {
				var r = -1, i = typeof t == "function", a = vu(e) ? O(e.length) : [];
				return Li(e, function(e) {
					a[++r] = i ? Mn(t, e, n) : na(e, t, n);
				}), a;
			}), wl = bo(function(e, t, n) {
				ki(e, n, t);
			});
			function Tl(e, t) {
				return (K(e) ? L : va)(e, U(t, 3));
			}
			function El(e, t, r, i) {
				return e == null ? [] : (K(t) || (t = t == null ? [] : [t]), r = i ? n : r, K(r) || (r = r == null ? [] : [r]), wa(e, t, r));
			}
			var Dl = bo(function(e, t, n) {
				e[+!n].push(t);
			}, function() {
				return [[], []];
			});
			function Ol(e, t, n) {
				var r = K(e) ? Vn : tr, i = arguments.length < 3;
				return r(e, U(t, 4), n, i, Li);
			}
			function kl(e, t, n) {
				var r = K(e) ? Hn : tr, i = arguments.length < 3;
				return r(e, U(t, 4), n, i, Ri);
			}
			function Al(e, t) {
				return (K(e) ? Ln : Hi)(e, Xl(U(t, 3)));
			}
			function jl(e) {
				return (K(e) ? bi : Na)(e);
			}
			function Ml(e, t, r) {
				return t = (r ? G(e, t, r) : t === n) ? 1 : X(t), (K(e) ? xi : Pa)(e, t);
			}
			function Nl(e) {
				return (K(e) ? Si : Ra)(e);
			}
			function Pl(e) {
				if (e == null) return 0;
				if (vu(e)) return Uu(e) ? Dr(e) : e.length;
				var t = W(e);
				return t == Ce || t == Ae ? e.size : ha(e).length;
			}
			function Fl(e, t, r) {
				var i = K(e) ? Un : Ba;
				return r && G(e, t, r) && (t = n), i(e, U(t, 3));
			}
			var Il = H(function(e, t) {
				if (e == null) return [];
				var n = t.length;
				return n > 1 && G(e, t[0], t[1]) ? t = [] : n > 2 && G(t[0], t[1], t[2]) && (t = [t[0]]), wa(e, B(t, 1), []);
			}), Ll = tn || function() {
				return F.Date.now();
			};
			function Rl(e, t) {
				if (typeof t != "function") throw new At(o);
				return e = X(e), function() {
					if (--e < 1) return t.apply(this, arguments);
				};
			}
			function zl(e, t, r) {
				return t = r ? n : t, t = e && t == null ? e.length : t, Uo(e, w, n, n, n, n, t);
			}
			function Bl(e, t) {
				var r;
				if (typeof t != "function") throw new At(o);
				return e = X(e), function() {
					return --e > 0 && (r = t.apply(this, arguments)), e <= 1 && (t = n), r;
				};
			}
			var Vl = H(function(e, t, n) {
				var r = _;
				if (n.length) {
					var i = Sr(n, ts(Vl));
					r |= S;
				}
				return Uo(e, r, t, n, i);
			}), Hl = H(function(e, t, n) {
				var r = _ | v;
				if (n.length) {
					var i = Sr(n, ts(Hl));
					r |= S;
				}
				return Uo(t, r, e, n, i);
			});
			function Ul(e, t, r) {
				t = r ? n : t;
				var i = Uo(e, b, n, n, n, n, n, t);
				return i.placeholder = Ul.placeholder, i;
			}
			function Wl(e, t, r) {
				t = r ? n : t;
				var i = Uo(e, x, n, n, n, n, n, t);
				return i.placeholder = Wl.placeholder, i;
			}
			function Gl(e, t, r) {
				var i, a, s, c, l, u, d = 0, f = !1, p = !1, m = !0;
				if (typeof e != "function") throw new At(o);
				t = ed(t) || 0, J(r) && (f = !!r.leading, p = "maxWait" in r, s = p ? j(ed(r.maxWait) || 0, t) : s, m = "trailing" in r ? !!r.trailing : m);
				function h(t) {
					var r = i, o = a;
					return i = a = n, d = t, c = e.apply(o, r), c;
				}
				function g(e) {
					return d = e, l = Ps(y, t), f ? h(e) : c;
				}
				function _(e) {
					var n = e - u, r = e - d, i = t - n;
					return p ? P(i, s - r) : i;
				}
				function v(e) {
					var r = e - u, i = e - d;
					return u === n || r >= t || r < 0 || p && i >= s;
				}
				function y() {
					var e = Ll();
					if (v(e)) return b(e);
					l = Ps(y, _(e));
				}
				function b(e) {
					return l = n, m && i ? h(e) : (i = a = n, c);
				}
				function x() {
					l !== n && io(l), d = 0, i = u = a = l = n;
				}
				function S() {
					return l === n ? c : b(Ll());
				}
				function C() {
					var e = Ll(), r = v(e);
					if (i = arguments, a = this, u = e, r) {
						if (l === n) return g(u);
						if (p) return io(l), l = Ps(y, t), h(u);
					}
					return l === n && (l = Ps(y, t)), c;
				}
				return C.cancel = x, C.flush = S, C;
			}
			var Kl = H(function(e, t) {
				return Fi(e, 1, t);
			}), ql = H(function(e, t, n) {
				return Fi(e, ed(t) || 0, n);
			});
			function Jl(e) {
				return Uo(e, ee);
			}
			function Yl(e, t) {
				if (typeof e != "function" || t != null && typeof t != "function") throw new At(o);
				var n = function() {
					var r = arguments, i = t ? t.apply(this, r) : r[0], a = n.cache;
					if (a.has(i)) return a.get(i);
					var o = e.apply(this, r);
					return n.cache = a.set(i, o) || a, o;
				};
				return n.cache = new (Yl.Cache || ii)(), n;
			}
			Yl.Cache = ii;
			function Xl(e) {
				if (typeof e != "function") throw new At(o);
				return function() {
					var t = arguments;
					switch (t.length) {
						case 0: return !e.call(this);
						case 1: return !e.call(this, t[0]);
						case 2: return !e.call(this, t[0], t[1]);
						case 3: return !e.call(this, t[0], t[1], t[2]);
					}
					return !e.apply(this, t);
				};
			}
			function Zl(e) {
				return Bl(2, e);
			}
			var Ql = no(function(e, t) {
				t = t.length == 1 && K(t[0]) ? L(t[0], sr(U())) : L(B(t, 1), sr(U()));
				var n = t.length;
				return H(function(r) {
					for (var i = -1, a = P(r.length, n); ++i < a;) r[i] = t[i].call(this, r[i]);
					return Mn(e, this, r);
				});
			}), $l = H(function(e, t) {
				return Uo(e, S, n, t, Sr(t, ts($l)));
			}), eu = H(function(e, t) {
				return Uo(e, C, n, t, Sr(t, ts(eu)));
			}), tu = Xo(function(e, t) {
				return Uo(e, T, n, n, n, t);
			});
			function nu(e, t) {
				if (typeof e != "function") throw new At(o);
				return t = t === n ? t : X(t), H(e, t);
			}
			function ru(e, t) {
				if (typeof e != "function") throw new At(o);
				return t = t == null ? 0 : j(X(t), 0), H(function(n) {
					var r = n[t], i = ro(n, 0, t);
					return r && Bn(i, r), Mn(e, this, i);
				});
			}
			function iu(e, t, n) {
				var r = !0, i = !0;
				if (typeof e != "function") throw new At(o);
				return J(n) && (r = "leading" in n ? !!n.leading : r, i = "trailing" in n ? !!n.trailing : i), Gl(e, t, {
					leading: r,
					maxWait: t,
					trailing: i
				});
			}
			function au(e) {
				return zl(e, 1);
			}
			function ou(e, t) {
				return $l(eo(t), e);
			}
			function su() {
				if (!arguments.length) return [];
				var e = arguments[0];
				return K(e) ? e : [e];
			}
			function cu(e) {
				return Mi(e, m);
			}
			function lu(e, t) {
				return t = typeof t == "function" ? t : n, Mi(e, m, t);
			}
			function uu(e) {
				return Mi(e, f | m);
			}
			function du(e, t) {
				return t = typeof t == "function" ? t : n, Mi(e, f | m, t);
			}
			function fu(e, t) {
				return t == null || Pi(e, t, Q(t));
			}
			function pu(e, t) {
				return e === t || e !== e && t !== t;
			}
			var mu = Ro(Xi), hu = Ro(function(e, t) {
				return e >= t;
			}), gu = ra(function() {
				return arguments;
			}()) ? ra : function(e) {
				return Y(e) && A.call(e, "callee") && !Jt.call(e, "callee");
			}, K = O.isArray, _u = En ? sr(En) : ia;
			function vu(e) {
				return e != null && Au(e.length) && !Ou(e);
			}
			function q(e) {
				return Y(e) && vu(e);
			}
			function yu(e) {
				return e === !0 || e === !1 || Y(e) && V(e) == _e;
			}
			var bu = sn || Xf, xu = Dn ? sr(Dn) : aa;
			function Su(e) {
				return Y(e) && e.nodeType === 1 && !zu(e);
			}
			function Cu(e) {
				if (e == null) return !0;
				if (vu(e) && (K(e) || typeof e == "string" || typeof e.splice == "function" || bu(e) || Gu(e) || gu(e))) return !e.length;
				var t = W(e);
				if (t == Ce || t == Ae) return !e.size;
				if (Ss(e)) return !ha(e).length;
				for (var n in e) if (A.call(e, n)) return !1;
				return !0;
			}
			function wu(e, t) {
				return oa(e, t);
			}
			function Tu(e, t, r) {
				r = typeof r == "function" ? r : n;
				var i = r ? r(e, t) : n;
				return i === n ? oa(e, t, n, r) : !!i;
			}
			function Eu(e) {
				if (!Y(e)) return !1;
				var t = V(e);
				return t == be || t == ye || typeof e.message == "string" && typeof e.name == "string" && !zu(e);
			}
			function Du(e) {
				return typeof e == "number" && un(e);
			}
			function Ou(e) {
				if (!J(e)) return !1;
				var t = V(e);
				return t == xe || t == Se || t == ge || t == Oe;
			}
			function ku(e) {
				return typeof e == "number" && e == X(e);
			}
			function Au(e) {
				return typeof e == "number" && e > -1 && e % 1 == 0 && e <= le;
			}
			function J(e) {
				var t = typeof e;
				return e != null && (t == "object" || t == "function");
			}
			function Y(e) {
				return typeof e == "object" && !!e;
			}
			var ju = On ? sr(On) : ca;
			function Mu(e, t) {
				return e === t || la(e, t, rs(t));
			}
			function Nu(e, t, r) {
				return r = typeof r == "function" ? r : n, la(e, t, rs(t), r);
			}
			function Pu(e) {
				return Ru(e) && e != +e;
			}
			function Fu(e) {
				if (xs(e)) throw new Tt(a);
				return ua(e);
			}
			function Iu(e) {
				return e === null;
			}
			function Lu(e) {
				return e == null;
			}
			function Ru(e) {
				return typeof e == "number" || Y(e) && V(e) == we;
			}
			function zu(e) {
				if (!Y(e) || V(e) != Ee) return !1;
				var t = Kt(e);
				if (t === null) return !0;
				var n = A.call(t, "constructor") && t.constructor;
				return typeof n == "function" && n instanceof n && Ft.call(n) == zt;
			}
			var Bu = kn ? sr(kn) : da;
			function Vu(e) {
				return ku(e) && e >= -le && e <= le;
			}
			var Hu = An ? sr(An) : fa;
			function Uu(e) {
				return typeof e == "string" || !K(e) && Y(e) && V(e) == je;
			}
			function Wu(e) {
				return typeof e == "symbol" || Y(e) && V(e) == Me;
			}
			var Gu = jn ? sr(jn) : pa;
			function Ku(e) {
				return e === n;
			}
			function qu(e) {
				return Y(e) && W(e) == Pe;
			}
			function Ju(e) {
				return Y(e) && V(e) == Fe;
			}
			var Yu = Ro(_a), Xu = Ro(function(e, t) {
				return e <= t;
			});
			function Zu(e) {
				if (!e) return [];
				if (vu(e)) return Uu(e) ? Or(e) : go(e);
				if (Zt && e[Zt]) return yr(e[Zt]());
				var t = W(e);
				return (t == Ce ? br : t == Ae ? Cr : Hd)(e);
			}
			function Qu(e) {
				return e ? (e = ed(e), e === ce || e === -ce ? (e < 0 ? -1 : 1) * ue : e === e ? e : 0) : e === 0 ? e : 0;
			}
			function X(e) {
				var t = Qu(e), n = t % 1;
				return t === t ? n ? t - n : t : 0;
			}
			function $u(e) {
				return e ? ji(X(e), 0, D) : 0;
			}
			function ed(e) {
				if (typeof e == "number") return e;
				if (Wu(e)) return E;
				if (J(e)) {
					var t = typeof e.valueOf == "function" ? e.valueOf() : e;
					e = J(t) ? t + "" : t;
				}
				if (typeof e != "string") return e === 0 ? e : +e;
				e = or(e);
				var n = vt.test(e);
				return n || bt.test(e) ? yn(e.slice(2), n ? 2 : 8) : _t.test(e) ? E : +e;
			}
			function td(e) {
				return _o(e, $(e));
			}
			function nd(e) {
				return e ? ji(X(e), -le, le) : e === 0 ? e : 0;
			}
			function Z(e) {
				return e == null ? "" : Ga(e);
			}
			var rd = xo(function(e, t) {
				if (Ss(t) || vu(t)) {
					_o(t, Q(t), e);
					return;
				}
				for (var n in t) A.call(t, n) && wi(e, n, t[n]);
			}), id = xo(function(e, t) {
				_o(t, $(t), e);
			}), ad = xo(function(e, t, n, r) {
				_o(t, $(t), e, r);
			}), od = xo(function(e, t, n, r) {
				_o(t, Q(t), e, r);
			}), sd = Xo(Ai);
			function cd(e, t) {
				var n = Br(e);
				return t == null ? n : Di(n, t);
			}
			var ld = H(function(e, t) {
				e = k(e);
				var r = -1, i = t.length, a = i > 2 ? t[2] : n;
				for (a && G(t[0], t[1], a) && (i = 1); ++r < i;) for (var o = t[r], s = $(o), c = -1, l = s.length; ++c < l;) {
					var u = s[c], d = e[u];
					(d === n || pu(d, Nt[u]) && !A.call(e, u)) && (e[u] = o[u]);
				}
				return e;
			}), ud = H(function(e) {
				return e.push(n, Go), Mn(Od, n, e);
			});
			function dd(e, t) {
				return qn(e, U(t, 3), Gi);
			}
			function fd(e, t) {
				return qn(e, U(t, 3), Ki);
			}
			function pd(e, t) {
				return e == null ? e : Ui(e, U(t, 3), $);
			}
			function md(e, t) {
				return e == null ? e : Wi(e, U(t, 3), $);
			}
			function hd(e, t) {
				return e && Gi(e, U(t, 3));
			}
			function gd(e, t) {
				return e && Ki(e, U(t, 3));
			}
			function _d(e) {
				return e == null ? [] : qi(e, Q(e));
			}
			function vd(e) {
				return e == null ? [] : qi(e, $(e));
			}
			function yd(e, t, r) {
				var i = e == null ? n : Ji(e, t);
				return i === n ? r : i;
			}
			function bd(e, t) {
				return e != null && us(e, t, Zi);
			}
			function xd(e, t) {
				return e != null && us(e, t, Qi);
			}
			var Sd = Mo(function(e, t, n) {
				t != null && typeof t.toString != "function" && (t = Rt.call(t)), e[t] = n;
			}, Of(Mf)), Cd = Mo(function(e, t, n) {
				t != null && typeof t.toString != "function" && (t = Rt.call(t)), A.call(e, t) ? e[t].push(n) : e[t] = [n];
			}, U), wd = H(na);
			function Q(e) {
				return vu(e) ? yi(e) : ha(e);
			}
			function $(e) {
				return vu(e) ? yi(e, !0) : ga(e);
			}
			function Td(e, t) {
				var n = {};
				return t = U(t, 3), Gi(e, function(e, r, i) {
					ki(n, t(e, r, i), e);
				}), n;
			}
			function Ed(e, t) {
				var n = {};
				return t = U(t, 3), Gi(e, function(e, r, i) {
					ki(n, r, t(e, r, i));
				}), n;
			}
			var Dd = xo(function(e, t, n) {
				xa(e, t, n);
			}), Od = xo(function(e, t, n, r) {
				xa(e, t, n, r);
			}), kd = Xo(function(e, t) {
				var n = {};
				if (e == null) return n;
				var r = !1;
				t = L(t, function(t) {
					return t = to(t, e), r ||= t.length > 1, t;
				}), _o(e, Qo(e), n), r && (n = Mi(n, f | p | m, Ko));
				for (var i = t.length; i--;) qa(n, t[i]);
				return n;
			});
			function Ad(e, t) {
				return Md(e, Xl(U(t)));
			}
			var jd = Xo(function(e, t) {
				return e == null ? {} : Ta(e, t);
			});
			function Md(e, t) {
				if (e == null) return {};
				var n = L(Qo(e), function(e) {
					return [e];
				});
				return t = U(t), Ea(e, n, function(e, n) {
					return t(e, n[0]);
				});
			}
			function Nd(e, t, r) {
				t = to(t, e);
				var i = -1, a = t.length;
				for (a || (a = 1, e = n); ++i < a;) {
					var o = e == null ? n : e[Bs(t[i])];
					o === n && (i = a, o = r), e = Ou(o) ? o.call(e) : o;
				}
				return e;
			}
			function Pd(e, t, n) {
				return e == null ? e : Fa(e, t, n);
			}
			function Fd(e, t, r, i) {
				return i = typeof i == "function" ? i : n, e == null ? e : Fa(e, t, r, i);
			}
			var Id = Ho(Q), Ld = Ho($);
			function Rd(e, t, n) {
				var r = K(e), i = r || bu(e) || Gu(e);
				if (t = U(t, 4), n == null) {
					var a = e && e.constructor;
					n = i ? r ? new a() : [] : J(e) && Ou(a) ? Br(Kt(e)) : {};
				}
				return (i ? Pn : Gi)(e, function(e, r, i) {
					return t(n, e, r, i);
				}), n;
			}
			function zd(e, t) {
				return e == null ? !0 : qa(e, t);
			}
			function Bd(e, t, n) {
				return e == null ? e : Ja(e, t, eo(n));
			}
			function Vd(e, t, r, i) {
				return i = typeof i == "function" ? i : n, e == null ? e : Ja(e, t, eo(r), i);
			}
			function Hd(e) {
				return e == null ? [] : cr(e, Q(e));
			}
			function Ud(e) {
				return e == null ? [] : cr(e, $(e));
			}
			function Wd(e, t, r) {
				return r === n && (r = t, t = n), r !== n && (r = ed(r), r = r === r ? r : 0), t !== n && (t = ed(t), t = t === t ? t : 0), ji(ed(e), t, r);
			}
			function Gd(e, t, r) {
				return t = Qu(t), r === n ? (r = t, t = 0) : r = Qu(r), e = ed(e), $i(e, t, r);
			}
			function Kd(e, t, r) {
				if (r && typeof r != "boolean" && G(e, t, r) && (t = r = n), r === n && (typeof t == "boolean" ? (r = t, t = n) : typeof e == "boolean" && (r = e, e = n)), e === n && t === n ? (e = 0, t = 1) : (e = Qu(e), t === n ? (t = e, e = 0) : t = Qu(t)), e > t) {
					var i = e;
					e = t, t = i;
				}
				if (r || e % 1 || t % 1) {
					var a = _n();
					return P(e + a * (t - e + vn("1e-" + ((a + "").length - 1))), t);
				}
				return Aa(e, t);
			}
			var qd = Eo(function(e, t, n) {
				return t = t.toLowerCase(), e + (n ? Jd(t) : t);
			});
			function Jd(e) {
				return Sf(Z(e).toLowerCase());
			}
			function Yd(e) {
				return e = Z(e), e && e.replace(St, pr).replace(ln, "");
			}
			function Xd(e, t, r) {
				e = Z(e), t = Ga(t);
				var i = e.length;
				r = r === n ? i : ji(X(r), 0, i);
				var a = r;
				return r -= t.length, r >= 0 && e.slice(r, a) == t;
			}
			function Zd(e) {
				return e = Z(e), e && $e.test(e) ? e.replace(Ze, mr) : e;
			}
			function Qd(e) {
				return e = Z(e), e && st.test(e) ? e.replace(ot, "\\$&") : e;
			}
			var $d = Eo(function(e, t, n) {
				return e + (n ? "-" : "") + t.toLowerCase();
			}), ef = Eo(function(e, t, n) {
				return e + (n ? " " : "") + t.toLowerCase();
			}), tf = To("toLowerCase");
			function nf(e, t, n) {
				e = Z(e), t = X(t);
				var r = t ? Dr(e) : 0;
				if (!t || r >= t) return e;
				var i = (t - r) / 2;
				return Fo(an(i), n) + e + Fo(rn(i), n);
			}
			function rf(e, t, n) {
				e = Z(e), t = X(t);
				var r = t ? Dr(e) : 0;
				return t && r < t ? e + Fo(t - r, n) : e;
			}
			function af(e, t, n) {
				e = Z(e), t = X(t);
				var r = t ? Dr(e) : 0;
				return t && r < t ? Fo(t - r, n) + e : e;
			}
			function of(e, t, n) {
				return n || t == null ? t = 0 : t &&= +t, gn(Z(e).replace(ct, ""), t || 0);
			}
			function sf(e, t, r) {
				return t = (r ? G(e, t, r) : t === n) ? 1 : X(t), Ma(Z(e), t);
			}
			function cf() {
				var e = arguments, t = Z(e[0]);
				return e.length < 3 ? t : t.replace(e[1], e[2]);
			}
			var lf = Eo(function(e, t, n) {
				return e + (n ? "_" : "") + t.toLowerCase();
			});
			function uf(e, t, r) {
				return r && typeof r != "number" && G(e, t, r) && (t = r = n), r = r === n ? D : r >>> 0, r ? (e = Z(e), e && (typeof t == "string" || t != null && !Bu(t)) && (t = Ga(t), !t && _r(e)) ? ro(Or(e), 0, r) : e.split(t, r)) : [];
			}
			var df = Eo(function(e, t, n) {
				return e + (n ? " " : "") + Sf(t);
			});
			function ff(e, t, n) {
				return e = Z(e), n = n == null ? 0 : ji(X(n), 0, e.length), t = Ga(t), e.slice(n, n + t.length) == t;
			}
			function pf(e, t, r) {
				var i = R.templateSettings;
				r && G(e, t, r) && (t = n), e = Z(e), t = od({}, t, i, Wo);
				var a = od({}, t.imports, i.imports, Wo), o = Q(a), l = cr(a, o);
				Pn(o, function(e) {
					if (pt.test(e)) throw new Tt(c);
				});
				var u, d, f = 0, p = t.interpolate || Ct, m = "__p += '", h = Ot((t.escape || Ct).source + "|" + p.source + "|" + (p === nt ? ht : Ct).source + "|" + (t.evaluate || Ct).source + "|$", "g"), g = "//# sourceURL=" + (A.call(t, "sourceURL") ? (t.sourceURL + "").replace(/\s/g, " ") : "lodash.templateSources[" + ++mn + "]") + "\n";
				e.replace(h, function(t, n, r, i, a, o) {
					return r ||= i, m += e.slice(f, o).replace(wt, hr), n && (u = !0, m += "' +\n__e(" + n + ") +\n'"), a && (d = !0, m += "';\n" + a + ";\n__p += '"), r && (m += "' +\n((__t = (" + r + ")) == null ? '' : __t) +\n'"), f = o + t.length, t;
				}), m += "';\n";
				var _ = A.call(t, "variable") && t.variable;
				if (!_) m = "with (obj) {\n" + m + "\n}\n";
				else if (pt.test(_)) throw new Tt(s);
				m = (d ? m.replace(qe, "") : m).replace(Je, "$1").replace(Ye, "$1;"), m = "function(" + (_ || "obj") + ") {\n" + (_ ? "" : "obj || (obj = {});\n") + "var __t, __p = ''" + (u ? ", __e = _.escape" : "") + (d ? ", __j = Array.prototype.join;\nfunction print() { __p += __j.call(arguments, '') }\n" : ";\n") + m + "return __p\n}";
				var v = wf(function() {
					return Et(o, g + "return " + m).apply(n, l);
				});
				if (v.source = m, Eu(v)) throw v;
				return v;
			}
			function mf(e) {
				return Z(e).toLowerCase();
			}
			function hf(e) {
				return Z(e).toUpperCase();
			}
			function gf(e, t, r) {
				if (e = Z(e), e && (r || t === n)) return or(e);
				if (!e || !(t = Ga(t))) return e;
				var i = Or(e), a = Or(t);
				return ro(i, ur(i, a), dr(i, a) + 1).join("");
			}
			function _f(e, t, r) {
				if (e = Z(e), e && (r || t === n)) return e.slice(0, kr(e) + 1);
				if (!e || !(t = Ga(t))) return e;
				var i = Or(e);
				return ro(i, 0, dr(i, Or(t)) + 1).join("");
			}
			function vf(e, t, r) {
				if (e = Z(e), e && (r || t === n)) return e.replace(ct, "");
				if (!e || !(t = Ga(t))) return e;
				var i = Or(e);
				return ro(i, ur(i, Or(t))).join("");
			}
			function yf(e, t) {
				var r = te, i = ne;
				if (J(t)) {
					var a = "separator" in t ? t.separator : a;
					r = "length" in t ? X(t.length) : r, i = "omission" in t ? Ga(t.omission) : i;
				}
				e = Z(e);
				var o = e.length;
				if (_r(e)) {
					var s = Or(e);
					o = s.length;
				}
				if (r >= o) return e;
				var c = r - Dr(i);
				if (c < 1) return i;
				var l = s ? ro(s, 0, c).join("") : e.slice(0, c);
				if (a === n) return l + i;
				if (s && (c += l.length - c), Bu(a)) {
					if (e.slice(c).search(a)) {
						var u, d = l;
						for (a.global || (a = Ot(a.source, Z(gt.exec(a)) + "g")), a.lastIndex = 0; u = a.exec(d);) var f = u.index;
						l = l.slice(0, f === n ? c : f);
					}
				} else if (e.indexOf(Ga(a), c) != c) {
					var p = l.lastIndexOf(a);
					p > -1 && (l = l.slice(0, p));
				}
				return l + i;
			}
			function bf(e) {
				return e = Z(e), e && Qe.test(e) ? e.replace(Xe, Ar) : e;
			}
			var xf = Eo(function(e, t, n) {
				return e + (n ? " " : "") + t.toUpperCase();
			}), Sf = To("toUpperCase");
			function Cf(e, t, r) {
				return e = Z(e), t = r ? n : t, t === n ? vr(e) ? Nr(e) : Kn(e) : e.match(t) || [];
			}
			var wf = H(function(e, t) {
				try {
					return Mn(e, n, t);
				} catch (e) {
					return Eu(e) ? e : new Tt(e);
				}
			}), Tf = Xo(function(e, t) {
				return Pn(t, function(t) {
					t = Bs(t), ki(e, t, Vl(e[t], e));
				}), e;
			});
			function Ef(e) {
				var t = e == null ? 0 : e.length, n = U();
				return e = t ? L(e, function(e) {
					if (typeof e[1] != "function") throw new At(o);
					return [n(e[0]), e[1]];
				}) : [], H(function(n) {
					for (var r = -1; ++r < t;) {
						var i = e[r];
						if (Mn(i[0], this, n)) return Mn(i[1], this, n);
					}
				});
			}
			function Df(e) {
				return Ni(Mi(e, f));
			}
			function Of(e) {
				return function() {
					return e;
				};
			}
			function kf(e, t) {
				return e == null || e !== e ? t : e;
			}
			var Af = Ao(), jf = Ao(!0);
			function Mf(e) {
				return e;
			}
			function Nf(e) {
				return ma(typeof e == "function" ? e : Mi(e, f));
			}
			function Pf(e) {
				return ya(Mi(e, f));
			}
			function Ff(e, t) {
				return ba(e, Mi(t, f));
			}
			var If = H(function(e, t) {
				return function(n) {
					return na(n, e, t);
				};
			}), Lf = H(function(e, t) {
				return function(n) {
					return na(e, n, t);
				};
			});
			function Rf(e, t, n) {
				var r = Q(t), i = qi(t, r);
				n == null && !(J(t) && (i.length || !r.length)) && (n = t, t = e, e = this, i = qi(t, Q(t)));
				var a = !(J(n) && "chain" in n) || !!n.chain, o = Ou(e);
				return Pn(i, function(n) {
					var r = t[n];
					e[n] = r, o && (e.prototype[n] = function() {
						var t = this.__chain__;
						if (a || t) {
							var n = e(this.__wrapped__);
							return (n.__actions__ = go(this.__actions__)).push({
								func: r,
								args: arguments,
								thisArg: e
							}), n.__chain__ = t, n;
						}
						return r.apply(e, Bn([this.value()], arguments));
					});
				}), e;
			}
			function zf() {
				return F._ === this && (F._ = Bt), this;
			}
			function Bf() {}
			function Vf(e) {
				return e = X(e), H(function(t) {
					return Ca(t, e);
				});
			}
			var Hf = Po(L), Uf = Po(In), Wf = Po(Un);
			function Gf(e) {
				return _s(e) ? $n(Bs(e)) : Da(e);
			}
			function Kf(e) {
				return function(t) {
					return e == null ? n : Ji(e, t);
				};
			}
			var qf = Lo(), Jf = Lo(!0);
			function Yf() {
				return [];
			}
			function Xf() {
				return !1;
			}
			function Zf() {
				return {};
			}
			function Qf() {
				return "";
			}
			function $f() {
				return !0;
			}
			function ep(e, t) {
				if (e = X(e), e < 1 || e > le) return [];
				var n = D, r = P(e, D);
				t = U(t), e -= D;
				for (var i = ir(r, t); ++n < e;) t(n);
				return i;
			}
			function tp(e) {
				return K(e) ? L(e, Bs) : Wu(e) ? [e] : go(zs(Z(e)));
			}
			function np(e) {
				var t = ++It;
				return Z(e) + t;
			}
			var rp = No(function(e, t) {
				return e + t;
			}, 0), ip = Bo("ceil"), ap = No(function(e, t) {
				return e / t;
			}, 1), op = Bo("floor");
			function sp(e) {
				return e && e.length ? Bi(e, Mf, Xi) : n;
			}
			function cp(e, t) {
				return e && e.length ? Bi(e, U(t, 2), Xi) : n;
			}
			function lp(e) {
				return Qn(e, Mf);
			}
			function up(e, t) {
				return Qn(e, U(t, 2));
			}
			function dp(e) {
				return e && e.length ? Bi(e, Mf, _a) : n;
			}
			function fp(e, t) {
				return e && e.length ? Bi(e, U(t, 2), _a) : n;
			}
			var pp = No(function(e, t) {
				return e * t;
			}, 1), mp = Bo("round"), hp = No(function(e, t) {
				return e - t;
			}, 0);
			function gp(e) {
				return e && e.length ? rr(e, Mf) : 0;
			}
			function _p(e, t) {
				return e && e.length ? rr(e, U(t, 2)) : 0;
			}
			return R.after = Rl, R.ary = zl, R.assign = rd, R.assignIn = id, R.assignInWith = ad, R.assignWith = od, R.at = sd, R.before = Bl, R.bind = Vl, R.bindAll = Tf, R.bindKey = Hl, R.castArray = su, R.chain = el, R.chunk = Ws, R.compact = Gs, R.concat = Ks, R.cond = Ef, R.conforms = Df, R.constant = Of, R.countBy = dl, R.create = cd, R.curry = Ul, R.curryRight = Wl, R.debounce = Gl, R.defaults = ld, R.defaultsDeep = ud, R.defer = Kl, R.delay = ql, R.difference = qs, R.differenceBy = Js, R.differenceWith = Ys, R.drop = Xs, R.dropRight = Zs, R.dropRightWhile = Qs, R.dropWhile = $s, R.fill = ec, R.filter = pl, R.flatMap = gl, R.flatMapDeep = _l, R.flatMapDepth = vl, R.flatten = rc, R.flattenDeep = ic, R.flattenDepth = ac, R.flip = Jl, R.flow = Af, R.flowRight = jf, R.fromPairs = oc, R.functions = _d, R.functionsIn = vd, R.groupBy = xl, R.initial = lc, R.intersection = uc, R.intersectionBy = dc, R.intersectionWith = fc, R.invert = Sd, R.invertBy = Cd, R.invokeMap = Cl, R.iteratee = Nf, R.keyBy = wl, R.keys = Q, R.keysIn = $, R.map = Tl, R.mapKeys = Td, R.mapValues = Ed, R.matches = Pf, R.matchesProperty = Ff, R.memoize = Yl, R.merge = Dd, R.mergeWith = Od, R.method = If, R.methodOf = Lf, R.mixin = Rf, R.negate = Xl, R.nthArg = Vf, R.omit = kd, R.omitBy = Ad, R.once = Zl, R.orderBy = El, R.over = Hf, R.overArgs = Ql, R.overEvery = Uf, R.overSome = Wf, R.partial = $l, R.partialRight = eu, R.partition = Dl, R.pick = jd, R.pickBy = Md, R.property = Gf, R.propertyOf = Kf, R.pull = _c, R.pullAll = vc, R.pullAllBy = yc, R.pullAllWith = bc, R.pullAt = xc, R.range = qf, R.rangeRight = Jf, R.rearg = tu, R.reject = Al, R.remove = Sc, R.rest = nu, R.reverse = Cc, R.sampleSize = Ml, R.set = Pd, R.setWith = Fd, R.shuffle = Nl, R.slice = wc, R.sortBy = Il, R.sortedUniq = jc, R.sortedUniqBy = Mc, R.split = uf, R.spread = ru, R.tail = Nc, R.take = Pc, R.takeRight = Fc, R.takeRightWhile = Ic, R.takeWhile = Lc, R.tap = tl, R.throttle = iu, R.thru = nl, R.toArray = Zu, R.toPairs = Id, R.toPairsIn = Ld, R.toPath = tp, R.toPlainObject = td, R.transform = Rd, R.unary = au, R.union = Rc, R.unionBy = zc, R.unionWith = Bc, R.uniq = Vc, R.uniqBy = Hc, R.uniqWith = Uc, R.unset = zd, R.unzip = Wc, R.unzipWith = Gc, R.update = Bd, R.updateWith = Vd, R.values = Hd, R.valuesIn = Ud, R.without = Kc, R.words = Cf, R.wrap = ou, R.xor = qc, R.xorBy = Jc, R.xorWith = Yc, R.zip = Xc, R.zipObject = Zc, R.zipObjectDeep = Qc, R.zipWith = $c, R.entries = Id, R.entriesIn = Ld, R.extend = id, R.extendWith = ad, Rf(R, R), R.add = rp, R.attempt = wf, R.camelCase = qd, R.capitalize = Jd, R.ceil = ip, R.clamp = Wd, R.clone = cu, R.cloneDeep = uu, R.cloneDeepWith = du, R.cloneWith = lu, R.conformsTo = fu, R.deburr = Yd, R.defaultTo = kf, R.divide = ap, R.endsWith = Xd, R.eq = pu, R.escape = Zd, R.escapeRegExp = Qd, R.every = fl, R.find = ml, R.findIndex = tc, R.findKey = dd, R.findLast = hl, R.findLastIndex = nc, R.findLastKey = fd, R.floor = op, R.forEach = yl, R.forEachRight = bl, R.forIn = pd, R.forInRight = md, R.forOwn = hd, R.forOwnRight = gd, R.get = yd, R.gt = mu, R.gte = hu, R.has = bd, R.hasIn = xd, R.head = sc, R.identity = Mf, R.includes = Sl, R.indexOf = cc, R.inRange = Gd, R.invoke = wd, R.isArguments = gu, R.isArray = K, R.isArrayBuffer = _u, R.isArrayLike = vu, R.isArrayLikeObject = q, R.isBoolean = yu, R.isBuffer = bu, R.isDate = xu, R.isElement = Su, R.isEmpty = Cu, R.isEqual = wu, R.isEqualWith = Tu, R.isError = Eu, R.isFinite = Du, R.isFunction = Ou, R.isInteger = ku, R.isLength = Au, R.isMap = ju, R.isMatch = Mu, R.isMatchWith = Nu, R.isNaN = Pu, R.isNative = Fu, R.isNil = Lu, R.isNull = Iu, R.isNumber = Ru, R.isObject = J, R.isObjectLike = Y, R.isPlainObject = zu, R.isRegExp = Bu, R.isSafeInteger = Vu, R.isSet = Hu, R.isString = Uu, R.isSymbol = Wu, R.isTypedArray = Gu, R.isUndefined = Ku, R.isWeakMap = qu, R.isWeakSet = Ju, R.join = pc, R.kebabCase = $d, R.last = mc, R.lastIndexOf = hc, R.lowerCase = ef, R.lowerFirst = tf, R.lt = Yu, R.lte = Xu, R.max = sp, R.maxBy = cp, R.mean = lp, R.meanBy = up, R.min = dp, R.minBy = fp, R.stubArray = Yf, R.stubFalse = Xf, R.stubObject = Zf, R.stubString = Qf, R.stubTrue = $f, R.multiply = pp, R.nth = gc, R.noConflict = zf, R.noop = Bf, R.now = Ll, R.pad = nf, R.padEnd = rf, R.padStart = af, R.parseInt = of, R.random = Kd, R.reduce = Ol, R.reduceRight = kl, R.repeat = sf, R.replace = cf, R.result = Nd, R.round = mp, R.runInContext = e, R.sample = jl, R.size = Pl, R.snakeCase = lf, R.some = Fl, R.sortedIndex = Tc, R.sortedIndexBy = Ec, R.sortedIndexOf = Dc, R.sortedLastIndex = Oc, R.sortedLastIndexBy = kc, R.sortedLastIndexOf = Ac, R.startCase = df, R.startsWith = ff, R.subtract = hp, R.sum = gp, R.sumBy = _p, R.template = pf, R.times = ep, R.toFinite = Qu, R.toInteger = X, R.toLength = $u, R.toLower = mf, R.toNumber = ed, R.toSafeInteger = nd, R.toString = Z, R.toUpper = hf, R.trim = gf, R.trimEnd = _f, R.trimStart = vf, R.truncate = yf, R.unescape = bf, R.uniqueId = np, R.upperCase = xf, R.upperFirst = Sf, R.each = yl, R.eachRight = bl, R.first = sc, Rf(R, function() {
				var e = {};
				return Gi(R, function(t, n) {
					A.call(R.prototype, n) || (e[n] = t);
				}), e;
			}(), { chain: !1 }), R.VERSION = r, Pn([
				"bind",
				"bindKey",
				"curry",
				"curryRight",
				"partial",
				"partialRight"
			], function(e) {
				R[e].placeholder = R;
			}), Pn(["drop", "take"], function(e, t) {
				z.prototype[e] = function(r) {
					r = r === n ? 1 : j(X(r), 0);
					var i = this.__filtered__ && !t ? new z(this) : this.clone();
					return i.__filtered__ ? i.__takeCount__ = P(r, i.__takeCount__) : i.__views__.push({
						size: P(r, D),
						type: e + (i.__dir__ < 0 ? "Right" : "")
					}), i;
				}, z.prototype[e + "Right"] = function(t) {
					return this.reverse()[e](t).reverse();
				};
			}), Pn([
				"filter",
				"map",
				"takeWhile"
			], function(e, t) {
				var n = t + 1, r = n == ae || n == se;
				z.prototype[e] = function(e) {
					var t = this.clone();
					return t.__iteratees__.push({
						iteratee: U(e, 3),
						type: n
					}), t.__filtered__ = t.__filtered__ || r, t;
				};
			}), Pn(["head", "last"], function(e, t) {
				var n = "take" + (t ? "Right" : "");
				z.prototype[e] = function() {
					return this[n](1).value()[0];
				};
			}), Pn(["initial", "tail"], function(e, t) {
				var n = "drop" + (t ? "" : "Right");
				z.prototype[e] = function() {
					return this.__filtered__ ? new z(this) : this[n](1);
				};
			}), z.prototype.compact = function() {
				return this.filter(Mf);
			}, z.prototype.find = function(e) {
				return this.filter(e).head();
			}, z.prototype.findLast = function(e) {
				return this.reverse().find(e);
			}, z.prototype.invokeMap = H(function(e, t) {
				return typeof e == "function" ? new z(this) : this.map(function(n) {
					return na(n, e, t);
				});
			}), z.prototype.reject = function(e) {
				return this.filter(Xl(U(e)));
			}, z.prototype.slice = function(e, t) {
				e = X(e);
				var r = this;
				return r.__filtered__ && (e > 0 || t < 0) ? new z(r) : (e < 0 ? r = r.takeRight(-e) : e && (r = r.drop(e)), t !== n && (t = X(t), r = t < 0 ? r.dropRight(-t) : r.take(t - e)), r);
			}, z.prototype.takeRightWhile = function(e) {
				return this.reverse().takeWhile(e).reverse();
			}, z.prototype.toArray = function() {
				return this.take(D);
			}, Gi(z.prototype, function(e, t) {
				var r = /^(?:filter|find|map|reject)|While$/.test(t), i = /^(?:head|last)$/.test(t), a = R[i ? "take" + (t == "last" ? "Right" : "") : t], o = i || /^find/.test(t);
				a && (R.prototype[t] = function() {
					var t = this.__wrapped__, s = i ? [1] : arguments, c = t instanceof z, l = s[0], u = c || K(t), d = function(e) {
						var t = a.apply(R, Bn([e], s));
						return i && f ? t[0] : t;
					};
					u && r && typeof l == "function" && l.length != 1 && (c = u = !1);
					var f = this.__chain__, p = !!this.__actions__.length, m = o && !f, h = c && !p;
					if (!o && u) {
						t = h ? t : new z(this);
						var g = e.apply(t, s);
						return g.__actions__.push({
							func: nl,
							args: [d],
							thisArg: n
						}), new Hr(g, f);
					}
					return m && h ? e.apply(this, s) : (g = this.thru(d), m ? i ? g.value()[0] : g.value() : g);
				});
			}), Pn([
				"pop",
				"push",
				"shift",
				"sort",
				"splice",
				"unshift"
			], function(e) {
				var t = jt[e], n = /^(?:push|sort|unshift)$/.test(e) ? "tap" : "thru", r = /^(?:pop|shift)$/.test(e);
				R.prototype[e] = function() {
					var e = arguments;
					if (r && !this.__chain__) {
						var i = this.value();
						return t.apply(K(i) ? i : [], e);
					}
					return this[n](function(n) {
						return t.apply(K(n) ? n : [], e);
					});
				};
			}), Gi(z.prototype, function(e, t) {
				var n = R[t];
				if (n) {
					var r = n.name + "";
					A.call(er, r) || (er[r] = []), er[r].push({
						name: t,
						func: n
					});
				}
			}), er[jo(n, v).name] = [{
				name: "wrapper",
				func: n
			}], z.prototype.clone = Ur, z.prototype.reverse = Wr, z.prototype.value = Gr, R.prototype.at = rl, R.prototype.chain = il, R.prototype.commit = al, R.prototype.next = ol, R.prototype.plant = cl, R.prototype.reverse = ll, R.prototype.toJSON = R.prototype.valueOf = R.prototype.value = ul, R.prototype.first = R.prototype.head, Zt && (R.prototype[Zt] = sl), R;
		})();
		typeof define == "function" && typeof define.amd == "object" && define.amd ? (F._ = Pr, define(function() {
			return Pr;
		})) : Cn ? ((Cn.exports = Pr)._ = Pr, Sn._ = Pr) : F._ = Pr;
	}).call(e);
})))();
function S(e, t, n) {
	let r = e.createShader(t);
	if (!r) throw Error(`Could not create shader of type ${t}`);
	if (e.shaderSource(r, n), e.compileShader(r), !e.getShaderParameter(r, e.COMPILE_STATUS)) throw e.deleteShader(r), console.log(e.getShaderInfoLog(r)), Error(`createShader: Error creating shader of type ${t}`);
	return r;
}
function C(e, t, n) {
	let r = e.createProgram();
	if (e.attachShader(r, t), e.attachShader(r, n), e.linkProgram(r), !e.getProgramParameter(r, e.LINK_STATUS)) throw e.deleteProgram(r), console.log(e.getProgramInfoLog(r)), Error("createProgram: Error trying to create program");
	return r;
}
//#endregion
//#region node_modules/arraybuffer-encoding/dist/esm/base64/encoding.js
var w = class {
	constructor(e, t) {
		if (!e || e.length != 64) throw Error("Charset must contain 64 characters");
		this._charset = e, this._noPadding = !!t, this._valid = RegExp("^[" + this._charset.replace("-", "\\-") + "]+={0,2}$");
	}
	Encode(e) {
		let t = e.byteLength;
		if (!t) return "";
		let n = new Uint8Array(e), r = "";
		for (let e = 0; e < t; e += 3) r += this._charset[n[e] >> 2] + this._charset[(n[e] & 3) << 4 | n[e + 1] >> 4] + this._charset[(n[e + 1] & 15) << 2 | n[e + 2] >> 6] + this._charset[n[e + 2] & 63];
		return t % 3 == 2 ? (r = r.substring(0, r.length - 1), this._noPadding || (r += "=")) : t % 3 == 1 && (r = r.substring(0, r.length - 2), this._noPadding || (r += "==")), r;
	}
	Decode(e) {
		if (e = (e || "").replace(/[\s]/g, ""), !e) return /* @__PURE__ */ new ArrayBuffer(0);
		if (!this._valid.test(e)) throw Error("Invalid base64 input sequence");
		let t = Math.floor(e.length * .75);
		e[e.length - 2] == "=" ? t -= 2 : e[e.length - 1] == "=" && t--;
		let n = new Uint8Array(t), r, i, a, o, s = 0, c = 0;
		for (; s < e.length * .75;) r = this._charset.indexOf(e.charAt(c++)), i = this._charset.indexOf(e.charAt(c++)), a = this._charset.indexOf(e.charAt(c++)), o = this._charset.indexOf(e.charAt(c++)), n[s++] = r << 2 | i >> 4, n[s++] = (i & 15) << 4 | a >> 2, n[s++] = (a & 3) << 6 | o;
		return n.buffer;
	}
}, T = new w("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
function ee(e) {
	return T.Encode(e);
}
function te(e) {
	return T.Decode(e);
}
new w("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_", !0);
//#endregion
//#region src/utils/general.ts
function ne(e) {
	let t = e.replace(/#/, "").toLocaleLowerCase().padEnd(8, "f"), n = parseInt(t.substring(0, 2), 16), r = parseInt(t.substring(2, 4), 16), i = parseInt(t.substring(4, 6), 16), a = parseInt(t.substring(6, 8), 16);
	return new Uint8Array([
		n,
		r,
		i,
		a
	]);
}
function re(e) {
	return e.charAt(0) === ";" ? [";", ...e.slice(2).split(";")] : e.split(";");
}
//#endregion
//#region src/utils/debug.ts
var ie = /* @__PURE__ */ new Set();
function ae(e, t) {
	ie.has(t) || (ie.add(t), console[e](t));
}
//#endregion
//#region src/classes/Phoxelis.ts
var oe = 255, se = "// Vertex Shader\nattribute vec4 a_position;\nvarying vec2 v_position;\n\nvoid main() {\n  v_position = a_position.xy;\n  gl_Position = a_position;\n}\n", ce = "// Fragment Shader\nprecision highp float;\nvarying vec2 v_position;\nuniform sampler2D u_paletteTexture;\nuniform sampler2D u_phoxelLayerTexture;\nuniform vec2 u_canvasSize;\nuniform vec2 u_fontSize;\nuniform float u_paletteSize;\nuniform float u_layerOpacity;\n\nvoid main() {\n  vec2 unPos = (v_position + 1.0) / 2.0;\n  vec2 mirroredPos = vec2(unPos.x, 1.0 - unPos.y);\n  vec2 gridSize = u_canvasSize / u_fontSize;\n\n  vec4 phoxId = texture2D(u_phoxelLayerTexture, mirroredPos);\n  vec2 phoxelPixelPos = fract(mirroredPos * gridSize);\n  float regisPhoxelHeightPos = ((phoxId.r * u_paletteSize) + phoxelPixelPos.y) / u_paletteSize;\n  vec2 uv = vec2(phoxelPixelPos.x, regisPhoxelHeightPos);\n\n  vec4 color = texture2D(u_paletteTexture, uv);\n  gl_FragColor = vec4(color.r * u_layerOpacity, color.g * u_layerOpacity, color.b * u_layerOpacity, color.a * u_layerOpacity);\n}\n";
function le(e, t, n, r = {}) {
	let { createBaseLayer: i, renderPalette: a, paletteDirection: o } = {
		createBaseLayer: !0,
		renderPalette: !1,
		paletteDirection: "left",
		...r
	}, s = n.width * (oe - 1), c = document.createElement("canvas"), l = c.getContext("2d");
	c.width = n.width * t, c.height = n.height * e;
	let u = [], d = {};
	function f(n = crypto.randomUUID()) {
		if (u.find((e) => e.id === n)) return console.error(`addLayer error: Layer with ID ${n} already exists. Skipping creation.`), n;
		let r = u.push({
			id: n,
			buffer: new Uint8Array(e * t).fill(0)
		}) - 1;
		return d[n] = r, n;
	}
	i && f();
	function p(e) {
		return u[d[e]];
	}
	function m() {
		d = {}, u.forEach((e, t) => d[e.id] = t);
	}
	function h(e, t) {
		let n = d[e];
		if (n === -1) {
			console.error(`moveLayer error: Could not find layer by id ${e}`);
			return;
		}
		if (u.length < t + 1) {
			console.error(`moveLayer error: Cannot move to index ${t}. Layers.length too short.}`);
			return;
		}
		let r = p(e);
		u.splice(n, 1), u.splice(t, 0, r), m();
	}
	function g(e) {
		let t = p(e);
		if (!t) {
			console.error(`removeLayer error: Could not find layer by id ${e}`);
			return;
		}
		t.buffer.forEach((e) => {
			e > 0 && b[e] && Ne(e);
		}), u.splice(d[e], 1), m();
	}
	let _ = document.createElement("canvas"), v = _.getContext("2d");
	_.width = s, _.height = n.height;
	let y = document.createElement("canvas");
	y.width = a ? Math.max(_.width, c.width) : c.width, y.height = c.height;
	let b = [null], x = {};
	function w() {
		let e = /* @__PURE__ */ new Set();
		e.add(0), u.forEach((t) => {
			t.buffer.forEach((t) => {
				e.add(t);
			});
		}), b.forEach((t, n) => {
			e.has(n) || ke(n);
		});
	}
	function T(e) {
		let t = b[e];
		if (t) {
			let [e, n, r] = re(t);
			return {
				char: e,
				fg: n,
				bg: r
			};
		}
		return null;
	}
	function ie(e, n, r) {
		let i = p(r);
		if (!i) return ae("warn", `getPhoxFromPosition error: Could not find layer by id ${r}`), null;
		let a = i.buffer[e * t + n];
		return T(a);
	}
	function le() {
		return {
			size: {
				rows: e,
				cols: t
			},
			palette: b,
			layers: u.map((e) => ({
				...e,
				buffer: ee(e.buffer.buffer)
			}))
		};
	}
	function ue(n) {
		(n.size.cols !== t || n.size.rows !== e) && console.warn("Imported Phoxelis and target Phoxelis have mismatching sizes. Unexpected behavior might occur.");
		let r = n.layers.map((e) => ({
			...e,
			buffer: new Uint8Array(te(e.buffer))
		})), i = n.palette.map((e) => typeof e == "string" ? re(e) : e);
		Fe(), r.forEach((e, t) => {
			f(e.id);
			for (let r = 0; r < n.size.rows; r++) for (let a = 0; a < n.size.cols; a++) {
				let o = e.buffer[r * n.size.cols + a];
				if (!i[o]) Me(r, a, u[t].id);
				else {
					let [e, n, s] = i[o];
					je(e, n, s, r, a, u[t].id);
				}
			}
		});
	}
	let E = y.getContext("webgl");
	if (!E || !l || !v) throw alert("WebGL/Canvas2d not supported"), Error("No WebGL or Canvas API");
	let D = C(E, S(E, E.VERTEX_SHADER, se), S(E, E.FRAGMENT_SHADER, ce)), de = E.getAttribLocation(D, "a_position"), fe = E.createBuffer();
	E.bindBuffer(E.ARRAY_BUFFER, fe);
	let pe = [
		-1,
		-1,
		-1,
		1,
		1,
		-1,
		1,
		-1,
		-1,
		1,
		1,
		1
	];
	E.bufferData(E.ARRAY_BUFFER, new Float32Array(pe), E.STATIC_DRAW);
	let me = E.getUniformLocation(D, "u_paletteTexture"), he = E.getUniformLocation(D, "u_phoxelLayerTexture"), ge = E.getUniformLocation(D, "u_canvasSize"), _e = E.getUniformLocation(D, "u_fontSize"), ve = E.getUniformLocation(D, "u_paletteSize"), ye = E.getUniformLocation(D, "u_layerOpacity"), be = n.height * oe, xe = new Uint8Array(n.width * be * 4).fill(0), Se = E.createTexture();
	E.bindTexture(E.TEXTURE_2D, Se), E.texImage2D(E.TEXTURE_2D, 0, E.RGBA, n.width, be, 0, E.RGBA, E.UNSIGNED_BYTE, xe), E.texParameteri(E.TEXTURE_2D, E.TEXTURE_MAG_FILTER, E.NEAREST), E.texParameteri(E.TEXTURE_2D, E.TEXTURE_MIN_FILTER, E.NEAREST), E.texParameteri(E.TEXTURE_2D, E.TEXTURE_WRAP_S, E.CLAMP_TO_EDGE), E.texParameteri(E.TEXTURE_2D, E.TEXTURE_WRAP_T, E.CLAMP_TO_EDGE);
	let Ce = new Uint8Array(e * t).fill(0), we = E.createTexture();
	E.bindTexture(E.TEXTURE_2D, we), E.pixelStorei(E.UNPACK_ALIGNMENT, 1), E.texImage2D(E.TEXTURE_2D, 0, E.LUMINANCE, t, e, 0, E.LUMINANCE, E.UNSIGNED_BYTE, Ce), E.texParameteri(E.TEXTURE_2D, E.TEXTURE_MAG_FILTER, E.NEAREST), E.texParameteri(E.TEXTURE_2D, E.TEXTURE_MIN_FILTER, E.NEAREST), E.texParameteri(E.TEXTURE_2D, E.TEXTURE_WRAP_S, E.CLAMP_TO_EDGE), E.texParameteri(E.TEXTURE_2D, E.TEXTURE_WRAP_T, E.CLAMP_TO_EDGE), E.pixelStorei(E.UNPACK_ALIGNMENT, 4);
	let Te = new Uint8Array(254).fill(0).map((e, t) => o === "right" ? t + 1 : 254 - t), Ee = E.createTexture();
	E.bindTexture(E.TEXTURE_2D, Ee), E.pixelStorei(E.UNPACK_ALIGNMENT, 1), E.texImage2D(E.TEXTURE_2D, 0, E.LUMINANCE, 254, 1, 0, E.LUMINANCE, E.UNSIGNED_BYTE, Te), E.texParameteri(E.TEXTURE_2D, E.TEXTURE_MAG_FILTER, E.NEAREST), E.texParameteri(E.TEXTURE_2D, E.TEXTURE_MIN_FILTER, E.NEAREST), E.texParameteri(E.TEXTURE_2D, E.TEXTURE_WRAP_S, E.CLAMP_TO_EDGE), E.texParameteri(E.TEXTURE_2D, E.TEXTURE_WRAP_T, E.CLAMP_TO_EDGE), E.pixelStorei(E.UNPACK_ALIGNMENT, 4);
	let De = (r = []) => {
		r.length > 0 && r.length !== u.length && ae("warn", "renderFrame warning: Length mismatch of layers and layerOptions. Unexpected behavior might occur."), E.enable(E.SCISSOR_TEST), y.getContext("2d")?.clearRect(0, 0, y.width, y.height), E.scissor(0, 0, y.width, y.height), E.clearColor(0, 0, 0, 0), E.clear(E.COLOR_BUFFER_BIT), l.clearRect(0, 0, c.width, c.height), E.viewport(0, 0, c.width, c.height), E.scissor(0, 0, c.width, c.height), E.useProgram(D), u.forEach((i, a) => {
			r[a]?.additionalTarget && r[a].additionalTarget.getContext("2d")?.clearRect(0, 0, r[a]?.additionalTarget.width, r[a]?.additionalTarget.height), E.enableVertexAttribArray(de);
			let o = E.FLOAT;
			E.vertexAttribPointer(de, 2, o, !1, 0, 0), E.uniform1i(me, 0), E.uniform1i(he, 1), E.uniform2f(ge, c.width, c.height), E.uniform2f(_e, n.width, n.height), E.uniform1f(ve, oe), E.uniform1f(ye, r[a]?.opacity ?? 1), E.activeTexture(E.TEXTURE0 + 0), E.bindTexture(E.TEXTURE_2D, Se), E.activeTexture(E.TEXTURE0 + 1), E.bindTexture(E.TEXTURE_2D, we), E.texSubImage2D(E.TEXTURE_2D, 0, 0, 0, t, e, E.LUMINANCE, E.UNSIGNED_BYTE, i.buffer), E.drawArrays(E.TRIANGLES, 0, pe.length / 2), r[a]?.additionalTarget && r[a].additionalTarget.getContext("2d")?.drawImage(y, 0, 0), l.drawImage(y, 0, 0);
		}), a && (E.viewport(0, 0, _.width, _.height), E.scissor(0, 0, _.width, _.height), E.clearColor(0, 0, 0, 0), E.clear(E.COLOR_BUFFER_BIT), E.uniform2f(ge, _.width, _.height), E.uniform1i(he, 2), E.uniform1f(ye, 1), E.activeTexture(E.TEXTURE0 + 2), E.bindTexture(E.TEXTURE_2D, Ee), E.drawArrays(E.TRIANGLES, 0, pe.length / 2), v.clearRect(0, 0, _.width, _.height), v.drawImage(y, 0, y.height - n.height, _.width, _.height, 0, 0, _.width, _.height));
	}, Oe = (e, t) => {
		let { char: r, fg: i, bg: a } = t, o = `${r};${i.toLocaleLowerCase()};${a.toLocaleLowerCase()}`, s = ne(i), c = ne(a), l = r.charCodeAt(0), u = n.characters[l];
		if (!u) {
			ae("warn", `render: no shape found for charcode ${l} (${r})`);
			return;
		}
		let d = new Uint8Array(u.length * u[0].length * 4);
		for (let e = 0; e < u.length; e++) for (let t = 0; t < u[0].length; t++) {
			let n = e * u[0].length * 4;
			d[n + t * 4] = u[e][t] ? s[0] : c[0], d[n + t * 4 + 1] = u[e][t] ? s[1] : c[1], d[n + t * 4 + 2] = u[e][t] ? s[2] : c[2], d[n + t * 4 + 3] = u[e][t] ? s[3] : c[3];
		}
		E.activeTexture(E.TEXTURE0 + 0), E.bindTexture(E.TEXTURE_2D, Se), E.texSubImage2D(E.TEXTURE_2D, 0, 0, e * n.height, n.width, n.height, E.RGBA, E.UNSIGNED_BYTE, d), b[e] = o;
	}, ke = (e) => {
		if (!b[e]) {
			console.log("No Phox to remove at index", e);
			return;
		}
		let t = new Uint8Array(n.height * n.width * 4).fill(0);
		E.activeTexture(E.TEXTURE0 + 0), E.bindTexture(E.TEXTURE_2D, Se), E.texSubImage2D(E.TEXTURE_2D, 0, 0, e * n.height, n.width, n.height, E.RGBA, E.UNSIGNED_BYTE, t), b[e] = null;
	};
	function Ae() {
		let e = b.indexOf(null, 1);
		return e === -1 ? b.length : e;
	}
	let je = (e, n, r, i, a, o) => {
		if (!o) if (u[0]) o = u[0].id;
		else {
			console.error("renderPhoxel error: Trying to remove phoxel, but there are no layers in phoxelis.");
			return;
		}
		let s = p(o);
		if (!s) {
			ae("error", `renderPhoxel error: Layer ${o} not found.`);
			return;
		}
		let c = s.buffer, l = `${e};${n.toLocaleLowerCase()};${r.toLocaleLowerCase()}`, d = b.indexOf(l);
		if (d === -1) {
			let t = Ae();
			if (t > 254) throw Error("Error adding Phox to Palette: 255 elements limit exceeded.");
			Oe(t, {
				char: e,
				fg: n,
				bg: r
			}), x[t] = 0, d = t;
		}
		let f = i * t + a;
		c[f] !== d && (Ne(c[f]), c[f] = d, x[d]++);
	}, Me = (e, n, r) => {
		if (!r) if (u[0]) r = u[0].id;
		else {
			console.error("removePhoxel error: Trying to remove phoxel, but there are no layers in phoxelis.");
			return;
		}
		let i = p(r);
		if (!i) {
			ae("error", `removePhoxel error: Layer ${r} not found.`);
			return;
		}
		let a = i.buffer, o = a[e * t + n];
		o === 0 || !b[o] || (a[e * t + n] = 0, Ne(o));
	};
	function Ne(e) {
		e !== 0 && (x[e]--, x[e] === 0 && (ke(e), delete x[e]));
	}
	let Pe = () => {
		E.activeTexture(E.TEXTURE0 + 0), E.bindTexture(E.TEXTURE_2D, Se), E.texSubImage2D(E.TEXTURE_2D, 0, 0, 0, n.width, be, E.RGBA, E.UNSIGNED_BYTE, new Uint8Array(n.width * be * 4));
	}, Fe = (e = !1) => {
		Pe();
		let t = () => {
			u.length = 0, Object.keys(d).forEach((e) => delete d[e]);
		};
		if (i && e) {
			let e = u[0]?.id;
			t(), f(e);
		} else t();
		b = [null], x = {};
	};
	return {
		renderFrame: De,
		renderPhoxel: je,
		removePhoxel: Me,
		canvas: c,
		reset: Fe,
		clearScreen: () => {
			u.forEach((e) => e.buffer.fill(0));
		},
		palette: _,
		exportPhoxelis: le,
		importPhoxelis: ue,
		getPhoxFromPaletteIndex: T,
		getPhoxFromPosition: ie,
		storePhoxInPalette: Oe,
		cleanUnusedPhoxesFromPalette: w,
		layers: u,
		addLayer: f,
		getLayer: p,
		moveLayer: h,
		removeLayer: g,
		layerPositions: d
	};
}
//#endregion
export { le as Phoxelis, x as getFont };
