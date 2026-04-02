import { ChatBedrockConverse } from '@langchain/aws';
import { z } from 'zod';

const RecordInfoSchema = z.object({
  source_id: z.string(),
  transaction_date: z.string().describe('The transaction date of the record in format YYYY-MM-DD'),
  currency: z.string().describe('The currency of the record in format USD or ARS or EUR or UNKNOWN'),
  amount: z.string(),
  description: z.string(),
  counterparty_name: z.string(),
  counterparty_tax_id: z.string(),
  counterparty_email: z.string(),
  counterparty_role: z.string().describe('The counterparty role of the record in format SUPPLIER or CUSTOMER or UNKNOWN'),
  cost_type: z.string().describe('The cost type of the record in format COST or EXPENSE or UNKNOWN'),
});

export type StructuredRecordInfo = z.infer<typeof RecordInfoSchema>;
export interface AiUsage {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}

export interface AiRowStructureResponse {
  data: StructuredRecordInfo;
  usage: AiUsage;
}

export async function queryAiForRowStructure(
  csvHeaderAndRow: string,
): Promise<AiRowStructureResponse | null> {
  const region = process.env.BEDROCK_AWS_REGION ?? process.env.AWS_DEFAULT_REGION;
  const accessKeyId =
    process.env.BEDROCK_AWS_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.BEDROCK_AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    return null;
  }

  try {
    const llm = new ChatBedrockConverse({
      model:
        process.env.BEDROCK_MODEL_ID ??
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
    const result = await structuredModel.invoke(
      `Extrae la informacion de este CSV (header + fila) y devuelvela en el schema solicitado:\n${csvHeaderAndRow}`,
    );

    const rawMessage = (result as { raw?: unknown }).raw as
      | {
          usage_metadata?: {
            input_tokens?: number;
            output_tokens?: number;
            total_tokens?: number;
          };
          response_metadata?: {
            usage?: {
              inputTokens?: number;
              outputTokens?: number;
              totalTokens?: number;
            };
          };
        }
      | undefined;

    const usageFromMessage = rawMessage?.usage_metadata;
    const usageFromResponse = rawMessage?.response_metadata?.usage;
    const inputTokens = usageFromMessage?.input_tokens ?? usageFromResponse?.inputTokens;
    const outputTokens = usageFromMessage?.output_tokens ?? usageFromResponse?.outputTokens;
    const totalTokens = usageFromMessage?.total_tokens ?? usageFromResponse?.totalTokens;

 
    const parsed = (result as { parsed?: unknown }).parsed;
    return {
      data: RecordInfoSchema.parse(parsed),
      usage: {
        inputTokens: inputTokens ?? null,
        outputTokens: outputTokens ?? null,
        totalTokens: totalTokens ?? null,
      },
    };
  } catch {
    return null;
  }
}
