use protos::ValidateRequest;
use protos::v1::greeter_service_server::{GreeterService, GreeterServiceServer};
use protos::v1::{SayHelloRequest, SayHelloResponse};
use tonic::{Request, Response, Status, transport::Server};

#[derive(Default)]
struct Greeter {}

#[tonic::async_trait]
impl GreeterService for Greeter {
    async fn say_hello(
        &self,
        request: Request<SayHelloRequest>,
    ) -> Result<Response<SayHelloResponse>, Status> {
        request.validate_inner()?;

        let name = request.into_inner().name;
        Ok(Response::new(SayHelloResponse {
            message: format!("Hello, {name}!"),
        }))
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let addr = "127.0.0.1:50051".parse()?;
    println!("gRPC server listening on {addr}");

    let reflection = tonic_reflection::server::Builder::configure()
        .register_encoded_file_descriptor_set(protos::FILE_DESCRIPTOR_SET)
        .build_v1()?;

    Server::builder()
        .add_service(reflection)
        .add_service(GreeterServiceServer::new(Greeter {}))
        .serve(addr)
        .await?;

    Ok(())
}
