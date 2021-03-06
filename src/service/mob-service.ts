import log4js from 'log4js';
import { injectable, inject } from "inversify";
import { GoogleSheetApiService } from "./google-drive-api-service";
import { ExcelService } from "./excel-service";
import { MobPrototype, MobParseException, MobStatisticPrototype, MobBehaviour, Loot, MobTypeNotFoundException, MobBehaviourGroup, MobType } from "../type/game-content/mob-service-model";
import { FieldType } from '../type/game-content/game-content-model';
import { assert } from 'console';
import { DamageStatistic, ResistanceStatistic, ResistanceDamageType, ResistanceEffect } from '../type/game-content/item-service-model';

@injectable()
export class MobService {

    private googleDriveService: GoogleSheetApiService;
    private excelService: ExcelService;
    private logger: log4js.Logger;

    private mobSpreadsheetId: string = "1K4Fcx8lsaKd9N4MDKnPmBfHAtf17NUyA3u5VYPBFTCk";

    constructor(
        @inject(GoogleSheetApiService) googleDriveService: GoogleSheetApiService,
        @inject(ExcelService) excelService: ExcelService) {

        this.googleDriveService = googleDriveService;
        this.excelService = excelService;

        this.logger = log4js.getLogger();
        this.logger.level = "debug";
    }

    public async buildMobs(): Promise<MobPrototype[]> {
        const googleDriveRows = await this.googleDriveService.getSheet({
            sheetId: this.mobSpreadsheetId,
            sheetName: "mob_data",
            credentialsPath: "secret/credentials.json",
        });

        const mobs: MobPrototype[] = googleDriveRows.rows
            .map((row, index) => {
                if (index === 0) {
                    return undefined;
                }

                let columnIndex = 0;
                try {

                    const id = row[0];
                    columnIndex++;
                    const name = row[1];
                    columnIndex++;
                    const type = (JSON.parse(row[2])) as MobType;
                    columnIndex++;
                    const texture = row[3];
                    columnIndex++;
                    const mobSfx = row[4];
                    columnIndex++;
                    const exp = Number(row[5].replace(",", "."));
                    columnIndex++;
                    const statistic = (JSON.parse(row[6]) as MobStatisticPrototype);
                    columnIndex++;
                    const behaviourGroup = (JSON.parse(row[7]) as MobBehaviourGroup);
                    columnIndex++;
                    const loot = (JSON.parse(row[8]) as Loot[]);
                    columnIndex++;
                    const eq = (JSON.parse(row[9]) as string[]);

                    if (behaviourGroup.action) {

                        behaviourGroup.action
                            .filter(group => group.name === "behaviour_useSkill")
                            .forEach(group => group.parameters['skillId'])
                    }

                    const mob: MobPrototype = {
                        mobId: id,
                        name: name,
                        type: type,
                        texture: texture,
                        mobSfx: mobSfx,
                        experience: exp,
                        statistic: statistic,
                        behaviours: behaviourGroup,
                        loot: loot,
                        eq: eq,
                    }

                    this.logger.info(`Mob "${mob.name}" parsed.`);

                    return mob;
                } catch (exception) {
                    throw new MobParseException(`Unable to parse mob at excel index ${index + 1}. Column: "${googleDriveRows.rows[0][columnIndex]}". Message: ${exception}.`);
                }
            })
            .filter(mob => mob);

        return mobs;
    }

    private parseToType(fieldType: string, data: any): any {
        switch (fieldType) {
            case "string":
                return data as string;
            case "number":
                const value = Number(data);
                if (value === NaN) {
                    throw new MobParseException(`Cannot parse field to number. Raw data: ${data}`);
                }
                return value;
            case "boolean":
                return data as boolean;
            case "DamageStatistic":
                return (data as DamageStatistic);
            case "ResistanceStatistic":
                return (data as ResistanceStatistic);
            case "ResistanceDamageType":
                return (data as ResistanceDamageType);
            case "ResistanceEffect":
                return (data as ResistanceEffect);
            default:
                throw new MobParseException(`Field parser implementation for type "${fieldType}" wasn't found`);
        }
    }
}
