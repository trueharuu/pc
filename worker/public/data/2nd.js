document.body.innerHTML = '';
const PIECES = 'TIJLOSZ';
// sorts haystack so it appears in the same order as pieces
// dupes go in front, e.g. SZS -> SSZ, JLL -> LLJ
// + is preserved and splits the sort
function sort(haystack, m = should_mirror) {
	const parts = haystack.split('+');
	return parts
		.map((part) => {
			const counts = {};
			for (let c of part) {
				if (m) {
					if (c === 'J') c = 'L';
					else if (c === 'L') c = 'J';
					else if (c === 'S') c = 'Z';
					else if (c === 'Z') c = 'S';
				}
				counts[c] = (counts[c] || 0) + 1;
			}

			const groups = PIECES.split('')
				.filter((p) => counts[p])
				.map((p) => ({ piece: p, count: counts[p] }));

			groups.sort((a, b) => {
				// dupes in front
				const aIsDup = a.count > 1 ? 0 : 1;
				const bIsDup = b.count > 1 ? 0 : 1;
				if (aIsDup !== bIsDup) return aIsDup - bIsDup;
				return PIECES.indexOf(a.piece) - PIECES.indexOf(b.piece);
			});

			return groups.map((g) => g.piece.repeat(g.count)).join('');
		})
		.join('+');
}

function pieces_used(haystack) {
	return haystack.replace(/\+/g, '').length;
}

function render(v, m = should_mirror, w = 10, h = 4) {
	if (v === '') v = 'v115@vhAAgh';
	const table = document.createElement('table');
	table.classList.add('fumen');
	const f = fumen.decoder.decode(v);
	for (let y = 0; y <= h; y++) {
		const row = document.createElement('tr');
		row.classList.add('fr');
		for (let x = 0; x < w; x++) {
			const cell = document.createElement('td');
			const value = f[0].field.field.field.pieces[(h - y) * 10 + x];
			cell.classList.add('c' + value, 'fc');
			row.appendChild(cell);
		}

		const hlrow = document.createElement('tr');
		hlrow.classList.add('fr', 'hlr');
		for (let x = 0; x < w; x++) {
			const cell = document.createElement('td');
			let value = f[0].field.field.field.pieces[(h - y) * 10 + x];
			let is_hl = 'c';
			if (value == 0) {
				is_hl = 'h';
				value = f[0].field.field.field.pieces[(h - 1 - y) * 10 + x];
			}
			cell.classList.add(is_hl + value, 'hlc');
			hlrow.appendChild(cell);
		}

		table.appendChild(row);
		table.appendChild(hlrow);
	}
	return table;
}

function id(i) {
	return i.replace(/\+/g, '-').slice(1);
}

function color(i) {
	if (data[i] === undefined) return 'empty';
	if (pieces_used(i) === 3) return 'p3';
	if (data[i].split(';').length === 0) return 'empty';
	if (data[i].split(';').length === 1) return 'oqb';
	if (data[i].split(';').length === 2) return 'otherqb';
	if (data[i].split(';').length === 3) return 'qb';
	return 'disabled';
}

const lines = text
	.replace(/\\\s+/g, '')
	.split('\n')
	.map((line) => line.trim())
	.filter((line) => line.length > 0);
const data = {};
for (const line of lines) {
	const sep = line.indexOf('=');
	if (sep === -1) continue;
	let key = line.slice(0, sep);
	if (!key.startsWith('@')) {
		key = sort(key);
	}
	const value = line.slice(sep + 1);

	if (value.includes(';') && value.split(';').every((x) => x.trim() === '')) {
		continue;
	}

	data[key] = value;
}

const title = document.createElement('title');
title.textContent = `${sort(data['@pc'])} ${sort(data['@save'])}%`;
document.head.appendChild(title);
const container = document.createElement('div');

const header = document.createElement('h1');
header.classList.add('title');
header.id = 'title';
header.textContent = `${sort(data['@pc'])} ${sort(data['@save'])}%`;
const desc = document.createElement('p');
desc.textContent = 'mina';
desc.style.lineHeight = '0';
desc.style.fontStyle = 'italic';

container.appendChild(header);
container.appendChild(desc);

const p2con = document.createElement('div');
const p2table = document.createElement('table');
p2con.appendChild(p2table);
p2con.id = 'p2con';
// 'first' header
const headerRow = document.createElement('tr');

const header_spacer = document.createElement('td');
header_spacer.style.borderTop = 'none';
header_spacer.style.borderLeft = 'none';

header_spacer.textContent = '';
headerRow.appendChild(header_spacer);

const firstHeader = document.createElement('td');
firstHeader.textContent = 'First';
firstHeader.colSpan = 7 + (data['@save'] ? 0 : 1);
headerRow.appendChild(firstHeader);
p2table.appendChild(headerRow);

// piece header
const pieceHeaderRow = document.createElement('tr');
const pieceHeaderSpacer = document.createElement('td');
pieceHeaderSpacer.textContent = 'Second';
pieceHeaderSpacer.rowSpan = 7 + (data['@save'] ? 0 : 1);
const pieceHeaderSpacer2 = document.createElement('td');
pieceHeaderSpacer2.textContent = '';
pieceHeaderSpacer2.classList.add('disabled');

pieceHeaderRow.appendChild(pieceHeaderSpacer);
pieceHeaderRow.appendChild(pieceHeaderSpacer2);

for (const piece of PIECES) {
	if (data['@save'] === piece) {
		continue;
	}
	const pieceHeader = document.createElement('td');
	pieceHeader.textContent = piece;
	pieceHeader.style.fontWeight = 'bold';
	pieceHeaderRow.appendChild(pieceHeader);
}

p2table.appendChild(pieceHeaderRow);

for (const piece2 of PIECES) {
	if (data['@save'] === piece2) continue;
	const row = document.createElement('tr');
	const piece2Cell = document.createElement('td');
	piece2Cell.textContent = piece2;
	piece2Cell.style.fontWeight = 'bold';
	row.appendChild(piece2Cell);

	for (const piece1 of PIECES) {
		if (data['@save'] === piece1) {
			continue;
		}

		if (piece1 === piece2) {
			const cell = document.createElement('td');
			cell.textContent = '';
			cell.classList.add('disabled');
			row.appendChild(cell);
			continue;
		}
		const cell = document.createElement('td');
		const s = sort(`${piece1}${piece2}`);
		const k = '+' + s in data ? '+' + s : '+' + piece1 + '+' + piece2 in data ? '+' + piece1 + '+' + piece2 : '';
		const href = '#' + id(k);
		cell.classList.add(color(k));
		const a = document.createElement('a');
		a.textContent = k;
		a.href = href;
		cell.appendChild(a);
		row.appendChild(cell);
	}

	p2table.appendChild(row);
}

container.appendChild(p2table);

// general setups
const general_header = document.createElement('h1');
general_header.textContent = 'General Setups';
general_header.classList.add('general');
general_header.id = 'general';
container.appendChild(general_header);

let g = 0;
for (const key in data) {
	if (key.startsWith('+')) {
		const value = data[key];
		if (pieces_used(key) !== 0 || value.split(';').length !== 2) {
			continue;
		}

		g++;

		const el = document.createElement('div');
		el.classList.add('nobreak');
		const header = document.createElement('h2');
		header.id = 'general-' + g;
		header.textContent = '#' + g;
		el.appendChild(header);

		const [setup, solves] = value.split(';');
		const table = document.createElement('table');
		const row = document.createElement('tr');
		const cell = document.createElement('td');
		cell.appendChild(render(setup));
		row.appendChild(cell);
		table.appendChild(row);

		// solves, 3 per row
		const solveList = solves.split(',');
		for (let i = 0; i < solveList.length; i++) {
			if (i % 3 === 0) {
				var solveRow = document.createElement('tr');
				table.appendChild(solveRow);
			}
			const solveCell = document.createElement('td');
			solveCell.appendChild(render(solveList[i]));
			solveRow.appendChild(solveCell);
		}
		el.appendChild(table);
		container.appendChild(el);
	}
}

// 1 minimal qbs
const minqb_header = document.createElement('h1');
minqb_header.textContent = '1 minimal QBs';
minqb_header.classList.add('qb');
minqb_header.id = 'qb';
container.appendChild(minqb_header);

// list all of them
for (const key in data) {
	if (key.startsWith('+')) {
		const value = data[key];
		if (pieces_used(key) !== 2 || value.split(';').length !== 3) {
			continue;
		}
		const el = document.createElement('div');
		el.classList.add('nobreak');
		const header = document.createElement('h2');
		header.id = id(key);
		header.textContent = key;
		el.appendChild(header);

		const [setup, p2, solve] = value.split(';');
		const table = document.createElement('table');
		const row = document.createElement('tr');

		const setupCell = document.createElement('td');
		setupCell.appendChild(render(setup));

		const p2Cell = document.createElement('td');
		p2Cell.appendChild(render(p2));

		const solveCell = document.createElement('td');
		solveCell.appendChild(render(solve));

		row.appendChild(setupCell);
		row.appendChild(p2Cell);
		row.appendChild(solveCell);

		table.appendChild(row);
		el.appendChild(table);
		container.appendChild(el);
	}
}

// 2+ minimal qbs
const otherqb_header = document.createElement('h1');
otherqb_header.textContent = 'Other QBs';
otherqb_header.classList.add('otherqb');
otherqb_header.id = 'otherqb';
container.appendChild(otherqb_header);
for (const key in data) {
	if (key.startsWith('+')) {
		const value = data[key];
		if (pieces_used(key) !== 2 || value.split(';').length !== 2) {
			continue;
		}

		const el = document.createElement('div');
		el.classList.add('nobreak');
		const header = document.createElement('h2');
		header.textContent = `${key} (${value.split(';')[1].split(',').length})`;
		header.id = id(key);
		el.appendChild(header);

		const [setup, solves] = value.split(';');
		const table = document.createElement('table');
		const row = document.createElement('tr');

		const setupCell = document.createElement('td');
		setupCell.appendChild(render(setup));

		row.appendChild(setupCell);
		table.appendChild(row);

		// solves, 3 per row
		const solveList = solves.split(',');
		for (let i = 0; i < solveList.length; i++) {
			if (i % 3 === 0) {
				var solveRow = document.createElement('tr');
				table.appendChild(solveRow);
			}
			const solveCell = document.createElement('td');
			solveCell.appendChild(render(solveList[i]));
			solveRow.appendChild(solveCell);
		}

		el.appendChild(table);
		container.appendChild(el);
	}
}

const oqb_header = document.createElement('h1');
oqb_header.textContent = 'OQB';
oqb_header.classList.add('oqb');
oqb_header.id = 'oqb';
container.appendChild(oqb_header);

function render_oqb_tree(node) {
	if (typeof node === 'string') {
		const d = document.createElement('div');
		for (const part of node.split(',')) {
			d.appendChild(render(part));
		}
		return d;
	}

	const table = document.createElement('table');
	table.style.display = 'inline-table';
	const row = document.createElement('tr');

	// @
	const cell = document.createElement('td');
	cell.appendChild(render(node['@']));
	row.appendChild(cell);
	table.appendChild(row);

	// pieces

	for (const piece of PIECES) {
		if (piece in node) {
			const row = document.createElement('tr');
			const pieceCell = document.createElement('td');
			pieceCell.innerHTML = `Reveal <span style="font-weight: bold;">${piece}</span>`;
			row.appendChild(pieceCell);
			const childCell = document.createElement('td');
			childCell.style.textAlign = 'left';
			childCell.appendChild(render_oqb_tree(node[piece]));
			row.appendChild(childCell);
			table.appendChild(row);
		}
	}

	// !
	const piece = '!';
	if (piece in node) {
		const cchildCell = document.createElement('td');
		cchildCell.appendChild(render_oqb_tree(node[piece]));
		cchildCell.style.textAlign = 'left';
		row.appendChild(cchildCell);
	}

	return table;
}

for (const key in data) {
	if (key.startsWith('+')) {
		const value = data[key];
		if (value.split(';').length !== 1) {
			continue;
		}

		const el = document.createElement('div');
		el.classList.add('nobreak');
		const header = document.createElement('h2');
		header.id = id(key);
		header.textContent = key;
		el.appendChild(header);

		const tree = JSON.parse(value);
		const table = render_oqb_tree(tree);
		el.appendChild(table);
		container.appendChild(el);
	}
}

function combinations(arr, k) {
	const result = [];
	function backtrack(start, path) {
		if (path.length === k) {
			result.push(path);
			return;
		}
		for (let i = start; i < arr.length; i++) {
			backtrack(i + 1, path.concat(arr[i]));
		}
	}
	backtrack(0, []);
	return result;
}

const p3header = document.createElement('h1');
p3header.textContent = '3-piece setups (optional)';
p3header.classList.add('p3');
p3header.id = 'p3';
container.appendChild(p3header);

function determine_used_setup(piece1, piece2, piece3) {
	// first two are interchangeable, any queue that is +XY can fit +X+Y and +Y+X
	// prefer 3p qb > 1min qb > other qb > oqb > nothing

	// partitions of 3p
	const p1 = sort(piece1 + piece2 + piece3);
	const p2 = sort(piece1 + piece2) + '+' + piece3;
	const p3 = sort(piece1 + piece3) + '+' + piece2;
	const p4 = sort(piece2 + piece3) + '+' + piece1;
	const p5 = piece1 + '+' + piece2 + '+' + piece3;

	// partitions of 2p
	// XY,Z can fit +X+Y, +Y+X, +Y+Z, +X+Z, +XY, +XZ, +YZ
	const p6 = sort(piece1) + '+' + piece2;
	const p7 = sort(piece1) + '+' + piece3;
	const p8 = sort(piece2) + '+' + piece3;
	const p9 = sort(piece1 + piece2);
	const p10 = sort(piece1 + piece3);
	const p11 = sort(piece2 + piece3);

	const candidates = [
		'+' + p1,
		'+' + p2,
		'+' + p3,
		'+' + p4,
		'+' + p5,
		'+' + p6,
		'+' + p7,
		'+' + p8,
		'+' + p9,
		'+' + p10,
		'+' + p11,
	].filter((k) => k in data);

	const priority = {
		p3: 4,
		qb: 5,
		otherqb: 3,
		oqb: 2,
		empty: 1,
		disabled: 0,
	};

	candidates.sort((a, b) => {
		const aColor = color(a);
		const bColor = color(b);
		const aScore = priority[aColor] ?? 0;
		const bScore = priority[bColor] ?? 0;
		if (aScore !== bScore) return bScore - aScore;

		// same color priority: prefer setups with dupes in the part to keep consistent color logic
		const aDupes = a
			.replace(/\+/g, '')
			.split('')
			.some((c, i, arr) => arr.indexOf(c) !== i);
		const bDupes = b
			.replace(/\+/g, '')
			.split('')
			.some((c, i, arr) => arr.indexOf(c) !== i);
		if (aDupes !== bDupes) return aDupes ? -1 : 1;

		return a.localeCompare(b);
	});

	return candidates[0] || '';
}

const p3table = document.createElement('table');
const p3theader = document.createElement('tr');
const p3headerSpacer = document.createElement('td');
p3headerSpacer.textContent = 'First';
p3headerSpacer.rowSpan = 2;
p3theader.appendChild(p3headerSpacer);
const p3headerSpacer2 = document.createElement('td');
p3headerSpacer2.textContent = 'Second';
p3headerSpacer2.colSpan = 7;
p3theader.appendChild(p3headerSpacer2);

p3table.appendChild(p3theader);
// secondary piece header
const p3secondaryHeaderRow = document.createElement('tr');
for (const piece of PIECES) {
	const cell = document.createElement('td');
	cell.textContent = piece;
	cell.style.fontWeight = 'bold';
	p3secondaryHeaderRow.appendChild(cell);
}
p3table.appendChild(p3secondaryHeaderRow);

for (const combo of combinations(PIECES.split(''), 2)) {
	const [piece1, piece2] = combo;
	const row = document.createElement('tr');
	const piece1Cell = document.createElement('td');
	piece1Cell.textContent = '+' + piece1 + piece2;
	piece1Cell.style.fontWeight = 'bold';
	row.appendChild(piece1Cell);

	for (const piece of PIECES) {
		if (piece === piece1 || piece === piece2) {
			const cell = document.createElement('td');
			cell.textContent = '';
			cell.classList.add('disabled');
			row.appendChild(cell);
			continue;
		}
		const cell = document.createElement('td');
		const k = determine_used_setup(piece1, piece2, piece);
		cell.classList.add(color(k));
		const href = '#' + id(k);
		const a = document.createElement('a');
		a.textContent = k;
		a.href = href;
		cell.appendChild(a);
		row.appendChild(cell);
	}

	p3table.appendChild(row);
}

container.appendChild(p3table);

// list all 3p setups
for (const key in data) {
	if (key.startsWith('+')) {
		const value = data[key];
		if (pieces_used(key) !== 3) {
			continue;
		}
		const header = document.createElement('h2');
		header.id = id(key);
		header.textContent = value.split(';').length === 3 ? key : `${key} (${value.split(';')[1].split(',').length})`;
		container.appendChild(header);
		if (value.split(';').length === 3) {
			const [setup, p2, solve] = value.split(';');
			const table = document.createElement('table');
			const row = document.createElement('tr');
			const setupCell = document.createElement('td');
			setupCell.appendChild(render(setup));
			const p2Cell = document.createElement('td');
			p2Cell.appendChild(render(p2));
			const solveCell = document.createElement('td');
			solveCell.appendChild(render(solve));
			row.appendChild(setupCell);
			row.appendChild(p2Cell);
			row.appendChild(solveCell);
			table.appendChild(row);
			container.appendChild(table);
		} else if (value.split(';').length === 2) {
			const [setup, solves] = value.split(';');
			const table = document.createElement('table');
			const row = document.createElement('tr');
			const setupCell = document.createElement('td');
			setupCell.appendChild(render(setup));
			row.appendChild(setupCell);
			table.appendChild(row);

			// solves, 3 per row
			const solveList = solves.split(',');
			for (let i = 0; i < solveList.length; i++) {
				if (i % 3 === 0) {
					var solveRow = document.createElement('tr');
					table.appendChild(solveRow);
				}
				const solveCell = document.createElement('td');
				solveCell.appendChild(render(solveList[i]));
				solveRow.appendChild(solveCell);
			}

			container.appendChild(table);
		}
	}
}

const nav = document.createElement('div');
nav.style.padding = '2rem';

// tree view of all setups
const navtitle = document.createElement('p');
navtitle.textContent = `${sort(data['@pc'])} ${data['@save']}%`;
navtitle.style.fontWeight = 'bold';
nav.appendChild(navtitle);

const sections = document.createElement('ul');

const s = document.createElement('li');
const a = document.createElement('a');
a.href = `#general`;
a.textContent = 'General Setups';
a.style.color = 'light-dark(#000, #fff)';
s.appendChild(a);
sections.appendChild(s);

const gs = document.createElement('ul');
// list general setups
const generalSetups = [];
let i = 0;
for (const key in data) {
	if (key.startsWith('+')) {
		const value = data[key];
		if (pieces_used(key) !== 0 || value.split(';').length !== 2) {
			continue;
		}
		i++;
		const s = document.createElement('li');
		const a = document.createElement('a');
		a.href = `#general-${i}`;
		a.textContent = '#' + i;
		s.appendChild(a);
		gs.appendChild(s);
	}
}
sections.appendChild(gs);

const s2 = document.createElement('li');
const a2 = document.createElement('a');
a2.href = `#qb`;
a2.textContent = '1 minimal QBs';
a2.style.color = 'light-dark(#000, #fff)';
s2.appendChild(a2);
sections.appendChild(s2);

const qs = document.createElement('ul');
for (const key in data) {
	if (key.startsWith('+')) {
		const value = data[key];
		if (pieces_used(key) !== 2 || value.split(';').length !== 3) {
			continue;
		}

		const s = document.createElement('li');
		const a = document.createElement('a');
		a.href = `#${id(key)}`;
		a.textContent = key;
		s.appendChild(a);
		qs.appendChild(s);
	}
}

sections.appendChild(qs);

const s3 = document.createElement('li');
const a3 = document.createElement('a');
a3.href = `#otherqb`;
a3.textContent = 'Other QBs';
a3.style.color = 'light-dark(#000, #fff)';
s3.appendChild(a3);
sections.appendChild(s3);

const os = document.createElement('ul');
for (const key in data) {
	if (key.startsWith('+')) {
		const value = data[key];
		if (pieces_used(key) !== 2 || value.split(';').length !== 2) {
			continue;
		}

		const s = document.createElement('li');
		const a = document.createElement('a');
		a.href = `#${id(key)}`;
		a.textContent = `${key} (${data[key].split(';')[1].split(',').length})`;
		s.appendChild(a);
		os.appendChild(s);
	}
}

sections.appendChild(os);

const s4 = document.createElement('li');
const a4 = document.createElement('a');
a4.href = `#oqb`;
a4.textContent = 'OQB';
a4.style.color = 'light-dark(#000, #fff)';
s4.appendChild(a4);
sections.appendChild(s4);

const oqbs = document.createElement('ul');
for (const key in data) {
	if (key.startsWith('+')) {
		const value = data[key];
		if (value.split(';').length !== 1) {
			continue;
		}

		const s = document.createElement('li');
		const a = document.createElement('a');
		a.href = `#${id(key)}`;
		a.textContent = key;
		s.appendChild(a);
		oqbs.appendChild(s);
	}
}

sections.appendChild(oqbs);
const s5 = document.createElement('li');
const a5 = document.createElement('a');
a5.href = `#p3`;
a5.textContent = '3-piece setups (optional)';
a5.style.color = 'light-dark(#000, #fff)';
s5.appendChild(a5);
sections.appendChild(s5);

const p3s = document.createElement('ul');
for (const key in data) {
	if (key.startsWith('+')) {
		const value = data[key];
		if (pieces_used(key) !== 3) {
			continue;
		}

		const s = document.createElement('li');
		const a = document.createElement('a');
		a.href = `#${id(key)}`;
		a.textContent = key;
		s.appendChild(a);
		p3s.appendChild(s);
	}
}

sections.appendChild(p3s);

nav.appendChild(sections);

// document.body.appendChild(nav);
document.body.appendChild(document.createElement('div'));
document.body.appendChild(container);
document.body.appendChild(document.createElement('div'));

for (const el of document.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
	if (el.id) {
		el.innerHTML = `<a class=ptr href=#${el.id}>#</a> ${el.innerHTML}`;
	}
}
