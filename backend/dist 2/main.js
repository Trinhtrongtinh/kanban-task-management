"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app_module_1 = require("./app.module");
const interceptors_1 = require("./common/interceptors");
const filters_1 = require("./common/filters");
const config_1 = require("./config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        rawBody: true,
    });
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'uploads'), {
        prefix: '/uploads/',
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new filters_1.AllExceptionsFilter());
    app.useGlobalInterceptors(new interceptors_1.TransformInterceptor(app.get(core_1.Reflector)));
    const appSettings = app.get(config_1.appConfig.KEY);
    const frontendUrl = appSettings.frontendUrl;
    const port = appSettings.port;
    app.enableCors({
        origin: frontendUrl,
        credentials: true,
    });
    app.use((0, cookie_parser_1.default)());
    app.set('trust proxy', 1);
    await app.listen(port);
}
bootstrap();
//# sourceMappingURL=main.js.map