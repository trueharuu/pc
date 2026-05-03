use std::process::Stdio;

fn main() {
    let seconds = [
        // "IJLO", "IJLS",
        // "IJLZ", "IOSZ", "JLOS", "JLOZ", "JLSZ", "TIJL",
        "TIOS", "TIOZ", "TISZ", "TJLO", "TJLS", "TJLZ", "TOSZ", "TIJO", "TIJS", "TIJZ", "TILO",
        "TILS", "TILZ", "TJOS", "TJOZ", "TJSZ", "TLOS", "TLOZ",
        "TLSZ",
        // "TTIJ", "TTIL", "TTIO", "TTIS", "TTIZ", "TTJL", "TTJO", "TTJS",
        // "TTJZ", "TTLO", "TTLS", "TTLZ", "TTOS", "TTOZ", "TTSZ", "IITJ", "IITL", "IITO", "IITS",
        // "IITZ", "IIJL", "IIOS", "IIOZ", "IISZ", "JJTI", "JJTL", "JJTO", "JJTS", "JJTZ", "JJIO",
        // "JJIS", "JJIZ", "JJOS", "JJOZ", "JJSZ", "LLTI", "LLTJ", "LLTO", "LLTS", "LLTZ", "LLIO",
        // "LLIS", "LLIZ", "LLOS", "LLOZ", "LLSZ", "OOTI", "OOTJ", "OOTL", "OOTS", "OOTZ", "OOIS",
        // "OOIZ", "OOJL", "OOSZ", "SSTI", "SSTJ", "SSTL", "SSTO", "SSTZ", "SSIO", "SSIZ", "SSJL",
        // "SSOZ", "ZZTI", "ZZTJ", "ZZTL", "ZZTO", "ZZTS", "ZZIO", "ZZIS", "ZZJL",
        // "ZZOS",
        // "TTTI", "TTTJ", "TTTL", "TTTO", "TTTS", "TTTZ", "IIIT", "IIIO", "IIIS", "IIIZ",
        // "JJJT", "JJJL", "LLLT", "LLLJ", "OOOT", "OOOI", "OOOS", "OOOZ", "SSST", "SSSI", "SSSO",
        // "SSSZ", "ZZZT", "ZZZI", "ZZZO", "ZZZS", "TITI", "TJTJ", "TLTL", "TOTO", "TSTS", "TZTZ",
        // "IJIJ", "ILIL", "IOIO", "ISIS", "IZIZ", "JLJL", "JOJO", "JSJS", "JZJZ", "LOLO", "LSLS",
        // "LZLZ", "OSOS", "OZOZ", "SZSZ", "TTTT", "IIII", "JJJJ", "LLLL", "OOOO", "SSSS", "ZZZZ",
    ];

    for s in seconds {
        // let path = format!("../worker/public/data/2nd/T/{s}");
        // if std::fs::exists(&path).unwrap() {
        //     println!("\x1b[32m{path}\x1b[0m");
        // } else {
        //     println!("\x1b[31m{path}\x1b[0m");
        // }
        std::process::Command::new("../gen/target/release/gen")
            .arg("-t")
            .arg(s)
            .arg("-s")
            .arg("O")
            .arg("-p")
            .arg(format!("../worker/public/data/2nd/O/{s}"))
            .stdout(Stdio::inherit())
            .output()
            .expect("failed");
    }
}
