# Liquid Glass integration

The navigation surface uses the MIT-licensed implementation from [nordify/css-liquid-glass](https://github.com/nordify/css-liquid-glass). The original `maps.ts`, `liquid-glass.ts`, and stylesheet are retained with the upstream MIT license in this directory.

It uses an SVG `feDisplacementMap` in `backdrop-filter: url(#...)` to refract live page pixels in Chromium. Browsers that do not support SVG filters inside `backdrop-filter` receive the intentionally simpler frosted fallback; the page does not clone its DOM or pretend a static gradient is refraction.

Only the compact sticky navigation is a refractive host. The mirrored-reflection pass is deliberately disabled: its continuous scroll-refresh loop is unnecessary for the requested effect and would spend GPU time. The baked SVG displacement refraction, bevel and edge light remain active on this single compact host. Keep the host and its ancestors free of opaque backgrounds, `filter`, `opacity`, `transform`, `isolation`, clipping overflow, and other backdrop-root triggers. The sticky header wrapper itself must remain transparent so the pane samples the page behind it.
