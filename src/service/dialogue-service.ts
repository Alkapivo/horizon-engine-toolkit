import log4js from 'log4js';
import { injectable, inject } from "inversify";
import { Dialogue, DialogueChoice, DialogueNode, DialogueParseException } from '../type/game-content/dialogue-service-model';

@injectable()
export class DialogueService {

    private logger: log4js.Logger;

    constructor() {
        this.logger = log4js.getLogger();
        this.logger.level = "debug";
    }

    buildDialogue(name, designerDialogue, langCode = "en_EN") {

        const nodes = designerDialogue[0].nodes as any[];

        let dialogue: Dialogue = {
            name: name,
            startNode: "",
            nodes: {}
        }

        try {
            nodes.forEach(node => {
                if (node.node_name === "START") {
                    dialogue.startNode = node.next;
                    return;
                }
                const nodeName: string = node.node_name;
                const author: string = node.character ? node.character[0] : undefined;
                const nextNode: string = node.next;
                const text: string = (typeof node.text === 'string' || node.text instanceof String) ? undefined : node.text[langCode];
                const action: string = (typeof node.text === 'string' || node.text instanceof String) ? node.text : undefined;
                const choices: DialogueChoice[] = Array.isArray(node.choices) ? (
                    node.choices.map(choice => {
                        const nextNode: string = choice.next;
                        const text: string = choice.text[langCode];
                        const conditionData: string = choice.is_condition ?
                            choice.condition : undefined;

                        let dialogueChoice: DialogueChoice = {
                            nextNode: nextNode,
                            text: text
                        }

                        if (conditionData) {
                            dialogueChoice.conditionData = conditionData
                        }

                        return dialogueChoice;
                    })
                ) : undefined;
                const branches = (node.branches) && (typeof node.branches.True === 'string' || node.branches.True instanceof String) ? 
                    {
                        truthy: node.branches.True,
                        falsy: node.branches.False
                    } : undefined

                let dialogueNode: DialogueNode = {
                    author: author,
                    nextNode: nextNode,
                }

                if (text) {
                    dialogueNode.text = text;
                }

                if (action) {
                    dialogueNode.action = action;
                }

                if (choices) {
                    dialogueNode.choices = choices;
                }

                if (branches) {
                    dialogueNode.branches = branches;
                }

                dialogue.nodes[nodeName] = dialogueNode;
            });
        } catch (exception) {
            throw new DialogueParseException(exception)
        }

        this.logger.info(`Dialogue ${name} parsed.`);

        return dialogue;
    }
}