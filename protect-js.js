// protect-js.js
// Usage: node protect-js.js
// Requires: npm i esbuild terser javascript-obfuscator dotenv
// Purpose: bundle -> inject API_TOKEN from .env -> minify -> obfuscate -> write to publicfiles/dist/bundle.obf.js

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const terser = require('terser');
const JavaScriptObfuscator = require('javascript-obfuscator');
require('dotenv').config();

(async () => {
  try {
    const ROOT = process.cwd();
    const SRC_ENTRY = path.join(ROOT, 'src', 'index.js');
    const PUBLIC_FOLDER = path.join(ROOT, 'publicfiles');
    const PUBLIC_DIST = path.join(PUBLIC_FOLDER, 'dist');

    // sanity checks
    if (!fs.existsSync(SRC_ENTRY)) {
      console.error('Gagal: file src/index.js tidak ditemukan. Pastikan path benar:', SRC_ENTRY);
      process.exit(1);
    }

    if (!fs.existsSync(PUBLIC_FOLDER)) {
      console.warn('Warning: publicfiles/ tidak ditemukan. Membuat folder publicfiles/ ...');
      fs.mkdirSync(PUBLIC_FOLDER, { recursive: true });
    }
    if (!fs.existsSync(PUBLIC_DIST)) fs.mkdirSync(PUBLIC_DIST, { recursive: true });

    // temp output
    const TMP_DIR = path.join(ROOT, '.build_tmp');
    if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
    const TMP_BUNDLE = path.join(TMP_DIR, 'bundle.js');

    console.log('> Bundling dengan esbuild...');
    await esbuild.build({
      entryPoints: [SRC_ENTRY],
      bundle: true,
      sourcemap: false,
      minify: false,
      platform: 'browser',
      target: ['es2017'],
      outfile: TMP_BUNDLE,
      logLevel: 'silent'
    });
    console.log('  ->', TMP_BUNDLE);

    // read bundled code
    let code = fs.readFileSync(TMP_BUNDLE, 'utf8');

    // inject env var: API_TOKEN
    if (process.env.API_TOKEN) {
      console.log('> Menyuntikkan API_TOKEN dari .env');
      const val = String(process.env.API_TOKEN).replace(/"/g, '\\"');
      code = code.replace(/process\.env\.API_TOKEN/g, `"${val}"`);
    } else {
      console.log('> Warning: .env tidak berisi API_TOKEN — tidak menyuntikkan apa-apa.');
    }

    // write intermediate bundle (post-inject)
    fs.writeFileSync(TMP_BUNDLE, code, 'utf8');

    console.log('> Minifying dengan terser...');
    const terserRes = await terser.minify(code, {
      compress: { defaults: true, drop_console: true },
      mangle: true,
      output: { ascii_only: true }
    });
    if (terserRes.error) throw terserRes.error;
    const TMP_MIN = path.join(TMP_DIR, 'bundle.min.js');
    fs.writeFileSync(TMP_MIN, terserRes.code, 'utf8');
    console.log('  ->', TMP_MIN, `(size: ${fs.statSync(TMP_MIN).size} bytes)`);

    console.log('> Obfuscating dengan javascript-obfuscator (bisa makan waktu)...');
    const obfConfig = {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.75,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.4,
      disableConsoleOutput: true,
      identifierNamesGenerator: 'hexadecimal',
      rotateStringArray: true,
      stringArray: true,
      stringArrayEncoding: ['rc4'],
      stringArrayThreshold: 0.9,
      splitStrings: true,
      splitStringsChunkLength: 5,
      transformObjectKeys: true,
      selfDefending: false,
      debugProtection: false
    };
    const minCode = fs.readFileSync(TMP_MIN, 'utf8');
    const obfResult = JavaScriptObfuscator.obfuscate(minCode, obfConfig);
    const OUT_FILE = path.join(PUBLIC_DIST, 'bundle.obf.js');
    fs.writeFileSync(OUT_FILE, obfResult.getObfuscatedCode(), 'utf8');
    console.log('  ->', OUT_FILE, `(size: ${fs.statSync(OUT_FILE).size} bytes)`);

    // patch publicfiles/index.html (backup) or root index.html if publicfiles/index.html missing
    const HTML_CANDIDATES = [
      path.join(PUBLIC_FOLDER, 'index.html'),
      path.join(ROOT, 'index.html'),
      path.join(ROOT, 'vload', 'index.html')
    ];
    let htmlPath = HTML_CANDIDATES.find(p => fs.existsSync(p));
    if (!htmlPath) {
      console.warn('Warning: tidak menemukan index.html di publicfiles/ atau root. Skip patching HTML.');
    } else {
      console.log('> Mem-patch', htmlPath, '(backup dibuat .bak)');
      const backup = htmlPath + '.bak';
      if (!fs.existsSync(backup)) fs.copyFileSync(htmlPath, backup);

      let htmlText = fs.readFileSync(htmlPath, 'utf8');

      // replace script src that points to src/index.js (various forms) to dist/bundle.obf.js
      const replaced = htmlText.replace(/(<script[^>]*src\s*=\s*["'])(?:\.?\/?publicfiles\/src\/index\.js|\.?\/?src\/index\.js|\.?\/?publicfiles\/src\/index\.js)(["'][^>]*>\s*<\/script>)/ig,
                                       `$1./dist/bundle.obf.js$2`);

      // if no match, ensure script tag present before </body>
      if (replaced === htmlText) {
        if (htmlText.includes('</body>')) {
          htmlText = htmlText.replace('</body>', `  <script src="./dist/bundle.obf.js"></script>\n</body>`);
        } else {
          htmlText += `\n<script src="./dist/bundle.obf.js"></script>\n`;
        }
      } else {
        htmlText = replaced;
      }

      fs.writeFileSync(htmlPath, htmlText, 'utf8');
      console.log('  -> patched and backup saved as', backup);
    }

    // optional: copy favicon/logo from root to publicfiles if exist
    ['favicon.ico', 'logo.png'].forEach(f => {
      const s = path.join(ROOT, f);
      if (fs.existsSync(s)) {
        fs.copyFileSync(s, path.join(PUBLIC_FOLDER, f));
      }
    });

    // cleanup tmp dir
    try { fs.rmSync(TMP_DIR, { recursive: true, force: true }); } catch (e) {}

    console.log('\nSelesai: publicfiles/dist/bundle.obf.js siap. Pastikan .env ada & .gitignore mengabaikan publicfiles/dist dan .env\n');
    console.log('Test lokal: npx http-server publicfiles -p 5000  (atau buka publicfiles/index.html di browser via file://)');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
