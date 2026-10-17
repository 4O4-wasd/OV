use std::error::Error;
use std::path::PathBuf;
use std::process::Command;

use prost::Message;

fn main() -> Result<(), Box<dyn Error>> {
    let descriptor_path = PathBuf::from(std::env::var("OUT_DIR")?).join("fds.binpb");

    let status = Command::new("buf")
        .args(["build", "-o"])
        .arg(&descriptor_path)
        .status()?;

    if !status.success() {
        return Err("buf build failed".into());
    }

    let bytes = std::fs::read(&descriptor_path)?;
    let fds = prost_types::FileDescriptorSet::decode(bytes.as_slice())?;
    tonic_prost_build::configure().compile_fds(fds)?;

    prost_protovalidate_build::Builder::new()
        .file_descriptor_set_path(&descriptor_path)?
        .compile()?;

    println!("cargo:rerun-if-changed=proto");
    println!("cargo:rerun-if-changed=buf.yaml");
    println!("cargo:rerun-if-changed=buf.lock");
    Ok(())
}
