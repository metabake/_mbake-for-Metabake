"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Ver {
    ver() {
        return 'v5.04.1';
    }
}
exports.Ver = Ver;
const markdownItAttrs = require("markdown-it-attrs");
const md = require('markdown-it')({
    html: true,
    typographer: true,
    linkify: true
});
md.use(markdownItAttrs);
const Marpit = require("@marp-team/marpit");
const marpit = new Marpit.Marpit();
const fs = require("fs-extra");
const FileHound = require("filehound");
const yaml = require("js-yaml");
const path = require("path");
const findUp = require("find-up");
const riotc = require("riot-compiler");
const pug = require("pug");
const minify = require('html-minifier').minify;
const Terser = require("terser");
const colors = require("colors");
const logger = require('tracer').colorConsole({
    filters: [
        {
            warn: colors.yellow,
            error: [colors.red]
        }
    ]
});
const beeper = require('beeper');
const JavaScriptObfuscator = require("javascript-obfuscator");
class RetMsg {
    constructor(cmd, code, msg) {
        this._cmd = cmd;
        this._code = code;
        this._msg = msg;
    }
    get cmd() {
        return this.cmd;
    }
    get code() {
        return Math.round(this._code);
    }
    get msg() {
        return this;
    }
    log() {
        console.info(this.cmd, this.msg, this.code);
    }
}
exports.RetMsg = RetMsg;
class Dirs {
    constructor(dir_) {
        let dir = Dirs.slash(dir_);
        this.dir = dir;
    }
    static slash(path_) {
        return path_.replace(/\\/g, '/');
    }
    static goUpOne(dir) {
        return path.resolve(dir, '..');
    }
    getInDir(sub) {
        const rec = FileHound.create()
            .paths(this.dir + sub)
            .not().glob("*.js")
            .findSync();
        let ret = [];
        const ll = this.dir.length + sub.length;
        for (let s of rec) {
            let n = s.substr(ll);
            if (n.includes('index.html'))
                continue;
            if (n.includes('index.pug'))
                continue;
            ret.push(n);
        }
        return ret;
    }
    getShort() {
        let lst = this.getFolders();
        let ret = [];
        const ll = this.dir.length;
        logger.info(this.dir, ll);
        for (let s of lst) {
            let n = s.substr(ll);
            ret.push(n);
        }
        return ret;
    }
    getFolders() {
        logger.info(this.dir);
        const rec = FileHound.create()
            .paths(this.dir)
            .ext('pug')
            .findSync();
        let ret = [];
        for (let val of rec) {
            val = Dirs.slash(val);
            let n = val.lastIndexOf('/');
            let s = val.substring(0, n);
            if (!fs.existsSync(s + '/dat.yaml'))
                continue;
            ret.push(s);
        }
        return Array.from(new Set(ret));
    }
}
exports.Dirs = Dirs;
class Dat {
    constructor(path__) {
        let path_ = Dirs.slash(path__);
        this._path = path_;
        let y;
        if (fs.existsSync(path_ + '/dat.yaml'))
            y = yaml.load(fs.readFileSync(path_ + '/dat.yaml'));
        if (!y)
            y = {};
        this.props = y;
        let keys = Object.keys(y);
        if (keys.includes('include'))
            this._addData();
    }
    write() {
        try {
            let y = yaml.dump(this.props, {
                skipInvalid: true,
                noRefs: true,
                noCompatMode: true,
                condenseFlow: true
            });
            let p = this._path + '/dat.yaml';
            logger.info(p);
            fs.writeFileSync(p, y);
        }
        catch (err) {
            logger.info(err);
        }
    }
    set(key, val) {
        this.props[key] = val;
    }
    _addData() {
        let jn = this.props.include;
        let fn = this._path + '/' + jn;
        logger.info(fn);
        let jso = fs.readFileSync(fn);
        Object.assign(this.props, JSON.parse(jso.toString()));
    }
    getAll() {
        return this.props;
    }
}
exports.Dat = Dat;
class MBake {
    bake(path_) {
        if (!path_ || path_.length < 1) {
            console.info('no path_ arg passed');
            return;
        }
        try {
            console.info(' Baking ' + path_);
            let d = new Dirs(path_);
            let dirs = d.getFolders();
            if (!dirs || dirs.length < 1) {
                path_ = Dirs.goUpOne(path_);
                console.info(' New Dir: ', path_);
                d = new Dirs(path_);
                dirs = d.getFolders();
            }
            for (let val of dirs) {
                let n = new BakeWrk(val);
                n.bake();
            }
        }
        catch (err) {
            logger.info(err);
            return new RetMsg(path_ + ' bake', -1, err);
        }
        return new RetMsg(path_ + ' bake', 1, 'ok');
    }
    comps(path_, watcher, mount) {
        if (!path_ || path_.length < 1) {
            console.info('no path_ arg passed');
            return;
        }
        try {
            console.info(' Tag ' + path_);
            let t = new Comps(path_);
            let lst = t.get();
            t.comps(lst, watcher, mount);
            return this.bake(path_);
        }
        catch (err) {
            return new RetMsg(path_ + ' tag', -1, err);
        }
    }
    itemizeNBake(ppath_) {
        if (!ppath_ || ppath_.length < 1) {
            console.info('no path_ arg passed');
            return;
        }
        logger.info('ib:', ppath_);
        try {
            const i = new Items(ppath_);
            i.itemize();
        }
        catch (err) {
            logger.info(err);
            return new RetMsg(ppath_ + ' itemizeB', -1, err);
        }
        return this.bake(ppath_);
    }
    _all(path_) {
        try {
            let t = new Comps(path_);
            let lst = t.get();
            t.comps(lst);
            return this.itemizeNBake(path_);
        }
        catch (err) {
            logger.info(err);
            return new RetMsg(path_ + ' tagA', -1, err);
        }
    }
}
exports.MBake = MBake;
class BakeWrk {
    constructor(dir_) {
        let dir = Dirs.slash(dir_);
        this.dir = dir;
        console.info(' processing: ' + this.dir);
    }
    static metaMD(text, options) {
        console.info(' ', options);
        return md.render(text);
    }
    static marp(text, options) {
        console.info(' ', options);
        const { html, css } = marpit.render(text);
        return html;
    }
    static minify_es6(text, inline) {
        var uglifyEsOptions = {
            parse: { bare_returns: {} },
            mangle: false,
            keep_classnames: true,
            keep_fnames: true,
            safari10: true
        };
        var code = text.match(/^\s*\s*$/) ? '' : text;
        uglifyEsOptions.parse.bare_returns = inline;
        var result = Terser.minify(code, uglifyEsOptions);
        if (result.error) {
            console.info('Uglify-es error:', result.error);
            beeper();
            return text;
        }
        return result.code.replace(/;$/, '');
    }
    static sindexes(source, f) {
        if (!source)
            return [];
        if (!f)
            return [];
        var result = [];
        for (let i = 0; i < source.length; ++i) {
            if (source.substring(i, i + f.length) == f)
                result.push(i);
        }
        return result;
    }
    fixHTMLcss(h) {
        if (!h)
            return h;
        var nh = (' ' + h).slice(1);
        let hits = BakeWrk.sindexes(h, '<!--');
        if (hits.length < 1)
            return nh;
        logger.trace(hits.length);
        let start = hits[0];
        let end = h.indexOf('-->', start);
        let str = h.substring(start + 5, end - 1);
        try {
            logger.trace(str);
            let y = yaml.load(str);
            let s1 = h.substring(0, start);
            let s2 = h.substring(end + 3);
            let klass = y['class'];
            let background_image = y['background-image'];
            let css = ' <style>.' + klass + ' { ';
            css = css + 'background-image: ' + background_image + ';';
            css = css + ' </style>';
            let div = ' <div class=\'' + klass + '\' >';
            div = div + '</div> ';
            return this.fixHTMLcss(s1 + div + css + s2);
        }
        catch (err) {
            logger.error(err);
            return h;
        }
    }
    bake() {
        let tstFile = this.dir + '/index.pug';
        if (!fs.existsSync(tstFile)) {
            return;
        }
        process.chdir(this.dir);
        let m = new Dat(this.dir);
        let options = m.getAll();
        options['filters'] = {
            metaMD: BakeWrk.metaMD,
            marp: BakeWrk.marp
        };
        let minifyO = {
            caseSensitive: true,
            collapseWhitespace: true,
            decodeEntities: true,
            minifyCSS: true,
            minifyJS: BakeWrk.minify_es6,
            quoteCharacter: "'",
            removeComments: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
            sortAttributes: true,
            sortClassName: true
        };
        let html = pug.renderFile(this.dir + '/index.pug', options);
        const ver = '<!-- mB ' + new Ver().ver() + ' on ' + new Date().toISOString() + ' -->';
        html = this.fixHTMLcss(html);
        if (!options['pretty'])
            html = minify(html, minifyO);
        html = html.replace(BakeWrk.ebodyHtml, ver + BakeWrk.ebodyHtml);
        let fn = this.dir + '/index.html';
        fs.writeFileSync(fn, html);
        if (!fs.existsSync(this.dir + '/m.pug'))
            return ' ';
        html = pug.renderFile(this.dir + '/m.pug', options);
        html = this.fixHTMLcss(html);
        if (!options['pretty'])
            html = minify(html, minifyO);
        html = html.replace(BakeWrk.ebodyHtml, ver + BakeWrk.ebodyHtml);
        fn = this.dir + '/m.html';
        fs.writeFileSync(fn, html);
    }
    getNameFromFileName(filename) {
        filename = Dirs.slash(filename);
        if (filename.indexOf('/') > -1) {
            let pos = filename.lastIndexOf('/') + 1;
            filename = filename.substring(pos);
        }
        let file = filename.replace(/\.(?:pug|jade)$/, '');
        return file.toLowerCase().replace(/[^a-z0-9]+([a-z])/g, function (_, character) {
            return character.toUpperCase();
        }) + 'Bind';
    }
}
BakeWrk.ebodyHtml = '</body>';
exports.BakeWrk = BakeWrk;
class Items {
    constructor(dir_) {
        let dir = Dirs.slash(dir_);
        let fn = dir + '/dat_i.yaml';
        if (!fs.existsSync(fn)) {
            let dir2 = findUp.sync('dat_i.yaml', { cwd: dir });
            dir = dir2.slice(0, -11);
        }
        this.dir = dir;
        let d = new Dirs(dir);
        this.dirs = d.getFolders();
    }
    _addAnItem(dn) {
        try {
            if (!fs.existsSync(dn + '/dat.yaml'))
                return;
            let y = yaml.load(fs.readFileSync(dn + '/dat.yaml'));
            if (!y)
                return;
            if (false == y.publish) {
                return;
            }
            if (typeof y.publishDate !== 'undefined'
                && y.publishDate !== null
                && (y.publishDate - Date.now()) > 0) {
                return;
            }
            Items.clean(y);
            let dl = dn.lastIndexOf('/');
            let url = dn.substring(dl + 1);
            console.info('', url);
            y.url = url;
            if (!y.hasOwnProperty('id'))
                y.id = url;
            if (!this.feed.items)
                this.feed.items = [];
            y.index = this.feed.items.length;
            this.feed.items.push(y);
        }
        catch (err) {
            logger.info(err);
        }
    }
    itemize() {
        logger.info('Itemizing: ' + this.dir);
        const rootDir = this.dir;
        let fn = rootDir + '/dat_i.yaml';
        let y = yaml.load(fs.readFileSync((fn)));
        Items.clean(y);
        y.nbVer = new Ver().ver();
        y.note = 'This is statically served and visible publicly.';
        this.feed = y;
        logger.warn(this.feed);
        for (let val of this.dirs) {
            this._addAnItem(val);
        }
        if (!this.feed.items)
            this.feed.items = [];
        if (0 == this.feed.items.length) {
            logger.info('no items');
            return;
        }
        this.feed.count = this.feed.items.length;
        let json = JSON.stringify(this.feed, null, 2);
        let items = rootDir + '/items.json';
        fs.writeFileSync(items, json);
        console.info(' processed.');
        return ' processed ';
    }
    static clean(o) {
        delete o['basedir'];
        delete o['ROOT'];
        delete o['pretty'];
        delete o['publish'];
    }
}
exports.Items = Items;
class Comps {
    constructor(dir_) {
        this.ver = '// mB ' + new Ver().ver() + ' on ' + new Date().toISOString() + '\r\n';
        let dir = Dirs.slash(dir_);
        this.dir = dir;
    }
    get() {
        const rec = FileHound.create()
            .paths(this.dir)
            .ext('pug')
            .glob('*-comp.pug')
            .findSync();
        let ret = [];
        for (let val of rec) {
            val = val.split('\\').join('/');
            ret.push(val);
        }
        return ret;
    }
    comps(list, watcher, mount) {
        console.info('Looking for tags *-comp ' + this.dir);
        for (let val of list) {
            let s = fs.readFileSync(val).toString();
            let n = val.lastIndexOf('/');
            let dir = val.substring(0, n);
            let name = val.substring(n);
            let p = name.lastIndexOf('.');
            name = name.substring(0, p);
            console.info(' ' + dir + name);
            this.process(s, dir + name, watcher, mount);
        }
        return 'ok';
    }
    static getObsOptions() {
        let t = {
            identifierNamesGenerator: 'mangled',
            disableConsoleOutput: true,
            target: 'browser-no-eval',
            stringArray: true,
            stringArrayThreshold: 1,
            stringArrayEncoding: 'rc4',
            selfDefending: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 1,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.2
        };
        return t;
    }
    process(s, fn, watcher, mount) {
        const r_options = { 'template': 'pug' };
        logger.info('compiling', fn + '.tag');
        let js;
        try {
            if (watcher) {
                js = riotc.compile(s, r_options, mount);
            }
            else {
                js = riotc.compile(s, r_options);
            }
        }
        catch (err) {
            beeper(1);
            logger.error('compiler error');
            logger.error(err);
            return;
        }
        fs.writeFileSync(fn + '.js', js);
        logger.info('minify');
        let ugs;
        try {
            ugs = JavaScriptObfuscator.obfuscate(js, Comps.getObsOptions());
        }
        catch (err) {
            logger.error('error');
            logger.error(err);
            return;
        }
        let obCode = this.ver + ugs.getObfuscatedCode();
        fs.writeFileSync(fn + '.min.js', obCode);
    }
}
exports.Comps = Comps;
module.exports = {
    Dat, Dirs, BakeWrk, Items, Comps, Ver, MBake, RetMsg
};