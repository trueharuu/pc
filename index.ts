const server = Bun.serve({
    port: 1024,
    routes: {
        "/": (req) => {
            return new Response("hi");
        },
        "/data/*": async (req, {}) => {
            // get what the * caught
            let slug = new URL(req.url).pathname.slice("/data/".length);
            console.log(slug);

            const file = Bun.file(`./data/${slug}`);
            if (await file.exists()) {
                return new Response(file.stream(), {
                    headers: {
                        "Content-Type": file.type,
                    },
                });
            } else {
                return new Response("not found", { status: 404 });
            }
        },
        "/2nd/*": async (req, {}) => {
            // fetch the file in ./data
            let slug = new URL(req.url).pathname.slice("/2nd/".length);
            console.log(slug);

            const file = Bun.file(`./data/2nd/${slug}`);
            if (await file.exists()) {
                let content = await file.text();
                let mir = false;
                if (content.startsWith("&mirror=")) {
                    const mirrorUrl = content.slice(8);
                    mir = true;
                    const mcr = Bun.file("./data/2nd/" + mirrorUrl);
                    if (!(await mcr.exists())) {
                        return new Response("not found", { status: 404 });
                    }

                    content = await mcr.text();
                }

                const sh = Bun.file("./data/2nd.html");
                const script = `<script>const text = \`${content}\`; const should_mirror = ${mir};</script>`;
                const html = await sh.text();
                return new Response(html.replace("<!--SCRIPT-->", script), {
                    headers: { "Content-Type": "text/html" },
                });
            } else {
                return new Response("not found", { status: 404 });
            }
        },
    },
    async fetch(req, server) {
        return new Response("not found", { status: 404 });
    },
});

console.log(`server running at http://localhost:${server.port}`);
