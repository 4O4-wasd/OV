import { NestFactory } from "@nestjs/core";
import {
    FastifyAdapter,
    NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import "dotenv/config";
import { AppModule } from "./app.module.js";

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter(),
    );

    const serverUrl =
        process.env.APP_URL || `http://localhost:${process.env.PORT ?? 3000}`;

    const config = new DocumentBuilder()
        .setTitle("OV Auth API")
        .setVersion("1.0")
        .addBearerAuth()
        .addServer(serverUrl)
        .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup("/", app, document);

    await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
