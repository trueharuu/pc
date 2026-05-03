/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		const host = url.protocol + '//' + url.host;
		if (url.pathname.startsWith('/2nd/')) {
			let slug = url.pathname.slice(5);
			// const file = await env.ASSETS.fetch(host + `/data/2nd/${slug}`);

			const file = await env.ASSETS.fetch(host + `/data/2nd/${slug}`);
			if (file.ok) {
				let content = await file.text();
				let mir = false;
				if (content.startsWith('&mirror=')) {
					const mirrorUrl = content.slice(8);
					mir = true;
					const mcr = await env.ASSETS.fetch(host + '/data/2nd/' + mirrorUrl);
					if (!mcr.ok) {
						return new Response('not found', { status: 404 });
					}

					content = await mcr.text();
				}

				const sh = await env.ASSETS.fetch(host + '/data/2nd.html');
				const script = `<script>const text = \`${content}\`; const should_mirror = ${mir};</script>`;

				const fa = await env.ASSETS.fetch(host + '/data/fumen.js');
				const fb = await env.ASSETS.fetch(host + '/data/2nd.js');
				const fc = await env.ASSETS.fetch(host + '/data/2nd.css');

				const prelim = `<script defer>${await fa.text()}</script><script defer>${await fb.text()}</script><style>${await fc.text()}</style>`;
				console.log(prelim);
				const html = await sh.text();
				return new Response(html.replace('<!--SCRIPT-->', script).replace('<!--PRELIM-->', prelim), {
					headers: { 'Content-Type': 'text/html' },
				});
			} else {
				return new Response('not found', { status: 404 });
			}
		}

		return new Response('not found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;
