pub mod ov {
    pub mod v1 {
        include!(concat!(env!("OUT_DIR"), "/ov.v1.rs"));
    }
}

include!(concat!(env!("OUT_DIR"), "/validate_impl.rs"));

pub use ov::*;
pub use prost_protovalidate::Validate;
pub use prost_protovalidate::tonic::ValidateRequest;

pub const FILE_DESCRIPTOR_SET: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/fds.binpb"));
