import "reflect-metadata";
import { Container } from "inversify";
import { TiledConverterService } from "./service/tiled-converter-service";
import { EntityGeneratorService } from "./service/entity-generator-service";


const DIContanier = new Container();
DIContanier.bind<TiledConverterService>(TiledConverterService).toSelf();
DIContanier.bind<EntityGeneratorService>(EntityGeneratorService).toSelf();

export default DIContanier;

