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
		let f, p, m, h, g, _, v, y, b, x, S, C, w, ee, te, ne, re, ie, ae = s[i] ?? i, oe = ae.slice(0, 2), se = ae.slice(2, 4);
		oe in c && se in c ? (_ = c[oe], v = c[se]) : (_ = 1, v = 0), v === 0 || v === 2 ? f = 1 : (v === 1 || v === -1) && (f = 0), _ === 1 || _ === -1 ? p = 1 : (_ === 2 || _ === 0) && (p = 0), r === 1 && (y = _ > 0 ? this.headers.fbbx : this.headers.fbby, _ > 0 ? (C = "dwx0", w = "dwy0") : (C = "dwx1", w = "dwy1"), S = C in this.headers ? this.headers[C] : w in this.headers ? this.headers[w] : null);
		let ce = [];
		h = [];
		let le = [];
		te = [], ne = 0;
		let ue = () => {
			ce.push(h), o ? te.shift() : te.pop(), le.push(te);
		}, de = e[Symbol.iterator]();
		for (re = !1;;) {
			if (re) re = !1;
			else {
				if (g = de.next()?.value, g === void 0) break;
				let e = this.glyphbycp(g);
				b = e === null ? l ? l instanceof u ? l : new u(l, this) : new u(a, this) : e, m = b.draw(), ie = m.width(), ee = 0, r === 1 && C !== void 0 && w !== void 0 && (x = b.meta[C] || b.meta[w], x ??= S, x != null && y !== void 0 && (ee = x - y));
			}
			if (ie !== void 0 && ee !== void 0 && m !== void 0 && b !== void 0 && g !== void 0) if (ne += ie + ee, ne <= n) h.push(m), te.push(ee);
			else {
				if (h.length === 0) throw Error(`\`_linelimit\` (${n}) is too small the line can't even contain one glyph: "${b.chr()}" (codepoint ${g}, width: ${ie})`);
				ue(), ne = 0, h = [], te = [], re = !0;
			}
		}
		h.length !== 0 && ue();
		let fe = ce.map((e, t) => d.concatall(e, {
			direction: _,
			align: f,
			offsetlist: le[t]
		}));
		return d.concatall(fe, {
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
		var n, r = "4.18.1", i = 200, a = "Unsupported core-js use. Try https://npms.io/search?q=ponyfill.", o = "Expected a function", s = "Invalid `variable` option passed into `_.template`", c = "Invalid `imports` option passed into `_.template`", l = "__lodash_hash_undefined__", u = 500, d = "__lodash_placeholder__", f = 1, p = 2, m = 4, h = 1, g = 2, _ = 1, v = 2, y = 4, b = 8, x = 16, S = 32, C = 64, w = 128, ee = 256, te = 512, ne = 30, re = "...", ie = 800, ae = 16, oe = 1, se = 2, ce = 3, le = Infinity, ue = 9007199254740991, de = 17976931348623157e292, fe = NaN, T = 4294967295, pe = T - 1, me = T >>> 1, he = [
			["ary", w],
			["bind", _],
			["bindKey", v],
			["curry", b],
			["curryRight", x],
			["flip", te],
			["partial", S],
			["partialRight", C],
			["rearg", ee]
		], ge = "[object Arguments]", _e = "[object Array]", ve = "[object AsyncFunction]", ye = "[object Boolean]", be = "[object Date]", xe = "[object DOMException]", Se = "[object Error]", Ce = "[object Function]", we = "[object GeneratorFunction]", E = "[object Map]", Te = "[object Number]", Ee = "[object Null]", De = "[object Object]", Oe = "[object Promise]", ke = "[object Proxy]", Ae = "[object RegExp]", je = "[object Set]", Me = "[object String]", Ne = "[object Symbol]", Pe = "[object Undefined]", Fe = "[object WeakMap]", Ie = "[object WeakSet]", Le = "[object ArrayBuffer]", Re = "[object DataView]", ze = "[object Float32Array]", Be = "[object Float64Array]", Ve = "[object Int8Array]", He = "[object Int16Array]", Ue = "[object Int32Array]", We = "[object Uint8Array]", Ge = "[object Uint8ClampedArray]", Ke = "[object Uint16Array]", qe = "[object Uint32Array]", Je = /\b__p \+= '';/g, Ye = /\b(__p \+=) '' \+/g, Xe = /(__e\(.*?\)|\b__t\)) \+\n'';/g, Ze = /&(?:amp|lt|gt|quot|#39);/g, Qe = /[&<>"']/g, $e = RegExp(Ze.source), et = RegExp(Qe.source), tt = /<%-([\s\S]+?)%>/g, nt = /<%([\s\S]+?)%>/g, rt = /<%=([\s\S]+?)%>/g, it = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, at = /^\w*$/, ot = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, st = /[\\^$.*+?()[\]{}|]/g, ct = RegExp(st.source), lt = /^\s+/, D = /\s/, ut = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/, dt = /\{\n\/\* \[wrapped with (.+)\] \*/, ft = /,? & /, pt = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g, mt = /[()=,{}\[\]\/\s]/, ht = /\\(\\)?/g, gt = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g, _t = /\w*$/, vt = /^[-+]0x[0-9a-f]+$/i, yt = /^0b[01]+$/i, bt = /^\[object .+?Constructor\]$/, xt = /^0o[0-7]+$/i, St = /^(?:0|[1-9]\d*)$/, Ct = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g, wt = /($^)/, Tt = /['\n\r\u2028\u2029\\]/g, Et = "\\ud800-\\udfff", Dt = "\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff", Ot = "\\u2700-\\u27bf", O = "a-z\\xdf-\\xf6\\xf8-\\xff", kt = "\\xac\\xb1\\xd7\\xf7", At = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", jt = "\\u2000-\\u206f", Mt = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", Nt = "A-Z\\xc0-\\xd6\\xd8-\\xde", Pt = "\\ufe0e\\ufe0f", Ft = kt + At + jt + Mt, It = "['’]", k = "[" + Et + "]", Lt = "[" + Ft + "]", Rt = "[" + Dt + "]", zt = "\\d+", Bt = "[" + Ot + "]", Vt = "[" + O + "]", Ht = "[^" + Et + Ft + zt + Ot + O + Nt + "]", Ut = "\\ud83c[\\udffb-\\udfff]", Wt = "(?:" + Rt + "|" + Ut + ")", Gt = "[^" + Et + "]", Kt = "(?:\\ud83c[\\udde6-\\uddff]){2}", qt = "[\\ud800-\\udbff][\\udc00-\\udfff]", Jt = "[" + Nt + "]", Yt = "\\u200d", Xt = "(?:" + Vt + "|" + Ht + ")", Zt = "(?:" + Jt + "|" + Ht + ")", Qt = "(?:" + It + "(?:d|ll|m|re|s|t|ve))?", $t = "(?:" + It + "(?:D|LL|M|RE|S|T|VE))?", en = Wt + "?", tn = "[" + Pt + "]?", nn = "(?:" + Yt + "(?:" + [
			Gt,
			Kt,
			qt
		].join("|") + ")" + tn + en + ")*", rn = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", an = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", on = tn + en + nn, sn = "(?:" + [
			Bt,
			Kt,
			qt
		].join("|") + ")" + on, cn = "(?:" + [
			Gt + Rt + "?",
			Rt,
			Kt,
			qt,
			k
		].join("|") + ")", ln = RegExp(It, "g"), un = RegExp(Rt, "g"), dn = RegExp(Ut + "(?=" + Ut + ")|" + cn + on, "g"), fn = RegExp([
			Jt + "?" + Vt + "+" + Qt + "(?=" + [
				Lt,
				Jt,
				"$"
			].join("|") + ")",
			Zt + "+" + $t + "(?=" + [
				Lt,
				Jt + Xt,
				"$"
			].join("|") + ")",
			Jt + "?" + Xt + "+" + Qt,
			Jt + "+" + $t,
			an,
			rn,
			zt,
			sn
		].join("|"), "g"), pn = RegExp("[" + Yt + Et + Dt + Pt + "]"), A = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/, mn = /* @__PURE__ */ "Array.Buffer.DataView.Date.Error.Float32Array.Float64Array.Function.Int8Array.Int16Array.Int32Array.Map.Math.Object.Promise.RegExp.Set.String.Symbol.TypeError.Uint8Array.Uint8ClampedArray.Uint16Array.Uint32Array.WeakMap._.clearTimeout.isFinite.parseInt.setTimeout".split("."), hn = -1, j = {};
		j[ze] = j[Be] = j[Ve] = j[He] = j[Ue] = j[We] = j[Ge] = j[Ke] = j[qe] = !0, j[ge] = j[_e] = j[Le] = j[ye] = j[Re] = j[be] = j[Se] = j[Ce] = j[E] = j[Te] = j[De] = j[Ae] = j[je] = j[Me] = j[Fe] = !1;
		var M = {};
		M[ge] = M[_e] = M[Le] = M[Re] = M[ye] = M[be] = M[ze] = M[Be] = M[Ve] = M[He] = M[Ue] = M[E] = M[Te] = M[De] = M[Ae] = M[je] = M[Me] = M[Ne] = M[We] = M[Ge] = M[Ke] = M[qe] = !0, M[Se] = M[Ce] = M[Fe] = !1;
		var N = {
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
		}, gn = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			"\"": "&quot;",
			"'": "&#39;"
		}, _n = {
			"&amp;": "&",
			"&lt;": "<",
			"&gt;": ">",
			"&quot;": "\"",
			"&#39;": "'"
		}, vn = {
			"\\": "\\",
			"'": "'",
			"\n": "n",
			"\r": "r",
			"\u2028": "u2028",
			"\u2029": "u2029"
		}, yn = parseFloat, bn = parseInt, xn = typeof global == "object" && global && global.Object === Object && global, Sn = typeof self == "object" && self && self.Object === Object && self, P = xn || Sn || Function("return this")(), Cn = typeof e == "object" && e && !e.nodeType && e, wn = Cn && typeof t == "object" && t && !t.nodeType && t, Tn = wn && wn.exports === Cn, En = Tn && xn.process, F = function() {
			try {
				return wn && wn.require && wn.require("util").types || En && En.binding && En.binding("util");
			} catch {}
		}(), Dn = F && F.isArrayBuffer, On = F && F.isDate, kn = F && F.isMap, An = F && F.isRegExp, jn = F && F.isSet, Mn = F && F.isTypedArray;
		function Nn(e, t, n) {
			switch (n.length) {
				case 0: return e.call(t);
				case 1: return e.call(t, n[0]);
				case 2: return e.call(t, n[0], n[1]);
				case 3: return e.call(t, n[0], n[1], n[2]);
			}
			return e.apply(t, n);
		}
		function Pn(e, t, n, r) {
			for (var i = -1, a = e == null ? 0 : e.length; ++i < a;) {
				var o = e[i];
				t(r, o, n(o), e);
			}
			return r;
		}
		function Fn(e, t) {
			for (var n = -1, r = e == null ? 0 : e.length; ++n < r && t(e[n], n, e) !== !1;);
			return e;
		}
		function In(e, t) {
			for (var n = e == null ? 0 : e.length; n-- && t(e[n], n, e) !== !1;);
			return e;
		}
		function Ln(e, t) {
			for (var n = -1, r = e == null ? 0 : e.length; ++n < r;) if (!t(e[n], n, e)) return !1;
			return !0;
		}
		function Rn(e, t) {
			for (var n = -1, r = e == null ? 0 : e.length, i = 0, a = []; ++n < r;) {
				var o = e[n];
				t(o, n, e) && (a[i++] = o);
			}
			return a;
		}
		function zn(e, t) {
			return !!(e != null && e.length) && Xn(e, t, 0) > -1;
		}
		function Bn(e, t, n) {
			for (var r = -1, i = e == null ? 0 : e.length; ++r < i;) if (n(t, e[r])) return !0;
			return !1;
		}
		function I(e, t) {
			for (var n = -1, r = e == null ? 0 : e.length, i = Array(r); ++n < r;) i[n] = t(e[n], n, e);
			return i;
		}
		function Vn(e, t) {
			for (var n = -1, r = t.length, i = e.length; ++n < r;) e[i + n] = t[n];
			return e;
		}
		function Hn(e, t, n, r) {
			var i = -1, a = e == null ? 0 : e.length;
			for (r && a && (n = e[++i]); ++i < a;) n = t(n, e[i], i, e);
			return n;
		}
		function Un(e, t, n, r) {
			var i = e == null ? 0 : e.length;
			for (r && i && (n = e[--i]); i--;) n = t(n, e[i], i, e);
			return n;
		}
		function Wn(e, t) {
			for (var n = -1, r = e == null ? 0 : e.length; ++n < r;) if (t(e[n], n, e)) return !0;
			return !1;
		}
		var Gn = er("length");
		function Kn(e) {
			return e.split("");
		}
		function qn(e) {
			return e.match(pt) || [];
		}
		function Jn(e, t, n) {
			var r;
			return n(e, function(e, n, i) {
				if (t(e, n, i)) return r = n, !1;
			}), r;
		}
		function Yn(e, t, n, r) {
			for (var i = e.length, a = n + (r ? 1 : -1); r ? a-- : ++a < i;) if (t(e[a], a, e)) return a;
			return -1;
		}
		function Xn(e, t, n) {
			return t === t ? Er(e, t, n) : Yn(e, Qn, n);
		}
		function Zn(e, t, n, r) {
			for (var i = n - 1, a = e.length; ++i < a;) if (r(e[i], t)) return i;
			return -1;
		}
		function Qn(e) {
			return e !== e;
		}
		function $n(e, t) {
			var n = e == null ? 0 : e.length;
			return n ? ir(e, t) / n : fe;
		}
		function er(e) {
			return function(t) {
				return t == null ? n : t[e];
			};
		}
		function tr(e) {
			return function(t) {
				return e == null ? n : e[t];
			};
		}
		function nr(e, t, n, r, i) {
			return i(e, function(e, i, a) {
				n = r ? (r = !1, e) : t(n, e, i, a);
			}), n;
		}
		function rr(e, t) {
			var n = e.length;
			for (e.sort(t); n--;) e[n] = e[n].value;
			return e;
		}
		function ir(e, t) {
			for (var r, i = -1, a = e.length; ++i < a;) {
				var o = t(e[i]);
				o !== n && (r = r === n ? o : r + o);
			}
			return r;
		}
		function ar(e, t) {
			for (var n = -1, r = Array(e); ++n < e;) r[n] = t(n);
			return r;
		}
		function or(e, t) {
			return I(t, function(t) {
				return [t, e[t]];
			});
		}
		function sr(e) {
			return e && e.slice(0, Ar(e) + 1).replace(lt, "");
		}
		function cr(e) {
			return function(t) {
				return e(t);
			};
		}
		function lr(e, t) {
			return I(t, function(t) {
				return e[t];
			});
		}
		function ur(e, t) {
			return e.has(t);
		}
		function dr(e, t) {
			for (var n = -1, r = e.length; ++n < r && Xn(t, e[n], 0) > -1;);
			return n;
		}
		function fr(e, t) {
			for (var n = e.length; n-- && Xn(t, e[n], 0) > -1;);
			return n;
		}
		function pr(e, t) {
			for (var n = e.length, r = 0; n--;) e[n] === t && ++r;
			return r;
		}
		var mr = tr(N), hr = tr(gn);
		function gr(e) {
			return "\\" + vn[e];
		}
		function _r(e, t) {
			return e == null ? n : e[t];
		}
		function vr(e) {
			return pn.test(e);
		}
		function yr(e) {
			return A.test(e);
		}
		function br(e) {
			for (var t, n = []; !(t = e.next()).done;) n.push(t.value);
			return n;
		}
		function xr(e) {
			var t = -1, n = Array(e.size);
			return e.forEach(function(e, r) {
				n[++t] = [r, e];
			}), n;
		}
		function Sr(e, t) {
			return function(n) {
				return e(t(n));
			};
		}
		function Cr(e, t) {
			for (var n = -1, r = e.length, i = 0, a = []; ++n < r;) {
				var o = e[n];
				(o === t || o === d) && (e[n] = d, a[i++] = n);
			}
			return a;
		}
		function wr(e) {
			var t = -1, n = Array(e.size);
			return e.forEach(function(e) {
				n[++t] = e;
			}), n;
		}
		function Tr(e) {
			var t = -1, n = Array(e.size);
			return e.forEach(function(e) {
				n[++t] = [e, e];
			}), n;
		}
		function Er(e, t, n) {
			for (var r = n - 1, i = e.length; ++r < i;) if (e[r] === t) return r;
			return -1;
		}
		function Dr(e, t, n) {
			for (var r = n + 1; r--;) if (e[r] === t) return r;
			return r;
		}
		function Or(e) {
			return vr(e) ? Mr(e) : Gn(e);
		}
		function kr(e) {
			return vr(e) ? Nr(e) : Kn(e);
		}
		function Ar(e) {
			for (var t = e.length; t-- && D.test(e.charAt(t)););
			return t;
		}
		var jr = tr(_n);
		function Mr(e) {
			for (var t = dn.lastIndex = 0; dn.test(e);) ++t;
			return t;
		}
		function Nr(e) {
			return e.match(dn) || [];
		}
		function Pr(e) {
			return e.match(fn) || [];
		}
		var Fr = (function e(t) {
			t = t == null ? P : Fr.defaults(P.Object(), t, Fr.pick(P, mn));
			var D = t.Array, pt = t.Date, Et = t.Error, Dt = t.Function, Ot = t.Math, O = t.Object, kt = t.RegExp, At = t.String, jt = t.TypeError, Mt = D.prototype, Nt = Dt.prototype, Pt = O.prototype, Ft = t["__core-js_shared__"], It = Nt.toString, k = Pt.hasOwnProperty, Lt = 0, Rt = function() {
				var e = /[^.]+$/.exec(Ft && Ft.keys && Ft.keys.IE_PROTO || "");
				return e ? "Symbol(src)_1." + e : "";
			}(), zt = Pt.toString, Bt = It.call(O), Vt = P._, Ht = kt("^" + It.call(k).replace(st, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"), Ut = Tn ? t.Buffer : n, Wt = t.Symbol, Gt = t.Uint8Array, Kt = Ut ? Ut.allocUnsafe : n, qt = Sr(O.getPrototypeOf, O), Jt = O.create, Yt = Pt.propertyIsEnumerable, Xt = Mt.splice, Zt = Wt ? Wt.isConcatSpreadable : n, Qt = Wt ? Wt.iterator : n, $t = Wt ? Wt.toStringTag : n, en = function() {
				try {
					var e = is(O, "defineProperty");
					return e({}, "", {}), e;
				} catch {}
			}(), tn = t.clearTimeout !== P.clearTimeout && t.clearTimeout, nn = pt && pt.now !== P.Date.now && pt.now, rn = t.setTimeout !== P.setTimeout && t.setTimeout, an = Ot.ceil, on = Ot.floor, sn = O.getOwnPropertySymbols, cn = Ut ? Ut.isBuffer : n, dn = t.isFinite, fn = Mt.join, pn = Sr(O.keys, O), A = Ot.max, N = Ot.min, gn = pt.now, _n = t.parseInt, vn = Ot.random, xn = Mt.reverse, Sn = is(t, "DataView"), Cn = is(t, "Map"), wn = is(t, "Promise"), En = is(t, "Set"), F = is(t, "WeakMap"), Gn = is(O, "create"), Kn = F && new F(), tr = {}, Er = Vs(Sn), Mr = Vs(Cn), Nr = Vs(wn), Ir = Vs(En), Lr = Vs(F), Rr = Wt ? Wt.prototype : n, zr = Rr ? Rr.valueOf : n, Br = Rr ? Rr.toString : n;
			function L(e) {
				if (X(e) && !K(e) && !(e instanceof R)) {
					if (e instanceof Ur) return e;
					if (k.call(e, "__wrapped__")) return Us(e);
				}
				return new Ur(e);
			}
			var Vr = function() {
				function e() {}
				return function(t) {
					if (!Y(t)) return {};
					if (Jt) return Jt(t);
					e.prototype = t;
					var r = new e();
					return e.prototype = n, r;
				};
			}();
			function Hr() {}
			function Ur(e, t) {
				this.__wrapped__ = e, this.__actions__ = [], this.__chain__ = !!t, this.__index__ = 0, this.__values__ = n;
			}
			L.templateSettings = {
				escape: tt,
				evaluate: nt,
				interpolate: rt,
				variable: "",
				imports: { _: L }
			}, L.prototype = Hr.prototype, L.prototype.constructor = L, Ur.prototype = Vr(Hr.prototype), Ur.prototype.constructor = Ur;
			function R(e) {
				this.__wrapped__ = e, this.__actions__ = [], this.__dir__ = 1, this.__filtered__ = !1, this.__iteratees__ = [], this.__takeCount__ = T, this.__views__ = [];
			}
			function Wr() {
				var e = new R(this.__wrapped__);
				return e.__actions__ = H(this.__actions__), e.__dir__ = this.__dir__, e.__filtered__ = this.__filtered__, e.__iteratees__ = H(this.__iteratees__), e.__takeCount__ = this.__takeCount__, e.__views__ = H(this.__views__), e;
			}
			function Gr() {
				if (this.__filtered__) {
					var e = new R(this);
					e.__dir__ = -1, e.__filtered__ = !0;
				} else e = this.clone(), e.__dir__ *= -1;
				return e;
			}
			function Kr() {
				var e = this.__wrapped__.value(), t = this.__dir__, n = K(e), r = t < 0, i = n ? e.length : 0, a = cs(0, i, this.__views__), o = a.start, s = a.end, c = s - o, l = r ? s : o - 1, u = this.__iteratees__, d = u.length, f = 0, p = N(c, this.__takeCount__);
				if (!n || !r && i == c && p == c) return Za(e, this.__actions__);
				var m = [];
				outer: for (; c-- && f < p;) {
					l += t;
					for (var h = -1, g = e[l]; ++h < d;) {
						var _ = u[h], v = _.iteratee, y = _.type, b = v(g);
						if (y == se) g = b;
						else if (!b) {
							if (y == oe) continue outer;
							break outer;
						}
					}
					m[f++] = g;
				}
				return m;
			}
			R.prototype = Vr(Hr.prototype), R.prototype.constructor = R;
			function qr(e) {
				var t = -1, n = e == null ? 0 : e.length;
				for (this.clear(); ++t < n;) {
					var r = e[t];
					this.set(r[0], r[1]);
				}
			}
			function Jr() {
				this.__data__ = Gn ? Gn(null) : {}, this.size = 0;
			}
			function Yr(e) {
				var t = this.has(e) && delete this.__data__[e];
				return this.size -= +!!t, t;
			}
			function Xr(e) {
				var t = this.__data__;
				if (Gn) {
					var r = t[e];
					return r === l ? n : r;
				}
				return k.call(t, e) ? t[e] : n;
			}
			function Zr(e) {
				var t = this.__data__;
				return Gn ? t[e] !== n : k.call(t, e);
			}
			function Qr(e, t) {
				var r = this.__data__;
				return this.size += +!this.has(e), r[e] = Gn && t === n ? l : t, this;
			}
			qr.prototype.clear = Jr, qr.prototype.delete = Yr, qr.prototype.get = Xr, qr.prototype.has = Zr, qr.prototype.set = Qr;
			function $r(e) {
				var t = -1, n = e == null ? 0 : e.length;
				for (this.clear(); ++t < n;) {
					var r = e[t];
					this.set(r[0], r[1]);
				}
			}
			function ei() {
				this.__data__ = [], this.size = 0;
			}
			function ti(e) {
				var t = this.__data__, n = Ei(t, e);
				return n < 0 ? !1 : (n == t.length - 1 ? t.pop() : Xt.call(t, n, 1), --this.size, !0);
			}
			function ni(e) {
				var t = this.__data__, r = Ei(t, e);
				return r < 0 ? n : t[r][1];
			}
			function ri(e) {
				return Ei(this.__data__, e) > -1;
			}
			function ii(e, t) {
				var n = this.__data__, r = Ei(n, e);
				return r < 0 ? (++this.size, n.push([e, t])) : n[r][1] = t, this;
			}
			$r.prototype.clear = ei, $r.prototype.delete = ti, $r.prototype.get = ni, $r.prototype.has = ri, $r.prototype.set = ii;
			function ai(e) {
				var t = -1, n = e == null ? 0 : e.length;
				for (this.clear(); ++t < n;) {
					var r = e[t];
					this.set(r[0], r[1]);
				}
			}
			function oi() {
				this.size = 0, this.__data__ = {
					hash: new qr(),
					map: new (Cn || $r)(),
					string: new qr()
				};
			}
			function si(e) {
				var t = ns(this, e).delete(e);
				return this.size -= +!!t, t;
			}
			function ci(e) {
				return ns(this, e).get(e);
			}
			function li(e) {
				return ns(this, e).has(e);
			}
			function ui(e, t) {
				var n = ns(this, e), r = n.size;
				return n.set(e, t), this.size += n.size == r ? 0 : 1, this;
			}
			ai.prototype.clear = oi, ai.prototype.delete = si, ai.prototype.get = ci, ai.prototype.has = li, ai.prototype.set = ui;
			function di(e) {
				var t = -1, n = e == null ? 0 : e.length;
				for (this.__data__ = new ai(); ++t < n;) this.add(e[t]);
			}
			function fi(e) {
				return this.__data__.set(e, l), this;
			}
			function pi(e) {
				return this.__data__.has(e);
			}
			di.prototype.add = di.prototype.push = fi, di.prototype.has = pi;
			function mi(e) {
				var t = this.__data__ = new $r(e);
				this.size = t.size;
			}
			function hi() {
				this.__data__ = new $r(), this.size = 0;
			}
			function gi(e) {
				var t = this.__data__, n = t.delete(e);
				return this.size = t.size, n;
			}
			function _i(e) {
				return this.__data__.get(e);
			}
			function vi(e) {
				return this.__data__.has(e);
			}
			function yi(e, t) {
				var n = this.__data__;
				if (n instanceof $r) {
					var r = n.__data__;
					if (!Cn || r.length < i - 1) return r.push([e, t]), this.size = ++n.size, this;
					n = this.__data__ = new ai(r);
				}
				return n.set(e, t), this.size = n.size, this;
			}
			mi.prototype.clear = hi, mi.prototype.delete = gi, mi.prototype.get = _i, mi.prototype.has = vi, mi.prototype.set = yi;
			function bi(e, t) {
				var n = K(e), r = !n && gu(e), i = !n && !r && yu(e), a = !n && !r && !i && Wu(e), o = n || r || i || a, s = o ? ar(e.length, At) : [], c = s.length;
				for (var l in e) (t || k.call(e, l)) && !(o && (l == "length" || i && (l == "offset" || l == "parent") || a && (l == "buffer" || l == "byteLength" || l == "byteOffset") || gs(l, c))) && s.push(l);
				return s;
			}
			function xi(e) {
				var t = e.length;
				return t ? e[ja(0, t - 1)] : n;
			}
			function Si(e, t) {
				return Rs(H(e), Mi(t, 0, e.length));
			}
			function Ci(e) {
				return Rs(H(e));
			}
			function wi(e, t, r) {
				(r !== n && !pu(e[t], r) || r === n && !(t in e)) && Ai(e, t, r);
			}
			function Ti(e, t, r) {
				var i = e[t];
				(!(k.call(e, t) && pu(i, r)) || r === n && !(t in e)) && Ai(e, t, r);
			}
			function Ei(e, t) {
				for (var n = e.length; n--;) if (pu(e[n][0], t)) return n;
				return -1;
			}
			function Di(e, t, n, r) {
				return Ri(e, function(e, i, a) {
					t(r, e, n(e), a);
				}), r;
			}
			function Oi(e, t) {
				return e && _o(t, $(t), e);
			}
			function ki(e, t) {
				return e && _o(t, wd(t), e);
			}
			function Ai(e, t, n) {
				t == "__proto__" && en ? en(e, t, {
					configurable: !0,
					enumerable: !0,
					value: n,
					writable: !0
				}) : e[t] = n;
			}
			function ji(e, t) {
				for (var r = -1, i = t.length, a = D(i), o = e == null; ++r < i;) a[r] = o ? n : vd(e, t[r]);
				return a;
			}
			function Mi(e, t, r) {
				return e === e && (r !== n && (e = e <= r ? e : r), t !== n && (e = e >= t ? e : t)), e;
			}
			function Ni(e, t, r, i, a, o) {
				var s, c = t & f, l = t & p, u = t & m;
				if (r && (s = a ? r(e, i, a, o) : r(e)), s !== n) return s;
				if (!Y(e)) return e;
				var d = K(e);
				if (d) {
					if (s = ds(e), !c) return H(e, s);
				} else {
					var h = W(e), g = h == Ce || h == we;
					if (yu(e)) return oo(e, c);
					if (h == De || h == ge || g && !a) {
						if (s = l || g ? {} : fs(e), !c) return l ? yo(e, ki(s, e)) : vo(e, Oi(s, e));
					} else {
						if (!M[h]) return a ? e : {};
						s = ps(e, h, c);
					}
				}
				o ||= new mi();
				var _ = o.get(e);
				if (_) return _;
				o.set(e, s), Vu(e) ? e.forEach(function(n) {
					s.add(Ni(n, t, r, n, e, o));
				}) : Au(e) && e.forEach(function(n, i) {
					s.set(i, Ni(n, t, r, i, e, o));
				});
				var v = d ? n : (u ? l ? Qo : Zo : l ? wd : $)(e);
				return Fn(v || e, function(n, i) {
					v && (i = n, n = e[i]), Ti(s, i, Ni(n, t, r, i, e, o));
				}), s;
			}
			function Pi(e) {
				var t = $(e);
				return function(n) {
					return Fi(n, e, t);
				};
			}
			function Fi(e, t, r) {
				var i = r.length;
				if (e == null) return !i;
				for (e = O(e); i--;) {
					var a = r[i], o = t[a], s = e[a];
					if (s === n && !(a in e) || !o(s)) return !1;
				}
				return !0;
			}
			function Ii(e, t, r) {
				if (typeof e != "function") throw new jt(o);
				return Ps(function() {
					e.apply(n, r);
				}, t);
			}
			function Li(e, t, n, r) {
				var a = -1, o = zn, s = !0, c = e.length, l = [], u = t.length;
				if (!c) return l;
				n && (t = I(t, cr(n))), r ? (o = Bn, s = !1) : t.length >= i && (o = ur, s = !1, t = new di(t));
				outer: for (; ++a < c;) {
					var d = e[a], f = n == null ? d : n(d);
					if (d = r || d !== 0 ? d : 0, s && f === f) {
						for (var p = u; p--;) if (t[p] === f) continue outer;
						l.push(d);
					} else o(t, f, r) || l.push(d);
				}
				return l;
			}
			var Ri = So(Ki), zi = So(qi, !0);
			function Bi(e, t) {
				var n = !0;
				return Ri(e, function(e, r, i) {
					return n = !!t(e, r, i), n;
				}), n;
			}
			function Vi(e, t, r) {
				for (var i = -1, a = e.length; ++i < a;) {
					var o = e[i], s = t(o);
					if (s != null && (c === n ? s === s && !Uu(s) : r(s, c))) var c = s, l = o;
				}
				return l;
			}
			function Hi(e, t, r, i) {
				var a = e.length;
				for (r = Z(r), r < 0 && (r = -r > a ? 0 : a + r), i = i === n || i > a ? a : Z(i), i < 0 && (i += a), i = r > i ? 0 : Qu(i); r < i;) e[r++] = t;
				return e;
			}
			function Ui(e, t) {
				var n = [];
				return Ri(e, function(e, r, i) {
					t(e, r, i) && n.push(e);
				}), n;
			}
			function z(e, t, n, r, i) {
				var a = -1, o = e.length;
				for (n ||= hs, i ||= []; ++a < o;) {
					var s = e[a];
					t > 0 && n(s) ? t > 1 ? z(s, t - 1, n, r, i) : Vn(i, s) : r || (i[i.length] = s);
				}
				return i;
			}
			var Wi = Co(), Gi = Co(!0);
			function Ki(e, t) {
				return e && Wi(e, t, $);
			}
			function qi(e, t) {
				return e && Gi(e, t, $);
			}
			function Ji(e, t) {
				return Rn(t, function(t) {
					return Du(e[t]);
				});
			}
			function Yi(e, t) {
				t = no(t, e);
				for (var r = 0, i = t.length; e != null && r < i;) e = e[Bs(t[r++])];
				return r && r == i ? e : n;
			}
			function Xi(e, t, n) {
				var r = t(e);
				return K(e) ? r : Vn(r, n(e));
			}
			function B(e) {
				return e == null ? e === n ? Pe : Ee : $t && $t in O(e) ? as(e) : Os(e);
			}
			function Zi(e, t) {
				return e > t;
			}
			function Qi(e, t) {
				return e != null && k.call(e, t);
			}
			function $i(e, t) {
				return e != null && t in O(e);
			}
			function ea(e, t, n) {
				return e >= N(t, n) && e < A(t, n);
			}
			function ta(e, t, r) {
				for (var i = r ? Bn : zn, a = e[0].length, o = e.length, s = o, c = D(o), l = Infinity, u = []; s--;) {
					var d = e[s];
					s && t && (d = I(d, cr(t))), l = N(d.length, l), c[s] = !r && (t || a >= 120 && d.length >= 120) ? new di(s && d) : n;
				}
				d = e[0];
				var f = -1, p = c[0];
				outer: for (; ++f < a && u.length < l;) {
					var m = d[f], h = t ? t(m) : m;
					if (m = r || m !== 0 ? m : 0, !(p ? ur(p, h) : i(u, h, r))) {
						for (s = o; --s;) {
							var g = c[s];
							if (!(g ? ur(g, h) : i(e[s], h, r))) continue outer;
						}
						p && p.push(h), u.push(m);
					}
				}
				return u;
			}
			function na(e, t, n, r) {
				return Ki(e, function(e, i, a) {
					t(r, n(e), i, a);
				}), r;
			}
			function ra(e, t, r) {
				t = no(t, e), e = As(e, t);
				var i = e == null ? e : e[Bs(mc(t))];
				return i == null ? n : Nn(i, e, r);
			}
			function ia(e) {
				return X(e) && B(e) == ge;
			}
			function aa(e) {
				return X(e) && B(e) == Le;
			}
			function oa(e) {
				return X(e) && B(e) == be;
			}
			function sa(e, t, n, r, i) {
				return e === t ? !0 : e == null || t == null || !X(e) && !X(t) ? e !== e && t !== t : ca(e, t, n, r, sa, i);
			}
			function ca(e, t, n, r, i, a) {
				var o = K(e), s = K(t), c = o ? _e : W(e), l = s ? _e : W(t);
				c = c == ge ? De : c, l = l == ge ? De : l;
				var u = c == De, d = l == De, f = c == l;
				if (f && yu(e)) {
					if (!yu(t)) return !1;
					o = !0, u = !1;
				}
				if (f && !u) return a ||= new mi(), o || Wu(e) ? qo(e, t, n, r, i, a) : Jo(e, t, c, n, r, i, a);
				if (!(n & h)) {
					var p = u && k.call(e, "__wrapped__"), m = d && k.call(t, "__wrapped__");
					if (p || m) {
						var g = p ? e.value() : e, _ = m ? t.value() : t;
						return a ||= new mi(), i(g, _, n, r, a);
					}
				}
				return f ? (a ||= new mi(), Yo(e, t, n, r, i, a)) : !1;
			}
			function la(e) {
				return X(e) && W(e) == E;
			}
			function ua(e, t, r, i) {
				var a = r.length, o = a, s = !i;
				if (e == null) return !o;
				for (e = O(e); a--;) {
					var c = r[a];
					if (s && c[2] ? c[1] !== e[c[0]] : !(c[0] in e)) return !1;
				}
				for (; ++a < o;) {
					c = r[a];
					var l = c[0], u = e[l], d = c[1];
					if (s && c[2]) {
						if (u === n && !(l in e)) return !1;
					} else {
						var f = new mi();
						if (i) var p = i(u, d, l, e, t, f);
						if (!(p === n ? sa(d, u, h | g, i, f) : p)) return !1;
					}
				}
				return !0;
			}
			function da(e) {
				return !Y(e) || bs(e) ? !1 : (Du(e) ? Ht : bt).test(Vs(e));
			}
			function fa(e) {
				return X(e) && B(e) == Ae;
			}
			function pa(e) {
				return X(e) && W(e) == je;
			}
			function ma(e) {
				return X(e) && ku(e.length) && !!j[B(e)];
			}
			function ha(e) {
				return typeof e == "function" ? e : e == null ? Mf : typeof e == "object" ? K(e) ? xa(e[0], e[1]) : ba(e) : Gf(e);
			}
			function ga(e) {
				if (!Ss(e)) return pn(e);
				var t = [];
				for (var n in O(e)) k.call(e, n) && n != "constructor" && t.push(n);
				return t;
			}
			function _a(e) {
				if (!Y(e)) return Ds(e);
				var t = Ss(e), n = [];
				for (var r in e) r == "constructor" && (t || !k.call(e, r)) || n.push(r);
				return n;
			}
			function va(e, t) {
				return e < t;
			}
			function ya(e, t) {
				var n = -1, r = q(e) ? D(e.length) : [];
				return Ri(e, function(e, i, a) {
					r[++n] = t(e, i, a);
				}), r;
			}
			function ba(e) {
				var t = rs(e);
				return t.length == 1 && t[0][2] ? ws(t[0][0], t[0][1]) : function(n) {
					return n === e || ua(n, e, t);
				};
			}
			function xa(e, t) {
				return _s(e) && Cs(t) ? ws(Bs(e), t) : function(r) {
					var i = vd(r, e);
					return i === n && i === t ? bd(r, e) : sa(t, i, h | g);
				};
			}
			function Sa(e, t, r, i, a) {
				e !== t && Wi(t, function(o, s) {
					if (a ||= new mi(), Y(o)) Ca(e, t, s, r, Sa, i, a);
					else {
						var c = i ? i(Ms(e, s), o, s + "", e, t, a) : n;
						c === n && (c = o), wi(e, s, c);
					}
				}, wd);
			}
			function Ca(e, t, r, i, a, o, s) {
				var c = Ms(e, r), l = Ms(t, r), u = s.get(l);
				if (u) {
					wi(e, r, u);
					return;
				}
				var d = o ? o(c, l, r + "", e, t, s) : n, f = d === n;
				if (f) {
					var p = K(l), m = !p && yu(l), h = !p && !m && Wu(l);
					d = l, p || m || h ? K(c) ? d = c : J(c) ? d = H(c) : m ? (f = !1, d = oo(l, !0)) : h ? (f = !1, d = fo(l, !0)) : d = [] : Ru(l) || gu(l) ? (d = c, gu(c) ? d = ed(c) : (!Y(c) || Du(c)) && (d = fs(l))) : f = !1;
				}
				f && (s.set(l, d), a(d, l, i, o, s), s.delete(l)), wi(e, r, d);
			}
			function wa(e, t) {
				var r = e.length;
				if (r) return t += t < 0 ? r : 0, gs(t, r) ? e[t] : n;
			}
			function Ta(e, t, n) {
				t = t.length ? I(t, function(e) {
					return K(e) ? function(t) {
						return Yi(t, e.length === 1 ? e[0] : e);
					} : e;
				}) : [Mf];
				var r = -1;
				return t = I(t, cr(U())), rr(ya(e, function(e, n, i) {
					return {
						criteria: I(t, function(t) {
							return t(e);
						}),
						index: ++r,
						value: e
					};
				}), function(e, t) {
					return mo(e, t, n);
				});
			}
			function Ea(e, t) {
				return Da(e, t, function(t, n) {
					return bd(e, n);
				});
			}
			function Da(e, t, n) {
				for (var r = -1, i = t.length, a = {}; ++r < i;) {
					var o = t[r], s = Yi(e, o);
					n(s, o) && Ia(a, no(o, e), s);
				}
				return a;
			}
			function Oa(e) {
				return function(t) {
					return Yi(t, e);
				};
			}
			function ka(e, t, n, r) {
				var i = r ? Zn : Xn, a = -1, o = t.length, s = e;
				for (e === t && (t = H(t)), n && (s = I(e, cr(n))); ++a < o;) for (var c = 0, l = t[a], u = n ? n(l) : l; (c = i(s, u, c, r)) > -1;) s !== e && Xt.call(s, c, 1), Xt.call(e, c, 1);
				return e;
			}
			function Aa(e, t) {
				for (var n = e ? t.length : 0, r = n - 1; n--;) {
					var i = t[n];
					if (n == r || i !== a) {
						var a = i;
						gs(i) ? Xt.call(e, i, 1) : Ja(e, i);
					}
				}
				return e;
			}
			function ja(e, t) {
				return e + on(vn() * (t - e + 1));
			}
			function Ma(e, t, n, r) {
				for (var i = -1, a = A(an((t - e) / (n || 1)), 0), o = D(a); a--;) o[r ? a : ++i] = e, e += n;
				return o;
			}
			function Na(e, t) {
				var n = "";
				if (!e || t < 1 || t > ue) return n;
				do
					t % 2 && (n += e), t = on(t / 2), t && (e += e);
				while (t);
				return n;
			}
			function V(e, t) {
				return Fs(ks(e, t, Mf), e + "");
			}
			function Pa(e) {
				return xi(Hd(e));
			}
			function Fa(e, t) {
				var n = Hd(e);
				return Rs(n, Mi(t, 0, n.length));
			}
			function Ia(e, t, r, i) {
				if (!Y(e)) return e;
				t = no(t, e);
				for (var a = -1, o = t.length, s = o - 1, c = e; c != null && ++a < o;) {
					var l = Bs(t[a]), u = r;
					if (l === "__proto__" || l === "constructor" || l === "prototype") return e;
					if (a != s) {
						var d = c[l];
						u = i ? i(d, l, c) : n, u === n && (u = Y(d) ? d : gs(t[a + 1]) ? [] : {});
					}
					Ti(c, l, u), c = c[l];
				}
				return e;
			}
			var La = Kn ? function(e, t) {
				return Kn.set(e, t), e;
			} : Mf, Ra = en ? function(e, t) {
				return en(e, "toString", {
					configurable: !0,
					enumerable: !1,
					value: Of(t),
					writable: !0
				});
			} : Mf;
			function za(e) {
				return Rs(Hd(e));
			}
			function Ba(e, t, n) {
				var r = -1, i = e.length;
				t < 0 && (t = -t > i ? 0 : i + t), n = n > i ? i : n, n < 0 && (n += i), i = t > n ? 0 : n - t >>> 0, t >>>= 0;
				for (var a = D(i); ++r < i;) a[r] = e[r + t];
				return a;
			}
			function Va(e, t) {
				var n;
				return Ri(e, function(e, r, i) {
					return n = t(e, r, i), !n;
				}), !!n;
			}
			function Ha(e, t, n) {
				var r = 0, i = e == null ? r : e.length;
				if (typeof t == "number" && t === t && i <= me) {
					for (; r < i;) {
						var a = r + i >>> 1, o = e[a];
						o !== null && !Uu(o) && (n ? o <= t : o < t) ? r = a + 1 : i = a;
					}
					return i;
				}
				return Ua(e, t, Mf, n);
			}
			function Ua(e, t, r, i) {
				var a = 0, o = e == null ? 0 : e.length;
				if (o === 0) return 0;
				t = r(t);
				for (var s = t !== t, c = t === null, l = Uu(t), u = t === n; a < o;) {
					var d = on((a + o) / 2), f = r(e[d]), p = f !== n, m = f === null, h = f === f, g = Uu(f);
					if (s) var _ = i || h;
					else _ = u ? h && (i || p) : c ? h && p && (i || !m) : l ? h && p && !m && (i || !g) : m || g ? !1 : i ? f <= t : f < t;
					_ ? a = d + 1 : o = d;
				}
				return N(o, pe);
			}
			function Wa(e, t) {
				for (var n = -1, r = e.length, i = 0, a = []; ++n < r;) {
					var o = e[n], s = t ? t(o) : o;
					if (!n || !pu(s, c)) {
						var c = s;
						a[i++] = o === 0 ? 0 : o;
					}
				}
				return a;
			}
			function Ga(e) {
				return typeof e == "number" ? e : Uu(e) ? fe : +e;
			}
			function Ka(e) {
				if (typeof e == "string") return e;
				if (K(e)) return I(e, Ka) + "";
				if (Uu(e)) return Br ? Br.call(e) : "";
				var t = e + "";
				return t == "0" && 1 / e == -le ? "-0" : t;
			}
			function qa(e, t, n) {
				var r = -1, a = zn, o = e.length, s = !0, c = [], l = c;
				if (n) s = !1, a = Bn;
				else if (o >= i) {
					var u = t ? null : Vo(e);
					if (u) return wr(u);
					s = !1, a = ur, l = new di();
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
			function Ja(e, t) {
				t = no(t, e);
				var n = -1, r = t.length;
				if (!r) return !0;
				for (; ++n < r;) {
					var i = Bs(t[n]);
					if (i === "__proto__" && !k.call(e, "__proto__") || (i === "constructor" || i === "prototype") && n < r - 1) return !1;
				}
				var a = As(e, t);
				return a == null || delete a[Bs(mc(t))];
			}
			function Ya(e, t, n, r) {
				return Ia(e, t, n(Yi(e, t)), r);
			}
			function Xa(e, t, n, r) {
				for (var i = e.length, a = r ? i : -1; (r ? a-- : ++a < i) && t(e[a], a, e););
				return n ? Ba(e, r ? 0 : a, r ? a + 1 : i) : Ba(e, r ? a + 1 : 0, r ? i : a);
			}
			function Za(e, t) {
				var n = e;
				return n instanceof R && (n = n.value()), Hn(t, function(e, t) {
					return t.func.apply(t.thisArg, Vn([e], t.args));
				}, n);
			}
			function Qa(e, t, n) {
				var r = e.length;
				if (r < 2) return r ? qa(e[0]) : [];
				for (var i = -1, a = D(r); ++i < r;) for (var o = e[i], s = -1; ++s < r;) s != i && (a[i] = Li(a[i] || o, e[s], t, n));
				return qa(z(a, 1), t, n);
			}
			function $a(e, t, r) {
				for (var i = -1, a = e.length, o = t.length, s = {}; ++i < a;) {
					var c = i < o ? t[i] : n;
					r(s, e[i], c);
				}
				return s;
			}
			function eo(e) {
				return J(e) ? e : [];
			}
			function to(e) {
				return typeof e == "function" ? e : Mf;
			}
			function no(e, t) {
				return K(e) ? e : _s(e, t) ? [e] : zs(Q(e));
			}
			var ro = V;
			function io(e, t, r) {
				var i = e.length;
				return r = r === n ? i : r, !t && r >= i ? e : Ba(e, t, r);
			}
			var ao = tn || function(e) {
				return P.clearTimeout(e);
			};
			function oo(e, t) {
				if (t) return e.slice();
				var n = e.length, r = Kt ? Kt(n) : new e.constructor(n);
				return e.copy(r), r;
			}
			function so(e) {
				var t = new e.constructor(e.byteLength);
				return new Gt(t).set(new Gt(e)), t;
			}
			function co(e, t) {
				var n = t ? so(e.buffer) : e.buffer;
				return new e.constructor(n, e.byteOffset, e.byteLength);
			}
			function lo(e) {
				var t = new e.constructor(e.source, _t.exec(e));
				return t.lastIndex = e.lastIndex, t;
			}
			function uo(e) {
				return zr ? O(zr.call(e)) : {};
			}
			function fo(e, t) {
				var n = t ? so(e.buffer) : e.buffer;
				return new e.constructor(n, e.byteOffset, e.length);
			}
			function po(e, t) {
				if (e !== t) {
					var r = e !== n, i = e === null, a = e === e, o = Uu(e), s = t !== n, c = t === null, l = t === t, u = Uu(t);
					if (!c && !u && !o && e > t || o && s && l && !c && !u || i && s && l || !r && l || !a) return 1;
					if (!i && !o && !u && e < t || u && r && a && !i && !o || c && r && a || !s && a || !l) return -1;
				}
				return 0;
			}
			function mo(e, t, n) {
				for (var r = -1, i = e.criteria, a = t.criteria, o = i.length, s = n.length; ++r < o;) {
					var c = po(i[r], a[r]);
					if (c) return r >= s ? c : c * (n[r] == "desc" ? -1 : 1);
				}
				return e.index - t.index;
			}
			function ho(e, t, n, r) {
				for (var i = -1, a = e.length, o = n.length, s = -1, c = t.length, l = A(a - o, 0), u = D(c + l), d = !r; ++s < c;) u[s] = t[s];
				for (; ++i < o;) (d || i < a) && (u[n[i]] = e[i]);
				for (; l--;) u[s++] = e[i++];
				return u;
			}
			function go(e, t, n, r) {
				for (var i = -1, a = e.length, o = -1, s = n.length, c = -1, l = t.length, u = A(a - s, 0), d = D(u + l), f = !r; ++i < u;) d[i] = e[i];
				for (var p = i; ++c < l;) d[p + c] = t[c];
				for (; ++o < s;) (f || i < a) && (d[p + n[o]] = e[i++]);
				return d;
			}
			function H(e, t) {
				var n = -1, r = e.length;
				for (t ||= D(r); ++n < r;) t[n] = e[n];
				return t;
			}
			function _o(e, t, r, i) {
				var a = !r;
				r ||= {};
				for (var o = -1, s = t.length; ++o < s;) {
					var c = t[o], l = i ? i(r[c], e[c], c, r, e) : n;
					l === n && (l = e[c]), a ? Ai(r, c, l) : Ti(r, c, l);
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
					var i = K(n) ? Pn : Di, a = t ? t() : {};
					return i(n, e, U(r, 2), a);
				};
			}
			function xo(e) {
				return V(function(t, r) {
					var i = -1, a = r.length, o = a > 1 ? r[a - 1] : n, s = a > 2 ? r[2] : n;
					for (o = e.length > 3 && typeof o == "function" ? (a--, o) : n, s && G(r[0], r[1], s) && (o = a < 3 ? n : o, a = 1), t = O(t); ++i < a;) {
						var c = r[i];
						c && e(t, c, i, o);
					}
					return t;
				});
			}
			function So(e, t) {
				return function(n, r) {
					if (n == null) return n;
					if (!q(n)) return e(n, r);
					for (var i = n.length, a = t ? i : -1, o = O(n); (t ? a-- : ++a < i) && r(o[a], a, o) !== !1;);
					return n;
				};
			}
			function Co(e) {
				return function(t, n, r) {
					for (var i = -1, a = O(t), o = r(t), s = o.length; s--;) {
						var c = o[e ? s : ++i];
						if (n(a[c], c, a) === !1) break;
					}
					return t;
				};
			}
			function wo(e, t, n) {
				var r = t & _, i = Do(e);
				function a() {
					return (this && this !== P && this instanceof a ? i : e).apply(r ? n : this, arguments);
				}
				return a;
			}
			function To(e) {
				return function(t) {
					t = Q(t);
					var r = vr(t) ? kr(t) : n, i = r ? r[0] : t.charAt(0), a = r ? io(r, 1).join("") : t.slice(1);
					return i[e]() + a;
				};
			}
			function Eo(e) {
				return function(t) {
					return Hn(Cf(Yd(t).replace(ln, "")), e, "");
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
					var n = Vr(e.prototype), r = e.apply(n, t);
					return Y(r) ? r : n;
				};
			}
			function Oo(e, t, r) {
				var i = Do(e);
				function a() {
					for (var o = arguments.length, s = D(o), c = o, l = ts(a); c--;) s[c] = arguments[c];
					var u = o < 3 && s[0] !== l && s[o - 1] !== l ? [] : Cr(s, l);
					return o -= u.length, o < r ? zo(e, t, jo, a.placeholder, n, s, u, n, n, r - o) : Nn(this && this !== P && this instanceof a ? i : e, this, s);
				}
				return a;
			}
			function ko(e) {
				return function(t, r, i) {
					var a = O(t);
					if (!q(t)) {
						var o = U(r, 3);
						t = $(t), r = function(e) {
							return o(a[e], e, a);
						};
					}
					var s = e(t, r, i);
					return s > -1 ? a[o ? t[s] : s] : n;
				};
			}
			function Ao(e) {
				return Xo(function(t) {
					var r = t.length, i = r, a = Ur.prototype.thru;
					for (e && t.reverse(); i--;) {
						var s = t[i];
						if (typeof s != "function") throw new jt(o);
						if (a && !c && es(s) == "wrapper") var c = new Ur([], !0);
					}
					for (i = c ? i : r; ++i < r;) {
						s = t[i];
						var l = es(s), u = l == "wrapper" ? $o(s) : n;
						c = u && ys(u[0]) && u[1] == (w | b | S | ee) && !u[4].length && u[9] == 1 ? c[es(u[0])].apply(c, u[3]) : s.length == 1 && ys(s) ? c[l]() : c.thru(s);
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
				var d = t & w, f = t & _, p = t & v, m = t & (b | x), h = t & te, g = p ? n : Do(e);
				function y() {
					for (var n = arguments.length, _ = D(n), v = n; v--;) _[v] = arguments[v];
					if (m) var b = ts(y), x = pr(_, b);
					if (i && (_ = ho(_, i, a, m)), o && (_ = go(_, o, s, m)), n -= x, m && n < u) {
						var S = Cr(_, b);
						return zo(e, t, jo, y.placeholder, r, _, S, c, l, u - n);
					}
					var C = f ? r : this, w = p ? C[e] : e;
					return n = _.length, c ? _ = js(_, c) : h && n > 1 && _.reverse(), d && l < n && (_.length = l), this && this !== P && this instanceof y && (w = g || Do(w)), w.apply(C, _);
				}
				return y;
			}
			function Mo(e, t) {
				return function(n, r) {
					return na(n, e, t(r), {});
				};
			}
			function No(e, t) {
				return function(r, i) {
					var a;
					if (r === n && i === n) return t;
					if (r !== n && (a = r), i !== n) {
						if (a === n) return i;
						typeof r == "string" || typeof i == "string" ? (r = Ka(r), i = Ka(i)) : (r = Ga(r), i = Ga(i)), a = e(r, i);
					}
					return a;
				};
			}
			function Po(e) {
				return Xo(function(t) {
					return t = I(t, cr(U())), V(function(n) {
						var r = this;
						return e(t, function(e) {
							return Nn(e, r, n);
						});
					});
				});
			}
			function Fo(e, t) {
				t = t === n ? " " : Ka(t);
				var r = t.length;
				if (r < 2) return r ? Na(t, e) : t;
				var i = Na(t, an(e / Or(t)));
				return vr(t) ? io(kr(i), 0, e).join("") : i.slice(0, e);
			}
			function Io(e, t, n, r) {
				var i = t & _, a = Do(e);
				function o() {
					for (var t = -1, s = arguments.length, c = -1, l = r.length, u = D(l + s), d = this && this !== P && this instanceof o ? a : e; ++c < l;) u[c] = r[c];
					for (; s--;) u[c++] = arguments[++t];
					return Nn(d, i ? n : this, u);
				}
				return o;
			}
			function Lo(e) {
				return function(t, r, i) {
					return i && typeof i != "number" && G(t, r, i) && (r = i = n), t = Zu(t), r === n ? (r = t, t = 0) : r = Zu(r), i = i === n ? t < r ? 1 : -1 : Zu(i), Ma(t, r, i, e);
				};
			}
			function Ro(e) {
				return function(t, n) {
					return typeof t == "string" && typeof n == "string" || (t = $u(t), n = $u(n)), e(t, n);
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
				var t = Ot[e];
				return function(e, n) {
					if (e = $u(e), n = n == null ? 0 : N(Z(n), 292), n && dn(e)) {
						var r = (Q(e) + "e").split("e");
						return r = (Q(t(r[0] + "e" + (+r[1] + n))) + "e").split("e"), +(r[0] + "e" + (+r[1] - n));
					}
					return t(e);
				};
			}
			var Vo = En && 1 / wr(new En([, -0]))[1] == le ? function(e) {
				return new En(e);
			} : Bf;
			function Ho(e) {
				return function(t) {
					var n = W(t);
					return n == E ? xr(t) : n == je ? Tr(t) : or(t, e(t));
				};
			}
			function Uo(e, t, r, i, a, s, c, l) {
				var u = t & v;
				if (!u && typeof e != "function") throw new jt(o);
				var d = i ? i.length : 0;
				if (d || (t &= ~(S | C), i = a = n), c = c === n ? c : A(Z(c), 0), l = l === n ? l : Z(l), d -= a ? a.length : 0, t & C) {
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
				if (m && Es(h, m), e = h[0], t = h[1], r = h[2], i = h[3], a = h[4], l = h[9] = h[9] === n ? u ? 0 : e.length : A(h[9] - d, 0), !l && t & (b | x) && (t &= ~(b | x)), !t || t == _) var g = wo(e, t, r);
				else g = t == b || t == x ? Oo(e, t, l) : (t == S || t == (_ | S)) && !a.length ? Io(e, t, r, i) : jo.apply(n, h);
				return Is((m ? La : Ns)(g, h), e, t);
			}
			function Wo(e, t, r, i) {
				return e === n || pu(e, Pt[r]) && !k.call(i, r) ? t : e;
			}
			function Go(e, t, r, i, a, o) {
				return Y(e) && Y(t) && (o.set(t, e), Sa(e, t, n, Go, o), o.delete(t)), e;
			}
			function Ko(e) {
				return Ru(e) ? n : e;
			}
			function qo(e, t, r, i, a, o) {
				var s = r & h, c = e.length, l = t.length;
				if (c != l && !(s && l > c)) return !1;
				var u = o.get(e), d = o.get(t);
				if (u && d) return u == t && d == e;
				var f = -1, p = !0, m = r & g ? new di() : n;
				for (o.set(e, t), o.set(t, e); ++f < c;) {
					var _ = e[f], v = t[f];
					if (i) var y = s ? i(v, _, f, t, e, o) : i(_, v, f, e, t, o);
					if (y !== n) {
						if (y) continue;
						p = !1;
						break;
					}
					if (m) {
						if (!Wn(t, function(e, t) {
							if (!ur(m, t) && (_ === e || a(_, e, r, i, o))) return m.push(t);
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
					case Re:
						if (e.byteLength != t.byteLength || e.byteOffset != t.byteOffset) return !1;
						e = e.buffer, t = t.buffer;
					case Le: return !(e.byteLength != t.byteLength || !a(new Gt(e), new Gt(t)));
					case ye:
					case be:
					case Te: return pu(+e, +t);
					case Se: return e.name == t.name && e.message == t.message;
					case Ae:
					case Me: return e == t + "";
					case E: var s = xr;
					case je:
						var c = r & h;
						if (s ||= wr, e.size != t.size && !c) return !1;
						var l = o.get(e);
						if (l) return l == t;
						r |= g, o.set(e, t);
						var u = qo(s(e), s(t), r, i, a, o);
						return o.delete(e), u;
					case Ne: if (zr) return zr.call(e) == zr.call(t);
				}
				return !1;
			}
			function Yo(e, t, r, i, a, o) {
				var s = r & h, c = Zo(e), l = c.length;
				if (l != Zo(t).length && !s) return !1;
				for (var u = l; u--;) {
					var d = c[u];
					if (!(s ? d in t : k.call(t, d))) return !1;
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
				return Xi(e, $, os);
			}
			function Qo(e) {
				return Xi(e, wd, ss);
			}
			var $o = Kn ? function(e) {
				return Kn.get(e);
			} : Bf;
			function es(e) {
				for (var t = e.name + "", n = tr[t], r = k.call(tr, t) ? n.length : 0; r--;) {
					var i = n[r], a = i.func;
					if (a == null || a == e) return i.name;
				}
				return t;
			}
			function ts(e) {
				return (k.call(L, "placeholder") ? L : e).placeholder;
			}
			function U() {
				var e = L.iteratee || Nf;
				return e = e === Nf ? ha : e, arguments.length ? e(arguments[0], arguments[1]) : e;
			}
			function ns(e, t) {
				var n = e.__data__;
				return vs(t) ? n[typeof t == "string" ? "string" : "hash"] : n.map;
			}
			function rs(e) {
				for (var t = $(e), n = t.length; n--;) {
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
				var r = _r(e, t);
				return da(r) ? r : n;
			}
			function as(e) {
				var t = k.call(e, $t), r = e[$t];
				try {
					e[$t] = n;
					var i = !0;
				} catch {}
				var a = zt.call(e);
				return i && (t ? e[$t] = r : delete e[$t]), a;
			}
			var os = sn ? function(e) {
				return e == null ? [] : (e = O(e), Rn(sn(e), function(t) {
					return Yt.call(e, t);
				}));
			} : Yf, ss = sn ? function(e) {
				for (var t = []; e;) Vn(t, os(e)), e = qt(e);
				return t;
			} : Yf, W = B;
			(Sn && W(new Sn(/* @__PURE__ */ new ArrayBuffer(1))) != Re || Cn && W(new Cn()) != E || wn && W(wn.resolve()) != Oe || En && W(new En()) != je || F && W(new F()) != Fe) && (W = function(e) {
				var t = B(e), r = t == De ? e.constructor : n, i = r ? Vs(r) : "";
				if (i) switch (i) {
					case Er: return Re;
					case Mr: return E;
					case Nr: return Oe;
					case Ir: return je;
					case Lr: return Fe;
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
							t = N(t, e + o);
							break;
						case "takeRight":
							e = A(e, t - o);
							break;
					}
				}
				return {
					start: e,
					end: t
				};
			}
			function ls(e) {
				var t = e.match(dt);
				return t ? t[1].split(ft) : [];
			}
			function us(e, t, n) {
				t = no(t, e);
				for (var r = -1, i = t.length, a = !1; ++r < i;) {
					var o = Bs(t[r]);
					if (!(a = e != null && n(e, o))) break;
					e = e[o];
				}
				return a || ++r != i ? a : (i = e == null ? 0 : e.length, !!i && ku(i) && gs(o, i) && (K(e) || gu(e)));
			}
			function ds(e) {
				var t = e.length, n = new e.constructor(t);
				return t && typeof e[0] == "string" && k.call(e, "index") && (n.index = e.index, n.input = e.input), n;
			}
			function fs(e) {
				return typeof e.constructor == "function" && !Ss(e) ? Vr(qt(e)) : {};
			}
			function ps(e, t, n) {
				var r = e.constructor;
				switch (t) {
					case Le: return so(e);
					case ye:
					case be: return new r(+e);
					case Re: return co(e, n);
					case ze:
					case Be:
					case Ve:
					case He:
					case Ue:
					case We:
					case Ge:
					case Ke:
					case qe: return fo(e, n);
					case E: return new r();
					case Te:
					case Me: return new r(e);
					case Ae: return lo(e);
					case je: return new r();
					case Ne: return uo(e);
				}
			}
			function ms(e, t) {
				var n = t.length;
				if (!n) return e;
				var r = n - 1;
				return t[r] = (n > 1 ? "& " : "") + t[r], t = t.join(n > 2 ? ", " : " "), e.replace(ut, "{\n/* [wrapped with " + t + "] */\n");
			}
			function hs(e) {
				return K(e) || gu(e) || !!(Zt && e && e[Zt]);
			}
			function gs(e, t) {
				var n = typeof e;
				return t ??= ue, !!t && (n == "number" || n != "symbol" && St.test(e)) && e > -1 && e % 1 == 0 && e < t;
			}
			function G(e, t, n) {
				if (!Y(n)) return !1;
				var r = typeof t;
				return (r == "number" ? q(n) && gs(t, n.length) : r == "string" && t in n) ? pu(n[t], e) : !1;
			}
			function _s(e, t) {
				if (K(e)) return !1;
				var n = typeof e;
				return n == "number" || n == "symbol" || n == "boolean" || e == null || Uu(e) ? !0 : at.test(e) || !it.test(e) || t != null && e in O(t);
			}
			function vs(e) {
				var t = typeof e;
				return t == "string" || t == "number" || t == "symbol" || t == "boolean" ? e !== "__proto__" : e === null;
			}
			function ys(e) {
				var t = es(e), n = L[t];
				if (typeof n != "function" || !(t in R.prototype)) return !1;
				if (e === n) return !0;
				var r = $o(n);
				return !!r && e === r[0];
			}
			function bs(e) {
				return !!Rt && Rt in e;
			}
			var xs = Ft ? Du : Xf;
			function Ss(e) {
				var t = e && e.constructor;
				return e === (typeof t == "function" && t.prototype || Pt);
			}
			function Cs(e) {
				return e === e && !Y(e);
			}
			function ws(e, t) {
				return function(r) {
					return r == null ? !1 : r[e] === t && (t !== n || e in O(r));
				};
			}
			function Ts(e) {
				var t = Yl(e, function(e) {
					return n.size === u && n.clear(), e;
				}), n = t.cache;
				return t;
			}
			function Es(e, t) {
				var n = e[1], r = t[1], i = n | r, a = i < (_ | v | w), o = r == w && n == b || r == w && n == ee && e[7].length <= t[8] || r == (w | ee) && t[7].length <= t[8] && n == b;
				if (!(a || o)) return e;
				r & _ && (e[2] = t[2], i |= n & _ ? 0 : y);
				var s = t[3];
				if (s) {
					var c = e[3];
					e[3] = c ? ho(c, s, t[4]) : s, e[4] = c ? Cr(e[3], d) : t[4];
				}
				return s = t[5], s && (c = e[5], e[5] = c ? go(c, s, t[6]) : s, e[6] = c ? Cr(e[5], d) : t[6]), s = t[7], s && (e[7] = s), r & w && (e[8] = e[8] == null ? t[8] : N(e[8], t[8])), e[9] ??= t[9], e[0] = t[0], e[1] = i, e;
			}
			function Ds(e) {
				var t = [];
				if (e != null) for (var n in O(e)) t.push(n);
				return t;
			}
			function Os(e) {
				return zt.call(e);
			}
			function ks(e, t, r) {
				return t = A(t === n ? e.length - 1 : t, 0), function() {
					for (var n = arguments, i = -1, a = A(n.length - t, 0), o = D(a); ++i < a;) o[i] = n[t + i];
					i = -1;
					for (var s = D(t + 1); ++i < t;) s[i] = n[i];
					return s[t] = r(o), Nn(e, this, s);
				};
			}
			function As(e, t) {
				return t.length < 2 ? e : Yi(e, Ba(t, 0, -1));
			}
			function js(e, t) {
				for (var r = e.length, i = N(t.length, r), a = H(e); i--;) {
					var o = t[i];
					e[i] = gs(o, r) ? a[o] : n;
				}
				return e;
			}
			function Ms(e, t) {
				if (!(t === "constructor" && typeof e[t] == "function") && t != "__proto__") return e[t];
			}
			var Ns = Ls(La), Ps = rn || function(e, t) {
				return P.setTimeout(e, t);
			}, Fs = Ls(Ra);
			function Is(e, t, n) {
				var r = t + "";
				return Fs(e, ms(r, Hs(ls(r), n)));
			}
			function Ls(e) {
				var t = 0, r = 0;
				return function() {
					var i = gn(), a = ae - (i - r);
					if (r = i, a > 0) {
						if (++t >= ie) return arguments[0];
					} else t = 0;
					return e.apply(n, arguments);
				};
			}
			function Rs(e, t) {
				var r = -1, i = e.length, a = i - 1;
				for (t = t === n ? i : t; ++r < t;) {
					var o = ja(r, a), s = e[o];
					e[o] = e[r], e[r] = s;
				}
				return e.length = t, e;
			}
			var zs = Ts(function(e) {
				var t = [];
				return e.charCodeAt(0) === 46 && t.push(""), e.replace(ot, function(e, n, r, i) {
					t.push(r ? i.replace(ht, "$1") : n || e);
				}), t;
			});
			function Bs(e) {
				if (typeof e == "string" || Uu(e)) return e;
				var t = e + "";
				return t == "0" && 1 / e == -le ? "-0" : t;
			}
			function Vs(e) {
				if (e != null) {
					try {
						return It.call(e);
					} catch {}
					try {
						return e + "";
					} catch {}
				}
				return "";
			}
			function Hs(e, t) {
				return Fn(he, function(n) {
					var r = "_." + n[0];
					t & n[1] && !zn(e, r) && e.push(r);
				}), e.sort();
			}
			function Us(e) {
				if (e instanceof R) return e.clone();
				var t = new Ur(e.__wrapped__, e.__chain__);
				return t.__actions__ = H(e.__actions__), t.__index__ = e.__index__, t.__values__ = e.__values__, t;
			}
			function Ws(e, t, r) {
				t = (r ? G(e, t, r) : t === n) ? 1 : A(Z(t), 0);
				var i = e == null ? 0 : e.length;
				if (!i || t < 1) return [];
				for (var a = 0, o = 0, s = D(an(i / t)); a < i;) s[o++] = Ba(e, a, a += t);
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
				for (var t = D(e - 1), n = arguments[0], r = e; r--;) t[r - 1] = arguments[r];
				return Vn(K(n) ? H(n) : [n], z(t, 1));
			}
			var qs = V(function(e, t) {
				return J(e) ? Li(e, z(t, 1, J, !0)) : [];
			}), Js = V(function(e, t) {
				var r = mc(t);
				return J(r) && (r = n), J(e) ? Li(e, z(t, 1, J, !0), U(r, 2)) : [];
			}), Ys = V(function(e, t) {
				var r = mc(t);
				return J(r) && (r = n), J(e) ? Li(e, z(t, 1, J, !0), n, r) : [];
			});
			function Xs(e, t, r) {
				var i = e == null ? 0 : e.length;
				return i ? (t = r || t === n ? 1 : Z(t), Ba(e, t < 0 ? 0 : t, i)) : [];
			}
			function Zs(e, t, r) {
				var i = e == null ? 0 : e.length;
				return i ? (t = r || t === n ? 1 : Z(t), t = i - t, Ba(e, 0, t < 0 ? 0 : t)) : [];
			}
			function Qs(e, t) {
				return e && e.length ? Xa(e, U(t, 3), !0, !0) : [];
			}
			function $s(e, t) {
				return e && e.length ? Xa(e, U(t, 3), !0) : [];
			}
			function ec(e, t, n, r) {
				var i = e == null ? 0 : e.length;
				return i ? (n && typeof n != "number" && G(e, t, n) && (n = 0, r = i), Hi(e, t, n, r)) : [];
			}
			function tc(e, t, n) {
				var r = e == null ? 0 : e.length;
				if (!r) return -1;
				var i = n == null ? 0 : Z(n);
				return i < 0 && (i = A(r + i, 0)), Yn(e, U(t, 3), i);
			}
			function nc(e, t, r) {
				var i = e == null ? 0 : e.length;
				if (!i) return -1;
				var a = i - 1;
				return r !== n && (a = Z(r), a = r < 0 ? A(i + a, 0) : N(a, i - 1)), Yn(e, U(t, 3), a, !0);
			}
			function rc(e) {
				return e != null && e.length ? z(e, 1) : [];
			}
			function ic(e) {
				return e != null && e.length ? z(e, le) : [];
			}
			function ac(e, t) {
				return e != null && e.length ? (t = t === n ? 1 : Z(t), z(e, t)) : [];
			}
			function oc(e) {
				for (var t = -1, n = e == null ? 0 : e.length, r = {}; ++t < n;) {
					var i = e[t];
					Ai(r, i[0], i[1]);
				}
				return r;
			}
			function sc(e) {
				return e && e.length ? e[0] : n;
			}
			function cc(e, t, n) {
				var r = e == null ? 0 : e.length;
				if (!r) return -1;
				var i = n == null ? 0 : Z(n);
				return i < 0 && (i = A(r + i, 0)), Xn(e, t, i);
			}
			function lc(e) {
				return e != null && e.length ? Ba(e, 0, -1) : [];
			}
			var uc = V(function(e) {
				var t = I(e, eo);
				return t.length && t[0] === e[0] ? ta(t) : [];
			}), dc = V(function(e) {
				var t = mc(e), r = I(e, eo);
				return t === mc(r) ? t = n : r.pop(), r.length && r[0] === e[0] ? ta(r, U(t, 2)) : [];
			}), fc = V(function(e) {
				var t = mc(e), r = I(e, eo);
				return t = typeof t == "function" ? t : n, t && r.pop(), r.length && r[0] === e[0] ? ta(r, n, t) : [];
			});
			function pc(e, t) {
				return e == null ? "" : fn.call(e, t);
			}
			function mc(e) {
				var t = e == null ? 0 : e.length;
				return t ? e[t - 1] : n;
			}
			function hc(e, t, r) {
				var i = e == null ? 0 : e.length;
				if (!i) return -1;
				var a = i;
				return r !== n && (a = Z(r), a = a < 0 ? A(i + a, 0) : N(a, i - 1)), t === t ? Dr(e, t, a) : Yn(e, Qn, a, !0);
			}
			function gc(e, t) {
				return e && e.length ? wa(e, Z(t)) : n;
			}
			var _c = V(vc);
			function vc(e, t) {
				return e && e.length && t && t.length ? ka(e, t) : e;
			}
			function yc(e, t, n) {
				return e && e.length && t && t.length ? ka(e, t, U(n, 2)) : e;
			}
			function bc(e, t, r) {
				return e && e.length && t && t.length ? ka(e, t, n, r) : e;
			}
			var xc = Xo(function(e, t) {
				var n = e == null ? 0 : e.length, r = ji(e, t);
				return Aa(e, I(t, function(e) {
					return gs(e, n) ? +e : e;
				}).sort(po)), r;
			});
			function Sc(e, t) {
				var n = [];
				if (!(e && e.length)) return n;
				var r = -1, i = [], a = e.length;
				for (t = U(t, 3); ++r < a;) {
					var o = e[r];
					t(o, r, e) && (n.push(o), i.push(r));
				}
				return Aa(e, i), n;
			}
			function Cc(e) {
				return e == null ? e : xn.call(e);
			}
			function wc(e, t, r) {
				var i = e == null ? 0 : e.length;
				return i ? (r && typeof r != "number" && G(e, t, r) ? (t = 0, r = i) : (t = t == null ? 0 : Z(t), r = r === n ? i : Z(r)), Ba(e, t, r)) : [];
			}
			function Tc(e, t) {
				return Ha(e, t);
			}
			function Ec(e, t, n) {
				return Ua(e, t, U(n, 2));
			}
			function Dc(e, t) {
				var n = e == null ? 0 : e.length;
				if (n) {
					var r = Ha(e, t);
					if (r < n && pu(e[r], t)) return r;
				}
				return -1;
			}
			function Oc(e, t) {
				return Ha(e, t, !0);
			}
			function kc(e, t, n) {
				return Ua(e, t, U(n, 2), !0);
			}
			function Ac(e, t) {
				if (e != null && e.length) {
					var n = Ha(e, t, !0) - 1;
					if (pu(e[n], t)) return n;
				}
				return -1;
			}
			function jc(e) {
				return e && e.length ? Wa(e) : [];
			}
			function Mc(e, t) {
				return e && e.length ? Wa(e, U(t, 2)) : [];
			}
			function Nc(e) {
				var t = e == null ? 0 : e.length;
				return t ? Ba(e, 1, t) : [];
			}
			function Pc(e, t, r) {
				return e && e.length ? (t = r || t === n ? 1 : Z(t), Ba(e, 0, t < 0 ? 0 : t)) : [];
			}
			function Fc(e, t, r) {
				var i = e == null ? 0 : e.length;
				return i ? (t = r || t === n ? 1 : Z(t), t = i - t, Ba(e, t < 0 ? 0 : t, i)) : [];
			}
			function Ic(e, t) {
				return e && e.length ? Xa(e, U(t, 3), !1, !0) : [];
			}
			function Lc(e, t) {
				return e && e.length ? Xa(e, U(t, 3)) : [];
			}
			var Rc = V(function(e) {
				return qa(z(e, 1, J, !0));
			}), zc = V(function(e) {
				var t = mc(e);
				return J(t) && (t = n), qa(z(e, 1, J, !0), U(t, 2));
			}), Bc = V(function(e) {
				var t = mc(e);
				return t = typeof t == "function" ? t : n, qa(z(e, 1, J, !0), n, t);
			});
			function Vc(e) {
				return e && e.length ? qa(e) : [];
			}
			function Hc(e, t) {
				return e && e.length ? qa(e, U(t, 2)) : [];
			}
			function Uc(e, t) {
				return t = typeof t == "function" ? t : n, e && e.length ? qa(e, n, t) : [];
			}
			function Wc(e) {
				if (!(e && e.length)) return [];
				var t = 0;
				return e = Rn(e, function(e) {
					if (J(e)) return t = A(e.length, t), !0;
				}), ar(t, function(t) {
					return I(e, er(t));
				});
			}
			function Gc(e, t) {
				if (!(e && e.length)) return [];
				var r = Wc(e);
				return t == null ? r : I(r, function(e) {
					return Nn(t, n, e);
				});
			}
			var Kc = V(function(e, t) {
				return J(e) ? Li(e, t) : [];
			}), qc = V(function(e) {
				return Qa(Rn(e, J));
			}), Jc = V(function(e) {
				var t = mc(e);
				return J(t) && (t = n), Qa(Rn(e, J), U(t, 2));
			}), Yc = V(function(e) {
				var t = mc(e);
				return t = typeof t == "function" ? t : n, Qa(Rn(e, J), n, t);
			}), Xc = V(Wc);
			function Zc(e, t) {
				return $a(e || [], t || [], Ti);
			}
			function Qc(e, t) {
				return $a(e || [], t || [], Ia);
			}
			var $c = V(function(e) {
				var t = e.length, r = t > 1 ? e[t - 1] : n;
				return r = typeof r == "function" ? (e.pop(), r) : n, Gc(e, r);
			});
			function el(e) {
				var t = L(e);
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
					return ji(t, e);
				};
				return t > 1 || this.__actions__.length || !(i instanceof R) || !gs(r) ? this.thru(a) : (i = i.slice(r, +r + +!!t), i.__actions__.push({
					func: nl,
					args: [a],
					thisArg: n
				}), new Ur(i, this.__chain__).thru(function(e) {
					return t && !e.length && e.push(n), e;
				}));
			});
			function il() {
				return el(this);
			}
			function al() {
				return new Ur(this.value(), this.__chain__);
			}
			function ol() {
				this.__values__ === n && (this.__values__ = Xu(this.value()));
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
				for (var t, r = this; r instanceof Hr;) {
					var i = Us(r);
					i.__index__ = 0, i.__values__ = n, t ? a.__wrapped__ = i : t = i;
					var a = i;
					r = r.__wrapped__;
				}
				return a.__wrapped__ = e, t;
			}
			function ll() {
				var e = this.__wrapped__;
				if (e instanceof R) {
					var t = e;
					return this.__actions__.length && (t = new R(this)), t = t.reverse(), t.__actions__.push({
						func: nl,
						args: [Cc],
						thisArg: n
					}), new Ur(t, this.__chain__);
				}
				return this.thru(Cc);
			}
			function ul() {
				return Za(this.__wrapped__, this.__actions__);
			}
			var dl = bo(function(e, t, n) {
				k.call(e, n) ? ++e[n] : Ai(e, n, 1);
			});
			function fl(e, t, r) {
				var i = K(e) ? Ln : Bi;
				return r && G(e, t, r) && (t = n), i(e, U(t, 3));
			}
			function pl(e, t) {
				return (K(e) ? Rn : Ui)(e, U(t, 3));
			}
			var ml = ko(tc), hl = ko(nc);
			function gl(e, t) {
				return z(Tl(e, t), 1);
			}
			function _l(e, t) {
				return z(Tl(e, t), le);
			}
			function vl(e, t, r) {
				return r = r === n ? 1 : Z(r), z(Tl(e, t), r);
			}
			function yl(e, t) {
				return (K(e) ? Fn : Ri)(e, U(t, 3));
			}
			function bl(e, t) {
				return (K(e) ? In : zi)(e, U(t, 3));
			}
			var xl = bo(function(e, t, n) {
				k.call(e, n) ? e[n].push(t) : Ai(e, n, [t]);
			});
			function Sl(e, t, n, r) {
				e = q(e) ? e : Hd(e), n = n && !r ? Z(n) : 0;
				var i = e.length;
				return n < 0 && (n = A(i + n, 0)), Hu(e) ? n <= i && e.indexOf(t, n) > -1 : !!i && Xn(e, t, n) > -1;
			}
			var Cl = V(function(e, t, n) {
				var r = -1, i = typeof t == "function", a = q(e) ? D(e.length) : [];
				return Ri(e, function(e) {
					a[++r] = i ? Nn(t, e, n) : ra(e, t, n);
				}), a;
			}), wl = bo(function(e, t, n) {
				Ai(e, n, t);
			});
			function Tl(e, t) {
				return (K(e) ? I : ya)(e, U(t, 3));
			}
			function El(e, t, r, i) {
				return e == null ? [] : (K(t) || (t = t == null ? [] : [t]), r = i ? n : r, K(r) || (r = r == null ? [] : [r]), Ta(e, t, r));
			}
			var Dl = bo(function(e, t, n) {
				e[+!n].push(t);
			}, function() {
				return [[], []];
			});
			function Ol(e, t, n) {
				var r = K(e) ? Hn : nr, i = arguments.length < 3;
				return r(e, U(t, 4), n, i, Ri);
			}
			function kl(e, t, n) {
				var r = K(e) ? Un : nr, i = arguments.length < 3;
				return r(e, U(t, 4), n, i, zi);
			}
			function Al(e, t) {
				return (K(e) ? Rn : Ui)(e, Xl(U(t, 3)));
			}
			function jl(e) {
				return (K(e) ? xi : Pa)(e);
			}
			function Ml(e, t, r) {
				return t = (r ? G(e, t, r) : t === n) ? 1 : Z(t), (K(e) ? Si : Fa)(e, t);
			}
			function Nl(e) {
				return (K(e) ? Ci : za)(e);
			}
			function Pl(e) {
				if (e == null) return 0;
				if (q(e)) return Hu(e) ? Or(e) : e.length;
				var t = W(e);
				return t == E || t == je ? e.size : ga(e).length;
			}
			function Fl(e, t, r) {
				var i = K(e) ? Wn : Va;
				return r && G(e, t, r) && (t = n), i(e, U(t, 3));
			}
			var Il = V(function(e, t) {
				if (e == null) return [];
				var n = t.length;
				return n > 1 && G(e, t[0], t[1]) ? t = [] : n > 2 && G(t[0], t[1], t[2]) && (t = [t[0]]), Ta(e, z(t, 1), []);
			}), Ll = nn || function() {
				return P.Date.now();
			};
			function Rl(e, t) {
				if (typeof t != "function") throw new jt(o);
				return e = Z(e), function() {
					if (--e < 1) return t.apply(this, arguments);
				};
			}
			function zl(e, t, r) {
				return t = r ? n : t, t = e && t == null ? e.length : t, Uo(e, w, n, n, n, n, t);
			}
			function Bl(e, t) {
				var r;
				if (typeof t != "function") throw new jt(o);
				return e = Z(e), function() {
					return --e > 0 && (r = t.apply(this, arguments)), e <= 1 && (t = n), r;
				};
			}
			var Vl = V(function(e, t, n) {
				var r = _;
				if (n.length) {
					var i = Cr(n, ts(Vl));
					r |= S;
				}
				return Uo(e, r, t, n, i);
			}), Hl = V(function(e, t, n) {
				var r = _ | v;
				if (n.length) {
					var i = Cr(n, ts(Hl));
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
				if (typeof e != "function") throw new jt(o);
				t = $u(t) || 0, Y(r) && (f = !!r.leading, p = "maxWait" in r, s = p ? A($u(r.maxWait) || 0, t) : s, m = "trailing" in r ? !!r.trailing : m);
				function h(t) {
					var r = i, o = a;
					return i = a = n, d = t, c = e.apply(o, r), c;
				}
				function g(e) {
					return d = e, l = Ps(y, t), f ? h(e) : c;
				}
				function _(e) {
					var n = e - u, r = e - d, i = t - n;
					return p ? N(i, s - r) : i;
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
					l !== n && ao(l), d = 0, i = u = a = l = n;
				}
				function S() {
					return l === n ? c : b(Ll());
				}
				function C() {
					var e = Ll(), r = v(e);
					if (i = arguments, a = this, u = e, r) {
						if (l === n) return g(u);
						if (p) return ao(l), l = Ps(y, t), h(u);
					}
					return l === n && (l = Ps(y, t)), c;
				}
				return C.cancel = x, C.flush = S, C;
			}
			var Kl = V(function(e, t) {
				return Ii(e, 1, t);
			}), ql = V(function(e, t, n) {
				return Ii(e, $u(t) || 0, n);
			});
			function Jl(e) {
				return Uo(e, te);
			}
			function Yl(e, t) {
				if (typeof e != "function" || t != null && typeof t != "function") throw new jt(o);
				var n = function() {
					var r = arguments, i = t ? t.apply(this, r) : r[0], a = n.cache;
					if (a.has(i)) return a.get(i);
					var o = e.apply(this, r);
					return n.cache = a.set(i, o) || a, o;
				};
				return n.cache = new (Yl.Cache || ai)(), n;
			}
			Yl.Cache = ai;
			function Xl(e) {
				if (typeof e != "function") throw new jt(o);
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
			var Ql = ro(function(e, t) {
				t = t.length == 1 && K(t[0]) ? I(t[0], cr(U())) : I(z(t, 1), cr(U()));
				var n = t.length;
				return V(function(r) {
					for (var i = -1, a = N(r.length, n); ++i < a;) r[i] = t[i].call(this, r[i]);
					return Nn(e, this, r);
				});
			}), $l = V(function(e, t) {
				return Uo(e, S, n, t, Cr(t, ts($l)));
			}), eu = V(function(e, t) {
				return Uo(e, C, n, t, Cr(t, ts(eu)));
			}), tu = Xo(function(e, t) {
				return Uo(e, ee, n, n, n, t);
			});
			function nu(e, t) {
				if (typeof e != "function") throw new jt(o);
				return t = t === n ? t : Z(t), V(e, t);
			}
			function ru(e, t) {
				if (typeof e != "function") throw new jt(o);
				return t = t == null ? 0 : A(Z(t), 0), V(function(n) {
					var r = n[t], i = io(n, 0, t);
					return r && Vn(i, r), Nn(e, this, i);
				});
			}
			function iu(e, t, n) {
				var r = !0, i = !0;
				if (typeof e != "function") throw new jt(o);
				return Y(n) && (r = "leading" in n ? !!n.leading : r, i = "trailing" in n ? !!n.trailing : i), Gl(e, t, {
					leading: r,
					maxWait: t,
					trailing: i
				});
			}
			function au(e) {
				return zl(e, 1);
			}
			function ou(e, t) {
				return $l(to(t), e);
			}
			function su() {
				if (!arguments.length) return [];
				var e = arguments[0];
				return K(e) ? e : [e];
			}
			function cu(e) {
				return Ni(e, m);
			}
			function lu(e, t) {
				return t = typeof t == "function" ? t : n, Ni(e, m, t);
			}
			function uu(e) {
				return Ni(e, f | m);
			}
			function du(e, t) {
				return t = typeof t == "function" ? t : n, Ni(e, f | m, t);
			}
			function fu(e, t) {
				return t == null || Fi(e, t, $(t));
			}
			function pu(e, t) {
				return e === t || e !== e && t !== t;
			}
			var mu = Ro(Zi), hu = Ro(function(e, t) {
				return e >= t;
			}), gu = ia(function() {
				return arguments;
			}()) ? ia : function(e) {
				return X(e) && k.call(e, "callee") && !Yt.call(e, "callee");
			}, K = D.isArray, _u = Dn ? cr(Dn) : aa;
			function q(e) {
				return e != null && ku(e.length) && !Du(e);
			}
			function J(e) {
				return X(e) && q(e);
			}
			function vu(e) {
				return e === !0 || e === !1 || X(e) && B(e) == ye;
			}
			var yu = cn || Xf, bu = On ? cr(On) : oa;
			function xu(e) {
				return X(e) && e.nodeType === 1 && !Ru(e);
			}
			function Su(e) {
				if (e == null) return !0;
				if (q(e) && (K(e) || typeof e == "string" || typeof e.splice == "function" || yu(e) || Wu(e) || gu(e))) return !e.length;
				var t = W(e);
				if (t == E || t == je) return !e.size;
				if (Ss(e)) return !ga(e).length;
				for (var n in e) if (k.call(e, n)) return !1;
				return !0;
			}
			function Cu(e, t) {
				return sa(e, t);
			}
			function wu(e, t, r) {
				r = typeof r == "function" ? r : n;
				var i = r ? r(e, t) : n;
				return i === n ? sa(e, t, n, r) : !!i;
			}
			function Tu(e) {
				if (!X(e)) return !1;
				var t = B(e);
				return t == Se || t == xe || typeof e.message == "string" && typeof e.name == "string" && !Ru(e);
			}
			function Eu(e) {
				return typeof e == "number" && dn(e);
			}
			function Du(e) {
				if (!Y(e)) return !1;
				var t = B(e);
				return t == Ce || t == we || t == ve || t == ke;
			}
			function Ou(e) {
				return typeof e == "number" && e == Z(e);
			}
			function ku(e) {
				return typeof e == "number" && e > -1 && e % 1 == 0 && e <= ue;
			}
			function Y(e) {
				var t = typeof e;
				return e != null && (t == "object" || t == "function");
			}
			function X(e) {
				return typeof e == "object" && !!e;
			}
			var Au = kn ? cr(kn) : la;
			function ju(e, t) {
				return e === t || ua(e, t, rs(t));
			}
			function Mu(e, t, r) {
				return r = typeof r == "function" ? r : n, ua(e, t, rs(t), r);
			}
			function Nu(e) {
				return Lu(e) && e != +e;
			}
			function Pu(e) {
				if (xs(e)) throw new Et(a);
				return da(e);
			}
			function Fu(e) {
				return e === null;
			}
			function Iu(e) {
				return e == null;
			}
			function Lu(e) {
				return typeof e == "number" || X(e) && B(e) == Te;
			}
			function Ru(e) {
				if (!X(e) || B(e) != De) return !1;
				var t = qt(e);
				if (t === null) return !0;
				var n = k.call(t, "constructor") && t.constructor;
				return typeof n == "function" && n instanceof n && It.call(n) == Bt;
			}
			var zu = An ? cr(An) : fa;
			function Bu(e) {
				return Ou(e) && e >= -ue && e <= ue;
			}
			var Vu = jn ? cr(jn) : pa;
			function Hu(e) {
				return typeof e == "string" || !K(e) && X(e) && B(e) == Me;
			}
			function Uu(e) {
				return typeof e == "symbol" || X(e) && B(e) == Ne;
			}
			var Wu = Mn ? cr(Mn) : ma;
			function Gu(e) {
				return e === n;
			}
			function Ku(e) {
				return X(e) && W(e) == Fe;
			}
			function qu(e) {
				return X(e) && B(e) == Ie;
			}
			var Ju = Ro(va), Yu = Ro(function(e, t) {
				return e <= t;
			});
			function Xu(e) {
				if (!e) return [];
				if (q(e)) return Hu(e) ? kr(e) : H(e);
				if (Qt && e[Qt]) return br(e[Qt]());
				var t = W(e);
				return (t == E ? xr : t == je ? wr : Hd)(e);
			}
			function Zu(e) {
				return e ? (e = $u(e), e === le || e === -le ? (e < 0 ? -1 : 1) * de : e === e ? e : 0) : e === 0 ? e : 0;
			}
			function Z(e) {
				var t = Zu(e), n = t % 1;
				return t === t ? n ? t - n : t : 0;
			}
			function Qu(e) {
				return e ? Mi(Z(e), 0, T) : 0;
			}
			function $u(e) {
				if (typeof e == "number") return e;
				if (Uu(e)) return fe;
				if (Y(e)) {
					var t = typeof e.valueOf == "function" ? e.valueOf() : e;
					e = Y(t) ? t + "" : t;
				}
				if (typeof e != "string") return e === 0 ? e : +e;
				e = sr(e);
				var n = yt.test(e);
				return n || xt.test(e) ? bn(e.slice(2), n ? 2 : 8) : vt.test(e) ? fe : +e;
			}
			function ed(e) {
				return _o(e, wd(e));
			}
			function td(e) {
				return e ? Mi(Z(e), -ue, ue) : e === 0 ? e : 0;
			}
			function Q(e) {
				return e == null ? "" : Ka(e);
			}
			var nd = xo(function(e, t) {
				if (Ss(t) || q(t)) {
					_o(t, $(t), e);
					return;
				}
				for (var n in t) k.call(t, n) && Ti(e, n, t[n]);
			}), rd = xo(function(e, t) {
				_o(t, wd(t), e);
			}), id = xo(function(e, t, n, r) {
				_o(t, wd(t), e, r);
			}), ad = xo(function(e, t, n, r) {
				_o(t, $(t), e, r);
			}), od = Xo(ji);
			function sd(e, t) {
				var n = Vr(e);
				return t == null ? n : Oi(n, t);
			}
			var cd = V(function(e, t) {
				e = O(e);
				var r = -1, i = t.length, a = i > 2 ? t[2] : n;
				for (a && G(t[0], t[1], a) && (i = 1); ++r < i;) for (var o = t[r], s = wd(o), c = -1, l = s.length; ++c < l;) {
					var u = s[c], d = e[u];
					(d === n || pu(d, Pt[u]) && !k.call(e, u)) && (e[u] = o[u]);
				}
				return e;
			}), ld = V(function(e) {
				return e.push(n, Go), Nn(Od, n, e);
			});
			function ud(e, t) {
				return Jn(e, U(t, 3), Ki);
			}
			function dd(e, t) {
				return Jn(e, U(t, 3), qi);
			}
			function fd(e, t) {
				return e == null ? e : Wi(e, U(t, 3), wd);
			}
			function pd(e, t) {
				return e == null ? e : Gi(e, U(t, 3), wd);
			}
			function md(e, t) {
				return e && Ki(e, U(t, 3));
			}
			function hd(e, t) {
				return e && qi(e, U(t, 3));
			}
			function gd(e) {
				return e == null ? [] : Ji(e, $(e));
			}
			function _d(e) {
				return e == null ? [] : Ji(e, wd(e));
			}
			function vd(e, t, r) {
				var i = e == null ? n : Yi(e, t);
				return i === n ? r : i;
			}
			function yd(e, t) {
				return e != null && us(e, t, Qi);
			}
			function bd(e, t) {
				return e != null && us(e, t, $i);
			}
			var xd = Mo(function(e, t, n) {
				t != null && typeof t.toString != "function" && (t = zt.call(t)), e[t] = n;
			}, Of(Mf)), Sd = Mo(function(e, t, n) {
				t != null && typeof t.toString != "function" && (t = zt.call(t)), k.call(e, t) ? e[t].push(n) : e[t] = [n];
			}, U), Cd = V(ra);
			function $(e) {
				return q(e) ? bi(e) : ga(e);
			}
			function wd(e) {
				return q(e) ? bi(e, !0) : _a(e);
			}
			function Td(e, t) {
				var n = {};
				return t = U(t, 3), Ki(e, function(e, r, i) {
					Ai(n, t(e, r, i), e);
				}), n;
			}
			function Ed(e, t) {
				var n = {};
				return t = U(t, 3), Ki(e, function(e, r, i) {
					Ai(n, r, t(e, r, i));
				}), n;
			}
			var Dd = xo(function(e, t, n) {
				Sa(e, t, n);
			}), Od = xo(function(e, t, n, r) {
				Sa(e, t, n, r);
			}), kd = Xo(function(e, t) {
				var n = {};
				if (e == null) return n;
				var r = !1;
				t = I(t, function(t) {
					return t = no(t, e), r ||= t.length > 1, t;
				}), _o(e, Qo(e), n), r && (n = Ni(n, f | p | m, Ko));
				for (var i = t.length; i--;) Ja(n, t[i]);
				return n;
			});
			function Ad(e, t) {
				return Md(e, Xl(U(t)));
			}
			var jd = Xo(function(e, t) {
				return e == null ? {} : Ea(e, t);
			});
			function Md(e, t) {
				if (e == null) return {};
				var n = I(Qo(e), function(e) {
					return [e];
				});
				return t = U(t), Da(e, n, function(e, n) {
					return t(e, n[0]);
				});
			}
			function Nd(e, t, r) {
				t = no(t, e);
				var i = -1, a = t.length;
				for (a || (a = 1, e = n); ++i < a;) {
					var o = e == null ? n : e[Bs(t[i])];
					o === n && (i = a, o = r), e = Du(o) ? o.call(e) : o;
				}
				return e;
			}
			function Pd(e, t, n) {
				return e == null ? e : Ia(e, t, n);
			}
			function Fd(e, t, r, i) {
				return i = typeof i == "function" ? i : n, e == null ? e : Ia(e, t, r, i);
			}
			var Id = Ho($), Ld = Ho(wd);
			function Rd(e, t, n) {
				var r = K(e), i = r || yu(e) || Wu(e);
				if (t = U(t, 4), n == null) {
					var a = e && e.constructor;
					n = i ? r ? new a() : [] : Y(e) && Du(a) ? Vr(qt(e)) : {};
				}
				return (i ? Fn : Ki)(e, function(e, r, i) {
					return t(n, e, r, i);
				}), n;
			}
			function zd(e, t) {
				return e == null ? !0 : Ja(e, t);
			}
			function Bd(e, t, n) {
				return e == null ? e : Ya(e, t, to(n));
			}
			function Vd(e, t, r, i) {
				return i = typeof i == "function" ? i : n, e == null ? e : Ya(e, t, to(r), i);
			}
			function Hd(e) {
				return e == null ? [] : lr(e, $(e));
			}
			function Ud(e) {
				return e == null ? [] : lr(e, wd(e));
			}
			function Wd(e, t, r) {
				return r === n && (r = t, t = n), r !== n && (r = $u(r), r = r === r ? r : 0), t !== n && (t = $u(t), t = t === t ? t : 0), Mi($u(e), t, r);
			}
			function Gd(e, t, r) {
				return t = Zu(t), r === n ? (r = t, t = 0) : r = Zu(r), e = $u(e), ea(e, t, r);
			}
			function Kd(e, t, r) {
				if (r && typeof r != "boolean" && G(e, t, r) && (t = r = n), r === n && (typeof t == "boolean" ? (r = t, t = n) : typeof e == "boolean" && (r = e, e = n)), e === n && t === n ? (e = 0, t = 1) : (e = Zu(e), t === n ? (t = e, e = 0) : t = Zu(t)), e > t) {
					var i = e;
					e = t, t = i;
				}
				if (r || e % 1 || t % 1) {
					var a = vn();
					return N(e + a * (t - e + yn("1e-" + ((a + "").length - 1))), t);
				}
				return ja(e, t);
			}
			var qd = Eo(function(e, t, n) {
				return t = t.toLowerCase(), e + (n ? Jd(t) : t);
			});
			function Jd(e) {
				return Sf(Q(e).toLowerCase());
			}
			function Yd(e) {
				return e = Q(e), e && e.replace(Ct, mr).replace(un, "");
			}
			function Xd(e, t, r) {
				e = Q(e), t = Ka(t);
				var i = e.length;
				r = r === n ? i : Mi(Z(r), 0, i);
				var a = r;
				return r -= t.length, r >= 0 && e.slice(r, a) == t;
			}
			function Zd(e) {
				return e = Q(e), e && et.test(e) ? e.replace(Qe, hr) : e;
			}
			function Qd(e) {
				return e = Q(e), e && ct.test(e) ? e.replace(st, "\\$&") : e;
			}
			var $d = Eo(function(e, t, n) {
				return e + (n ? "-" : "") + t.toLowerCase();
			}), ef = Eo(function(e, t, n) {
				return e + (n ? " " : "") + t.toLowerCase();
			}), tf = To("toLowerCase");
			function nf(e, t, n) {
				e = Q(e), t = Z(t);
				var r = t ? Or(e) : 0;
				if (!t || r >= t) return e;
				var i = (t - r) / 2;
				return Fo(on(i), n) + e + Fo(an(i), n);
			}
			function rf(e, t, n) {
				e = Q(e), t = Z(t);
				var r = t ? Or(e) : 0;
				return t && r < t ? e + Fo(t - r, n) : e;
			}
			function af(e, t, n) {
				e = Q(e), t = Z(t);
				var r = t ? Or(e) : 0;
				return t && r < t ? Fo(t - r, n) + e : e;
			}
			function of(e, t, n) {
				return n || t == null ? t = 0 : t &&= +t, _n(Q(e).replace(lt, ""), t || 0);
			}
			function sf(e, t, r) {
				return t = (r ? G(e, t, r) : t === n) ? 1 : Z(t), Na(Q(e), t);
			}
			function cf() {
				var e = arguments, t = Q(e[0]);
				return e.length < 3 ? t : t.replace(e[1], e[2]);
			}
			var lf = Eo(function(e, t, n) {
				return e + (n ? "_" : "") + t.toLowerCase();
			});
			function uf(e, t, r) {
				return r && typeof r != "number" && G(e, t, r) && (t = r = n), r = r === n ? T : r >>> 0, r ? (e = Q(e), e && (typeof t == "string" || t != null && !zu(t)) && (t = Ka(t), !t && vr(e)) ? io(kr(e), 0, r) : e.split(t, r)) : [];
			}
			var df = Eo(function(e, t, n) {
				return e + (n ? " " : "") + Sf(t);
			});
			function ff(e, t, n) {
				return e = Q(e), n = n == null ? 0 : Mi(Z(n), 0, e.length), t = Ka(t), e.slice(n, n + t.length) == t;
			}
			function pf(e, t, r) {
				var i = L.templateSettings;
				r && G(e, t, r) && (t = n), e = Q(e), t = ad({}, t, i, Wo);
				var a = ad({}, t.imports, i.imports, Wo), o = $(a), l = lr(a, o);
				Fn(o, function(e) {
					if (mt.test(e)) throw new Et(c);
				});
				var u, d, f = 0, p = t.interpolate || wt, m = "__p += '", h = kt((t.escape || wt).source + "|" + p.source + "|" + (p === rt ? gt : wt).source + "|" + (t.evaluate || wt).source + "|$", "g"), g = "//# sourceURL=" + (k.call(t, "sourceURL") ? (t.sourceURL + "").replace(/\s/g, " ") : "lodash.templateSources[" + ++hn + "]") + "\n";
				e.replace(h, function(t, n, r, i, a, o) {
					return r ||= i, m += e.slice(f, o).replace(Tt, gr), n && (u = !0, m += "' +\n__e(" + n + ") +\n'"), a && (d = !0, m += "';\n" + a + ";\n__p += '"), r && (m += "' +\n((__t = (" + r + ")) == null ? '' : __t) +\n'"), f = o + t.length, t;
				}), m += "';\n";
				var _ = k.call(t, "variable") && t.variable;
				if (!_) m = "with (obj) {\n" + m + "\n}\n";
				else if (mt.test(_)) throw new Et(s);
				m = (d ? m.replace(Je, "") : m).replace(Ye, "$1").replace(Xe, "$1;"), m = "function(" + (_ || "obj") + ") {\n" + (_ ? "" : "obj || (obj = {});\n") + "var __t, __p = ''" + (u ? ", __e = _.escape" : "") + (d ? ", __j = Array.prototype.join;\nfunction print() { __p += __j.call(arguments, '') }\n" : ";\n") + m + "return __p\n}";
				var v = wf(function() {
					return Dt(o, g + "return " + m).apply(n, l);
				});
				if (v.source = m, Tu(v)) throw v;
				return v;
			}
			function mf(e) {
				return Q(e).toLowerCase();
			}
			function hf(e) {
				return Q(e).toUpperCase();
			}
			function gf(e, t, r) {
				if (e = Q(e), e && (r || t === n)) return sr(e);
				if (!e || !(t = Ka(t))) return e;
				var i = kr(e), a = kr(t);
				return io(i, dr(i, a), fr(i, a) + 1).join("");
			}
			function _f(e, t, r) {
				if (e = Q(e), e && (r || t === n)) return e.slice(0, Ar(e) + 1);
				if (!e || !(t = Ka(t))) return e;
				var i = kr(e);
				return io(i, 0, fr(i, kr(t)) + 1).join("");
			}
			function vf(e, t, r) {
				if (e = Q(e), e && (r || t === n)) return e.replace(lt, "");
				if (!e || !(t = Ka(t))) return e;
				var i = kr(e);
				return io(i, dr(i, kr(t))).join("");
			}
			function yf(e, t) {
				var r = ne, i = re;
				if (Y(t)) {
					var a = "separator" in t ? t.separator : a;
					r = "length" in t ? Z(t.length) : r, i = "omission" in t ? Ka(t.omission) : i;
				}
				e = Q(e);
				var o = e.length;
				if (vr(e)) {
					var s = kr(e);
					o = s.length;
				}
				if (r >= o) return e;
				var c = r - Or(i);
				if (c < 1) return i;
				var l = s ? io(s, 0, c).join("") : e.slice(0, c);
				if (a === n) return l + i;
				if (s && (c += l.length - c), zu(a)) {
					if (e.slice(c).search(a)) {
						var u, d = l;
						for (a.global || (a = kt(a.source, Q(_t.exec(a)) + "g")), a.lastIndex = 0; u = a.exec(d);) var f = u.index;
						l = l.slice(0, f === n ? c : f);
					}
				} else if (e.indexOf(Ka(a), c) != c) {
					var p = l.lastIndexOf(a);
					p > -1 && (l = l.slice(0, p));
				}
				return l + i;
			}
			function bf(e) {
				return e = Q(e), e && $e.test(e) ? e.replace(Ze, jr) : e;
			}
			var xf = Eo(function(e, t, n) {
				return e + (n ? " " : "") + t.toUpperCase();
			}), Sf = To("toUpperCase");
			function Cf(e, t, r) {
				return e = Q(e), t = r ? n : t, t === n ? yr(e) ? Pr(e) : qn(e) : e.match(t) || [];
			}
			var wf = V(function(e, t) {
				try {
					return Nn(e, n, t);
				} catch (e) {
					return Tu(e) ? e : new Et(e);
				}
			}), Tf = Xo(function(e, t) {
				return Fn(t, function(t) {
					t = Bs(t), Ai(e, t, Vl(e[t], e));
				}), e;
			});
			function Ef(e) {
				var t = e == null ? 0 : e.length, n = U();
				return e = t ? I(e, function(e) {
					if (typeof e[1] != "function") throw new jt(o);
					return [n(e[0]), e[1]];
				}) : [], V(function(n) {
					for (var r = -1; ++r < t;) {
						var i = e[r];
						if (Nn(i[0], this, n)) return Nn(i[1], this, n);
					}
				});
			}
			function Df(e) {
				return Pi(Ni(e, f));
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
				return ha(typeof e == "function" ? e : Ni(e, f));
			}
			function Pf(e) {
				return ba(Ni(e, f));
			}
			function Ff(e, t) {
				return xa(e, Ni(t, f));
			}
			var If = V(function(e, t) {
				return function(n) {
					return ra(n, e, t);
				};
			}), Lf = V(function(e, t) {
				return function(n) {
					return ra(e, n, t);
				};
			});
			function Rf(e, t, n) {
				var r = $(t), i = Ji(t, r);
				n == null && !(Y(t) && (i.length || !r.length)) && (n = t, t = e, e = this, i = Ji(t, $(t)));
				var a = !(Y(n) && "chain" in n) || !!n.chain, o = Du(e);
				return Fn(i, function(n) {
					var r = t[n];
					e[n] = r, o && (e.prototype[n] = function() {
						var t = this.__chain__;
						if (a || t) {
							var n = e(this.__wrapped__);
							return (n.__actions__ = H(this.__actions__)).push({
								func: r,
								args: arguments,
								thisArg: e
							}), n.__chain__ = t, n;
						}
						return r.apply(e, Vn([this.value()], arguments));
					});
				}), e;
			}
			function zf() {
				return P._ === this && (P._ = Vt), this;
			}
			function Bf() {}
			function Vf(e) {
				return e = Z(e), V(function(t) {
					return wa(t, e);
				});
			}
			var Hf = Po(I), Uf = Po(Ln), Wf = Po(Wn);
			function Gf(e) {
				return _s(e) ? er(Bs(e)) : Oa(e);
			}
			function Kf(e) {
				return function(t) {
					return e == null ? n : Yi(e, t);
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
				if (e = Z(e), e < 1 || e > ue) return [];
				var n = T, r = N(e, T);
				t = U(t), e -= T;
				for (var i = ar(r, t); ++n < e;) t(n);
				return i;
			}
			function tp(e) {
				return K(e) ? I(e, Bs) : Uu(e) ? [e] : H(zs(Q(e)));
			}
			function np(e) {
				var t = ++Lt;
				return Q(e) + t;
			}
			var rp = No(function(e, t) {
				return e + t;
			}, 0), ip = Bo("ceil"), ap = No(function(e, t) {
				return e / t;
			}, 1), op = Bo("floor");
			function sp(e) {
				return e && e.length ? Vi(e, Mf, Zi) : n;
			}
			function cp(e, t) {
				return e && e.length ? Vi(e, U(t, 2), Zi) : n;
			}
			function lp(e) {
				return $n(e, Mf);
			}
			function up(e, t) {
				return $n(e, U(t, 2));
			}
			function dp(e) {
				return e && e.length ? Vi(e, Mf, va) : n;
			}
			function fp(e, t) {
				return e && e.length ? Vi(e, U(t, 2), va) : n;
			}
			var pp = No(function(e, t) {
				return e * t;
			}, 1), mp = Bo("round"), hp = No(function(e, t) {
				return e - t;
			}, 0);
			function gp(e) {
				return e && e.length ? ir(e, Mf) : 0;
			}
			function _p(e, t) {
				return e && e.length ? ir(e, U(t, 2)) : 0;
			}
			return L.after = Rl, L.ary = zl, L.assign = nd, L.assignIn = rd, L.assignInWith = id, L.assignWith = ad, L.at = od, L.before = Bl, L.bind = Vl, L.bindAll = Tf, L.bindKey = Hl, L.castArray = su, L.chain = el, L.chunk = Ws, L.compact = Gs, L.concat = Ks, L.cond = Ef, L.conforms = Df, L.constant = Of, L.countBy = dl, L.create = sd, L.curry = Ul, L.curryRight = Wl, L.debounce = Gl, L.defaults = cd, L.defaultsDeep = ld, L.defer = Kl, L.delay = ql, L.difference = qs, L.differenceBy = Js, L.differenceWith = Ys, L.drop = Xs, L.dropRight = Zs, L.dropRightWhile = Qs, L.dropWhile = $s, L.fill = ec, L.filter = pl, L.flatMap = gl, L.flatMapDeep = _l, L.flatMapDepth = vl, L.flatten = rc, L.flattenDeep = ic, L.flattenDepth = ac, L.flip = Jl, L.flow = Af, L.flowRight = jf, L.fromPairs = oc, L.functions = gd, L.functionsIn = _d, L.groupBy = xl, L.initial = lc, L.intersection = uc, L.intersectionBy = dc, L.intersectionWith = fc, L.invert = xd, L.invertBy = Sd, L.invokeMap = Cl, L.iteratee = Nf, L.keyBy = wl, L.keys = $, L.keysIn = wd, L.map = Tl, L.mapKeys = Td, L.mapValues = Ed, L.matches = Pf, L.matchesProperty = Ff, L.memoize = Yl, L.merge = Dd, L.mergeWith = Od, L.method = If, L.methodOf = Lf, L.mixin = Rf, L.negate = Xl, L.nthArg = Vf, L.omit = kd, L.omitBy = Ad, L.once = Zl, L.orderBy = El, L.over = Hf, L.overArgs = Ql, L.overEvery = Uf, L.overSome = Wf, L.partial = $l, L.partialRight = eu, L.partition = Dl, L.pick = jd, L.pickBy = Md, L.property = Gf, L.propertyOf = Kf, L.pull = _c, L.pullAll = vc, L.pullAllBy = yc, L.pullAllWith = bc, L.pullAt = xc, L.range = qf, L.rangeRight = Jf, L.rearg = tu, L.reject = Al, L.remove = Sc, L.rest = nu, L.reverse = Cc, L.sampleSize = Ml, L.set = Pd, L.setWith = Fd, L.shuffle = Nl, L.slice = wc, L.sortBy = Il, L.sortedUniq = jc, L.sortedUniqBy = Mc, L.split = uf, L.spread = ru, L.tail = Nc, L.take = Pc, L.takeRight = Fc, L.takeRightWhile = Ic, L.takeWhile = Lc, L.tap = tl, L.throttle = iu, L.thru = nl, L.toArray = Xu, L.toPairs = Id, L.toPairsIn = Ld, L.toPath = tp, L.toPlainObject = ed, L.transform = Rd, L.unary = au, L.union = Rc, L.unionBy = zc, L.unionWith = Bc, L.uniq = Vc, L.uniqBy = Hc, L.uniqWith = Uc, L.unset = zd, L.unzip = Wc, L.unzipWith = Gc, L.update = Bd, L.updateWith = Vd, L.values = Hd, L.valuesIn = Ud, L.without = Kc, L.words = Cf, L.wrap = ou, L.xor = qc, L.xorBy = Jc, L.xorWith = Yc, L.zip = Xc, L.zipObject = Zc, L.zipObjectDeep = Qc, L.zipWith = $c, L.entries = Id, L.entriesIn = Ld, L.extend = rd, L.extendWith = id, Rf(L, L), L.add = rp, L.attempt = wf, L.camelCase = qd, L.capitalize = Jd, L.ceil = ip, L.clamp = Wd, L.clone = cu, L.cloneDeep = uu, L.cloneDeepWith = du, L.cloneWith = lu, L.conformsTo = fu, L.deburr = Yd, L.defaultTo = kf, L.divide = ap, L.endsWith = Xd, L.eq = pu, L.escape = Zd, L.escapeRegExp = Qd, L.every = fl, L.find = ml, L.findIndex = tc, L.findKey = ud, L.findLast = hl, L.findLastIndex = nc, L.findLastKey = dd, L.floor = op, L.forEach = yl, L.forEachRight = bl, L.forIn = fd, L.forInRight = pd, L.forOwn = md, L.forOwnRight = hd, L.get = vd, L.gt = mu, L.gte = hu, L.has = yd, L.hasIn = bd, L.head = sc, L.identity = Mf, L.includes = Sl, L.indexOf = cc, L.inRange = Gd, L.invoke = Cd, L.isArguments = gu, L.isArray = K, L.isArrayBuffer = _u, L.isArrayLike = q, L.isArrayLikeObject = J, L.isBoolean = vu, L.isBuffer = yu, L.isDate = bu, L.isElement = xu, L.isEmpty = Su, L.isEqual = Cu, L.isEqualWith = wu, L.isError = Tu, L.isFinite = Eu, L.isFunction = Du, L.isInteger = Ou, L.isLength = ku, L.isMap = Au, L.isMatch = ju, L.isMatchWith = Mu, L.isNaN = Nu, L.isNative = Pu, L.isNil = Iu, L.isNull = Fu, L.isNumber = Lu, L.isObject = Y, L.isObjectLike = X, L.isPlainObject = Ru, L.isRegExp = zu, L.isSafeInteger = Bu, L.isSet = Vu, L.isString = Hu, L.isSymbol = Uu, L.isTypedArray = Wu, L.isUndefined = Gu, L.isWeakMap = Ku, L.isWeakSet = qu, L.join = pc, L.kebabCase = $d, L.last = mc, L.lastIndexOf = hc, L.lowerCase = ef, L.lowerFirst = tf, L.lt = Ju, L.lte = Yu, L.max = sp, L.maxBy = cp, L.mean = lp, L.meanBy = up, L.min = dp, L.minBy = fp, L.stubArray = Yf, L.stubFalse = Xf, L.stubObject = Zf, L.stubString = Qf, L.stubTrue = $f, L.multiply = pp, L.nth = gc, L.noConflict = zf, L.noop = Bf, L.now = Ll, L.pad = nf, L.padEnd = rf, L.padStart = af, L.parseInt = of, L.random = Kd, L.reduce = Ol, L.reduceRight = kl, L.repeat = sf, L.replace = cf, L.result = Nd, L.round = mp, L.runInContext = e, L.sample = jl, L.size = Pl, L.snakeCase = lf, L.some = Fl, L.sortedIndex = Tc, L.sortedIndexBy = Ec, L.sortedIndexOf = Dc, L.sortedLastIndex = Oc, L.sortedLastIndexBy = kc, L.sortedLastIndexOf = Ac, L.startCase = df, L.startsWith = ff, L.subtract = hp, L.sum = gp, L.sumBy = _p, L.template = pf, L.times = ep, L.toFinite = Zu, L.toInteger = Z, L.toLength = Qu, L.toLower = mf, L.toNumber = $u, L.toSafeInteger = td, L.toString = Q, L.toUpper = hf, L.trim = gf, L.trimEnd = _f, L.trimStart = vf, L.truncate = yf, L.unescape = bf, L.uniqueId = np, L.upperCase = xf, L.upperFirst = Sf, L.each = yl, L.eachRight = bl, L.first = sc, Rf(L, function() {
				var e = {};
				return Ki(L, function(t, n) {
					k.call(L.prototype, n) || (e[n] = t);
				}), e;
			}(), { chain: !1 }), L.VERSION = r, Fn([
				"bind",
				"bindKey",
				"curry",
				"curryRight",
				"partial",
				"partialRight"
			], function(e) {
				L[e].placeholder = L;
			}), Fn(["drop", "take"], function(e, t) {
				R.prototype[e] = function(r) {
					r = r === n ? 1 : A(Z(r), 0);
					var i = this.__filtered__ && !t ? new R(this) : this.clone();
					return i.__filtered__ ? i.__takeCount__ = N(r, i.__takeCount__) : i.__views__.push({
						size: N(r, T),
						type: e + (i.__dir__ < 0 ? "Right" : "")
					}), i;
				}, R.prototype[e + "Right"] = function(t) {
					return this.reverse()[e](t).reverse();
				};
			}), Fn([
				"filter",
				"map",
				"takeWhile"
			], function(e, t) {
				var n = t + 1, r = n == oe || n == ce;
				R.prototype[e] = function(e) {
					var t = this.clone();
					return t.__iteratees__.push({
						iteratee: U(e, 3),
						type: n
					}), t.__filtered__ = t.__filtered__ || r, t;
				};
			}), Fn(["head", "last"], function(e, t) {
				var n = "take" + (t ? "Right" : "");
				R.prototype[e] = function() {
					return this[n](1).value()[0];
				};
			}), Fn(["initial", "tail"], function(e, t) {
				var n = "drop" + (t ? "" : "Right");
				R.prototype[e] = function() {
					return this.__filtered__ ? new R(this) : this[n](1);
				};
			}), R.prototype.compact = function() {
				return this.filter(Mf);
			}, R.prototype.find = function(e) {
				return this.filter(e).head();
			}, R.prototype.findLast = function(e) {
				return this.reverse().find(e);
			}, R.prototype.invokeMap = V(function(e, t) {
				return typeof e == "function" ? new R(this) : this.map(function(n) {
					return ra(n, e, t);
				});
			}), R.prototype.reject = function(e) {
				return this.filter(Xl(U(e)));
			}, R.prototype.slice = function(e, t) {
				e = Z(e);
				var r = this;
				return r.__filtered__ && (e > 0 || t < 0) ? new R(r) : (e < 0 ? r = r.takeRight(-e) : e && (r = r.drop(e)), t !== n && (t = Z(t), r = t < 0 ? r.dropRight(-t) : r.take(t - e)), r);
			}, R.prototype.takeRightWhile = function(e) {
				return this.reverse().takeWhile(e).reverse();
			}, R.prototype.toArray = function() {
				return this.take(T);
			}, Ki(R.prototype, function(e, t) {
				var r = /^(?:filter|find|map|reject)|While$/.test(t), i = /^(?:head|last)$/.test(t), a = L[i ? "take" + (t == "last" ? "Right" : "") : t], o = i || /^find/.test(t);
				a && (L.prototype[t] = function() {
					var t = this.__wrapped__, s = i ? [1] : arguments, c = t instanceof R, l = s[0], u = c || K(t), d = function(e) {
						var t = a.apply(L, Vn([e], s));
						return i && f ? t[0] : t;
					};
					u && r && typeof l == "function" && l.length != 1 && (c = u = !1);
					var f = this.__chain__, p = !!this.__actions__.length, m = o && !f, h = c && !p;
					if (!o && u) {
						t = h ? t : new R(this);
						var g = e.apply(t, s);
						return g.__actions__.push({
							func: nl,
							args: [d],
							thisArg: n
						}), new Ur(g, f);
					}
					return m && h ? e.apply(this, s) : (g = this.thru(d), m ? i ? g.value()[0] : g.value() : g);
				});
			}), Fn([
				"pop",
				"push",
				"shift",
				"sort",
				"splice",
				"unshift"
			], function(e) {
				var t = Mt[e], n = /^(?:push|sort|unshift)$/.test(e) ? "tap" : "thru", r = /^(?:pop|shift)$/.test(e);
				L.prototype[e] = function() {
					var e = arguments;
					if (r && !this.__chain__) {
						var i = this.value();
						return t.apply(K(i) ? i : [], e);
					}
					return this[n](function(n) {
						return t.apply(K(n) ? n : [], e);
					});
				};
			}), Ki(R.prototype, function(e, t) {
				var n = L[t];
				if (n) {
					var r = n.name + "";
					k.call(tr, r) || (tr[r] = []), tr[r].push({
						name: t,
						func: n
					});
				}
			}), tr[jo(n, v).name] = [{
				name: "wrapper",
				func: n
			}], R.prototype.clone = Wr, R.prototype.reverse = Gr, R.prototype.value = Kr, L.prototype.at = rl, L.prototype.chain = il, L.prototype.commit = al, L.prototype.next = ol, L.prototype.plant = cl, L.prototype.reverse = ll, L.prototype.toJSON = L.prototype.valueOf = L.prototype.value = ul, L.prototype.first = L.prototype.head, Qt && (L.prototype[Qt] = sl), L;
		})();
		typeof define == "function" && typeof define.amd == "object" && define.amd ? (P._ = Fr, define(function() {
			return Fr;
		})) : wn ? ((wn.exports = Fr)._ = Fr, Cn._ = Fr) : P._ = Fr;
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
}, ee = new w("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
function te(e) {
	return ee.Encode(e);
}
function ne(e) {
	return ee.Decode(e);
}
new w("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_", !0);
//#endregion
//#region src/utils/general.ts
function re(e) {
	let t = e.replace(/#/, "").toLocaleLowerCase().padEnd(8, "f"), n = parseInt(t.substring(0, 2), 16), r = parseInt(t.substring(2, 4), 16), i = parseInt(t.substring(4, 6), 16), a = parseInt(t.substring(6, 8), 16);
	return new Uint8Array([
		n,
		r,
		i,
		a
	]);
}
function ie(e) {
	return e.charAt(0) === ";" ? [";", ...e.slice(2).split(";")] : e.split(";");
}
//#endregion
//#region src/utils/debug.ts
var ae = /* @__PURE__ */ new Set();
function oe(e, t) {
	ae.has(t) || (ae.add(t), console[e](t));
}
//#endregion
//#region src/classes/Phoxelis.ts
var se = 255, ce = "// Vertex Shader\nattribute vec4 a_position;\nvarying vec2 v_position;\n\nvoid main() {\n  v_position = a_position.xy;\n  gl_Position = a_position;\n}\n", le = "// Fragment Shader\nprecision highp float;\nvarying vec2 v_position;\nuniform sampler2D u_paletteTexture;\nuniform sampler2D u_phoxelLayerTexture;\nuniform vec2 u_canvasSize;\nuniform vec2 u_fontSize;\nuniform float u_paletteSize;\nuniform float u_layerOpacity;\n\nvoid main() {\n  vec2 unPos = (v_position + 1.0) / 2.0;\n  vec2 mirroredPos = vec2(unPos.x, 1.0 - unPos.y);\n  vec2 gridSize = u_canvasSize / u_fontSize;\n\n  vec4 phoxId = texture2D(u_phoxelLayerTexture, mirroredPos);\n  vec2 phoxelPixelPos = fract(mirroredPos * gridSize);\n  float regisPhoxelHeightPos = ((phoxId.r * u_paletteSize) + phoxelPixelPos.y) / u_paletteSize;\n  vec2 uv = vec2(phoxelPixelPos.x, regisPhoxelHeightPos);\n\n  vec4 color = texture2D(u_paletteTexture, uv);\n  gl_FragColor = vec4(color.r * u_layerOpacity, color.g * u_layerOpacity, color.b * u_layerOpacity, color.a * u_layerOpacity);\n}\n";
function ue(e, t, n, r = {}) {
	let { createBaseLayer: i, renderPalette: a, paletteDirection: o } = {
		createBaseLayer: !0,
		renderPalette: !1,
		paletteDirection: "left",
		...r
	}, s = n.width * (se - 1), c = document.createElement("canvas"), l = c.getContext("2d");
	c.width = n.width * t, c.height = n.height * e;
	let u = [], d = {};
	function f(n = crypto.randomUUID()) {
		return u.find((e) => e.id === n) ? (console.error(`addLayer error: Layer with ID ${n} already exists. Skipping creation.`), n) : (d[n] = u.push({
			id: n,
			buffer: new Uint8Array(e * t).fill(0)
		}) - 1, n);
	}
	i && f();
	function p(e) {
		return u[d[e]];
	}
	function m() {
		Object.keys(d).forEach((e) => delete d[e]), u.forEach((e, t) => d[e.id] = t);
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
		let t = p(e), n = {};
		t.buffer.forEach((e) => {
			e > 0 && x[e] && (n[e] || (n[e] = x[e]), Fe(e));
		});
		let r = u.splice(d[e], 1);
		return m(), {
			layer: r[0],
			phoxes: n
		};
	}
	function _(n) {
		if (!n) {
			console.error("loadLayer error: No layer to load");
			return;
		}
		let { layer: r, phoxes: i } = n, a = f(r.id);
		for (let n = 0; n < e; n++) for (let e = 0; e < t; e++) {
			let o = n * t + e, s = r.buffer[o];
			if (s === 0) continue;
			let [c, l, u] = ie(i[s]);
			Ne(c, l, u, n, e, a);
		}
	}
	let v = document.createElement("canvas"), y = v.getContext("2d");
	v.width = s, v.height = n.height;
	let b = document.createElement("canvas");
	b.width = a ? Math.max(v.width, c.width) : c.width, b.height = c.height;
	let x = [null], w = {};
	function ee() {
		let e = /* @__PURE__ */ new Set();
		e.add(0), u.forEach((t) => {
			t.buffer.forEach((t) => {
				e.add(t);
			});
		}), x.forEach((t, n) => {
			e.has(n) || je(n);
		});
	}
	function ae(e) {
		let t = x[e];
		if (t) {
			let [e, n, r] = ie(t);
			return {
				char: e,
				fg: n,
				bg: r
			};
		}
		return null;
	}
	function ue(e, n, r) {
		let i = p(r);
		if (!i) return oe("warn", `getPhoxFromPosition error: Could not find layer by id ${r}`), null;
		let a = i.buffer[e * t + n];
		return ae(a);
	}
	function de() {
		return {
			size: {
				rows: e,
				cols: t
			},
			palette: x,
			layers: u.map((e) => ({
				...e,
				buffer: te(e.buffer.buffer)
			}))
		};
	}
	function fe(n) {
		(n.size.cols !== t || n.size.rows !== e) && console.warn("Imported Phoxelis and target Phoxelis have mismatching sizes. Unexpected behavior might occur.");
		let r = n.layers.map((e) => ({
			...e,
			buffer: new Uint8Array(ne(e.buffer))
		})), i = n.palette.map((e) => typeof e == "string" ? ie(e) : e);
		Le(), r.forEach((e, t) => {
			f(e.id);
			for (let r = 0; r < n.size.rows; r++) for (let a = 0; a < n.size.cols; a++) {
				let o = e.buffer[r * n.size.cols + a];
				if (!i[o]) Pe(r, a, u[t].id);
				else {
					let [e, n, s] = i[o];
					Ne(e, n, s, r, a, u[t].id);
				}
			}
		});
	}
	let T = b.getContext("webgl");
	if (!T || !l || !y) throw alert("WebGL/Canvas2d not supported"), Error("No WebGL or Canvas API");
	let pe = C(T, S(T, T.VERTEX_SHADER, ce), S(T, T.FRAGMENT_SHADER, le)), me = T.getAttribLocation(pe, "a_position"), he = T.createBuffer();
	T.bindBuffer(T.ARRAY_BUFFER, he);
	let ge = [
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
	T.bufferData(T.ARRAY_BUFFER, new Float32Array(ge), T.STATIC_DRAW);
	let _e = T.getUniformLocation(pe, "u_paletteTexture"), ve = T.getUniformLocation(pe, "u_phoxelLayerTexture"), ye = T.getUniformLocation(pe, "u_canvasSize"), be = T.getUniformLocation(pe, "u_fontSize"), xe = T.getUniformLocation(pe, "u_paletteSize"), Se = T.getUniformLocation(pe, "u_layerOpacity"), Ce = n.height * se, we = new Uint8Array(n.width * Ce * 4).fill(0), E = T.createTexture();
	T.bindTexture(T.TEXTURE_2D, E), T.texImage2D(T.TEXTURE_2D, 0, T.RGBA, n.width, Ce, 0, T.RGBA, T.UNSIGNED_BYTE, we), T.texParameteri(T.TEXTURE_2D, T.TEXTURE_MAG_FILTER, T.NEAREST), T.texParameteri(T.TEXTURE_2D, T.TEXTURE_MIN_FILTER, T.NEAREST), T.texParameteri(T.TEXTURE_2D, T.TEXTURE_WRAP_S, T.CLAMP_TO_EDGE), T.texParameteri(T.TEXTURE_2D, T.TEXTURE_WRAP_T, T.CLAMP_TO_EDGE);
	let Te = new Uint8Array(e * t).fill(0), Ee = T.createTexture();
	T.bindTexture(T.TEXTURE_2D, Ee), T.pixelStorei(T.UNPACK_ALIGNMENT, 1), T.texImage2D(T.TEXTURE_2D, 0, T.LUMINANCE, t, e, 0, T.LUMINANCE, T.UNSIGNED_BYTE, Te), T.texParameteri(T.TEXTURE_2D, T.TEXTURE_MAG_FILTER, T.NEAREST), T.texParameteri(T.TEXTURE_2D, T.TEXTURE_MIN_FILTER, T.NEAREST), T.texParameteri(T.TEXTURE_2D, T.TEXTURE_WRAP_S, T.CLAMP_TO_EDGE), T.texParameteri(T.TEXTURE_2D, T.TEXTURE_WRAP_T, T.CLAMP_TO_EDGE), T.pixelStorei(T.UNPACK_ALIGNMENT, 4);
	let De = new Uint8Array(254).fill(0).map((e, t) => o === "right" ? t + 1 : 254 - t), Oe = T.createTexture();
	T.bindTexture(T.TEXTURE_2D, Oe), T.pixelStorei(T.UNPACK_ALIGNMENT, 1), T.texImage2D(T.TEXTURE_2D, 0, T.LUMINANCE, 254, 1, 0, T.LUMINANCE, T.UNSIGNED_BYTE, De), T.texParameteri(T.TEXTURE_2D, T.TEXTURE_MAG_FILTER, T.NEAREST), T.texParameteri(T.TEXTURE_2D, T.TEXTURE_MIN_FILTER, T.NEAREST), T.texParameteri(T.TEXTURE_2D, T.TEXTURE_WRAP_S, T.CLAMP_TO_EDGE), T.texParameteri(T.TEXTURE_2D, T.TEXTURE_WRAP_T, T.CLAMP_TO_EDGE), T.pixelStorei(T.UNPACK_ALIGNMENT, 4);
	let ke = (r = []) => {
		r.length > 0 && r.length !== u.length && oe("warn", "renderFrame warning: Length mismatch of layers and layerOptions. Unexpected behavior might occur."), T.enable(T.SCISSOR_TEST), b.getContext("2d")?.clearRect(0, 0, b.width, b.height), T.scissor(0, 0, b.width, b.height), T.clearColor(0, 0, 0, 0), T.clear(T.COLOR_BUFFER_BIT), l.clearRect(0, 0, c.width, c.height), T.viewport(0, 0, c.width, c.height), T.scissor(0, 0, c.width, c.height), T.useProgram(pe), u.forEach((i, a) => {
			r[a]?.additionalTarget && r[a].additionalTarget.getContext("2d")?.clearRect(0, 0, r[a]?.additionalTarget.width, r[a]?.additionalTarget.height), T.enableVertexAttribArray(me);
			let o = T.FLOAT;
			T.vertexAttribPointer(me, 2, o, !1, 0, 0), T.uniform1i(_e, 0), T.uniform1i(ve, 1), T.uniform2f(ye, c.width, c.height), T.uniform2f(be, n.width, n.height), T.uniform1f(xe, se), T.uniform1f(Se, r[a]?.opacity ?? 1), T.activeTexture(T.TEXTURE0 + 0), T.bindTexture(T.TEXTURE_2D, E), T.activeTexture(T.TEXTURE0 + 1), T.bindTexture(T.TEXTURE_2D, Ee), T.texSubImage2D(T.TEXTURE_2D, 0, 0, 0, t, e, T.LUMINANCE, T.UNSIGNED_BYTE, i.buffer), T.drawArrays(T.TRIANGLES, 0, ge.length / 2), r[a]?.additionalTarget && r[a].additionalTarget.getContext("2d")?.drawImage(b, 0, 0), l.drawImage(b, 0, 0);
		}), a && (T.viewport(0, 0, v.width, v.height), T.scissor(0, 0, v.width, v.height), T.clearColor(0, 0, 0, 0), T.clear(T.COLOR_BUFFER_BIT), T.uniform2f(ye, v.width, v.height), T.uniform1i(ve, 2), T.uniform1f(Se, 1), T.activeTexture(T.TEXTURE0 + 2), T.bindTexture(T.TEXTURE_2D, Oe), T.drawArrays(T.TRIANGLES, 0, ge.length / 2), y.clearRect(0, 0, v.width, v.height), y.drawImage(b, 0, b.height - n.height, v.width, v.height, 0, 0, v.width, v.height));
	}, Ae = (e, t) => {
		let { char: r, fg: i, bg: a } = t, o = `${r};${i.toLocaleLowerCase()};${a.toLocaleLowerCase()}`, s = re(i), c = re(a), l = r.charCodeAt(0), u = n.characters[l];
		if (!u) {
			oe("warn", `render: no shape found for charcode ${l} (${r})`);
			return;
		}
		let d = new Uint8Array(u.length * u[0].length * 4);
		for (let e = 0; e < u.length; e++) for (let t = 0; t < u[0].length; t++) {
			let n = e * u[0].length * 4;
			d[n + t * 4] = u[e][t] ? s[0] : c[0], d[n + t * 4 + 1] = u[e][t] ? s[1] : c[1], d[n + t * 4 + 2] = u[e][t] ? s[2] : c[2], d[n + t * 4 + 3] = u[e][t] ? s[3] : c[3];
		}
		T.activeTexture(T.TEXTURE0 + 0), T.bindTexture(T.TEXTURE_2D, E), T.texSubImage2D(T.TEXTURE_2D, 0, 0, e * n.height, n.width, n.height, T.RGBA, T.UNSIGNED_BYTE, d), x[e] = o;
	}, je = (e) => {
		if (!x[e]) {
			console.log("No Phox to remove at index", e);
			return;
		}
		let t = new Uint8Array(n.height * n.width * 4).fill(0);
		T.activeTexture(T.TEXTURE0 + 0), T.bindTexture(T.TEXTURE_2D, E), T.texSubImage2D(T.TEXTURE_2D, 0, 0, e * n.height, n.width, n.height, T.RGBA, T.UNSIGNED_BYTE, t), x[e] = null;
	};
	function Me() {
		let e = x.indexOf(null, 1);
		return e === -1 ? x.length : e;
	}
	let Ne = (e, n, r, i, a, o) => {
		if (!o) if (u[0]) o = u[0].id;
		else {
			console.error("renderPhoxel error: Trying to remove phoxel, but there are no layers in phoxelis.");
			return;
		}
		let s = p(o);
		if (!s) {
			oe("error", `renderPhoxel error: Layer ${o} not found.`);
			return;
		}
		let c = `${e};${n.toLocaleLowerCase()};${r.toLocaleLowerCase()}`, l = x.indexOf(c);
		if (l === -1) {
			let t = Me();
			if (t > 254) throw Error("Error adding Phox to Palette: 255 elements limit exceeded.");
			Ae(t, {
				char: e,
				fg: n,
				bg: r
			}), w[t] = 0, l = t;
		}
		let d = i * t + a;
		s.buffer[d] !== l && (Fe(s.buffer[d]), s.buffer[d] = l, w[l]++);
	}, Pe = (e, n, r) => {
		if (!r) if (u[0]) r = u[0].id;
		else {
			console.error("removePhoxel error: Trying to remove phoxel, but there are no layers in phoxelis.");
			return;
		}
		let i = p(r);
		if (!i) {
			oe("error", `removePhoxel error: Layer ${r} not found.`);
			return;
		}
		let a = i.buffer, o = a[e * t + n];
		o === 0 || !x[o] || (a[e * t + n] = 0, Fe(o));
	};
	function Fe(e) {
		e !== 0 && (w[e]--, w[e] === 0 && (je(e), delete w[e]));
	}
	let Ie = () => {
		T.activeTexture(T.TEXTURE0 + 0), T.bindTexture(T.TEXTURE_2D, E), T.texSubImage2D(T.TEXTURE_2D, 0, 0, 0, n.width, Ce, T.RGBA, T.UNSIGNED_BYTE, new Uint8Array(n.width * Ce * 4));
	}, Le = (e = !1) => {
		Ie();
		let t = () => {
			u.length = 0, Object.keys(d).forEach((e) => delete d[e]);
		};
		if (i && e) {
			let e = u[0]?.id;
			t(), f(e);
		} else t();
		x = [null], w = {};
	};
	return {
		renderFrame: ke,
		renderPhoxel: Ne,
		removePhoxel: Pe,
		canvas: c,
		reset: Le,
		clearScreen: () => {
			u.forEach((e) => e.buffer.fill(0));
		},
		palette: v,
		exportPhoxelis: de,
		importPhoxelis: fe,
		getPhoxFromPaletteIndex: ae,
		getPhoxFromPosition: ue,
		storePhoxInPalette: Ae,
		cleanUnusedPhoxesFromPalette: ee,
		layers: u,
		addLayer: f,
		getLayer: p,
		moveLayer: h,
		removeLayer: g,
		loadLayer: _,
		layerPositions: d
	};
}
//#endregion
export { ue as Phoxelis, x as getFont };
