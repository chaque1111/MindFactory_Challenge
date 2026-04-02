"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryAiForRowStructure = queryAiForRowStructure;
const aws_1 = require("@langchain/aws");
const zod_1 = require("zod");
const RecordInfoSchema = zod_1.z.object({
    source_id: zod_1.z.string(),
    transaction_date: zod_1.z.string().describe('The transaction date of the record in format YYYY-MM-DD'),
    currency: zod_1.z.string().describe('The currency of the record in format USD or ARS or EUR or UNKNOWN'),
    amount: zod_1.z.string(),
    description: zod_1.z.string(),
    counterparty_name: zod_1.z.string(),
    counterparty_tax_id: zod_1.z.string(),
    counterparty_email: zod_1.z.string(),
    counterparty_role: zod_1.z.string().describe('The counterparty role of the record in format SUPPLIER or CUSTOMER or UNKNOWN'),
    cost_type: zod_1.z.string().describe('The cost type of the record in format COST or EXPENSE or UNKNOWN'),
});
async function queryAiForRowStructure(csvHeaderAndRow) {
    const region = process.env.BEDROCK_AWS_REGION ?? process.env.AWS_DEFAULT_REGION;
    const accessKeyId = process.env.BEDROCK_AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.BEDROCK_AWS_SECRET_ACCESS_KEY;
    if (!region || !accessKeyId || !secretAccessKey) {
        return null;
    }
    try {
        const llm = new aws_1.ChatBedrockConverse({
            model: process.env.BEDROCK_MODEL_ID ??
                'global.anthropic.claude-haiku-4-5-20251001-v1:0',
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
        const structuredModel = llm.withStructuredOutput(RecordInfoSchema, {
            includeRaw: true,
        });
        const result = await structuredModel.invoke(`Extrae la informacion de este CSV (header + fila) y devuelvela en el schema solicitado:\n${csvHeaderAndRow}`);
        const rawMessage = result.raw;
        const usageFromMessage = rawMessage?.usage_metadata;
        const usageFromResponse = rawMessage?.response_metadata?.usage;
        const inputTokens = usageFromMessage?.input_tokens ?? usageFromResponse?.inputTokens;
        const outputTokens = usageFromMessage?.output_tokens ?? usageFromResponse?.outputTokens;
        const totalTokens = usageFromMessage?.total_tokens ?? usageFromResponse?.totalTokens;
        const parsed = result.parsed;
        return {
            data: RecordInfoSchema.parse(parsed),
            usage: {
                inputTokens: inputTokens ?? null,
                outputTokens: outputTokens ?? null,
                totalTokens: totalTokens ?? null,
            },
        };
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=aws_bedrock.js.map