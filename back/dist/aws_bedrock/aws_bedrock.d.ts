import { z } from 'zod';
declare const RecordInfoSchema: z.ZodObject<{
    source_id: z.ZodString;
    transaction_date: z.ZodString;
    currency: z.ZodString;
    amount: z.ZodString;
    description: z.ZodString;
    counterparty_name: z.ZodString;
    counterparty_tax_id: z.ZodString;
    counterparty_email: z.ZodString;
    counterparty_role: z.ZodString;
    cost_type: z.ZodString;
}, z.core.$strip>;
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
export declare function queryAiForRowStructure(csvHeaderAndRow: string): Promise<AiRowStructureResponse | null>;
export {};
