use std::{
    fs::File,
    io::{BufWriter, Write},
    process::Command,
    sync::{Arc, Mutex},
};

use clap::Parser;
use fumen::{CellColor, Fumen};
use itertools::Itertools;
use rayon::prelude::*;

const PIECES: &str = "TIJLOSZ";

#[derive(Parser)]
pub struct Program {
    second: String,
    save: String,
    #[arg(short)]
    path: Option<String>,
}

/// Lightweight status used for console coloring and summary.
#[derive(Clone, Copy, Debug)]
enum QueueStatus {
    Min1,
    Min2,
    Missing,
    ThreeP,
}

/// Shared progress structure used for both active and done categories.
pub struct Progress {
    active: Vec<String>,
    done_min1: Vec<String>,
    done_min2: Vec<String>,
    done_missing: Vec<String>,
    done_3p: Vec<String>,
}

impl Default for Progress {
    fn default() -> Self {
        Self {
            active: vec![],
            done_min1: vec![],
            done_min2: vec![],
            done_missing: vec![],
            done_3p: vec![],
        }
    }
}

impl Progress {
    fn add_active(&mut self, key: String) {
        if !self.active.contains(&key) {
            self.active.push(key);
            self.active.sort();
        }
    }

    fn remove_active(&mut self, key: &str) {
        self.active.retain(|k| k != key);
    }

    fn mark(&mut self, key: String, status: QueueStatus) {
        // Ensure it's not in active anymore.
        self.remove_active(&key);

        // Remove from other done lists if it exists to avoid duplicates,
        // then push into the correct one.
        self.done_min1.retain(|k| k != &key);
        self.done_min2.retain(|k| k != &key);
        self.done_missing.retain(|k| k != &key);
        self.done_3p.retain(|k| k != &key);

        match status {
            QueueStatus::Min1 => {
                if !self.done_min1.contains(&key) {
                    self.done_min1.push(key);
                    self.done_min1.sort();
                }
            }
            QueueStatus::Min2 => {
                if !self.done_min2.contains(&key) {
                    self.done_min2.push(key);
                    self.done_min2.sort();
                }
            }
            QueueStatus::Missing => {
                if !self.done_missing.contains(&key) {
                    self.done_missing.push(key);
                    self.done_missing.sort();
                }
            }
            QueueStatus::ThreeP => {
                if !self.done_3p.contains(&key) {
                    self.done_3p.push(key);
                    self.done_3p.sort();
                }
            }
        }
    }

    /// Draw the progress block to stdout.
    /// This variant no longer moves the cursor; it always prints without overwriting.
    pub fn draw(&self, _write_over: bool) {
        // Prepare active string
        let active_list = if self.active.is_empty() {
            "".to_string()
        } else {
            self.active.join(", ")
        };

        // Prepare done category strings with ANSI colors
        let min1_s = if self.done_min1.is_empty() {
            "".to_string()
        } else {
            self.done_min1
                .iter()
                .map(|k| format!("\x1b[32m{}\x1b[0m", k))
                .collect::<Vec<_>>()
                .join(", ")
        };

        let min2_s = if self.done_min2.is_empty() {
            "".to_string()
        } else {
            self.done_min2
                .iter()
                .map(|k| format!("\x1b[33m{}\x1b[0m", k))
                .collect::<Vec<_>>()
                .join(", ")
        };

        let missing_s = if self.done_missing.is_empty() {
            "".to_string()
        } else {
            self.done_missing
                .iter()
                .map(|k| format!("\x1b[31m{}\x1b[0m", k))
                .collect::<Vec<_>>()
                .join(", ")
        };

        let threep_s = if self.done_3p.is_empty() {
            "".to_string()
        } else {
            self.done_3p
                .iter()
                .map(|k| format!("\x1b[36m{}\x1b[0m", k))
                .collect::<Vec<_>>()
                .join(", ")
        };

        // Note: we intentionally do not move the cursor up anymore; output is appended.

        // Line 1: active
        print!("\x1b[2K\r");
        print!("active     : ({})\n", active_list);

        // Line 2: done min1
        print!("\x1b[2K\r");
        print!("done (min1): ({})\n", min1_s);

        // Line 3: done min2
        print!("\x1b[2K\r");
        print!("done (min2): ({})\n", min2_s);

        // Line 4: done none (missing)
        print!("\x1b[2K\r");
        print!("done (none): ({})\n", missing_s);

        // Line 5: done 3p
        print!("\x1b[2K\r");
        print!("done (  3p): ({})\r\n", threep_s);

        std::io::stdout().flush().unwrap();
    }
}

/// Redraw variant that assumes caller already holds `console` lock. Avoids locking console again.
fn do_redraw_nolock(progress: &Arc<Mutex<Progress>>) {
    // Caller is responsible for holding console lock; we only need the progress lock.
    let p = progress.lock().unwrap();
    p.draw(true);
}

fn main() {
    let program = Program::parse();
    let second = Arc::new(program.second);
    let save = Arc::new(program.save);
    let path = Arc::new(program.path.unwrap_or_else(|| second.as_ref().clone()));

    // Writer for incremental file writes
    let file = File::create(format!("./{}", path.as_ref())).expect("failed to create output file");
    let writer = Arc::new(Mutex::new(BufWriter::new(file)));

    // Write headers immediately
    {
        let mut w = writer.lock().unwrap();
        writeln!(w, "@pc={}", second.as_ref()).unwrap();
        writeln!(w, "@percent=1").unwrap();
        writeln!(w, "@save={}", save.as_ref()).unwrap();
        w.flush().unwrap();
    }

    // Shared progress (replaces separate active/done)
    let progress = Arc::new(Mutex::new(Progress::default()));

    // Console mutex so redraws don't interleave with other output
    let console = Arc::new(Mutex::new(()));

    // Reserve five lines for continuous overwrite (active + four done categories)
    {
        let _c = console.lock().unwrap();
        // Print five blank lines which we will overwrite repeatedly
        // We print to stdout because user wanted the format shown in stdout.
        print!("\n\n\n\n\n");
        std::io::stdout().flush().unwrap();
    }

    // Build a combined worklist of 2-piece and 3-piece items so they can be
    // processed in parallel on the rayon thread pool together.
    enum WorkItem {
        Two(String),   // "AB"
        Three(String), // "ABC"
    }

    let save_char = save.chars().next().unwrap();
    let mut work: Vec<WorkItem> = Vec::new();
    for c in PIECES.chars().combinations(2) {
        let a = c[0];
        let b = c[1];
        if a == save_char || b == save_char {
            continue;
        }
        work.push(WorkItem::Two(format!("{}{}", a, b)));
    }
    for c in PIECES.chars().combinations(3) {
        if c.contains(&save_char) {
            continue;
        }
        work.push(WorkItem::Three(format!("{}{}{}", c[0], c[1], c[2])));
    }

    work.par_iter().for_each(|item| match item {
        WorkItem::Two(p2) => {
            let a = p2.chars().nth(0).unwrap().to_string();
            let b = p2.chars().nth(1).unwrap().to_string();

            let ab = a.clone() + &b;
            let ba = b.clone() + &a;

            let add_active =
                |key: &str, console: &Arc<Mutex<()>>, progress: &Arc<Mutex<Progress>>| {
                    let _console_guard = console.lock().unwrap();
                    {
                        let mut p = progress.lock().unwrap();
                        p.add_active(key.to_string());
                    }
                    do_redraw_nolock(progress);
                };

            let remove_active_and_mark =
                |key: &str,
                 status: QueueStatus,
                 console: &Arc<Mutex<()>>,
                 progress: &Arc<Mutex<Progress>>| {
                    let _console_guard = console.lock().unwrap();
                    {
                        let mut p = progress.lock().unwrap();
                        p.mark(key.to_string(), status);
                    }
                    do_redraw_nolock(progress);
                };

            let unordered_key = format!("+{}{}", a, b);
            add_active(&unordered_key, &console, &progress);
            let (setup_un, raw_un) = call(&second, &save, &ab, false);
            if is_min1(&raw_un) {
                let (qb_a, qb_b) = qbify(&raw_un, &ab);
                {
                    let mut w = writer.lock().unwrap();
                    writeln!(w, "{}={};{};{}", unordered_key, setup_un, qb_a, qb_b).unwrap();
                    w.flush().unwrap();
                }
                remove_active_and_mark(&unordered_key, QueueStatus::Min1, &console, &progress);
            } else {
                remove_active_and_mark(&unordered_key, QueueStatus::Missing, &console, &progress);

                let ordered_ab_key = format!("+{}+{}", a, b);
                add_active(&ordered_ab_key, &console, &progress);
                let (setup_ab, raw_ab) = call(&second, &save, &ab, true);
                if is_min1(&raw_ab) {
                    let (qb_a, qb_b) = qbify(&raw_ab, &ab);
                    {
                        let mut w = writer.lock().unwrap();
                        writeln!(w, "{}={};{};{}", ordered_ab_key, setup_ab, qb_a, qb_b).unwrap();
                        w.flush().unwrap();
                    }
                    remove_active_and_mark(&ordered_ab_key, QueueStatus::Min1, &console, &progress);
                } else {
                    {
                        let mut w = writer.lock().unwrap();
                        writeln!(w, "{}={};{}", ordered_ab_key, setup_ab, raw_ab).unwrap();
                        w.flush().unwrap();
                    }
                    remove_active_and_mark(&ordered_ab_key, QueueStatus::Min2, &console, &progress);
                }

                let ordered_ba_key = format!("+{}+{}", b, a);
                add_active(&ordered_ba_key, &console, &progress);
                let (setup_ba, raw_ba) = call(&second, &save, &ba, true);
                if is_min1(&raw_ba) {
                    let (qb_a, qb_b) = qbify(&raw_ba, &ba);
                    {
                        let mut w = writer.lock().unwrap();
                        writeln!(w, "{}={};{};{}", ordered_ba_key, setup_ba, qb_a, qb_b).unwrap();
                        w.flush().unwrap();
                    }
                    remove_active_and_mark(&ordered_ba_key, QueueStatus::Min1, &console, &progress);
                } else {
                    {
                        let mut w = writer.lock().unwrap();
                        writeln!(w, "{}={};{}", ordered_ba_key, setup_ba, raw_ba).unwrap();
                        w.flush().unwrap();
                    }
                    remove_active_and_mark(&ordered_ba_key, QueueStatus::Min2, &console, &progress);
                }
            }
        }
        WorkItem::Three(p3s) => {
            let p3s = p3s.clone();

            let add_active =
                |key: &str, console: &Arc<Mutex<()>>, progress: &Arc<Mutex<Progress>>| {
                    let _console_guard = console.lock().unwrap();
                    {
                        let mut p = progress.lock().unwrap();
                        p.add_active(key.to_string());
                    }
                    do_redraw_nolock(progress);
                };

            let remove_active_and_mark =
                |key: &str,
                 status: QueueStatus,
                 console: &Arc<Mutex<()>>,
                 progress: &Arc<Mutex<Progress>>| {
                    let _console_guard = console.lock().unwrap();
                    {
                        let mut p = progress.lock().unwrap();
                        p.mark(key.to_string(), status);
                    }
                    do_redraw_nolock(progress);
                };

            // Try groupings in order; if one produces a result we skip the rest.
            let mut handled = false;

            // --- try +XYZ ---
            let key_t = format!("+{}{}{}", &p3s[0..1], &p3s[1..2], &p3s[2..3]);
            add_active(&key_t, &console, &progress);
            let (setup_t, raw_t) = call3p(&second, &save, &p3s, Grouping::Together);
            if is_min1(&raw_t) {
                let (qb_a, qb_b) = qbify(&raw_t, &p3s[0..3]);
                {
                    let mut w = writer.lock().unwrap();
                    writeln!(w, "{}={};{};{}", key_t, setup_t, qb_a, qb_b).unwrap();
                    w.flush().unwrap();
                }
                remove_active_and_mark(&key_t, QueueStatus::ThreeP, &console, &progress);
                handled = true;
            } else if !raw_t.is_empty() {
                {
                    let mut w = writer.lock().unwrap();
                    writeln!(w, "{}={};{}", key_t, setup_t, raw_t).unwrap();
                    w.flush().unwrap();
                }
                remove_active_and_mark(&key_t, QueueStatus::Min2, &console, &progress);
                handled = true;
            } else {
                remove_active_and_mark(&key_t, QueueStatus::Missing, &console, &progress);
            }

            // --- try +XY+Z (First grouping) ---
            if !handled {
                let key_first = format!("+{}+{}", &p3s[0..2], &p3s[2..3]);
                add_active(&key_first, &console, &progress);
                let (setup_f, raw_f) = call3p(&second, &save, &p3s, Grouping::First);
                if is_min1(&raw_f) {
                    let (qb_a, qb_b) = qbify(&raw_f, &p3s[0..3]);
                    {
                        let mut w = writer.lock().unwrap();
                        writeln!(w, "{}={};{};{}", key_first, setup_f, qb_a, qb_b).unwrap();
                        w.flush().unwrap();
                    }
                    remove_active_and_mark(&key_first, QueueStatus::ThreeP, &console, &progress);
                    handled = true;
                } else if !raw_f.is_empty() {
                    {
                        let mut w = writer.lock().unwrap();
                        writeln!(w, "{}={};{}", key_first, setup_f, raw_f).unwrap();
                        w.flush().unwrap();
                    }
                    remove_active_and_mark(&key_first, QueueStatus::Min2, &console, &progress);
                    handled = true;
                } else {
                    remove_active_and_mark(&key_first, QueueStatus::Missing, &console, &progress);
                }
            }

            // --- try +X+YZ (Last grouping) ---
            if !handled {
                let key_last = format!("+{}+{}", &p3s[0..1], &p3s[1..3]);
                add_active(&key_last, &console, &progress);
                let (setup_l, raw_l) = call3p(&second, &save, &p3s, Grouping::Last);
                if is_min1(&raw_l) {
                    let (qb_a, qb_b) = qbify(&raw_l, &p3s[0..3]);
                    {
                        let mut w = writer.lock().unwrap();
                        writeln!(w, "{}={};{};{}", key_last, setup_l, qb_a, qb_b).unwrap();
                        w.flush().unwrap();
                    }
                    remove_active_and_mark(&key_last, QueueStatus::ThreeP, &console, &progress);
                    handled = true;
                } else if !raw_l.is_empty() {
                    {
                        let mut w = writer.lock().unwrap();
                        writeln!(w, "{}={};{}", key_last, setup_l, raw_l).unwrap();
                        w.flush().unwrap();
                    }
                    remove_active_and_mark(&key_last, QueueStatus::Min2, &console, &progress);
                    handled = true;
                } else {
                    remove_active_and_mark(&key_last, QueueStatus::Missing, &console, &progress);
                }
            }

            // --- finally try +X+Y+Z (None grouping) ---
            if !handled {
                let key_none = format!("+{}+{}+{}", &p3s[0..1], &p3s[1..2], &p3s[2..3]);
                add_active(&key_none, &console, &progress);
                let (setup_n, raw_n) = call3p(&second, &save, &p3s, Grouping::None);
                if is_min1(&raw_n) {
                    let (qb_a, qb_b) = qbify(&raw_n, &p3s[0..3]);
                    {
                        let mut w = writer.lock().unwrap();
                        writeln!(w, "{}={};{};{}", key_none, setup_n, qb_a, qb_b).unwrap();
                        w.flush().unwrap();
                    }
                    remove_active_and_mark(&key_none, QueueStatus::ThreeP, &console, &progress);
                } else if !raw_n.is_empty() {
                    {
                        let mut w = writer.lock().unwrap();
                        writeln!(w, "{}={};{}", key_none, setup_n, raw_n).unwrap();
                        w.flush().unwrap();
                    }
                    remove_active_and_mark(&key_none, QueueStatus::Min2, &console, &progress);
                } else {
                    remove_active_and_mark(&key_none, QueueStatus::Missing, &console, &progress);
                }
            }
        }
    });

    // Finalize: mark any leftover active queues as Missing before final redraw to avoid showing leftover active entries
    {
        // Hold console lock first to avoid races with concurrent redraws/helpers.
        let _console_guard = console.lock().unwrap();

        // Move any remaining active keys into the done map as Missing, and clear active.
        {
            let mut p = progress.lock().unwrap();
            // Drain active entries into missing
            let remaining_active = std::mem::take(&mut p.active);
            for k in remaining_active {
                p.mark(k, QueueStatus::Missing);
            }
        }

        // Redraw while still holding the console lock using the no-lock variant.
        // (do_redraw_nolock assumes the console lock is already held.)
        do_redraw_nolock(&progress);
    }

    // Move cursor down so final logs don't overwrite the status block
    {
        let _c = console.lock().unwrap();
        println!();
    }

    eprintln!("Processing complete. Output written to ./{}", path.as_ref());
}

fn is_min1(raw: &str) -> bool {
    let s = raw.trim();
    if s.is_empty() {
        return false;
    }
    s.split(',').count() == 1
}

fn call(setup: &str, save: &str, p2: &str, ordered: bool) -> (String, String) {
    let remaining = PIECES
        .chars()
        .filter(|x| !p2.contains(*x) && !save.contains(*x))
        .collect::<String>();
    let solve = if ordered {
        format!(
            "{},{},{}",
            save,
            format!("{},{}", &p2[0..=0], &p2[1..=1]),
            remaining
        )
    } else {
        format!("{},{},{}", save, p2, remaining)
    };

    let o = Command::new("../qb_finder/target/release/qb_finder_cli")
        .arg("--build-queue")
        .arg(setup)
        .arg("--solve-queue")
        .arg(&solve)
        .arg("--saves")
        .arg(save)
        .output()
        .expect("failed to run qb_finder_cli");

    let t = String::from_utf8_lossy(&o.stdout).to_string();
    let mut z = t.trim().split(';');
    let setup_part = z.next().unwrap_or_default().to_string();
    let raw_part = z.next().unwrap_or_default().to_string();
    (setup_part, raw_part)
}

pub enum Grouping {
    Together, // +XYZ
    First,    // +XY+Z
    Last,     // +X+YZ
    None,     // +X+Y+Z
}
fn call3p(setup: &str, save: &str, p3: &str, ordered: Grouping) -> (String, String) {
    let remaining = PIECES
        .chars()
        .filter(|x| !p3.contains(*x))
        .collect::<String>();
    let prefix = match ordered {
        Grouping::Together => format!("{}{}{}", &p3[0..=0], &p3[1..=1], &p3[2..=2]),
        Grouping::First => format!("{}{},{}", &p3[0..=0], &p3[1..=1], &p3[2..=2]),
        Grouping::Last => format!("{},{}{}", &p3[0..=0], &p3[1..=1], &p3[2..=2]),
        Grouping::None => format!("{},{},{}", &p3[0..=0], &p3[1..=1], &p3[2..=2]),
    };
    let solve = format!("{},{}", prefix, remaining);

    let o = Command::new("../qb_finder/target/release/qb_finder_cli")
        .arg("--build-queue")
        .arg(setup)
        .arg("--solve-queue")
        .arg(&solve)
        .arg("--saves")
        .arg(save)
        .output()
        .expect("failed to run qb_finder_cli");

    let t = String::from_utf8_lossy(&o.stdout).to_string();
    let mut z = t.trim().split(';');
    let setup_part = z.next().unwrap_or_default().to_string();
    let raw_part = z.next().unwrap_or_default().to_string();
    (setup_part, raw_part)
}

fn to_cc(f: &str) -> CellColor {
    match f {
        "T" => CellColor::T,
        "I" => CellColor::I,
        "J" => CellColor::J,
        "L" => CellColor::L,
        "O" => CellColor::O,
        "S" => CellColor::S,
        "Z" => CellColor::Z,
        "X" => CellColor::Grey,
        _ => CellColor::Empty,
    }
}

fn qbify(f: &str, p: &str) -> (String, String) {
    let mut exclude = vec![];
    for c in p.chars() {
        exclude.push(to_cc(&c.to_string()));
    }

    // Be defensive: if decode fails, return empty encodings instead of panicking.
    let fu = match Fumen::decode(f) {
        Ok(fu) => fu,
        Err(_) => {
            return (String::new(), String::new());
        }
    };

    if fu.pages.is_empty() {
        return (String::new(), String::new());
    }

    let pu = &fu.pages[0];

    let mut fa = Fumen::default();
    let pa = fa.add_page();
    let mut fb = Fumen::default();
    let pb = fb.add_page();

    for y in 0..4 {
        for x in 0..10 {
            let c = pu.field[y][x];
            if c == CellColor::Grey || exclude.contains(&c) {
                pa.field[y][x] = c;
            }

            if !exclude.contains(&c) && c != CellColor::Empty {
                pb.field[y][x] = c;
            } else {
                pb.field[y][x] = CellColor::Grey;
            }
        }
    }

    (fa.encode(), fb.encode())
}
