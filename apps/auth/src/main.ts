import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import "dotenv/config";
import { AppModule } from "./app.module.js";

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    const serverUrl =
        process.env.APP_URL || `http://localhost:${process.env.PORT ?? 3000}`;

    const config = new DocumentBuilder()
        .setTitle("OV Auth API")
        .setVersion("1.0")
        .addBearerAuth()
        .addServer(serverUrl)
        .build();

    const document = SwaggerModule.createDocument(app, config);

    // Serve the spec and a CDN-loaded Scalar UI directly, with no extra
    // packages (SwaggerModule.setup would pull in serve-static machinery).
    const http = app.getHttpAdapter();

    http.get("/openapi.json", (_req, res) => {
        res.json(document);
    });

    http.get("/", (_req, res) => {
        res.send(`<!doctype html>
<html>
  <head>
    <title>OV Auth API</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script
      id="api-reference"
      type="application/json"
      data-url="/openapi.json"
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`);
    });

    await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();