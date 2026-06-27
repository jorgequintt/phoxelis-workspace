declare const fontNames: readonly ["0_Trithemius437", "1_Trithemius8x16", "2_Trithemius9x15", "3_Trithemius6x9", "4_Trithemius5x8"];
type Binary = 0 | 1;
export type CharShape = Binary[][];
export interface Font {
    fontName: string;
    length: number;
    height: number;
    width: number;
    characters: {
        [codepoint: number]: CharShape;
    };
    charactersList: Array<{
        codepoint: number;
        shape: CharShape;
    }>;
}
export type FontName = (typeof fontNames)[number];
export declare function getFont(fontName: FontName): Promise<Font>;
export {};
