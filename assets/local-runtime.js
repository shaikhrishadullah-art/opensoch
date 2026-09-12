/* Serve the design system's runtime dependencies from this origin.
 *
 * vendor/support.js loads React, ReactDOM and Babel standalone from unpkg at
 * runtime. That put ~3MB of third-party JavaScript in front of every section
 * page, and rendered them blank whenever unpkg was unreachable.
 *
 * support.js resolves each of those through window.__resources first
 * (see cdnScriptFor), so this redirects them to local copies without editing
 * support.js, which the design handoff asks us not to touch. The files in
 * vendor/lib were pulled from the npm registry and are byte-identical to the
 * unpkg copies — their sha384 digests match the SRI constants support.js
 * pins, which is how that was confirmed.
 *
 * Must load BEFORE vendor/support.js.
 */
window.__resources = Object.assign({}, window.__resources, {
  "https://unpkg.com/react@18.3.1/umd/react.production.min.js":
    "/vendor/lib/react.production.min.js",
  "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js":
    "/vendor/lib/react-dom.production.min.js",
  "https://unpkg.com/@babel/standalone@7.29.0/babel.min.js":
    "/vendor/lib/babel.min.js"
});
