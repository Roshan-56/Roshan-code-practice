export type RichNode=string|{tag:string;children?:RichNode[];href?:string;src?:string;alt?:string};
export type StatementExample={title:string;input?:string;output?:string;explanation?:string;blocks:RichNode[]};
export type Statement={description:RichNode[];examples:StatementExample[];constraints:RichNode[];followUp:RichNode[];attribution:{label:string;url:string;license?:string};kind:'practice'|'source';};
